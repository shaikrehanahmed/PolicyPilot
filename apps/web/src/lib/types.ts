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
  verification_status?: string;
  criteria_count?: number;
  documents_count?: number;
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

export type TriageVerdictType =
  | "NEEDS_CLARIFICATION"
  | "CORRECTABLE_DEFECT"
  | "PROCEDURAL_TRAP_WARNING"
  | "QUEUE_WAIT_NO_ACTION"
  | "SUBSTANTIVE_EXCLUSION"
  | "UNRECOGNIZED_STATUS";

export interface RescueClarificationQuestion {
  fact_key: string;
  question_text: string;
  options: { value: string; label: string }[];
  why_this_matters: string;
}

export interface RescueRemediationStep {
  step_number: number;
  destination: string;
  action_title: string;
  detailed_instruction: string;
  required_items_to_carry: string[];
}

export interface RescueCitation {
  quote: string;
  source_id: string;
  source_title: string;
  source_url: string;
  source_tier: number;
  section_ref?: string;
  last_verified_at: string;
  freshness_status: "VERIFIED" | "STALE" | "REQUIRES_REVIEW" | "CONFLICTING";
  xml_delimited_chunk: string;
}

export interface RescueAlternativeScheme {
  scheme_id: string;
  scheme_slug: string;
  scheme_name: string;
  overall_status: "ELIGIBLE" | "PARTIALLY_ELIGIBLE" | "NOT_ELIGIBLE" | "UNDETERMINED";
  why_this_result: string;
  missing_profile_fields: string[];
}

export interface RescuePreset {
  preset_id: string;
  label: string;
  scheme_slug: string;
  symptom_code: string;
  sample_status_text: string;
  suggested_profile: CitizenProfile;
}

export interface RescueDiagnoseRequest {
  scheme_slug?: string;
  raw_status_text: string;
  selected_symptom_code?: string | null;
  supplied_facts?: Record<string, string>;
  profile?: CitizenProfile;
  lang?: LanguageCode;
}

export interface RescueDiagnoseResponse {
  status: string;
  scrubbed_input_echo: string;
  matched_scheme_slug?: string | null;
  matched_scheme_name?: string | null;
  matched_symptom_code?: string | null;
  verdict: TriageVerdictType;
  critical_trap_warning?: string | null;
  actor_explanation?: string | null;
  simple_explanation?: string | null;
  polite_office_draft?: string | null;
  clarification_questions: RescueClarificationQuestion[];
  epistemic_state: {
    known_facts: string[];
    unknown_to_verify: string[];
    unverified_boundaries: string[];
  };
  remediation_steps: RescueRemediationStep[];
  citations: RescueCitation[];
  alternative_schemes: RescueAlternativeScheme[];
  draft_grievance_text?: string | null;
  steps_log: WorkflowStepLog[];
  disclaimer: string;
}

export type LanguageCode = "en" | "te" | "hi" | "ur";

export interface AnnouncementItem {
  id: string;
  scheme_slug?: string | null;
  official_scheme_name: string;
  title: string;
  summary: string;
  benefits_summary?: string | null;
  eligibility_summary?: string | null;
  deadline_info?: string | null;
  level: "CENTRAL" | "STATE" | "CONCURRENT";
  state?: string | null;
  department: string;
  source_id: string;
  source_title: string;
  source_url: string;
  application_url?: string | null;
  published_date?: string | null;
  last_verified_at: string;
  verification_status: "VERIFIED" | "STALE" | "REQUIRES_REVIEW" | "CONFLICTING";
  content_hash: string;
  is_new_or_updated: boolean;
  review_note?: string | null;
}

export interface SourceChangeCheckResult {
  checked_at: string;
  monitoring_mode: string;
  scheduler_active: boolean;
  external_requirements_note: string;
  total_sources_checked: number;
  verified_announcements_count: number;
  awaiting_review_count: number;
  duplicates_prevented: number;
  detected_changes: string[];
  announcements: AnnouncementItem[];
}

// --- Conversational Assistant & Cloud TTS Types ---
export interface AssistantMessageItem {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface AssistantActionDirective {
  action_type: "NONE" | "NAVIGATE" | "GO_BACK" | "STOP_AUDIO" | "SWITCH_LANGUAGE";
  target_path?: string | null;
  target_lang?: LanguageCode | null;
}

export interface AssistantChatRequest {
  message: string;
  lang: LanguageCode;
  current_path?: string;
  current_scheme_slug?: string | null;
  profile?: CitizenProfile;
  history?: AssistantMessageItem[];
}

export interface AssistantChatResponse {
  status: string;
  reply_text: string;
  lang: LanguageCode;
  intent_classified: string;
  action: AssistantActionDirective;
  referenced_schemes: Scheme[];
  citations: Record<string, unknown>[];
  follow_up_question?: string | null;
  provider_used: string;
  is_fallback: boolean;
}

export interface TTSCapabilities {
  configured_provider: string;
  cloud_tts_ready: boolean;
  model_id: string;
  supported_languages: Record<
    string,
    {
      cloud_supported: boolean;
      elevenlabs_model_compatible: boolean;
      speech_lang_tag: string;
    }
  >;
  configuration_note: string;
}

export interface TTSSynthesizeResponse {
  status: string;
  lang: LanguageCode;
  provider_used: string;
  cloud_audio_available: boolean;
  audio_base64?: string | null;
  mime_type: string;
  text_chunks: string[];
  limitation_notice?: string | null;
}

