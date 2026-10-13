import pytest

from app.rules.evaluator import (
    evaluate_scheme_eligibility,
    evaluate_single_criterion,
)
from app.rules.operators import RuleOperatorError, evaluate_operator
from app.schemas.common import (
    CriterionResultState,
    EligibilityStatus,
    EvaluationCompleteness,
)
from app.schemas.profile import NormalizedProfile
from app.schemas.scheme import SchemeBase, SchemeCriterionBase


class TestDeterministicOperators:
    """Tests pure Python operator logic and boundary conditions."""

    def test_numeric_less_than_or_equal_boundaries(self):
        # Exactly on boundary
        satisfied, reason = evaluate_operator("<=", 800000, 800000)
        assert satisfied is True
        assert "<=" in reason

        # Below boundary
        satisfied, reason = evaluate_operator("<=", 799999, 800000)
        assert satisfied is True

        # Above boundary
        satisfied, reason = evaluate_operator("<=", 800001, 800000)
        assert satisfied is False
        assert "exceeds maximum threshold" in reason

    def test_numeric_string_coercion_and_currency_symbols(self):
        # Strings with commas and currency symbols
        satisfied, _ = evaluate_operator("<=", "₹8,00,000", 800000)
        assert satisfied is True

        satisfied, _ = evaluate_operator(">=", "₹2,50,000", "200000")
        assert satisfied is True

    def test_equality_and_case_insensitivity(self):
        satisfied, _ = evaluate_operator("==", "TS", "ts")
        assert satisfied is True

        satisfied, _ = evaluate_operator("==", "farmer", "FARMER")
        assert satisfied is True

        satisfied, _ = evaluate_operator("==", "artisan", "farmer")
        assert satisfied is False

    def test_set_membership_in(self):
        allowed = ["farmer", "artisan", "weaver"]
        satisfied, _ = evaluate_operator("IN", "farmer", allowed)
        assert satisfied is True

        satisfied, _ = evaluate_operator("IN", "student", allowed)
        assert satisfied is False

    def test_range_boundaries(self):
        # [18, 35]
        satisfied, _ = evaluate_operator("RANGE", 18, [18, 35])
        assert satisfied is True

        satisfied, _ = evaluate_operator("RANGE", 35, [18, 35])
        assert satisfied is True

        satisfied, _ = evaluate_operator("RANGE", 17, [18, 35])
        assert satisfied is False

        satisfied, _ = evaluate_operator("RANGE", 36, [18, 35])
        assert satisfied is False

    def test_unsupported_or_malformed_operator_raises(self):
        with pytest.raises(RuleOperatorError):
            evaluate_operator("FUZZY_MATCH", "value", "target")

        with pytest.raises(RuleOperatorError):
            evaluate_operator("IN", "value", 12345)  # IN requires list/set


class TestCriterionEvaluation:
    """Tests evaluation of individual criteria under valid, missing, and malformed inputs."""

    def test_explicit_result_states_met_and_not_met(self):
        criterion = SchemeCriterionBase(
            criterion_key="annual_income_inr",
            operator="<=",
            value={"v": 800000},
            required=True,
            source_ref="Clause 4.1",
        )

        # MET
        profile_met = NormalizedProfile(annual_income_inr=500000)
        res_met = evaluate_single_criterion(criterion, profile_met)
        assert res_met.status == CriterionResultState.MET
        assert res_met.user_provided_value == 500000

        # NOT_MET
        profile_not_met = NormalizedProfile(annual_income_inr=900000)
        res_not_met = evaluate_single_criterion(criterion, profile_not_met)
        assert res_not_met.status == CriterionResultState.NOT_MET
        assert res_not_met.user_provided_value == 900000

    def test_missing_profile_attribute_yields_unknown_never_silently_passes(self):
        criterion = SchemeCriterionBase(
            criterion_key="landholding_acres",
            operator=">",
            value={"v": 0.0},
            required=True,
        )
        # Profile without landholding_acres
        profile_empty = NormalizedProfile(annual_income_inr=500000)
        res = evaluate_single_criterion(criterion, profile_empty)

        # Must explicitly be UNKNOWN, NOT MET, and NOT silent True
        assert res.status == CriterionResultState.UNKNOWN
        assert "Missing profile attribute 'landholding_acres'" in res.reason

    def test_malformed_or_unsupported_rule_yields_unknown_never_silently_passes(self):
        criterion = SchemeCriterionBase(
            criterion_key="category",
            operator="INVALID_OP",
            value={"v": ["SC", "ST"]},
            required=True,
        )
        profile = NormalizedProfile(category="SC")
        res = evaluate_single_criterion(criterion, profile)

        # Must be UNKNOWN with explicit error reason
        assert res.status == CriterionResultState.UNKNOWN
        assert "rule error" in res.reason


