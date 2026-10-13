import {
  ActionPlan,
  CitizenProfile,
  EligibilityResult,
  EvidenceChunk,
  RescueDiagnoseRequest,
  RescueDiagnoseResponse,
  RescuePreset,
  Scheme,
  Source,
  SystemHealth,
  WorkflowRunResponse,
} from "./types";

export function getApiBase(): string {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return envUrl || "http://localhost:8000";
    }
    // In production or preview deployments on Vercel, always route to Render backend if envUrl is missing or localhost
    if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      return "https://policypilot-ajnf.onrender.com";
    }
    return envUrl;
  }
  // Server-side
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }
  return process.env.NODE_ENV === "production"
    ? "https://policypilot-ajnf.onrender.com"
    : envUrl || "http://localhost:8000";
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiBase = getApiBase();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${apiBase}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const method = (options.method || "GET").toUpperCase();
  // Only set Content-Type if a body is present to avoid triggering CORS preflight on GET/HEAD
  if (options.body && method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
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
    const rawMsg = err instanceof Error ? err.message : String(err);
    console.error(`[API Error] ${endpoint} (${url}):`, err);
    if (rawMsg.includes("Failed to fetch") || rawMsg.includes("NetworkError")) {
      throw new Error(
        `Unable to reach PolicyPilot backend at ${apiBase}. Please verify the server is running and network is active.`
      );
    }
    throw err instanceof Error ? err : new Error(rawMsg);
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

export async function fetchRescuePresets(): Promise<RescuePreset[]> {
  return request<RescuePreset[]>("/api/v1/rescue/presets");
}

export async function diagnoseRescueStatus(
  payload: RescueDiagnoseRequest
): Promise<RescueDiagnoseResponse> {
  return request<RescueDiagnoseResponse>("/api/v1/rescue/diagnose", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
