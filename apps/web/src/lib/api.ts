import {
  ActionPlan,
  CitizenProfile,
  EligibilityResult,
  EvidenceChunk,
  Scheme,
  Source,
  SystemHealth,
  WorkflowRunResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // non-json response
      }
      throw new Error(
        errorJson?.message || errorJson?.detail || `API request failed with status ${res.status}`
      );
    }

    return await res.json();
  } catch (err: unknown) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export async function fetchHealth(): Promise<SystemHealth> {
  return request<SystemHealth>("/api/health");
}

export async function fetchSchemes(params?: {
  category?: string;
  level?: string;
  state?: string;
  search?: string;
}): Promise<Scheme[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.level) query.set("level", params.level);
  if (params?.state) query.set("state", params.state);
  if (params?.search) query.set("search", params.search);

  const qs = query.toString();
  return request<Scheme[]>(`/api/v1/schemes${qs ? `?${qs}` : ""}`);
}

export async function fetchScheme(idOrSlug: string): Promise<Scheme> {
  return request<Scheme>(`/api/v1/schemes/${encodeURIComponent(idOrSlug)}`);
}

export async function discoverSchemes(
  profile: CitizenProfile,
  goal?: string
): Promise<Scheme[]> {
  return request<Scheme[]>("/api/v1/schemes/discover", {
    method: "POST",
    body: JSON.stringify({ profile, goal }),
  });
}

export async function validateProfile(profile: CitizenProfile): Promise<{
  valid: boolean;
  normalized_profile: CitizenProfile;
  warnings: string[];
  fields_recognized: string[];
}> {
  return request("/api/v1/profile/validate", {
    method: "POST",
    body: JSON.stringify({ profile }),
  });
}

export async function evaluateEligibility(
  schemeId: string,
  profile: CitizenProfile
): Promise<EligibilityResult> {
  return request<EligibilityResult>("/api/v1/eligibility/evaluate", {
    method: "POST",
    body: JSON.stringify({ scheme_id: schemeId, profile }),
  });
}

export async function evaluateBatch(
  profile: CitizenProfile,
  schemeIds?: string[]
): Promise<EligibilityResult[]> {
  return request<EligibilityResult[]>("/api/v1/eligibility/evaluate-batch", {
    method: "POST",
    body: JSON.stringify({ profile, scheme_ids: schemeIds }),
  });
}

export async function fetchSources(): Promise<Source[]> {
  return request<Source[]>("/api/v1/sources");
}

export async function fetchSourcesStatus(): Promise<{
  total_sources: number;
  verified_sources: number;
  tier_1_sources: number;
  unverified_examples: number;
  demo_mode: boolean;
  retrieval_mode: string;
  sources: Source[];
}> {
  return request("/api/v1/sources/status");
}

export async function fetchEvidence(
  query: string,
  schemeId?: string
): Promise<EvidenceChunk[]> {
  const q = new URLSearchParams({ q: query });
  if (schemeId) q.set("scheme_id", schemeId);
  return request<EvidenceChunk[]>(`/api/v1/sources/evidence?${q.toString()}`);
}

export async function generateActionPlan(
  schemeId: string,
  profile: CitizenProfile
): Promise<ActionPlan> {
  return request<ActionPlan>("/api/v1/action-plans/generate", {
    method: "POST",
    body: JSON.stringify({ scheme_id: schemeId, profile }),
  });
}

export async function runWorkflow(
  profile: CitizenProfile,
  goal?: string,
  selectedSchemeSlug?: string
): Promise<WorkflowRunResponse> {
  return request<WorkflowRunResponse>("/api/v1/workflow/run", {
    method: "POST",
    body: JSON.stringify({
      profile,
      goal,
      selected_scheme_slug: selectedSchemeSlug,
    }),
  });
}