class TestSchemeEligibilityAggregation:
    """Tests overall scheme aggregation, completeness, and multi-criteria rules."""

    def test_single_passed_criterion_does_not_imply_scheme_approval(self):
        scheme = SchemeBase(
            slug="test-scheme",
            name="Test Scheme",
            category="agriculture",
            description="Multi-criteria test scheme",
        )
        criteria = [
            SchemeCriterionBase(
                criterion_key="occupation",
                operator="==",
                value={"v": "farmer"},
                required=True,
            ),
            SchemeCriterionBase(
                criterion_key="annual_income_inr",
                operator="<=",
                value={"v": 200000},
                required=True,
            ),
        ]
        # Profile meets occupation=farmer, BUT fails income (300000 > 200000)
        profile = NormalizedProfile(occupation="farmer", annual_income_inr=300000)

        assessment = evaluate_scheme_eligibility(scheme, criteria, profile)

        # Proves that a passed individual criterion DOES NOT imply scheme approval
        assert assessment.met_count == 1
        assert assessment.not_met_count == 1
        assert assessment.overall_status == EligibilityStatus.NOT_ELIGIBLE
        assert assessment.completeness == EvaluationCompleteness.COMPLETE
        assert "Not eligible" in assessment.why_this_result

    def test_all_criteria_met_yields_eligible_and_complete(self):
        scheme = SchemeBase(
            slug="pm-kisan-test",
            name="PM-KISAN Test",
            category="agriculture",
            description="PM Kisan",
        )
        criteria = [
            SchemeCriterionBase(
                criterion_key="occupation",
                operator="==",
                value={"v": "farmer"},
                required=True,
            ),
            SchemeCriterionBase(
                criterion_key="landholding_acres",
                operator=">",
                value={"v": 0.0},
                required=True,
            ),
        ]
        profile = NormalizedProfile(occupation="farmer", landholding_acres=2.5)

        assessment = evaluate_scheme_eligibility(scheme, criteria, profile)
        assert assessment.overall_status == EligibilityStatus.ELIGIBLE
        assert assessment.completeness == EvaluationCompleteness.COMPLETE
        assert assessment.met_count == 2
        assert assessment.not_met_count == 0
        assert assessment.unknown_count == 0

    def test_missing_data_yields_partially_eligible_and_incomplete(self):
        scheme = SchemeBase(
            slug="pm-kisan-test",
            name="PM-KISAN Test",
            category="agriculture",
            description="PM Kisan",
        )
        criteria = [
            SchemeCriterionBase(
                criterion_key="occupation",
                operator="==",
                value={"v": "farmer"},
                required=True,
            ),
            SchemeCriterionBase(
                criterion_key="landholding_acres",
                operator=">",
                value={"v": 0.0},
                required=True,
            ),
        ]
        # Profile provides occupation=farmer, but missing landholding_acres
        profile = NormalizedProfile(occupation="farmer")

        assessment = evaluate_scheme_eligibility(scheme, criteria, profile)
        assert assessment.overall_status == EligibilityStatus.PARTIALLY_ELIGIBLE
        assert assessment.completeness == EvaluationCompleteness.INCOMPLETE
        assert assessment.met_count == 1
        assert assessment.unknown_count == 1
        assert "landholding_acres" in assessment.missing_profile_fields

    def test_failure_trumps_missing_information(self):
        """If one required criterion definitively FAILS, the overall status is NOT_ELIGIBLE,
        even if another criterion is unknown/missing.
        """
        scheme = SchemeBase(
            slug="test-mixed",
            name="Mixed Test",
            category="general",
            description="Mixed",
        )
        criteria = [
            SchemeCriterionBase(
                criterion_key="state",
                operator="==",
                value={"v": "TS"},
                required=True,
            ),
            SchemeCriterionBase(
                criterion_key="landholding_acres",
                operator=">",
                value={"v": 0.0},
                required=True,
            ),
        ]
        # Citizen is from "MH" (definitively fails state=="TS"), and landholding is missing
        profile = NormalizedProfile(state="MH")

        assessment = evaluate_scheme_eligibility(scheme, criteria, profile)
        assert assessment.overall_status == EligibilityStatus.NOT_ELIGIBLE
        assert assessment.not_met_count == 1
        assert assessment.unknown_count == 1

    def test_empty_criteria_yields_undetermined(self):
        scheme = SchemeBase(
            slug="empty-scheme",
            name="Empty Scheme",
            category="general",
            description="Empty",
        )
        profile = NormalizedProfile(occupation="farmer")
        assessment = evaluate_scheme_eligibility(scheme, [], profile)
        assert assessment.overall_status == EligibilityStatus.UNDETERMINED
        assert assessment.completeness == EvaluationCompleteness.INCOMPLETE

    def test_unverified_scheme_cannot_be_declared_eligible(self):
        """Unverified schemes must never yield an ELIGIBLE status."""
        scheme_dict = {
            "slug": "example-unverified",
            "name": "Unverified Scheme",
            "category": "education",
            "active": False,
            "verification_status": "UNVERIFIED_EXAMPLE",
        }
        criteria = [
            SchemeCriterionBase(
                criterion_key="occupation",
                operator="==",
                value={"v": "student"},
                required=True,
            )
        ]
        profile = NormalizedProfile(occupation="student")
        assessment = evaluate_scheme_eligibility(scheme_dict, criteria, profile)
        assert assessment.overall_status == EligibilityStatus.UNDETERMINED
        assert "cannot generate a definitive eligibility claim" in assessment.why_this_result

    def test_pmkisan_statutory_exclusions_and_no_land_cap(self):
        """Verify PM-KISAN allows >2 hectares landholding, but excludes income tax payees and govt employees."""
        scheme = SchemeBase(
            slug="pm-kisan",
            name="PM-KISAN",
            category="agriculture",
            description="PM Kisan",
        )
        criteria = [
            SchemeCriterionBase(criterion_key="occupation", operator="==", value={"v": "farmer"}, required=True),
            SchemeCriterionBase(criterion_key="landholding_acres", operator=">", value={"v": 0.0}, required=True),
            SchemeCriterionBase(criterion_key="is_institutional_landholder", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="is_government_employee_non_mts", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="is_income_tax_payee", operator="==", value={"v": False}, required=True),
        ]
        # Farmer with 10 acres (> 2 hectares ~ 4.94 acres) and no exclusions -> ELIGIBLE
        eligible_profile = NormalizedProfile(
            occupation="farmer",
            landholding_acres=10.0,
            is_institutional_landholder=False,
            is_government_employee=False,
            is_income_tax_payee=False,
        )
        assessment_el = evaluate_scheme_eligibility(scheme, criteria, eligible_profile)
        assert assessment_el.overall_status == EligibilityStatus.ELIGIBLE
        assert assessment_el.met_count == 5

        # Farmer who is an income tax payee -> NOT_ELIGIBLE
        tax_profile = NormalizedProfile(
            occupation="farmer",
            landholding_acres=2.0,
            is_institutional_landholder=False,
            is_government_employee=False,
            is_income_tax_payee=True,
        )
        assessment_tax = evaluate_scheme_eligibility(scheme, criteria, tax_profile)
        assert assessment_tax.overall_status == EligibilityStatus.NOT_ELIGIBLE
        assert assessment_tax.not_met_count == 1

    def test_pmkisan_mts_class_iv_exemption_and_all_exclusions(self):
        """Verify PM-KISAN Clause 2(b)(iii) Multi-Tasking Staff / Class IV exemption
        and all statutory exclusion categories.
        """
        scheme = SchemeBase(
            slug="pm-kisan",
            name="PM-KISAN",
            category="agriculture",
            description="PM Kisan",
        )
        criteria = [
            SchemeCriterionBase(criterion_key="occupation", operator="==", value={"v": "farmer"}, required=True),
            SchemeCriterionBase(criterion_key="landholding_acres", operator=">", value={"v": 0.0}, required=True),
            SchemeCriterionBase(criterion_key="is_institutional_landholder", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="has_constitutional_post_holder", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="has_specified_elected_representative", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="is_government_employee_non_mts", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="has_pensioner_above_10k_non_mts", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="is_income_tax_payee", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="has_practicing_professional", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="is_nri_or_foreign_resident", operator="==", value={"v": False}, required=True),
        ]

        # Case 1: Government employee who IS Class IV / MTS -> EXEMPT from exclusion -> ELIGIBLE!
        mts_profile = NormalizedProfile(
            occupation="farmer",
            landholding_acres=2.5,
            is_institutional_landholder=False,
            has_constitutional_post_holder=False,
            has_specified_elected_representative=False,
            is_government_employee=True,
            is_mts_or_class_iv=True,  # EXEMPT!
            has_pensioner_above_10k_non_mts=False,
            is_income_tax_payee=False,
            has_practicing_professional=False,
            is_nri_or_foreign_resident=False,
        )
        res_mts = evaluate_scheme_eligibility(scheme, criteria, mts_profile)
        assert res_mts.overall_status == EligibilityStatus.ELIGIBLE
        assert res_mts.not_met_count == 0

        # Case 2: Government employee who is NOT Class IV / MTS -> EXCLUDED -> NOT_ELIGIBLE
        officer_profile = NormalizedProfile(
            occupation="farmer",
            landholding_acres=2.5,
            is_institutional_landholder=False,
            has_constitutional_post_holder=False,
            has_specified_elected_representative=False,
            is_government_employee=True,
            is_mts_or_class_iv=False,  # Excluded
            has_pensioner_above_10k_non_mts=False,
            is_income_tax_payee=False,
            has_practicing_professional=False,
            is_nri_or_foreign_resident=False,
        )
        res_officer = evaluate_scheme_eligibility(scheme, criteria, officer_profile)
        assert res_officer.overall_status == EligibilityStatus.NOT_ELIGIBLE
        assert res_officer.not_met_count == 1

        # Case 3: Practicing registered professional (Doctor/CA/Lawyer) -> NOT_ELIGIBLE
        prof_profile = NormalizedProfile(
            occupation="farmer",
            landholding_acres=2.5,
            is_institutional_landholder=False,
            has_constitutional_post_holder=False,
            has_specified_elected_representative=False,
            is_government_employee=False,
            has_pensioner_above_10k_non_mts=False,
            is_income_tax_payee=False,
            has_practicing_professional=True,  # Excluded
            is_nri_or_foreign_resident=False,
        )
        res_prof = evaluate_scheme_eligibility(scheme, criteria, prof_profile)
        assert res_prof.overall_status == EligibilityStatus.NOT_ELIGIBLE

        # Case 4: Constitutional post holder in family -> NOT_ELIGIBLE
        const_profile = NormalizedProfile(
            occupation="farmer",
            landholding_acres=2.5,
            is_institutional_landholder=False,
            has_constitutional_post_holder=True,  # Excluded
            has_specified_elected_representative=False,
            is_government_employee=False,
            has_pensioner_above_10k_non_mts=False,
            is_income_tax_payee=False,
            has_practicing_professional=False,
            is_nri_or_foreign_resident=False,
        )
        assert evaluate_scheme_eligibility(scheme, criteria, const_profile).overall_status == EligibilityStatus.NOT_ELIGIBLE

        # Case 5: NRI / foreign resident -> NOT_ELIGIBLE
        nri_profile = NormalizedProfile(
            occupation="farmer",
            landholding_acres=2.5,
            is_institutional_landholder=False,
            has_constitutional_post_holder=False,
            has_specified_elected_representative=False,
            is_government_employee=False,
            has_pensioner_above_10k_non_mts=False,
            is_income_tax_payee=False,
            has_practicing_professional=False,
            is_nri_or_foreign_resident=True,  # Excluded
        )
        assert evaluate_scheme_eligibility(scheme, criteria, nri_profile).overall_status == EligibilityStatus.NOT_ELIGIBLE

        # Case 6: Unknown exclusion answers -> PARTIALLY_ELIGIBLE, never claims definitive approval
        unknown_profile = NormalizedProfile(
            occupation="farmer",
            landholding_acres=2.5,
            is_institutional_landholder=False,
            # has_constitutional_post_holder is None
        )
        res_unk = evaluate_scheme_eligibility(scheme, criteria, unknown_profile)
        assert res_unk.overall_status == EligibilityStatus.PARTIALLY_ELIGIBLE
        assert res_unk.completeness == EvaluationCompleteness.INCOMPLETE
        assert "has_constitutional_post_holder" in res_unk.missing_profile_fields

    def test_pmjay_disjunctive_pathways_senior_70_plus_and_vulnerable(self):
        """Verify PM-JAY multi-pathway disjunction:
        Pathway A: Senior Citizen (age >= 70) irrespective of income.
        Pathway B: Vulnerable household (annual_income_inr <= 250000, category in [SC, ST, OBC, EWS]).
        """
        scheme = SchemeBase(
            slug="pm-jay",
            name="AB-PMJAY",
            category="healthcare",
            description="Ayushman Bharat",
        )
        criteria = [
            # Pathway 1: Senior Citizen Universal Route
            SchemeCriterionBase(
                criterion_key="age",
                operator=">=",
                value={"v": 70},
                required=True,
                pathway="senior_70_plus",
                source_ref="Senior Citizen Guidelines",
            ),
            # Pathway 2: Vulnerable Household Route
            SchemeCriterionBase(
                criterion_key="annual_income_inr",
                operator="<=",
                value={"v": 250000},
                required=True,
                pathway="vulnerable_household",
                source_ref="SECC Threshold",
            ),
            SchemeCriterionBase(
                criterion_key="category",
                operator="IN",
                value={"v": ["SC", "ST", "OBC", "EWS"]},
                required=True,
                pathway="vulnerable_household",
                source_ref="SECC Target",
            ),
        ]

        # Case 1: Senior citizen aged 75 with high income (₹15,00,000) -> ELIGIBLE via senior_70_plus
        wealthy_senior = NormalizedProfile(
            age=75,
            annual_income_inr=1500000,
            category="GEN",
        )
        res_senior = evaluate_scheme_eligibility(scheme, criteria, wealthy_senior)
        assert res_senior.overall_status == EligibilityStatus.ELIGIBLE
        assert res_senior.completeness == EvaluationCompleteness.COMPLETE
        assert "Senior 70 Plus" in res_senior.why_this_result

        # Case 2: Non-senior aged 35 with low income (₹1,50,000) and SC category -> ELIGIBLE via vulnerable_household
        young_vulnerable = NormalizedProfile(
            age=35,
            annual_income_inr=150000,
            category="SC",
        )
        res_young = evaluate_scheme_eligibility(scheme, criteria, young_vulnerable)
        assert res_young.overall_status == EligibilityStatus.ELIGIBLE
        assert "Vulnerable Household" in res_young.why_this_result

        # Case 3: Non-senior aged 35 with high income (₹12,00,000, GEN) -> NOT_ELIGIBLE (both pathways fail)
        non_eligible = NormalizedProfile(
            age=35,
            annual_income_inr=1200000,
            category="GEN",
        )
        res_none = evaluate_scheme_eligibility(scheme, criteria, non_eligible)
        assert res_none.overall_status == EligibilityStatus.NOT_ELIGIBLE
        assert "Not eligible" in res_none.why_this_result

        # Case 4: Non-senior aged 35 with missing income -> PARTIALLY_ELIGIBLE
        missing_income = NormalizedProfile(
            age=35,
            category="SC",
        )
        res_missing = evaluate_scheme_eligibility(scheme, criteria, missing_income)
        assert res_missing.overall_status == EligibilityStatus.PARTIALLY_ELIGIBLE
        assert "annual_income_inr" in res_missing.missing_profile_fields

        # Case 5: Missing age and high income -> PARTIALLY_ELIGIBLE (citizen could be 70+)
        missing_age = NormalizedProfile(
            annual_income_inr=1000000,
            category="GEN",
        )
        res_no_age = evaluate_scheme_eligibility(scheme, criteria, missing_age)
        assert res_no_age.overall_status == EligibilityStatus.PARTIALLY_ELIGIBLE
        assert "age" in res_no_age.missing_profile_fields

    def test_pmayg_15_point_live_questionnaire(self):
        """Verify PMAY-G live questionnaire (netiayHome/questions.html Q1 through Q15)
        evaluates correct exclusions and boundaries.
        """
        scheme = SchemeBase(
            slug="pmay-g",
            name="PMAY-G",
            category="housing",
            description="Gramin Housing",
        )
        criteria = [
            SchemeCriterionBase(criterion_key="residence_area", operator="==", value={"v": "rural"}, required=True),
            SchemeCriterionBase(criterion_key="owns_pucca_house", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="lives_in_kutcha_house", operator="==", value={"v": True}, required=True),
            SchemeCriterionBase(criterion_key="has_more_than_two_pucca_rooms", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="has_motorized_vehicle", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="has_mechanized_agri_equipment", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="has_kcc_above_50k", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="is_government_employee", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="has_registered_non_agri_enterprise", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="earns_above_15k_monthly", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="is_income_tax_payee", operator="==", value={"v": False}, required=True),
            SchemeCriterionBase(criterion_key="pays_professional_tax", operator="==", value={"v": False}, required=True),
        ]

        # Eligible rural kutcha household
        eligible_profile = NormalizedProfile(
            residence_area="rural",
            owns_pucca_house=False,
            lives_in_kutcha_house=True,
            has_more_than_two_pucca_rooms=False,
            has_motorized_vehicle=False,
            has_mechanized_agri_equipment=False,
            has_kcc_above_50k=False,
            is_government_employee=False,
            has_registered_non_agri_enterprise=False,
            earns_above_15k_monthly=False,
            is_income_tax_payee=False,
            pays_professional_tax=False,
        )
        res_el = evaluate_scheme_eligibility(scheme, criteria, eligible_profile)
        assert res_el.overall_status == EligibilityStatus.ELIGIBLE
        assert res_el.met_count == 12

        # Disqualifier: Owns motorized vehicle (Q6)
        veh_profile = eligible_profile.model_copy(update={"has_motorized_vehicle": True})
        assert evaluate_scheme_eligibility(scheme, criteria, veh_profile).overall_status == EligibilityStatus.NOT_ELIGIBLE

        # Disqualifier: Owns mechanized agri equipment (Q7)
        agri_profile = eligible_profile.model_copy(update={"has_mechanized_agri_equipment": True})
        assert evaluate_scheme_eligibility(scheme, criteria, agri_profile).overall_status == EligibilityStatus.NOT_ELIGIBLE

        # Disqualifier: More than 2 pucca rooms (Q5)
        rooms_profile = eligible_profile.model_copy(update={"has_more_than_two_pucca_rooms": True})
        assert evaluate_scheme_eligibility(scheme, criteria, rooms_profile).overall_status == EligibilityStatus.NOT_ELIGIBLE

        # Disqualifier: Earning > ₹15,000/month (Q11 derived from annual_income_inr=240000)
        income_profile = eligible_profile.model_copy(update={"earns_above_15k_monthly": None, "annual_income_inr": 240000.0})
        assert evaluate_scheme_eligibility(scheme, criteria, income_profile).overall_status == EligibilityStatus.NOT_ELIGIBLE

        # Disqualifier: Pays professional tax (Q13)
        ptax_profile = eligible_profile.model_copy(update={"pays_professional_tax": True})
        assert evaluate_scheme_eligibility(scheme, criteria, ptax_profile).overall_status == EligibilityStatus.NOT_ELIGIBLE
