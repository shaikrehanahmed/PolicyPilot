"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  HelpCircle,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { diagnoseRescueStatus, fetchRescuePresets } from "@/lib/api";
import { useProfile } from "@/lib/profile-context";
import {
  CitizenProfile,
  RescueDiagnoseResponse,
  RescuePreset,
} from "@/lib/types";

function scrubClientSidePII(raw: string): string {
  return raw
    .replace(/\b(?:\d[\s-]?){7,15}\d\b/g, "[REDACTED_ID_NUMBER]")
    .replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      "[REDACTED_EMAIL]"
    );
}

export default function RescueModePage() {
  const { profile } = useProfile();
  const [presets, setPresets] = useState<RescuePreset[]>([]);
  const [rawText, setRawText] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [overrideProfile, setOverrideProfile] = useState<CitizenProfile | null>(null);
  const activeProfile = overrideProfile || profile;
  const [suppliedFacts, setSuppliedFacts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<RescueDiagnoseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRescuePresets()
      .then(setPresets)
      .catch(() => {});
  }, []);

  const executeDiagnosis = async (
    textToUse: string,
    codeToUse: string | null,
    factsToUse: Record<string, string>,
    profileToUse: CitizenProfile
  ) => {
    setLoading(true);
    setError(null);
    try {
      const safeText = scrubClientSidePII(textToUse);
      const res = await diagnoseRescueStatus({
        raw_status_text: safeText,
        selected_symptom_code: codeToUse,
        supplied_facts: factsToUse,
        profile: profileToUse,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to run Rescue Mode diagnosis."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (p: RescuePreset) => {
    setRawText(p.sample_status_text);
    setSelectedCode(p.symptom_code);
    setSuppliedFacts({});
    const mergedProfile = { ...profile, ...p.suggested_profile };
    setOverrideProfile(mergedProfile);
    executeDiagnosis(p.sample_status_text, p.symptom_code, {}, mergedProfile);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-2xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>PolicyPilot Rescue Mode · Zero-PII Deterministic Triage</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213F] tracking-tight">
          Resolve Defective, Stalled, or Rejected Applications
        </h1>
        <p className="text-sm text-[#667085] max-w-3xl leading-relaxed">
          Paste a cryptic portal status message (such as{" "}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
            Marked Defective by INO
          </span>
          ,{" "}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
            PFMS Rejected by Bank
          </span>
          , or{" "}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
            PFMS Response Pending
          </span>
          ). Our deterministic rules engine prevents irreversible portal withdrawal mistakes, cites
          exact official manual clauses, and routes substantive exclusions to verified alternative
          schemes.
        </p>
      </div>

      {/* 1-Click Judge & Citizen Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">
            One-Click Verified Failure Scenarios (Live Demo Presets)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {presets.map((p) => (
            <button
              key={p.preset_id}
              onClick={() => handleSelectPreset(p)}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                selectedCode === p.symptom_code
                  ? "border-[#4F46E5] bg-[#4F46E5]/5 shadow-2xs"
                  : "border-[#E5E7EB] bg-white hover:border-[#4F46E5]/50"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-[#17213F]">{p.label}</div>
                <div className="text-[11px] text-[#667085] mt-1 line-clamp-1 font-mono">
                  &ldquo;{p.sample_status_text}&rdquo;
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Status Input Card with Browser-Side PII Shield */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-2xs">
        <label className="block text-sm font-bold text-[#17213F]">
          Portal Status Message or Rejection Notice
        </label>
        <textarea
          rows={3}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setSelectedCode(null);
          }}
          placeholder="Paste status string from NSP, PM-KISAN, Telangana ePASS / Rythu Bharosa, or MeeSeva..."
          className="w-full rounded-xl border border-gray-300 p-3.5 text-sm text-[#17213F] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
            <span className="font-bold">Zero-PII Browser Shield:</span>{" "}
            {scrubClientSidePII(rawText) || "Any 8–16 digit numbers are masked before leaving your browser."}
          </div>
          <button
            onClick={() =>
              executeDiagnosis(rawText, selectedCode, suppliedFacts, activeProfile)
            }
            disabled={!rawText.trim() || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Running Deterministic Triage..." : "Diagnose Application Status"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Clarification Micro-Questions (When verdict === NEEDS_CLARIFICATION) */}
      {result && result.verdict === "NEEDS_CLARIFICATION" && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-amber-950">
                Clarification Needed to Prevent a Portal Trap
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Answer {result.clarification_questions.length} quick question(s) so the deterministic
                engine selects the exact legal recovery procedure.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {result.clarification_questions.map((q) => (
              <div
                key={q.fact_key}
                className="bg-white rounded-xl border border-amber-200 p-4 space-y-2.5"
              >
                <div className="text-sm font-bold text-[#17213F]">{q.question_text}</div>
                <div className="text-xs text-[#667085]">{q.why_this_matters}</div>
                <div className="flex flex-wrap gap-3 pt-1">
                  {q.options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                        suppliedFacts[q.fact_key] === opt.value
                          ? "border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5]"
                          : "border-gray-200 hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.fact_key}
                        value={opt.value}
                        checked={suppliedFacts[q.fact_key] === opt.value}
                        onChange={() =>
                          setSuppliedFacts((prev) => ({
                            ...prev,
                            [q.fact_key]: opt.value,
                          }))
                        }
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              executeDiagnosis(rawText, selectedCode, suppliedFacts, activeProfile)
            }
            className="px-5 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold cursor-pointer"
          >
            Confirm Answers & Generate Verified Recovery Plan
          </button>
        </div>
      )}

      {/* Full Diagnostic Output */}
      {result && result.verdict !== "NEEDS_CLARIFICATION" && (
        <div className="space-y-6">
          {/* Procedural Trap Red Alert */}
          {result.critical_trap_warning && (
            <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-5 flex items-start gap-3.5">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-red-700">
                  Deterministic Procedural Trap Guardrail
                </div>
                <p className="text-sm font-semibold text-red-950 leading-relaxed">
                  {result.critical_trap_warning}
                </p>
              </div>
            </div>
          )}

          {/* Epistemic State: Known / Unknown / Unverified */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Known (Verified by Rules)</span>
              </div>
              <ul className="text-xs text-emerald-950 space-y-1.5 list-disc pl-4">
                {result.epistemic_state.known_facts.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Unknown (You Must Check)</span>
              </div>
              <ul className="text-xs text-amber-950 space-y-1.5 list-disc pl-4">
                {result.epistemic_state.unknown_to_verify.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span>Unverified System Boundary</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                {result.epistemic_state.unverified_boundaries.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step-by-Step Recovery Plan & Printable Counter Slip */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">
                  Verdict: {result.verdict.replace(/_/g, " ")}
                </span>
                <h2 className="text-lg font-bold text-[#17213F] mt-0.5">
                  Evidence-Grounded Recovery Checklist
                </h2>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-[#17213F] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Counter Action Slip
              </button>
            </div>

            <div className="space-y-4">
              {result.remediation_steps.map((step) => (
                <div
                  key={step.step_number}
                  className="rounded-xl border border-gray-200 p-4 space-y-2 bg-gray-50/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#4F46E5]">
                      STEP {step.step_number}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                      Destination: {step.destination.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#17213F]">
                    {step.action_title}
                  </div>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {step.detailed_instruction}
                  </p>
                  {step.required_items_to_carry.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {step.required_items_to_carry.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-white border border-gray-200 px-2.5 py-0.5 rounded text-gray-700 font-medium"
                        >
                          Carry: {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pre-Drafted Nodal Representation Letter */}
            {result.draft_grievance_text && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="text-xs font-bold uppercase text-slate-700">
                  Reviewable Nodal Officer Representation Draft
                </div>
                <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono bg-white p-3 rounded-lg border border-slate-200">
                  {result.draft_grievance_text}
                </pre>
              </div>
            )}
          </div>

          {/* Official Citations (SKILL.md Compliant) */}
          {result.citations.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#667085]">
                <FileText className="w-4 h-4 text-[#4F46E5]" />
                <span>Official Gazette & Portal Manual Citations</span>
              </div>
              {result.citations.map((cit, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#17213F]">
                      {cit.source_title} ({cit.section_ref})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cit.freshness_status === "VERIFIED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {cit.freshness_status} · Tier {cit.source_tier}
                    </span>
                  </div>
                  <blockquote className="italic text-gray-700 border-l-2 border-[#4F46E5] pl-3">
                    &ldquo;{cit.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>Last Verified: {cit.last_verified_at.slice(0, 10)}</span>
                    <a
                      href={cit.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#4F46E5] font-semibold hover:underline"
                    >
                      Official Source <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No-Dead-End Alternative Schemes */}
          {result.alternative_schemes.length > 0 && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">
                  No-Dead-End Benefit Routing (Deterministic Eligibility Engine)
                </span>
                <h3 className="text-base font-bold text-[#17213F] mt-0.5">
                  Verified Alternative Schemes Matching Your Citizen Profile
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.alternative_schemes.map((alt) => (
                  <div
                    key={alt.scheme_id}
                    className="bg-white rounded-xl border border-indigo-100 p-4 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#17213F]">
                        {alt.scheme_name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {alt.overall_status}
                      </span>
                    </div>
                    <p className="text-xs text-[#667085]">{alt.why_this_result}</p>
                    <Link
                      href={`/schemes/${alt.scheme_slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:underline pt-1"
                    >
                      View Scheme Action Plan <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
