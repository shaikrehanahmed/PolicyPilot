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
} from "lucide-react";
import {
  evaluateEligibility,
  fetchScheme,
  generateActionPlan,
  runWorkflow,
} from "@/lib/api";
import {
  ActionPlan,
  EligibilityResult,
  EvidenceChunk,
  Scheme,
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
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-indigo-600" />
          {t("detail.agentWorkflow")}
        </button>
      </div>

      {/* Scheme Top Overview Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
              {scheme.category}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
              {scheme.level} {scheme.state ? `• ${scheme.state}` : "• Central"}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              {scheme.verification_status}
            </span>
          </div>

          <a
            href={portalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors border border-gray-200"
          >
            {t("detail.officialPortal")} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17213F] leading-tight">
            {displayName}
          </h1>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {t("detail.nodalAuthority")}: {scheme.department || "Government of India"}
          </p>
        </div>

        <p className="text-sm text-[#475467] leading-relaxed max-w-4xl">
          {displayDescription}
        </p>
      </div>

      {/* Deterministic Eligibility Outcome Banner */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 shadow-xs transition-all ${
          status === "ELIGIBLE"
            ? "bg-emerald-50/70 border-emerald-300"
            : status === "PARTIALLY_ELIGIBLE"
            ? "bg-amber-50/70 border-amber-300"
            : status === "NOT_ELIGIBLE"
            ? "bg-rose-50/70 border-rose-300"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  status === "ELIGIBLE"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : status === "PARTIALLY_ELIGIBLE"
                    ? "bg-amber-600 text-white border-amber-600"
                    : status === "NOT_ELIGIBLE"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-gray-600 text-white border-gray-600"
                }`}
              >
                {status.replace("_", " ")}
              </span>

              <span className="text-xs font-semibold text-gray-600">
                {t("detail.evaluationCompleteness")}: {eligibility?.completeness || "COMPLETE"}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {eligibility?.why_this_result}
            </h2>

            {/* AI Explanation Paragraph */}
            {actionPlan?.explanation && (
              <div className="bg-white/80 rounded-xl p-4 border border-gray-200 text-xs text-gray-700 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>{t("detail.plainSynthesis")}</span>
                  <span className="text-[10px] font-normal text-gray-500 font-mono">
                    ({actionPlan.explanation.provider === "gemini" ? "Gemini 3.8 Flash" : "Deterministic Fallback"})
                  </span>
                </div>
                <p>{actionPlan.explanation.text}</p>
                {actionPlan.explanation.note && (
                  <span className="text-[10px] text-gray-400 block italic">
                    {actionPlan.explanation.note}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs min-w-[220px] text-xs space-y-2 shrink-0">
            <span className="font-bold text-gray-800 uppercase tracking-wider text-[10px] block border-b pb-1">
              {t("detail.activeProfile")}
            </span>
            <div className="flex justify-between text-gray-600">
              <span>{t("common.state", "State")}:</span>
              <strong className="text-gray-900">{profile.state || "Not set"}</strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t("common.occupation", "Occupation")}:</span>
              <strong className="text-gray-900 capitalize">{profile.occupation || "Not set"}</strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t("common.income", "Income")}:</span>
              <strong className="text-gray-900">
                {profile.annual_income_inr ? `₹${formatCurrencyINR(profile.annual_income_inr)}` : "Not set"}
              </strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t("common.landholding", "Landholding")}:</span>
              <strong className="text-gray-900">
                {profile.landholding_acres != null ? `${profile.landholding_acres} Acres` : "Not provided"}
              </strong>
            </div>
            <Link
              href="/profile"
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold block text-center pt-1 border-t mt-1"
            >
              {t("detail.editProfile")}
            </Link>
          </div>
        </div>
      </div>

      {/* Granular Criteria Evaluation Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#17213F]">
              {t("detail.evalMatrix")}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("detail.evalMatrixDesc")}
            </p>
          </div>
          <span className="text-xs font-mono bg-gray-100 px-2.5 py-1 rounded text-gray-600 font-medium">
            {scheme.criteria?.length || 0} {t("detail.officialRules")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-gray-200 text-[#475467] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">{t("detail.criterionHeader")}</th>
                <th className="p-4">{t("detail.conditionHeader")}</th>
                <th className="p-4">{t("detail.profileValueHeader")}</th>
                <th className="p-4">{t("detail.resultStateHeader")}</th>
                <th className="p-4">{t("detail.evidenceHeader")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {eligibility?.criteria.map((crit, idx) => {
                const isMet = crit.status === "met";
                const isNotMet = crit.status === "not_met";

                return (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-950 capitalize">
                          {crit.criterion_key.replace(/_/g, " ")}
                        </span>
                        {crit.pathway && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-semibold uppercase tracking-wider border border-indigo-200">
                            Pathway: {crit.pathway.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{crit.reason}</div>
                    </td>

                    <td className="p-4 font-mono text-gray-700">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-800">
                        {crit.operator} {JSON.stringify(crit.rule_target_value)}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-gray-900 font-semibold">
                      {crit.user_provided_value !== null && crit.user_provided_value !== undefined ? (
                        <span>{String(crit.user_provided_value)}</span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-normal">
                          {t("detail.missingAttribute")}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {isMet ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t("detail.met")}
                        </span>
                      ) : isNotMet ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                          <XCircle className="w-3 h-3 text-rose-600" /> {t("detail.notMet")}
                        </span>
                      ) : crit.status === "needs_verification" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                          <ShieldCheck className="w-3 h-3 text-purple-600" /> {t("detail.needsVerification")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          <HelpCircle className="w-3 h-3 text-amber-600" /> {t("detail.unknown")}
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
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline flex items-center gap-1 text-left"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>{crit.source_ref}</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">{t("detail.clauseInGazette")}</span>
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
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-lg text-[#17213F]">
              {t("detail.actionPlanTitle")}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {t("detail.actionPlanDesc")}
            </p>
          </div>

          <div className="space-y-4">
            {actionPlan?.roadmap.map((step) => (
              <div
                key={step.order}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-[#F8FAFC] hover:bg-white hover:border-indigo-200 transition-all shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {step.order}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-gray-900">{step.title}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-200/80 text-gray-700">
                      {step.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.action}</p>

                  {step.portal_url && (
                    <a
                      href={step.portal_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold mt-2 hover:underline"
                    >
                      {t("detail.visitPortal")} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Required Documents Checklist */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-lg text-[#17213F]">
              {t("detail.documentsChecklistTitle")}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
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
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    isNotApplicable
                      ? "border-gray-200 bg-gray-50/60 opacity-80"
                      : "border-gray-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isNotApplicable ? "text-gray-400" : "text-indigo-600"}`} />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold text-xs ${isNotApplicable ? "text-gray-600" : "text-gray-900"}`}>
                        {doc.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                          isMandatory
                            ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                            : isConditional
                            ? "text-amber-800 bg-amber-50 border-amber-200"
                            : isNotApplicable
                            ? "text-gray-600 bg-gray-100 border-gray-200"
                            : "text-blue-800 bg-blue-50 border-blue-200"
                        }`}
                      >
                        {reqType.replace(/_/g, " ")}
                      </span>
                    </div>
                    {doc.description ? (
                      <p className="text-[11px] text-gray-600 leading-snug">{doc.description}</p>
                    ) : (
                      <span className="text-[11px] text-gray-400 capitalize block">
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
            <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>100% Cashless Treatment Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-900/90">
                PM-JAY is a cashless hospitalization scheme. Beneficiaries do not need to link a bank account or pay any hospital admission deposit. Treatment is authorized directly through your Ayushman Golden Card.
              </p>
            </div>
          ) : scheme.slug === "nsp-post-matric" ? (
            <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-200 text-xs text-blue-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>Institutional Verification Requirement</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-900/90">
                After completing One-Time Registration (OTR) on scholarships.gov.in, print your acknowledgment slip and submit it along with original caste and income certificates to your institution nodal officer for Level-1 validation.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Aadhaar-DBT Seeding Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Direct Benefit Transfer (DBT) requires your active bank account to be seeded with your Aadhaar number at your bank branch and mapped on the NPCI gateway for public funds credit.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Official Evidence Drawer / Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-gray-900">{t("detail.sourceCitation")}</h3>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-gray-500 block">{t("detail.referencedClause")}</span>
                <span className="font-bold text-gray-900 text-sm">
                  {selectedEvidence.source_ref}
                </span>
              </div>

              {selectedEvidence.evidence && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                  <span className="font-semibold text-gray-700 block">{t("detail.officialQuote")}</span>
                  <blockquote className="italic text-gray-800 leading-relaxed border-l-2 border-indigo-400 pl-3">
                    &ldquo;{selectedEvidence.evidence.quote || selectedEvidence.evidence.text}&rdquo;
                  </blockquote>
                  <div className="text-[11px] text-gray-500 pt-1 flex justify-between">
                    <span>Page: {selectedEvidence.evidence.page_ref || "p.3"}</span>
                    <span>Section: {selectedEvidence.evidence.section_ref || "Clause 2.1"}</span>
                  </div>
                </div>
              )}

              <div>
                <span className="font-semibold text-gray-500 block">Publication:</span>
                <span className="text-gray-700">{scheme.source?.title || "Department Guideline"}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {t("detail.closeCitation")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agentic Workflow Execution Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    LangGraph Autonomous Navigation Workflow
                  </h3>
                  <span className="text-xs text-gray-500">
                    6-Node Policy Pipeline (StateGraph with Meaningful Branching)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {workflowRunning ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-gray-700">
                  Executing LangGraph nodes asynchronously...
                </p>
                <p className="text-[11px] text-gray-400">
                  Normalizing Profile → Discovering Schemes → Evaluating Rules → Checking Documents → Verifying Sources → Preparing Action Plan
                </p>
              </div>
            ) : workflowResult ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Node Execution Trajectory:
                  </h4>
                  {workflowResult.steps_log.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-gray-200 bg-[#F8FAFC] text-xs flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-gray-900 font-mono text-[11px]">
                            {step.step_name}
                          </strong>
                          <span className="text-[10px] text-gray-400">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[11px]">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {workflowResult.explanation && (
                  <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Grounded Synthesis
                      </span>
                      <span className="text-[10px] font-mono text-indigo-700">
                        {workflowResult.explanation.provider === "gemini" ? "Gemini 3.8 Flash (Live)" : "Deterministic Fallback"}
                      </span>
                    </div>
                    <p className="leading-relaxed">{workflowResult.explanation.text}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-rose-600">Workflow execution failed.</p>
            )}

            <div className="pt-2 border-t flex justify-end">
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
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
