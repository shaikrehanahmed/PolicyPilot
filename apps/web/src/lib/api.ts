import {
  ActionPlan,
  AnnouncementItem,
  AssistantChatRequest,
  AssistantChatResponse,
  CitizenProfile,
  EligibilityResult,
  EvidenceChunk,
  LanguageCode,
  NotificationPreferences,
  OrganizationCalculatorRequest,
  OrganizationCalculatorResponse,
  PricingCatalogResponse,
  RankedSchemeDiscoveryItem,
  RescueDiagnoseRequest,
  RescueDiagnoseResponse,
  RescuePreset,
  Scheme,
  Source,
  SourceChangeCheckResult,
  SystemHealth,
  TrackingCenterResponse,
  TTSCapabilities,
  TTSSynthesizeResponse,
  UserApplicationStatus,
  WorkflowRunResponse,
} from "./types";

export function getSessionUserId(): string {
  if (typeof window === "undefined") return "demo-default-citizen";
  let uid = localStorage.getItem("policypilot_user_id");
  if (!uid) {
    uid = `citizen_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem("policypilot_user_id", uid);
  }
  return uid;
}

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
    "X-User-ID": getSessionUserId(),
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

export async function fetchAnnouncements(
  lang: string = "en",
  verifiedOnly: boolean = false
): Promise<AnnouncementItem[]> {
  const q = new URLSearchParams({ lang });
  if (verifiedOnly) q.set("verified_only", "true");
  return request<AnnouncementItem[]>(`/api/v1/announcements?${q.toString()}`);
}

export async function checkOfficialSourceUpdates(
  lang: string = "en"
): Promise<SourceChangeCheckResult> {
  const q = new URLSearchParams({ lang });
  return request<SourceChangeCheckResult>(
    `/api/v1/announcements/check-updates?${q.toString()}`,
    {
      method: "POST",
    }
  );
}

export const checkAnnouncementUpdates = checkOfficialSourceUpdates;

export async function chatWithAssistant(
  payload: AssistantChatRequest
): Promise<AssistantChatResponse> {
  return request<AssistantChatResponse>("/api/v1/assistant/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchTTSCapabilities(): Promise<TTSCapabilities> {
  return request<TTSCapabilities>("/api/v1/tts/capabilities");
}

export async function synthesizeSpeechAudio(
  text: string,
  lang: LanguageCode
): Promise<TTSSynthesizeResponse> {
  return request<TTSSynthesizeResponse>("/api/v1/tts/synthesize", {
    method: "POST",
    body: JSON.stringify({ text, lang }),
  });
}

export async function fetchPricingCatalog(): Promise<PricingCatalogResponse> {
  return request<PricingCatalogResponse>("/api/v1/pricing/catalog");
}

export async function calculateOrganizationPricing(
  payload: OrganizationCalculatorRequest
): Promise<OrganizationCalculatorResponse> {
  return request<OrganizationCalculatorResponse>(
    "/api/v1/pricing/calculate-organization",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

// --- Scheme Tracking, My Applications & Notifications (Parts B & C) ---

export async function fetchTrackingState(
  userIdOverride?: string
): Promise<TrackingCenterResponse> {
  const uid = userIdOverride || getSessionUserId();
  return request<TrackingCenterResponse>("/api/v1/tracking/state", {
    headers: { "X-User-ID": uid },
  });
}

export async function recordSchemeVisit(
  schemeSlug: string,
  userIdOverride?: string
): Promise<TrackingCenterResponse> {
  const uid = userIdOverride || getSessionUserId();
  return request<TrackingCenterResponse>("/api/v1/tracking/visit", {
    method: "POST",
    headers: { "X-User-ID": uid },
    body: JSON.stringify({ scheme_slug: schemeSlug }),
  });
}

export async function removeRecentVisit(
  schemeSlug: string,
  userIdOverride?: string
): Promise<TrackingCenterResponse> {
  const uid = userIdOverride || getSessionUserId();
  return request<TrackingCenterResponse>(
    `/api/v1/tracking/visit/${encodeURIComponent(schemeSlug)}`,
    {
      method: "DELETE",
      headers: { "X-User-ID": uid },
    }
  );
}

export async function clearAllRecentVisits(
  userIdOverride?: string
): Promise<TrackingCenterResponse> {
  const uid = userIdOverride || getSessionUserId();
  return request<TrackingCenterResponse>("/api/v1/tracking/visit", {
    method: "DELETE",
    headers: { "X-User-ID": uid },
  });
}

export async function updateSchemeApplicationStatus(
  schemeSlug: string,
  userConfirmedStatus: UserApplicationStatus,
  notes?: string,
  userIdOverride?: string
): Promise<TrackingCenterResponse> {
  const uid = userIdOverride || getSessionUserId();
  return request<TrackingCenterResponse>("/api/v1/tracking/status", {
    method: "POST",
    headers: { "X-User-ID": uid },
    body: JSON.stringify({
      scheme_slug: schemeSlug,
      user_confirmed_status: userConfirmedStatus,
      notes,
    }),
  });
}

export async function removeTrackedApplication(
  schemeSlug: string,
  userIdOverride?: string
): Promise<TrackingCenterResponse> {
  const uid = userIdOverride || getSessionUserId();
  return request<TrackingCenterResponse>(
    `/api/v1/tracking/applications/${encodeURIComponent(schemeSlug)}`,
    {
      method: "DELETE",
      headers: { "X-User-ID": uid },
    }
  );
}

export async function updateNotificationPreferences(
  prefs: NotificationPreferences,
  userIdOverride?: string
): Promise<TrackingCenterResponse> {
  const uid = userIdOverride || getSessionUserId();
  return request<TrackingCenterResponse>("/api/v1/tracking/preferences", {
    method: "PUT",
    headers: { "X-User-ID": uid },
    body: JSON.stringify(prefs),
  });
}

export async function markNotificationRead(
  notificationId: string,
  userIdOverride?: string
): Promise<TrackingCenterResponse> {
  const uid = userIdOverride || getSessionUserId();
  return request<TrackingCenterResponse>(
    `/api/v1/tracking/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: "POST",
      headers: { "X-User-ID": uid },
    }
  );
}

