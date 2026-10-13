export interface SchemeCriterion {
  id?: string;
  criterion_key: string;
  operator: string;
  value: { v: unknown };
  required: boolean;
  pathway?: string;
  source_ref?: string;
  description?: string;
}

export interface SchemeDocument {
  id?: string;
  kind: string;
  name: string;
  required: boolean;
  requirement_type?: "MANDATORY" | "CONDITIONALLY_REQUIRED" | "COMMONLY_REQUESTED" | "NOT_APPLICABLE" | "UNVERIFIED";
  description?: string;
  deadline?: string;
  route?: string;
  apply_url?: string;
}

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher: string;
  source_tier: number;
  doc_type: string;
  verification_status: "VERIFIED" | "STALE" | "CONFLICT" | "UNVERIFIED_EXAMPLE";
  last_verified_at?: string;
  content_hash?: string;
}

export interface EvidenceChunk {
  id: string;
  source_id: string;
  source_title: string;
  source_url: string;
  source_tier: number;
  quote: string;
  page_ref?: string;
  section_ref?: string;
  last_verified_at?: string;
  verification_status: string;
}

export interface Scheme {
  id: string;
  slug: string;
  name: string;
  category: string;
  level: "CENTRAL" | "STATE";
  state?: string | null;
  department?: string | null;
  description: string;
  active: boolean;
  source_title?: string;
  source_url?: string;
  verification_status: string;
  criteria_count: number;
  documents_count: number;
  criteria?: SchemeCriterion[];
  documents?: SchemeDocument[];
  evidence_chunks?: EvidenceChunk[];
  source?: Source;
  relevance_score?: number;
  relevance_rationale?: string;
  retrieval_mode?: string;
}

export interface CitizenProfile {
  state?: string;
  age?: number;
  annual_income_inr?: number;
  occupation?: string;
  category?: string; // GEN, OBC, SC, ST, EWS
  gender?: string;
  landholding_acres?: number;
  disability_percent?: number;
  education_level?: string;
  is_minority?: boolean;

  // PM-KISAN Statutory Exclusions & Exceptions
  is_institutional_landholder?: boolean;
  is_government_employee?: boolean;
  is_mts_or_class_iv?: boolean;
  has_constitutional_post_holder?: boolean;
  has_specified_elected_representative?: boolean;
  has_pensioner_above_10k_non_mts?: boolean;
  is_income_tax_payee?: boolean;
  has_practicing_professional?: boolean;
  is_nri_or_foreign_resident?: boolean;

  // PMAY-G Live Questionnaire Fields (Q1-Q15)
  is_priority_deprived?: boolean;
  residence_area?: string; // rural | urban
  owns_pucca_house?: boolean;
  lives_in_kutcha_house?: boolean;
  has_more_than_two_pucca_rooms?: boolean;
  has_motorized_vehicle?: boolean;
  has_mechanized_agri_equipment?: boolean;
  has_kcc_above_50k?: boolean;
  has_registered_non_agri_enterprise?: boolean;
  earns_above_15k_monthly?: boolean;
  pays_professional_tax?: boolean;
  irrigated_land_acres?: number;
  unirrigated_land_acres?: number;

  goal?: string;
  [key: string]: unknown;
}

export interface CriterionEvaluationResult {
  criterion_id?: string;
  criterion_key: string;
  operator: string;
  rule_target_value: unknown;
  user_provided_value?: unknown;
  status: "met" | "not_met" | "unknown" | "needs_verification";
  reason: string;
  source_ref?: string;
  required: boolean;
  pathway?: string;
  evidence?: EvidenceChunk[];
}

export interface EligibilityResult {
  scheme_id: string;
  scheme_name: string;
  status: "ELIGIBLE" | "PARTIALLY_ELIGIBLE" | "NOT_ELIGIBLE" | "UNDETERMINED";
  completeness: "COMPLETE" | "INCOMPLETE";
  criteria: CriterionEvaluationResult[];
  why_this_scheme?: string;
  why_this_result: string;
  missing_information: string[];
  sources: Source[];
  disclaimer: string;
}

export interface ActionRoadmapStep {
  order: number;
  title: string;
  action: string;
  status: string;
  critical?: boolean;
  portal_url?: string;
  documents?: SchemeDocument[];
}

export interface ActionPlan {
  scheme_id: string;
  scheme_slug: string;
  scheme_name: string;
  overall_status: string;
  completeness: string;
  why_this_result: string;
  roadmap: ActionRoadmapStep[];
  required_documents: SchemeDocument[];
  official_portal_url: string;
  explanation: {
    text: string;
    provider: string;
    model: string;
    is_fallback: boolean;
    note: string;
  };
  disclaimer: string;
}

export interface WorkflowStepLog {
  step_name: string;
  detail: string;
  status: string;
  timestamp: string;
}

export interface WorkflowRunResponse {
  status: string;
  steps_log: WorkflowStepLog[];
  normalized_profile: CitizenProfile;
  discovered_schemes: Scheme[];
  evaluations: Record<string, unknown>[];
  missing_fields: string[];
  evidence_chunks: EvidenceChunk[];
  action_plan?: ActionPlan;
  explanation?: {
    text: string;
    provider: string;
    model: string;
    is_fallback: boolean;
    note: string;
  };
  error?: string;
}

export interface SystemHealth {
  status: string;
  version: string;
  environment: string;
  demo_mode: boolean;
  database: string;
  pgvector: string;
  llm_status: string;
  llm_model: string;
  embedding_model: string;
  embedding_dim: number;
  retrieval_mode: string;
  message?: string;
}

export function formatCurrencyINR(amount?: number | null): string {
  if (amount === undefined || amount === null) return "Not set";
  return new Intl.NumberFormat("en-IN").format(amount);
}
