import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.explanation import generate_explanation
from app.demo.repository import get_demo_repo
from app.rules.evaluator import evaluate_scheme_eligibility

logger = logging.getLogger("policypilot.api.action_plan")
router = APIRouter(prefix="/action-plans", tags=["Action Plans"])


class ActionPlanRequest(BaseModel):
    scheme_id: str = Field(description="Scheme ID or slug")
    profile: Dict[str, Any] = Field(description="Citizen profile demographic attributes")


class ActionRoadmapStep(BaseModel):
    order: int
    title: str
    action: str
    status: str
    critical: bool = False
    portal_url: Optional[str] = None
    documents: Optional[List[Dict[str, Any]]] = None


class ActionPlanResponse(BaseModel):
    scheme_id: str
    scheme_slug: str
    scheme_name: str
    overall_status: str
    completeness: str
    why_this_result: str
    roadmap: List[ActionRoadmapStep]
    required_documents: List[Dict[str, Any]]
    official_portal_url: str
    explanation: Dict[str, Any]
    disclaimer: str


def _build_scheme_specific_steps(
    slug: str,
    scheme_name: str,
    portal_url: str,
    docs: List[Dict[str, Any]],
    status: str,
) -> List[ActionRoadmapStep]:
    """Constructs scheme-specific, non-generic application roadmap steps."""
    steps: List[ActionRoadmapStep] = []

    if slug == "pm-kisan":
        steps.append(
            ActionRoadmapStep(
                order=1,
                title="Assemble Land & Aadhaar Banking Records",
                action="Gather your Land Ownership Record (Khata/RoR/Passbook) proving cultivable land ownership, and ensure your bank account is seeded with Aadhaar for Direct Benefit Transfer (DBT).",
                status="READY",
                critical=True,
                documents=[d for d in docs if d.get("requirement_type") == "MANDATORY"],
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=2,
                title="Register via PM-KISAN Farmers Corner",
                action=f"Navigate to the official PM-KISAN portal ({portal_url}) -> Farmers Corner -> New Farmer Registration, or visit your nearest Common Service Centre (CSC) with your land records.",
                status="NEXT_STEP" if status in ["ELIGIBLE", "PARTIALLY_ELIGIBLE"] else "BLOCKED",
                critical=False,
                portal_url=portal_url,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=3,
                title="Complete Mandatory e-KYC & Status Tracking",
                action="Complete OTP or biometric e-KYC on pmkisan.gov.in. Track your beneficiary registration and verify installment credit of ₹2,000 every 4 months.",
                status="UPCOMING",
                critical=False,
                portal_url=f"{portal_url}BeneficiaryStatus_New.aspx",
            )
        )

    elif slug == "pm-jay":
        steps.append(
            ActionRoadmapStep(
                order=1,
                title="Prepare Authorized Photo Identity & Family Proof",
                action="Keep your Aadhaar Card OR Voter ID OR any authorized government photo ID ready, along with your Ration Card / SECC Household Letter. Note: No bank account or cash deposit is required.",
                status="READY",
                critical=True,
                documents=docs,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=2,
                title="Generate Family Ayushman Bharat Golden Card",
                action=f"Verify your family's inclusion at any empaneled hospital helpdesk, Ayushman Arogya Mandir, CSC, or on the NHA portal ({portal_url}). Receive your official Ayushman Card.",
                status="NEXT_STEP" if status in ["ELIGIBLE", "PARTIALLY_ELIGIBLE"] else "BLOCKED",
                critical=False,
                portal_url=portal_url,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=3,
                title="Access 100% Cashless Inpatient Hospitalization",
                action="Present the Ayushman Card at any empaneled public or private hospital across India for cashless secondary and tertiary hospitalization cover up to ₹5,00,000 per family per year.",
                status="UPCOMING",
                critical=False,
            )
        )

    elif slug == "pmay-g":
        steps.append(
            ActionRoadmapStep(
                order=1,
                title="Assemble Identity, Land Site Consent & MGNREGA Job Card",
                action="Gather household Aadhaar cards, Gram Panchayat kutcha house possession slip, bank passbook, and your MGNREGA Job Card (if enrolled for labor allowance convergence).",
                status="READY",
                critical=True,
                documents=docs,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=2,
                title="Gram Panchayat Awaas+ Verification & Geo-Tag Inspection",
                action=f"Confirm registration on the Gram Panchayat Awaas+ priority list on AwaasSoft ({portal_url}). Block Development Office officers conduct geo-tagged inspection of the existing kutcha dwelling.",
                status="NEXT_STEP" if status in ["ELIGIBLE", "PARTIALLY_ELIGIBLE"] else "BLOCKED",
                critical=False,
                portal_url=portal_url,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=3,
                title="Construction Milestone Geo-tagging & Tranche Disbursal",
                action="Receive financial assistance of ₹1,20,000 (plains) / ₹1,30,000 (hilly areas) directly into your bank account across verified construction stages (Foundation, Lintel, Roof completion).",
                status="UPCOMING",
                critical=False,
            )
        )

    elif slug == "nsp-post-matric":
        steps.append(
            ActionRoadmapStep(
                order=1,
                title="Obtain Caste, Income & Educational Bonafide Certificates",
                action="Secure your Revenue Authority SC/ST Caste Certificate, current financial year Income Certificate (ceiling ₹2,50,000), Class 10 marksheet, and college admission bonafide certificate.",
                status="READY",
                critical=True,
                documents=docs,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=2,
                title="Apply via National Scholarship Portal (NSP)",
                action=f"Complete One-Time Registration (OTR) on the National Scholarship Portal ({portal_url}) and submit your post-matric scholarship application with required certificate uploads.",
                status="NEXT_STEP" if status in ["ELIGIBLE", "PARTIALLY_ELIGIBLE"] else "BLOCKED",
                critical=False,
                portal_url=portal_url,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=3,
                title="Institute Verification & PFMS Direct Credit",
                action="Submit application copy to your college/institute nodal officer for Level-1 institutional verification. Once approved by District Welfare Officer, funds are credited via PFMS.",
                status="UPCOMING",
                critical=False,
            )
        )

    elif slug in ("rythu-bharosa", "rythu-bandhu"):
        steps.append(
            ActionRoadmapStep(
                order=1,
                title="Prepare Telangana Digital Pattadar Passbook",
                action="Verify your Pattadar Passbook (PPB) number issued via Dharani/CCLA, and ensure your Aadhaar and bank account match land ownership records.",
                status="READY",
                critical=True,
                documents=docs,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=2,
                title="Confirm Land Title Records with Agriculture Extension Officer",
                action=f"Verify survey number and land extent on the Telangana portal ({portal_url}). If records require updating, submit passbook copy to the local Agriculture Extension Officer (AEO).",
                status="NEXT_STEP" if status in ["ELIGIBLE", "PARTIALLY_ELIGIBLE"] else "BLOCKED",
                critical=False,
                portal_url=portal_url,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=3,
                title="Receive Seasonal Agricultural Input Support (₹12,000/Acre)",
                action="Seasonal agricultural investment support of ₹12,000 per acre annually (₹6,000 per acre per season for Kharif and Rabi) is credited directly into the farmer's registered bank account prior to crop seasons under state guidelines.",
                status="UPCOMING",
                critical=False,
            )
        )

    else:
        # Fallback for dynamic/other schemes
        mandatory_docs = [d.get("name", "Document") for d in docs if d.get("required") or d.get("requirement_type") == "MANDATORY"]
        doc_names_str = ", ".join(mandatory_docs) if mandatory_docs else "official identity documents"
        steps.append(
            ActionRoadmapStep(
                order=1,
                title="Assemble Scheme Verification Documents",
                action=f"Prepare required certificates: {doc_names_str}.",
                status="READY",
                critical=True,
                documents=docs,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=2,
                title="Review Official Guidance & Apply",
                action=f"Consult the verified government information portal ({portal_url}) to follow scheme-specific submission steps.",
                status="NEXT_STEP" if status in ["ELIGIBLE", "PARTIALLY_ELIGIBLE"] else "BLOCKED",
                critical=False,
                portal_url=portal_url,
            )
        )
        steps.append(
            ActionRoadmapStep(
                order=3,
                title="Track Official Application Status",
                action="Follow up with the nodal department or designated administrative authority using your application acknowledgment reference.",
                status="UPCOMING",
                critical=False,
            )
        )

    return steps


