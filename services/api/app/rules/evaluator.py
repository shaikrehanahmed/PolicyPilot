from typing import Any, Dict, List, Sequence, Union

from ..schemas.common import (
    CriterionResultState,
    EligibilityStatus,
    EvaluationCompleteness,
)
from ..schemas.eligibility import (
    CriterionEvaluationResult,
    EvaluationAssessment,
)
from ..schemas.profile import NormalizedProfile
from ..schemas.scheme import SchemeBase, SchemeCriterionBase
from .operators import RuleOperatorError, evaluate_operator


def evaluate_single_criterion(
    criterion: Union[SchemeCriterionBase, Dict[str, Any]],
    profile: Union[NormalizedProfile, Dict[str, Any]],
) -> CriterionEvaluationResult:
    """Deterministically evaluates a single scheme criterion against a citizen profile.

    GUARANTEES:
    - Status is explicitly MET ('met'), NOT_MET ('not_met'), UNKNOWN ('unknown'),
      or NEEDS_VERIFICATION ('needs_verification').
    - Missing or malformed data NEVER silently passes.
    - Zero external network, vector, or LLM calls.
    - Unverified criteria can never generate a definitive met status.
    """
    # 1. Normalize criterion attributes
    if isinstance(criterion, dict):
        c_id = str(criterion.get("id", ""))
        c_key = str(criterion.get("criterion_key", ""))
        op = str(criterion.get("operator", ""))
        val_dict = criterion.get("value", {})
        source_ref = criterion.get("source_ref")
        required = bool(criterion.get("required", True))
        pathway = criterion.get("pathway")
        c_ver_status = str(criterion.get("verification_status", "VERIFIED")).upper()
    else:
        c_id = str(getattr(criterion, "id", ""))
        c_key = criterion.criterion_key
        op = criterion.operator
        val_dict = criterion.value
        source_ref = criterion.source_ref
        required = criterion.required
        pathway = getattr(criterion, "pathway", None)
        c_ver_status = str(getattr(criterion, "verification_status", "VERIFIED")).upper()

    # Extract target value from JSONB payload (e.g. {"v": 800000})
    if isinstance(val_dict, dict) and "v" in val_dict:
        target_val = val_dict["v"]
    else:
        target_val = val_dict

    # Check for unverified rule upfront
    if c_ver_status in ("UNVERIFIED", "UNVERIFIED_EXAMPLE", "REQUIRES_REVIEW", "CONFLICTING"):
        return CriterionEvaluationResult(
            criterion_id=c_id or None,
            criterion_key=c_key,
            operator=op,
            rule_target_value=target_val,
            user_provided_value=None,
            status=CriterionResultState.NEEDS_VERIFICATION,
            reason=f"Rule criterion is marked '{c_ver_status}' and requires official Gazette confirmation",
            source_ref=source_ref,
            required=required,
            pathway=pathway,
        )

    # 2. Extract user value from profile
    if isinstance(profile, NormalizedProfile):
        user_val = profile.get_value(c_key)
    elif isinstance(profile, dict):
        try:
            user_val = NormalizedProfile(**profile).get_value(c_key)
        except Exception:
            user_val = profile.get(c_key)
    else:
        user_val = None

    # 2b. Handle potential match requiring official database verification
    if isinstance(user_val, dict) and user_val.get("__status__") == "needs_verification":
        return CriterionEvaluationResult(
            criterion_id=c_id or None,
            criterion_key=c_key,
            operator=op,
            rule_target_value=target_val,
            user_provided_value=user_val.get("__value__"),
            status=CriterionResultState.NEEDS_VERIFICATION,
            reason=user_val.get(
                "__reason__",
                f"Profile attribute '{c_key}' is a potential match but requires verification against official registry",
            ),
            source_ref=source_ref,
            required=required,
            pathway=pathway,
        )

    # 3. Handle missing user profile value
    if user_val is None:
        return CriterionEvaluationResult(
            criterion_id=c_id or None,
            criterion_key=c_key,
            operator=op,
            rule_target_value=target_val,
            user_provided_value=None,
            status=CriterionResultState.UNKNOWN,
            reason=f"Missing profile attribute '{c_key}' required for evaluation",
            source_ref=source_ref,
            required=required,
            pathway=pathway,
        )

    # 4. Handle missing/empty target value in criterion definition
    if target_val is None or (isinstance(target_val, (list, dict)) and len(target_val) == 0):
        return CriterionEvaluationResult(
            criterion_id=c_id or None,
            criterion_key=c_key,
            operator=op,
            rule_target_value=target_val,
            user_provided_value=user_val,
            status=CriterionResultState.UNKNOWN,
            reason="Criterion definition contains empty or null target threshold",
            source_ref=source_ref,
            required=required,
            pathway=pathway,
        )

    # 5. Evaluate operator deterministically
    try:
        satisfied, reason = evaluate_operator(
            operator=op,
            user_val=user_val,
            target_val=target_val,
        )
        return CriterionEvaluationResult(
            criterion_id=c_id or None,
            criterion_key=c_key,
            operator=op,
            rule_target_value=target_val,
            user_provided_value=user_val,
            status=CriterionResultState.MET if satisfied else CriterionResultState.NOT_MET,
            reason=reason,
            source_ref=source_ref,
            required=required,
            pathway=pathway,
        )
    except RuleOperatorError as roe:
        # Malformed or unsupported criteria MUST NOT silently pass or fail; they are explicitly UNKNOWN
        return CriterionEvaluationResult(
            criterion_id=c_id or None,
            criterion_key=c_key,
            operator=op,
            rule_target_value=target_val,
            user_provided_value=user_val,
            status=CriterionResultState.UNKNOWN,
            reason=f"Evaluation failed due to rule error: {str(roe)}",
            source_ref=source_ref,
            required=required,
            pathway=pathway,
        )
    except Exception as e:
        return CriterionEvaluationResult(
            criterion_id=c_id or None,
            criterion_key=c_key,
            operator=op,
            rule_target_value=target_val,
            user_provided_value=user_val,
            status=CriterionResultState.UNKNOWN,
            reason=f"Unexpected evaluation error: {str(e)}",
            source_ref=source_ref,
            required=required,
            pathway=pathway,
        )


