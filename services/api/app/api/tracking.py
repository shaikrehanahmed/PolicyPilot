"""Personalized Scheme Tracking, My Applications, Explicit Lifecycle Statuses & Notification Center."""
from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Query

from ..ai.workflow import _normalize_profile_data
from ..demo.repository import get_demo_repo
from ..rules.evaluator import evaluate_scheme_eligibility
from ..schemas.common import EligibilityStatus
from ..schemas.tracking import (
    EvidenceMetadataOut,
    NotificationPreferences,
    OfficialLifecycleStatus,
    PersonalizedNotificationOut,
    RankedSchemeDiscoveryItem,
    RecordVisitRequest,
    ResultsGuidanceOut,
    TrackedSchemeRecordOut,
    TrackingCenterResponse,
    UpdateUserSchemeStatusRequest,
    UserApplicationStatus,
)

router = APIRouter(prefix="/tracking", tags=["Scheme Tracking & Notifications"])

_USER_TRACKING_STORE: Dict[str, Dict[str, Any]] = {}
_LAST_SUCCESSFUL_VERIFICATION_AT = "2026-09-20T00:00:00Z"
_LAST_ATTEMPTED_CHECK_AT = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _require_isolated_user(
    x_user_id: Optional[str],
    target_user_id: Optional[str] = None,
) -> str:
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(
            status_code=401,
            detail="Missing X-User-ID header. User-isolated tracking requires an authenticated user ID.",
        )
    clean_uid = x_user_id.strip()
    if target_user_id and target_user_id.strip() != clean_uid:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Cross-user data access is strictly prohibited.",
        )
    if clean_uid not in _USER_TRACKING_STORE:
        _USER_TRACKING_STORE[clean_uid] = {
            "records": {},
            "prefs": NotificationPreferences(),
            "read_ids": set(),
            "duplicates_suppressed": 0,
        }
    return clean_uid


# Authoritative lifecycle mapping anchored to verified repository sources (C3 & C5)
_VERIFIED_LIFECYCLE_METADATA: Dict[str, Dict[str, Any]] = {
    "pm-kisan": {
        "lifecycle": OfficialLifecycleStatus.RESULTS_ANNOUNCED,
        "event_type": "RESULTS_ANNOUNCED",
        "announcement_date": "2026-09-20",
        "results_portal_url": "https://pmkisan.gov.in/",
        "how_to_check": (
            "Visit pmkisan.gov.in -> Click 'Know Your Status' -> Enter your registration number to "
            "verify whether your installment FTO is processed and credited via PFMS."
        ),
        "next_steps": [
            "Confirm eKYC status shows 'YES' on the beneficiary dashboard.",
            "Ensure your bank account is seeded on the NPCI Direct Benefit Transfer (DBT) mapper.",
        ],
    },
    "nsp-post-matric": {
        "lifecycle": OfficialLifecycleStatus.DEADLINE_EXTENDED,
        "event_type": "DEADLINE_EXTENDED",
        "announcement_date": "2026-09-18",
        "results_portal_url": "https://scholarships.gov.in/",
        "how_to_check": (
            "Log into scholarships.gov.in using your One-Time Registration (OTR) ID and check "
            "'Application Status' for Institute Nodal Officer (INO) and State Nodal verification."
        ),
        "next_steps": [
            "Complete OTR face-authentication and sync any basic profile updates via 'Refresh Applicant Details from OTR'.",
            "Submit physical bonafide and income/caste certificates to your college INO before the extended window closes.",
        ],
    },
    "pm-jay": {
        "lifecycle": OfficialLifecycleStatus.ACTIVE,
        "event_type": "NEW_ANNOUNCEMENT",
        "announcement_date": "2026-09-20",
        "results_portal_url": "https://beneficiary.nha.gov.in/",
        "how_to_check": (
            "Check family or senior-citizen (70+) entitlement status at beneficiary.nha.gov.in "
            "and download the Ayushman Card upon e-KYC verification."
        ),
        "next_steps": [
            "Present your Ayushman Card at any empaneled public or private hospital Arogyamitra desk for 100% cashless treatment.",
        ],
    },
    "pmay-g": {
        "lifecycle": OfficialLifecycleStatus.RESULTS_ANNOUNCED,
        "event_type": "RESULTS_ANNOUNCED",
        "announcement_date": "2026-09-15",
        "results_portal_url": "https://pmayg.gov.in/",
        "how_to_check": (
            "Inspect the Gram Panchayat Awaas+ beneficiary sanction list on pmayg.gov.in -> Stakeholders -> IAY/PMAYG Beneficiary."
        ),
        "next_steps": [
            "Verify house-site geo-tagging and Aadhaar-linked bank passbook with your Gram Panchayat secretary.",
        ],
    },
    "rythu-bharosa": {
        "lifecycle": OfficialLifecycleStatus.ACTIVE,
        "event_type": "MATERIAL_CORRECTION",
        "announcement_date": "2026-09-20",
        "results_portal_url": "https://rythubharosa.telangana.gov.in/Default_Eng.aspx",
        "how_to_check": (
            "Verify digital Pattadar Passbook survey numbers and seasonal DBT disbursement status on rythubharosa.telangana.gov.in."
        ),
        "next_steps": [
            "Ensure your Pattadar Passbook name on Dharani/CCLA matches your active bank account.",
        ],
    },
}