@router.post("/generate", response_model=ActionPlanResponse)
async def generate_action_plan(payload: ActionPlanRequest) -> ActionPlanResponse:
    """Generates a personalized, step-by-step action plan and AI explanation for a scheme."""
    repo = get_demo_repo()
    scheme = repo.get_scheme(payload.scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{payload.scheme_id}' not found.")

    criteria = repo.get_scheme_criteria(scheme["id"])
    assessment = evaluate_scheme_eligibility(scheme, criteria, payload.profile)

    source = scheme.get("source", {})
    portal_url = source.get("url") or "https://www.myscheme.gov.in"
    docs = scheme.get("documents", [])
    missing = assessment.missing_profile_fields

    # Retrieve official evidence quotes
    evidence = repo.search_evidence(query=scheme["name"], scheme_id=scheme["id"], top_k=2)
    quotes = [e["quote"] for e in evidence if "quote" in e]

    # Generate grounded explanation (live Gemini if key present, else deterministic fallback)
    sources_list = [source] if source else []
    explanation = await generate_explanation(
        scheme_name=scheme["name"],
        status=str(assessment.overall_status.value),
        met_count=assessment.met_count,
        not_met_count=assessment.not_met_count,
        unknown_count=assessment.unknown_count,
        missing_fields=missing,
        criteria_results=[c.model_dump() for c in assessment.criteria_results],
        sources=sources_list,
        evidence_quotes=quotes,
    )

    # Build chronological roadmap steps
    steps: List[ActionRoadmapStep] = []

    # If attributes are missing, Step 1 is always completing the missing profile attributes
    if missing:
        missing_labels = [f"'{m.replace('_', ' ')}'" for m in missing]
        steps.append(
            ActionRoadmapStep(
                order=1,
                title="Complete Missing Profile Attributes",
                action=f"Your assessment is currently incomplete because {', '.join(missing_labels)} are missing from your profile. Provide these demographic values to enable conclusive deterministic verification.",
                status="ACTION_REQUIRED",
                critical=True,
            )
        )

    # Build tailored scheme roadmap steps
    scheme_steps = _build_scheme_specific_steps(
        slug=scheme["slug"],
        scheme_name=scheme["name"],
        portal_url=portal_url,
        docs=docs,
        status=str(assessment.overall_status.value),
    )

    for s in scheme_steps:
        s.order = len(steps) + 1
        steps.append(s)

    return ActionPlanResponse(
        scheme_id=str(scheme["id"]),
        scheme_slug=scheme["slug"],
        scheme_name=scheme["name"],
        overall_status=str(assessment.overall_status.value),
        completeness=str(assessment.completeness.value),
        why_this_result=assessment.why_this_result,
        roadmap=steps,
        required_documents=docs,
        official_portal_url=portal_url,
        explanation=explanation,
        disclaimer="PolicyPilot provides evidence-grounded policy guidance. This preliminary assessment does not guarantee government approval.",
    )