export async function rankSchemesByProfile(
  profile: CitizenProfile,
  includeUnverified: boolean = false
): Promise<RankedSchemeDiscoveryItem[]> {
  return request<RankedSchemeDiscoveryItem[]>("/api/v1/tracking/rank-schemes", {
    method: "POST",
    body: JSON.stringify({ profile, include_unverified: includeUnverified }),
  });
}

// --- Billing, Subscriptions, Organizations & Razorpay Checkout (Parts D, E, F) ---

export async function fetchCurrentPricing(): Promise<any> {
  return request("/api/v1/billing/pricing");
}

export async function fetchOrganizationQuote(seats: number): Promise<any> {
  return request(`/api/v1/billing/quote/organization?seats=${encodeURIComponent(String(seats))}`);
}

export async function fetchBillingAccount(userIdOverride?: string): Promise<any> {
  const uid = userIdOverride || getSessionUserId();
  return request("/api/v1/billing/account", {
    headers: { "X-User-ID": uid },
  });
}

export async function createCheckoutOrder(
  planType: "INDIVIDUAL" | "ORGANIZATION",
  seats: number = 1,
  orgId?: string,
  userIdOverride?: string
): Promise<any> {
  const uid = userIdOverride || getSessionUserId();
  return request("/api/v1/billing/checkout/create-order", {
    method: "POST",
    headers: { "X-User-ID": uid },
    body: JSON.stringify({ plan_type: planType, seats, org_id: orgId }),
  });
}

export async function fetchSandboxTestSignature(
  orderId: string,
  userIdOverride?: string
): Promise<{
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}> {
  const uid = userIdOverride || getSessionUserId();
  return request(
    `/api/v1/billing/checkout/sandbox-test-signature?order_id=${encodeURIComponent(orderId)}`,
    {
      method: "POST",
      headers: { "X-User-ID": uid },
    }
  );
}

export async function verifyCheckoutPayment(
  payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
  userIdOverride?: string
): Promise<any> {
  const uid = userIdOverride || getSessionUserId();
  return request("/api/v1/billing/checkout/verify", {
    method: "POST",
    headers: { "X-User-ID": uid },
    body: JSON.stringify(payload),
  });
}

export async function createOrganizationAccount(
  name: string,
  initialSeats: number,
  userIdOverride?: string
): Promise<any> {
  const uid = userIdOverride || getSessionUserId();
  return request("/api/v1/billing/organizations", {
    method: "POST",
    headers: { "X-User-ID": uid },
    body: JSON.stringify({ name, initial_seats: initialSeats }),
  });
}

export async function assignOrganizationSeat(
  orgId: string,
  memberEmail: string,
  memberUserId?: string,
  userIdOverride?: string
): Promise<any> {
  const uid = userIdOverride || getSessionUserId();
  return request(`/api/v1/billing/organizations/${encodeURIComponent(orgId)}/seats/assign`, {
    method: "POST",
    headers: { "X-User-ID": uid },
    body: JSON.stringify({ member_email: memberEmail, member_user_id: memberUserId }),
  });
}

export async function revokeOrganizationSeat(
  orgId: string,
  seatId: string,
  userIdOverride?: string
): Promise<any> {
  const uid = userIdOverride || getSessionUserId();
  return request(
    `/api/v1/billing/organizations/${encodeURIComponent(orgId)}/seats/${encodeURIComponent(
      seatId
    )}/revoke`,
    {
      method: "POST",
      headers: { "X-User-ID": uid },
    }
  );
}