def evaluate_scheme_eligibility(
    scheme: Union[SchemeBase, Dict[str, Any]],
    criteria: Sequence[Union[SchemeCriterionBase, Dict[str, Any]]],
    profile: Union[NormalizedProfile, Dict[str, Any]],
) -> EvaluationAssessment:
    """Evaluates full scheme eligibility deterministically across all criteria.

    GUARANTEES:
    - Any mandatory criterion failure -> NOT_ELIGIBLE (even if other criteria pass).
    - Passed individual criteria do NOT imply overall scheme approval.
    - If required criteria are UNKNOWN or NEEDS_VERIFICATION -> PARTIALLY_ELIGIBLE with INCOMPLETE assessment.
    - If all required criteria are MET -> ELIGIBLE with COMPLETE assessment (unless scheme is unverified).
    - Unverified rules/schemes (e.g. UNVERIFIED_EXAMPLE) CAN NEVER yield ELIGIBLE -> UNDETERMINED.
    - If criteria list is empty or engine error -> UNDETERMINED.
    """
    scheme_id = str(
        scheme.get("id", "") if isinstance(scheme, dict) else getattr(scheme, "id", "scheme-0")
    )
    scheme_name = str(
        scheme.get("name", "Unknown Scheme")
        if isinstance(scheme, dict)
        else getattr(scheme, "name", "Unknown Scheme")
    )

    # Check scheme-level verification status
    scheme_ver_status = "VERIFIED"
    if isinstance(scheme, dict):
        scheme_ver_status = str(
            scheme.get("verification_status")
            or (scheme.get("source") or {}).get("verification_status")
            or "VERIFIED"
        ).upper()
        scheme_active = scheme.get("active", True)
    else:
        scheme_ver_status = str(getattr(scheme, "verification_status", "VERIFIED")).upper()
        scheme_active = getattr(scheme, "active", True)

    if not criteria:
        return EvaluationAssessment(
            scheme_id=scheme_id,
            scheme_name=scheme_name,
            overall_status=EligibilityStatus.UNDETERMINED,
            completeness=EvaluationCompleteness.INCOMPLETE,
            criteria_results=[],
            met_count=0,
            not_met_count=0,
            unknown_count=0,
            missing_profile_fields=[],
            why_this_result="No criteria defined for this scheme. Cannot determine eligibility.",
        )

    results: List[CriterionEvaluationResult] = []
    missing_fields: List[str] = []

    for c in criteria:
        res = evaluate_single_criterion(c, profile)
        results.append(res)
        if res.status in (CriterionResultState.UNKNOWN, CriterionResultState.NEEDS_VERIFICATION) and res.required:
            if (
                res.criterion_key not in missing_fields
                and "Missing profile attribute" in res.reason
            ):
                missing_fields.append(res.criterion_key)

    met_req = [r for r in results if r.status == CriterionResultState.MET and r.required]
    not_met_req = [r for r in results if r.status == CriterionResultState.NOT_MET and r.required]
    unknown_req = [
        r for r in results
        if r.status in (CriterionResultState.UNKNOWN, CriterionResultState.NEEDS_VERIFICATION) and r.required
    ]

    met_count = len([r for r in results if r.status == CriterionResultState.MET])
    not_met_count = len([r for r in results if r.status == CriterionResultState.NOT_MET])
    unknown_count = len([
        r for r in results
        if r.status in (CriterionResultState.UNKNOWN, CriterionResultState.NEEDS_VERIFICATION)
    ])

    # Unverified scheme cannot make a definitive eligibility claim
    if scheme_ver_status in ("UNVERIFIED", "UNVERIFIED_EXAMPLE", "REQUIRES_REVIEW", "CONFLICTING") or not scheme_active:
        return EvaluationAssessment(
            scheme_id=scheme_id,
            scheme_name=scheme_name,
            overall_status=EligibilityStatus.UNDETERMINED,
            completeness=EvaluationCompleteness.INCOMPLETE,
            criteria_results=results,
            met_count=met_count,
            not_met_count=not_met_count,
            unknown_count=unknown_count,
            missing_profile_fields=missing_fields,
            why_this_result=(
                f"Unverified rules or unconfirmed source data ({scheme_ver_status}) "
                "cannot generate a definitive eligibility claim."
            ),
        )

    # Check if this scheme defines multiple distinct eligibility pathways (e.g. PM-JAY Senior 70+ vs Vulnerable Household)
    distinct_pathways = list(dict.fromkeys(r.pathway for r in results if r.pathway is not None))
    if len(distinct_pathways) > 1:
        # Multi-pathway scheme evaluation (Disjunctive evaluation across statutory routes)
        pathway_evaluations: Dict[str, Dict[str, Any]] = {}
        for pw in distinct_pathways:
            pw_results = [r for r in results if r.pathway == pw or r.pathway is None]
            pw_met_req = [r for r in pw_results if r.status == CriterionResultState.MET and r.required]
            pw_not_met_req = [r for r in pw_results if r.status == CriterionResultState.NOT_MET and r.required]
            pw_unknown_req = [
                r for r in pw_results
                if r.status in (CriterionResultState.UNKNOWN, CriterionResultState.NEEDS_VERIFICATION) and r.required
            ]
            if len(pw_not_met_req) > 0:
                pw_status = EligibilityStatus.NOT_ELIGIBLE
            elif len(pw_unknown_req) > 0:
                pw_status = EligibilityStatus.PARTIALLY_ELIGIBLE
            else:
                pw_status = EligibilityStatus.ELIGIBLE
            pathway_evaluations[pw] = {
                "status": pw_status,
                "met": pw_met_req,
                "not_met": pw_not_met_req,
                "unknown": pw_unknown_req,
            }

        eligible_pws = [pw for pw, ev in pathway_evaluations.items() if ev["status"] == EligibilityStatus.ELIGIBLE]
        partial_pws = [pw for pw, ev in pathway_evaluations.items() if ev["status"] == EligibilityStatus.PARTIALLY_ELIGIBLE]

        if len(eligible_pws) > 0:
            overall_status = EligibilityStatus.ELIGIBLE
            completeness = EvaluationCompleteness.COMPLETE
            missing_fields = []
            pw_label = eligible_pws[0].replace("_", " ").title()
            why = f"Eligible: Deterministically qualified via '{pw_label}' statutory pathway (all required criteria satisfied)."
        elif len(partial_pws) > 0:
            overall_status = EligibilityStatus.PARTIALLY_ELIGIBLE
            completeness = EvaluationCompleteness.INCOMPLETE
            viable_missing: List[str] = []
            for pw in partial_pws:
                for r in pathway_evaluations[pw]["unknown"]:
                    if r.criterion_key not in viable_missing and (
                        "Missing profile attribute" in r.reason
                        or r.status == CriterionResultState.NEEDS_VERIFICATION
                    ):
                        viable_missing.append(r.criterion_key)
            missing_fields = viable_missing
            pw_labels = ", ".join(f"'{p.replace('_', ' ').title()}'" for p in partial_pws)
            why = (
                f"Assessment incomplete: Profile may qualify under {pw_labels} pathway(s), but requires "
                f"additional demographic details ({', '.join(missing_fields) if missing_fields else 'statutory verification required'})."
            )
        else:
            overall_status = EligibilityStatus.NOT_ELIGIBLE
            completeness = EvaluationCompleteness.COMPLETE
            missing_fields = []
            disqual_reasons = []
            for pw in distinct_pathways:
                pw_fails = [f"{r.criterion_key}: {r.reason}" for r in pathway_evaluations[pw]["not_met"]]
                disqual_reasons.append(f"{pw.replace('_', ' ').title()} ({'; '.join(pw_fails)})")
            why = f"Not eligible: Criteria not satisfied under any configured statutory pathway: {' | '.join(disqual_reasons)}."

    else:
        # Completeness is COMPLETE only if 0 required criteria are UNKNOWN or NEEDS_VERIFICATION
        completeness = (
            EvaluationCompleteness.COMPLETE
            if len(unknown_req) == 0
            else EvaluationCompleteness.INCOMPLETE
        )

        # 1. Any required criterion failure -> NOT_ELIGIBLE (Failure trumps missing info)
        if len(not_met_req) > 0:
            overall_status = EligibilityStatus.NOT_ELIGIBLE
            fail_reasons = "; ".join([f"{r.criterion_key}: {r.reason}" for r in not_met_req])
            why = f"Not eligible: {len(not_met_req)} required criterion condition(s) not met ({fail_reasons})."

        # 2. Otherwise, if any required criterion is UNKNOWN / NEEDS_VERIFICATION -> PARTIALLY_ELIGIBLE
        elif len(unknown_req) > 0:
            overall_status = EligibilityStatus.PARTIALLY_ELIGIBLE
            why = (
                f"Assessment incomplete: {len(met_req)} criteria met, but {len(unknown_req)} required "
                f"condition(s) require missing demographic information or administrative verification "
                f"({', '.join(missing_fields) if missing_fields else 'statutory verification required'})."
            )

        # 3. All required criteria are MET
        else:
            overall_status = EligibilityStatus.ELIGIBLE
            why = f"Eligible: All {len(met_req)} required criteria conditions deterministically satisfied."

    return EvaluationAssessment(
        scheme_id=scheme_id,
        scheme_name=scheme_name,
        overall_status=overall_status,
        completeness=completeness,
        criteria_results=results,
        met_count=met_count,
        not_met_count=not_met_count,
        unknown_count=unknown_count,
        missing_profile_fields=missing_fields,
        why_this_result=why,
    )