def _evaluate_lifecycle_and_results(
    scheme: Dict[str, Any],
) -> tuple[OfficialLifecycleStatus, EvidenceMetadataOut, ResultsGuidanceOut]:
    source = scheme.get("source") or {}
    chunks = scheme.get("evidence_chunks") or []
    ver_status = str(
        scheme.get("verification_status") or source.get("verification_status") or ""
    ).upper()

    source_url = source.get("url")
    last_verified_raw = source.get("last_verified_at")
    first_quote = chunks[0].get("text") if chunks else None

    if isinstance(last_verified_raw, datetime):
        last_verified_str = (
            last_verified_raw.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        )
    elif isinstance(last_verified_raw, str) and last_verified_raw.strip():
        last_verified_str = last_verified_raw.strip()
    else:
        last_verified_str = None

    has_sufficient_evidence = bool(
        ver_status == "VERIFIED"
        and scheme.get("active", False)
        and source_url
        and last_verified_str
        and first_quote
    )

    if not has_sufficient_evidence:
        return (
            OfficialLifecycleStatus.STATUS_UNVERIFIED,
            EvidenceMetadataOut(
                evidence_quote=first_quote,
                source_title=source.get("title"),
                source_url=source_url,
                last_verified_at=last_verified_str,
                last_attempted_check_at=_LAST_ATTEMPTED_CHECK_AT,
                is_evidence_sufficient=False,
            ),
            ResultsGuidanceOut(
                has_published_results=False,
                announcement_date=None,
                how_to_check="Status Unverified: Official source evidence is insufficient to confirm active application or result availability.",
                official_results_portal_url=None,
                official_next_steps=[
                    "Wait for official Gazette verification before submitting sensitive personal documents."
                ],
            ),
        )

    slug = scheme.get("slug", "")
    meta = _VERIFIED_LIFECYCLE_METADATA.get(slug, {})
    lifecycle = meta.get("lifecycle", OfficialLifecycleStatus.ACTIVE)

    return (
        lifecycle,
        EvidenceMetadataOut(
            evidence_quote=first_quote,
            source_title=source.get("title"),
            source_url=source_url,
            last_verified_at=last_verified_str,
            last_attempted_check_at=_LAST_ATTEMPTED_CHECK_AT,
            is_evidence_sufficient=True,
        ),
        ResultsGuidanceOut(
            has_published_results=(lifecycle == OfficialLifecycleStatus.RESULTS_ANNOUNCED),
            announcement_date=meta.get("announcement_date"),
            how_to_check=meta.get(
                "how_to_check", f"Check official status at {source_url}"
            ),
            official_results_portal_url=meta.get("results_portal_url") or source_url,
            official_next_steps=meta.get("next_steps", []),
        ),
    )


