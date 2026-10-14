"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  ExternalLink,
  Sparkles,
  BookOpen,
  Building2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Check,
  Calendar,
  BookmarkCheck,
  Clock,
} from "lucide-react";
import {
  evaluateEligibility,
  fetchScheme,
  generateActionPlan,
  recordSchemeVisit,
  runWorkflow,
  updateSchemeApplicationStatus,
} from "@/lib/api";
import {
  ActionPlan,
  EligibilityResult,
  EvidenceChunk,
  Scheme,
  TrackedSchemeRecordOut,
  WorkflowRunResponse,
  formatCurrencyINR,
} from "@/lib/types";
import { useProfile } from "@/lib/profile-context";
import { useLanguage } from "@/lib/i18n-context";
import { BackButton } from "@/components/back-button";

interface SelectedEvidenceItem {
  title: string;
  source_ref?: string;
  evidence?: (EvidenceChunk & { text?: string }) | null;
}

export default function SchemeDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Loading scheme details...</p>
        </div>
      }
    >
      <SchemeDetailContent />
    </Suspense>
  );
}

function SchemeDetailContent() {
  const params = useParams();
  const schemeSlug = params.id as string;
  const { profile } = useProfile();
  const { localizeScheme, isRtl, t } = useLanguage();

  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<SelectedEvidenceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workflow agent state
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<WorkflowRunResponse | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [trackingRecord, setTrackingRecord] = useState<TrackedSchemeRecordOut | null>(null);

  useEffect(() => {
    recordSchemeVisit(schemeSlug)
      .then((res) => {
        const found = res?.tracked_schemes?.find((t) => t.scheme_slug === schemeSlug);
        if (found) setTrackingRecord(found);
      })
      .catch(() => {});
  }, [schemeSlug]);

  const handleToggleAppliedStatus = async () => {
    const current = trackingRecord?.user_confirmed_status;
    const target = current === "APPLIED" ? "NOT_APPLIED" : "APPLIED";
    try {
      const updated = await updateSchemeApplicationStatus(schemeSlug, target);
      const found = updated?.tracked_schemes?.find((t) => t.scheme_slug === schemeSlug);
      if (found) setTrackingRecord(found);
    } catch (err) {
      console.error("Failed to update application status:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const s = await fetchScheme(schemeSlug);
        setScheme(s);

        // Run deterministic evaluation
        const evalRes = await evaluateEligibility(schemeSlug, profile);
        setEligibility(evalRes);

        // Generate action plan
        const plan = await generateActionPlan(schemeSlug, profile);
        setActionPlan(plan);
      } catch (e: unknown) {
        console.error("Failed to load scheme evaluation:", e);
        setError(e instanceof Error ? e.message : "Failed to load scheme details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [schemeSlug, profile]);

  const handleRunAgenticWorkflow = async () => {
    setWorkflowRunning(true);
    setShowWorkflowModal(true);
    try {
      const res = await runWorkflow(profile, profile.goal, schemeSlug);
      setWorkflowResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setWorkflowRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 font-medium">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  if (error && !scheme) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h2 className="text-lg font-bold text-red-900">Failed to load scheme details</h2>
          <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer shadow-xs"
            >
              {t("common.retry")}
            </button>
            <Link
              href="/schemes"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 shadow-xs"
            >
              ← {t("detail.back")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Scheme Not Found</h2>
        <p className="text-sm text-gray-500">The requested scheme could not be located in the repository.</p>
        <Link href="/schemes" className="text-sm text-indigo-600 font-semibold underline">
          ← {t("detail.back")}
        </Link>
      </div>
    );
  }

  const status = eligibility?.status || "UNDETERMINED";
  const portalUrl = scheme.source?.url || "https://india.gov.in";
  const { displayName, displayDescription } = localizeScheme(scheme);

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
    >
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <BackButton fallbackHref="/schemes" labelOverride={t("detail.back")} />

        <button
          onClick={handleRunAgenticWorkflow}
          className="btn-forest inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 text-[#C5A572]" />
          <span>{t("btn_run_analysis") || t("nav_runAnalysis") || "Run Policy Analysis"}</span>
        </button>
      </div>

      {/* Scheme Top Overview Header */}
      <div className="folio-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="brass-badge px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
              {scheme.category}
            </span>
            <span className="embossed-well px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-[#4A524C]">
              {scheme.level} {scheme.state ? `• ${scheme.state}` : "• Central"}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#E6ECE7] text-[#163026] border border-[#CFDBD1]">
              {scheme.verification_status}
            </span>
          </div>

          <a
            href={portalUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-parchment inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            {t("detail.officialPortal")} <ExternalLink className="w-3.5 h-3.5 text-[#163026]" />
          </a>
        </div>

        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#141815] leading-tight">
            {displayName}
          </h1>
          <p className="text-xs text-[#6B726C] mt-1 flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-[#8C6D3B] shrink-0" />
            <span>{t("detail.nodalAuthority")}: {scheme.department || "Government of India"}</span>
          </p>
        </div>

        <p className="text-sm text-[#4A524C] leading-relaxed max-w-4xl">
          {displayDescription}
        </p>
      </div>

      {/* Scheme Tracking, Official Lifecycle Status & Results Guidance (Parts C1-C6) */}
      <div className="card-3d rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("detail_officialLifecycle") || "Official Lifecycle"}:
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                trackingRecord?.official_lifecycle_status === "Active"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : trackingRecord?.official_lifecycle_status === "Deadline Extended"
                  ? "bg-blue-50 text-blue-800 border-blue-300"
                  : trackingRecord?.official_lifecycle_status === "Results Announced"
                  ? "bg-purple-50 text-purple-800 border-purple-300"
                  : trackingRecord?.official_lifecycle_status === "Application Closed"
                  ? "bg-gray-100 text-gray-700 border-gray-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {trackingRecord?.official_lifecycle_status || "Active"}
            </span>
            {trackingRecord?.evidence?.last_verified_at && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                Verified: <span className="ltr-inline">{trackingRecord.evidence.last_verified_at.slice(0, 10)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleAppliedStatus}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer border btn-3d ${
                trackingRecord?.user_confirmed_status === "APPLIED"
                  ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>
                {trackingRecord?.user_confirmed_status === "APPLIED"
                  ? (t("detail_markedAsApplied") || "Marked as Applied")
                  : (t("detail_markAsApplied") || "Mark as Applied")}
              </span>
            </button>
          </div>
        </div>

        {/* Applied disclaimer and timestamp */}
        {trackingRecord?.user_confirmed_status === "APPLIED" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-950">
                Marked as Applied
                {trackingRecord.applied_at
                  ? ` on ${trackingRecord.applied_at.slice(0, 10)}`
                  : ""}
              </p>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                {trackingRecord.external_submission_disclaimer ||
                  "PolicyPilot records your self-reported 'Applied' status for personal tracking only and cannot independently verify submission or approval on external government portals."}
              </p>
            </div>
          </div>
        )}

        {/* Results Guidance Card (Part C5) */}
        {trackingRecord?.results_guidance && (
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs card-3d">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5 text-sm">
                <FileText className="w-4 h-4 text-[#4F46E5]" />
                {t("detail_resultsGuidanceTitle")}
              </span>
              {trackingRecord.results_guidance.announcement_date && (
                <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Batch: <span className="ltr-inline">{trackingRecord.results_guidance.announcement_date}</span>
                </span>
              )}
            </div>
            <p className="text-slate-700 leading-relaxed">
              {trackingRecord.results_guidance.how_to_check}
            </p>
            {trackingRecord.results_guidance.official_next_steps &&
              trackingRecord.results_guidance.official_next_steps.length > 0 && (
                <ul className="list-disc ps-4 space-y-1 text-slate-700">
                  {trackingRecord.results_guidance.official_next_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              )}
            {trackingRecord.results_guidance.official_results_portal_url && (
              <a
                href={trackingRecord.results_guidance.official_results_portal_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#4F46E5] hover:underline font-bold pt-1"
              >
                Official Verification Portal <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <p className="text-[11px] text-slate-500 italic pt-1.5 border-t border-slate-200">
              {trackingRecord.results_guidance.distinction_disclaimer}
            </p>
          </div>
        )}
      </div>

      {/* Deterministic Eligibility Outcome Banner */}
      <div
        className={`card-3d rounded-3xl p-6 sm:p-8 transition-all ${
          status === "ELIGIBLE"
            ? "border-emerald-300/80 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30"
            : status === "PARTIALLY_ELIGIBLE"
            ? "border-amber-300/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30"
            : status === "NOT_ELIGIBLE"
            ? "border-rose-300/80 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs ${
                  status === "ELIGIBLE"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : status === "PARTIALLY_ELIGIBLE"
                    ? "bg-amber-600 text-white border-amber-600"
                    : status === "NOT_ELIGIBLE"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-slate-600 text-white border-slate-600"
                }`}
              >
                {status.replace("_", " ")}
              </span>

              <span className="text-xs font-semibold text-slate-600">
                {t("detail.evaluationCompleteness")}: {eligibility?.completeness || "COMPLETE"}
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#0F172A] leading-snug">
              {eligibility?.why_this_result}
            </h2>

            {/* AI Explanation Paragraph */}
            {actionPlan?.explanation && (
              <div className="bg-white/90 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                  <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                  <span>{t("detail.plainSynthesis")}</span>
                  <span className="text-[10px] font-normal text-slate-500 font-mono">
                    ({actionPlan.explanation.provider === "gemini" ? "Gemini 3.8 Flash" : "Deterministic Fallback"})
                  </span>
                </div>
                <p>{actionPlan.explanation.text}</p>
                {actionPlan.explanation.note && (
                  <span className="text-[10px] text-slate-400 block italic">
                    {actionPlan.explanation.note}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs min-w-[240px] text-xs space-y-2.5 shrink-0 card-3d">
            <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[10px] block border-b border-slate-100 pb-1.5">
              {t("detail.activeProfile")}
            </span>
            <div className="flex justify-between text-slate-600">
              <span>{t("common.state", "State")}:</span>
              <strong className="text-slate-900">{profile.state || "Not set"}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t("common.occupation", "Occupation")}:</span>
              <strong className="text-slate-900 capitalize">{profile.occupation || "Not set"}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t("common.income", "Income")}:</span>
              <strong className="text-slate-900 ltr-inline">
                {profile.annual_income_inr ? `₹${formatCurrencyINR(profile.annual_income_inr)}` : "Not set"}
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t("common.landholding", "Landholding")}:</span>
              <strong className="text-slate-900 ltr-inline">
                {profile.landholding_acres != null ? `${profile.landholding_acres} Acres` : "Not provided"}
              </strong>
            </div>
            <Link
              href="/profile"
              className="text-[11px] text-[#4F46E5] hover:text-[#4338CA] font-bold block text-center pt-2 border-t border-slate-100 mt-1 transition"
            >
              {t("detail.editProfile")}
            </Link>
          </div>
        </div>
      </div>

      {/* Granular Criteria Evaluation Table */}
      <div className="card-3d rounded-3xl overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="font-extrabold text-base text-[#0F172A]">
              {t("detail.evalMatrix")}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("detail.evalMatrixDesc")}
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-lg text-slate-700 font-semibold border border-slate-200">
            {scheme.criteria?.length || 0} {t("detail.officialRules")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">{t("detail.criterionHeader")}</th>
                <th className="p-4">{t("detail.conditionHeader")}</th>
                <th className="p-4">{t("detail.profileValueHeader")}</th>
                <th className="p-4">{t("detail.resultStateHeader")}</th>
                <th className="p-4">{t("detail.evidenceHeader")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {eligibility?.criteria.map((crit, idx) => {
                const isMet = crit.status === "met";
                const isNotMet = crit.status === "not_met";

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#0F172A] capitalize">
                          {crit.criterion_key.replace(/_/g, " ")}
                        </span>
                        {crit.pathway && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#4F46E5] text-[10px] font-bold uppercase tracking-wider border border-indigo-200">
                            Pathway: {crit.pathway.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">{crit.reason}</div>
                    </td>

                    <td className="p-4 font-mono text-slate-700">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-slate-800 text-[11px] border border-slate-200 ltr-inline">
                        {crit.operator} {JSON.stringify(crit.rule_target_value)}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-slate-900 font-bold">
                      {crit.user_provided_value !== null && crit.user_provided_value !== undefined ? (
                        <span className="ltr-inline">{String(crit.user_provided_value)}</span>
                      ) : (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          {t("detail.missingAttribute")}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {isMet ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t("detail.met")}
                        </span>
                      ) : isNotMet ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] shadow-2xs">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> {t("detail.notMet")}
                        </span>
                      ) : crit.status === "needs_verification" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px] shadow-2xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> {t("detail.needsVerification")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] shadow-2xs">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> {t("detail.unknown")}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {crit.source_ref ? (
                        <button
                          onClick={() =>
                            setSelectedEvidence({
                              title: scheme.name,
                              source_ref: crit.source_ref,
                              evidence: crit.evidence?.[0] || scheme.evidence_chunks?.[0],
                            })
                          }
                          className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-bold underline flex items-center gap-1.5 text-left cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>{crit.source_ref}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">{t("detail.clauseInGazette")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Action Roadmap & Required Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Personalized Action Roadmap */}
        <div className="lg:col-span-7 card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-extrabold text-lg text-[#0F172A]">
              {t("detail.actionPlanTitle")}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t("detail.actionPlanDesc")}
            </p>
          </div>

          <div className="space-y-4">
            {actionPlan?.roadmap.map((step) => (
              <div
                key={step.order}
                className="flex items-start gap-4 p-4.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all shadow-2xs card-3d"
              >
                <div className="w-7 h-7 rounded-xl bg-[#4F46E5] text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  {step.order}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-[#0F172A]">{step.title}</h4>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                      {step.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.action}</p>

                  {step.portal_url && (
                    <a
                      href={step.portal_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#4F46E5] font-bold mt-2 hover:underline"
                    >
                      {t("detail.visitPortal")} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Required Documents Checklist */}
        <div className="lg:col-span-5 card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-extrabold text-lg text-[#0F172A]">
              {t("detail.documentsChecklistTitle")}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t("detail.documentsChecklistDesc")}
            </p>
          </div>

          <div className="space-y-3">
            {scheme.documents?.map((doc, idx) => {
              const reqType = doc.requirement_type || (doc.required ? "MANDATORY" : "COMMONLY_REQUESTED");
              const isMandatory = reqType === "MANDATORY";
              const isConditional = reqType === "CONDITIONALLY_REQUIRED";
              const isNotApplicable = reqType === "NOT_APPLICABLE";

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                    isNotApplicable
                      ? "border-slate-200 bg-slate-50/60 opacity-80"
                      : "border-slate-200 bg-white hover:border-indigo-300 shadow-2xs card-3d"
                  }`}
                >
                  <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isNotApplicable ? "text-slate-400" : "text-[#4F46E5]"}`} />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold text-xs ${isNotApplicable ? "text-slate-600" : "text-slate-900"}`}>
                        {doc.name}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                          isMandatory
                            ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                            : isConditional
                            ? "text-amber-800 bg-amber-50 border-amber-200"
                            : isNotApplicable
                            ? "text-slate-600 bg-slate-100 border-slate-200"
                            : "text-blue-800 bg-blue-50 border-blue-200"
                        }`}
                      >
                        {reqType.replace(/_/g, " ")}
                      </span>
                    </div>
                    {doc.description ? (
                      <p className="text-[11px] text-slate-600 leading-snug">{doc.description}</p>
                    ) : (
                      <span className="text-[11px] text-slate-400 capitalize block">
                        Category: {doc.kind.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scheme-Specific Procedural Notice */}
          {scheme.slug === "pm-jay" ? (
            <div className="bg-emerald-50/90 rounded-2xl p-4.5 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>100% Cashless Treatment Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-900/90">
                PM-JAY is a cashless hospitalization scheme. Beneficiaries do not need to link a bank account or pay any hospital admission deposit. Treatment is authorized directly through your Ayushman Golden Card.
              </p>
            </div>
          ) : scheme.slug === "nsp-post-matric" ? (
            <div className="bg-blue-50/90 rounded-2xl p-4.5 border border-blue-200 text-xs text-blue-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>Institutional Verification Requirement</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-900/90">
                After completing One-Time Registration (OTR) on scholarships.gov.in, print your acknowledgment slip and submit it along with original caste and income certificates to your institution nodal officer for Level-1 validation.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50/90 rounded-2xl p-4.5 border border-amber-200 text-xs text-amber-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Aadhaar-DBT Seeding Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                Direct Benefit Transfer (DBT) requires your active bank account to be seeded with your Aadhaar number at your bank branch and mapped on the NPCI gateway for public funds credit.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Official Evidence Drawer / Modal */}
      {/* Official Evidence Drawer / Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="card-3d bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-extrabold text-sm text-[#0F172A]">{t("detail.sourceCitation")}</h3>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer p-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="font-semibold text-slate-500 block">{t("detail.referencedClause")}</span>
                <span className="font-bold text-[#0F172A] text-sm font-mono mt-0.5 block">
                  {selectedEvidence.source_ref}
                </span>
              </div>

              {selectedEvidence.evidence && (
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-2 card-3d">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">{t("detail.officialQuote")}</span>
                  <blockquote className="italic text-slate-800 leading-relaxed border-l-2 border-[#4F46E5] pl-3 py-0.5">
                    &ldquo;{selectedEvidence.evidence.quote || selectedEvidence.evidence.text}&rdquo;
                  </blockquote>
                  <div className="text-[11px] text-slate-500 pt-1 flex justify-between font-mono">
                    <span>Page: <span className="ltr-inline">{selectedEvidence.evidence.page_ref || "p.3"}</span></span>
                    <span>Section: <span className="ltr-inline">{selectedEvidence.evidence.section_ref || "Clause 2.1"}</span></span>
                  </div>
                </div>
              )}

              <div>
                <span className="font-semibold text-slate-500 block">Publication:</span>
                <span className="text-slate-700 font-medium">{scheme.source?.title || "Department Guideline"}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold cursor-pointer btn-3d shadow-md shadow-indigo-500/20"
              >
                {t("detail.closeCitation")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Analysis Autonomous Navigation Workflow Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="card-3d bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#4F46E5]" />
                <div>
                  <h3 className="font-extrabold text-base text-[#0F172A]">
                    Policy Analysis Autonomous Navigation Workflow
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    6-Node Policy Pipeline (Deterministic Evaluator &amp; Gazette Verification)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer p-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {workflowRunning ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  Executing policy analysis pipeline asynchronously...
                </p>
                <p className="text-[11px] text-slate-400">
                  Normalizing Profile → Discovering Schemes → Evaluating Rules → Checking Documents → Verifying Sources → Preparing Action Plan
                </p>
              </div>
            ) : workflowResult ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Node Execution Trajectory:
                  </h4>
                  {workflowResult.steps_log.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex items-start gap-3 card-3d"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-2xs">
                        ✓
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-[#0F172A] font-mono text-[11px]">
                            {step.step_name}
                          </strong>
                          <span className="text-[10px] text-slate-400 font-mono ltr-inline">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {workflowResult.explanation && (
                  <div className="bg-indigo-50/70 rounded-2xl p-4.5 border border-indigo-200 text-xs text-indigo-950 space-y-2 card-3d">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-indigo-950">
                        <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                        Grounded Synthesis
                      </span>
                      <span className="text-[10px] font-mono text-indigo-700 bg-white/80 px-2 py-0.5 rounded-md border border-indigo-200">
                        {workflowResult.explanation.provider === "gemini" ? "Gemini 3.8 Flash (Live)" : "Deterministic Fallback"}
                      </span>
                    </div>
                    <p className="leading-relaxed text-indigo-950">{workflowResult.explanation.text}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-rose-600 font-semibold">Workflow execution failed.</p>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer btn-3d"
              >
                {t("detail.closeTrace")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
