from enum import Enum


class CriterionResultState(str, Enum):
    """Explicit state of an evaluated criterion.
    Must never be guessed. If missing or malformed, must be UNKNOWN.
    """

    MET = "met"
    NOT_MET = "not_met"
    UNKNOWN = "unknown"
    NEEDS_VERIFICATION = "needs_verification"


class EligibilityStatus(str, Enum):
    """Overall scheme eligibility outcome."""

    ELIGIBLE = "ELIGIBLE"
    PARTIALLY_ELIGIBLE = "PARTIALLY_ELIGIBLE"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"
    UNDETERMINED = "UNDETERMINED"


class EvaluationCompleteness(str, Enum):
    """Distinguishes complete evaluation (all criteria decisively evaluated)
    from incomplete assessment (one or more criteria are unknown or missing).
    """

    COMPLETE = "COMPLETE"
    INCOMPLETE = "INCOMPLETE"


class VerificationStatus(str, Enum):
    """Provenance and verification status of official sources and claims."""

    VERIFIED = "VERIFIED"
    STALE = "STALE"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"
    CONFLICTING = "CONFLICTING"


class SchemeLevel(str, Enum):
    CENTRAL = "CENTRAL"
    STATE = "STATE"
    CONCURRENT = "CONCURRENT"