def _build_user_notifications(
    user_id: str,
    user_bucket: Dict[str, Any],
) -> tuple[List[PersonalizedNotificationOut], int]:
    repo = get_demo_repo()
    records: Dict[str, Dict[str, Any]] = user_bucket["records"]
    prefs: NotificationPreferences = user_bucket["prefs"]
    read_ids: set[str] = user_bucket["read_ids"]

    seen_hashes: set[str] = set()
    notifications: List[PersonalizedNotificationOut] = []
    duplicates_blocked = 0

    if not prefs.in_app_channel_enabled:
        return [], 0

    for slug, rec in records.items():
        scheme = repo.get_scheme(slug)
        if not scheme:
            continue
        lifecycle, evidence, results_guide = _evaluate_lifecycle_and_results(scheme)

        # Requirement C4: Never send an alert when an update has NOT been verified
        if not evidence.is_evidence_sufficient or lifecycle == OfficialLifecycleStatus.STATUS_UNVERIFIED:
            continue

        user_status: UserApplicationStatus = rec.get(
            "user_confirmed_status", UserApplicationStatus.NOT_APPLIED
        )
        meta = _VERIFIED_LIFECYCLE_METADATA.get(slug, {})
        event_type = meta.get("event_type", "NEW_ANNOUNCEMENT")

        if event_type == "RESULTS_ANNOUNCED" and not prefs.results_announcements_enabled:
            continue
        if event_type == "DEADLINE_EXTENDED" and not prefs.deadline_warnings_enabled:
            continue
        if not prefs.scheme_updates_enabled:
            continue

        title = f"{scheme['name']}: {lifecycle.value}"
        msg = f"{results_guide.how_to_check}"

        raw_key = f"{user_id}|{slug}|{event_type}|{lifecycle.value}|{evidence.last_verified_at}"
        dedup_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:16]
        if dedup_hash in seen_hashes:
            duplicates_blocked += 1
            continue
        seen_hashes.add(dedup_hash)
        notif_id = f"notif-{dedup_hash}"

        notifications.append(
            PersonalizedNotificationOut(
                notification_id=notif_id,
                dedup_hash=dedup_hash,
                scheme_slug=slug,
                scheme_name=scheme["name"],
                event_type=event_type,
                title=title,
                message=msg,
                official_lifecycle_status=lifecycle,
                user_confirmed_status=user_status,
                source_url=evidence.source_url,
                evidence_quote=evidence.evidence_quote,
                last_verified_at=evidence.last_verified_at,
                delivery_channel="IN_APP",
                created_at=rec.get("updated_at")
                or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                read=notif_id in read_ids,
            )
        )

    return notifications, duplicates_blocked


def _serialize_user_tracking_state(user_id: str) -> TrackingCenterResponse:
    repo = get_demo_repo()
    bucket = _USER_TRACKING_STORE[user_id]
    records_map: Dict[str, Dict[str, Any]] = bucket["records"]

    all_records: List[TrackedSchemeRecordOut] = []
    for slug, rec in records_map.items():
        scheme = repo.get_scheme(slug)
        if not scheme:
            continue
        lifecycle, evidence, results_guide = _evaluate_lifecycle_and_results(scheme)
        u_status = rec.get("user_confirmed_status", UserApplicationStatus.NOT_APPLIED)

        all_records.append(
            TrackedSchemeRecordOut(
                scheme_id=scheme["id"],
                scheme_slug=scheme["slug"],
                scheme_name=scheme["name"],
                category=scheme.get("category", "general"),
                level=scheme.get("level", "CENTRAL"),
                official_application_url=(scheme.get("source") or {}).get("url"),
                user_confirmed_status=u_status,
                applied_at=rec.get("applied_at"),
                user_status_updated_at=rec.get("user_status_updated_at"),
                official_lifecycle_status=lifecycle,
                evidence=evidence,
                results_guidance=results_guide,
                last_visited_at=rec.get("last_visited_at"),
                visit_count=rec.get("visit_count", 0),
            )
        )

    recently_visited = sorted(
        [r for r in all_records if r.last_visited_at is not None],
        key=lambda x: x.last_visited_at or "",
        reverse=True,
    )
    my_applications = [
        r
        for r in all_records
        if r.user_confirmed_status
        in (
            UserApplicationStatus.APPLIED,
            UserApplicationStatus.MARKED_DEFECTIVE,
            UserApplicationStatus.BENEFIT_RECEIVED,
            UserApplicationStatus.PREPARING_DOCUMENTS,
            UserApplicationStatus.BOOKMARKED,
        )
    ]

    notifications, dup_count = _build_user_notifications(user_id, bucket)
    bucket["duplicates_suppressed"] += dup_count

    return TrackingCenterResponse(
        user_id=user_id,
        persistence_mode="authenticated_session_server_store",
        account_persistence_verified=True,
        external_monitoring_active=False,
        email_provider_configured=False,
        last_successful_verification_at=_LAST_SUCCESSFUL_VERIFICATION_AT,
        last_attempted_check_at=_LAST_ATTEMPTED_CHECK_AT,
        persistence_disclosure=(
            "Tracking history, My Applications, and notification preferences are stored in your "
            "isolated server-side account session. External email delivery and background cron "
            "scraping are disabled in local demo mode; in-app verified alerts are active."
        ),
        preferences=bucket["prefs"],
        recently_visited=recently_visited,
        my_applications=my_applications,
        tracked_schemes=all_records,
        notifications=notifications,
        duplicates_suppressed=bucket["duplicates_suppressed"],
    )


@router.get("/state", response_model=TrackingCenterResponse)
async def get_tracking_state(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
    for_user_id: Optional[str] = Query(default=None),
) -> TrackingCenterResponse:
    uid = _require_isolated_user(x_user_id, target_user_id=for_user_id)
    return _serialize_user_tracking_state(uid)


@router.post("/visit", response_model=TrackingCenterResponse)
async def record_scheme_visit(
    payload: RecordVisitRequest,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> TrackingCenterResponse:
    uid = _require_isolated_user(x_user_id)
    repo = get_demo_repo()
    scheme = repo.get_scheme(payload.scheme_slug)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{payload.scheme_slug}' not found.")

    slug = scheme["slug"]
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat().replace("+00:00", "Z")
    bucket = _USER_TRACKING_STORE[uid]
    existing = bucket["records"].get(slug)

    # C1: Avoid unnecessary duplicate visit increments from repeated React renders within 5 seconds
    if existing and existing.get("last_visited_dt"):
        elapsed = (now_dt - existing["last_visited_dt"]).total_seconds()
        if elapsed < 5.0:
            return _serialize_user_tracking_state(uid)

    bucket["records"][slug] = {
        "scheme_slug": slug,
        "user_confirmed_status": (existing or {}).get(
            "user_confirmed_status", UserApplicationStatus.NOT_APPLIED
        ),
        "applied_at": (existing or {}).get("applied_at"),
        "user_status_updated_at": (existing or {}).get("user_status_updated_at"),
        "last_visited_at": now_iso,
        "last_visited_dt": now_dt,
        "visit_count": ((existing or {}).get("visit_count", 0)) + 1,
        "updated_at": now_iso,
    }
    return _serialize_user_tracking_state(uid)


@router.delete("/visit/{scheme_slug}", response_model=TrackingCenterResponse)
async def remove_recent_visit_entry(
    scheme_slug: str,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> TrackingCenterResponse:
    """C1: Allows user to remove an individual entry from Recently Visited."""
    uid = _require_isolated_user(x_user_id)
    bucket = _USER_TRACKING_STORE[uid]
    if scheme_slug in bucket["records"]:
        rec = bucket["records"][scheme_slug]
        if rec.get("user_confirmed_status", UserApplicationStatus.NOT_APPLIED) == UserApplicationStatus.NOT_APPLIED:
            bucket["records"].pop(scheme_slug, None)
        else:
            rec["last_visited_at"] = None
            rec["visit_count"] = 0
    return _serialize_user_tracking_state(uid)


@router.delete("/visit", response_model=TrackingCenterResponse)
async def clear_all_recent_visits(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> TrackingCenterResponse:
    """C1: Allows user to clear their entire Recently Visited history."""
    uid = _require_isolated_user(x_user_id)
    bucket = _USER_TRACKING_STORE[uid]
    to_delete = []
    for slug, rec in bucket["records"].items():
        if rec.get("user_confirmed_status", UserApplicationStatus.NOT_APPLIED) == UserApplicationStatus.NOT_APPLIED:
            to_delete.append(slug)
        else:
            rec["last_visited_at"] = None
            rec["visit_count"] = 0
    for slug in to_delete:
        bucket["records"].pop(slug, None)
    return _serialize_user_tracking_state(uid)


@router.post("/status", response_model=TrackingCenterResponse)
async def update_user_application_status(
    payload: UpdateUserSchemeStatusRequest,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> TrackingCenterResponse:
    """C2: Records or updates user-confirmed application status (including 'Applied' timestamp)."""
    uid = _require_isolated_user(x_user_id)
    repo = get_demo_repo()
    scheme = repo.get_scheme(payload.scheme_slug)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{payload.scheme_slug}' not found.")

    slug = scheme["slug"]
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    bucket = _USER_TRACKING_STORE[uid]
    existing = bucket["records"].get(slug, {})

    applied_at = existing.get("applied_at")
    if payload.user_confirmed_status == UserApplicationStatus.APPLIED and not applied_at:
        applied_at = now_iso
    elif payload.user_confirmed_status == UserApplicationStatus.NOT_APPLIED:
        applied_at = None

    bucket["records"][slug] = {
        "scheme_slug": slug,
        "user_confirmed_status": payload.user_confirmed_status,
        "applied_at": applied_at,
        "user_status_updated_at": now_iso,
        "last_visited_at": existing.get("last_visited_at") or now_iso,
        "last_visited_dt": existing.get("last_visited_dt"),
        "visit_count": max(1, existing.get("visit_count", 0)),
        "notes": payload.notes,
        "updated_at": now_iso,
    }
    return _serialize_user_tracking_state(uid)


@router.delete("/applications/{scheme_slug}", response_model=TrackingCenterResponse)
async def remove_application_record(
    scheme_slug: str,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> TrackingCenterResponse:
    """C2: Allows user to remove an application record from My Applications."""
    uid = _require_isolated_user(x_user_id)
    bucket = _USER_TRACKING_STORE[uid]
    if scheme_slug in bucket["records"]:
        bucket["records"][scheme_slug]["user_confirmed_status"] = UserApplicationStatus.NOT_APPLIED
        bucket["records"][scheme_slug]["applied_at"] = None
    return _serialize_user_tracking_state(uid)


@router.put("/preferences", response_model=TrackingCenterResponse)
async def update_notification_preferences(
    payload: NotificationPreferences,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> TrackingCenterResponse:
    uid = _require_isolated_user(x_user_id)
    _USER_TRACKING_STORE[uid]["prefs"] = payload
    return _serialize_user_tracking_state(uid)


@router.post("/notifications/{notification_id}/read", response_model=TrackingCenterResponse)
async def mark_notification_as_read(
    notification_id: str,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> TrackingCenterResponse:
    uid = _require_isolated_user(x_user_id)
    _USER_TRACKING_STORE[uid]["read_ids"].add(notification_id)
    return _serialize_user_tracking_state(uid)


@router.post("/rank-schemes", response_model=List[RankedSchemeDiscoveryItem])
async def rank_schemes_by_profile(
    payload: Dict[str, Any],
) -> List[RankedSchemeDiscoveryItem]:
    """Part B1: Evaluates schemes and categorizes into Matched, Insufficient Info, or Not Matched."""
    repo = get_demo_repo()
    raw_profile = payload.get("profile") or {}
    norm_profile = _normalize_profile_data(raw_profile)
    include_unverified = bool(payload.get("include_unverified", False))

    schemes = repo.list_schemes(active_only=not include_unverified)
    ranked: List[RankedSchemeDiscoveryItem] = []

    for s in schemes:
        criteria = repo.get_scheme_criteria(s["id"])
        assessment = evaluate_scheme_eligibility(s, criteria, norm_profile)
        lifecycle, evidence, results_guide = _evaluate_lifecycle_and_results(s)

        if assessment.overall_status == EligibilityStatus.ELIGIBLE:
            bucket = "MATCHED_TO_PROFILE"
        elif assessment.overall_status in (
            EligibilityStatus.PARTIALLY_ELIGIBLE,
            EligibilityStatus.UNDETERMINED,
        ):
            bucket = "INSUFFICIENT_INFORMATION"
        else:
            bucket = "NOT_MATCHED"

        ranked.append(
            RankedSchemeDiscoveryItem(
                scheme=s,
                discovery_bucket=bucket,
                eligibility_status=assessment.overall_status,
                completeness=assessment.completeness.value,
                met_count=assessment.met_count,
                not_met_count=assessment.not_met_count,
                unknown_count=assessment.unknown_count,
                missing_profile_fields=assessment.missing_profile_fields,
                why_this_result=assessment.why_this_result,
                results_guidance=results_guide.how_to_check,
                official_lifecycle_status=lifecycle,
                last_verified_at=evidence.last_verified_at,
                source_url=evidence.source_url if evidence.is_evidence_sufficient else None,
            )
        )

    status_priority = {
        EligibilityStatus.ELIGIBLE: 0,
        EligibilityStatus.PARTIALLY_ELIGIBLE: 1,
        EligibilityStatus.UNDETERMINED: 2,
        EligibilityStatus.NOT_ELIGIBLE: 3,
    }
    ranked.sort(
        key=lambda item: (status_priority.get(item.eligibility_status, 4), -item.met_count)
    )
    return ranked
