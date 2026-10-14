"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { diagnoseRescueStatus, fetchRescuePresets } from "@/lib/api";
import { useProfile } from "@/lib/profile-context";
import { useLanguage } from "@/lib/i18n-context";
import { BackButton } from "@/components/back-button";
import { VoiceAccessibilityBar } from "@/components/voice-accessibility-bar";
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

export default function ScholarshipRescuePage() {
  const { profile } = useProfile();
  const { lang, isRtl, t } = useLanguage();

  const [presets, setPresets] = useState<RescuePreset[]>([]);
  const [rawText, setRawText] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [presetProfileOverrides, setPresetProfileOverrides] = useState<Partial<CitizenProfile>>({});
  const [suppliedFacts, setSuppliedFacts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<RescueDiagnoseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeProfile = { ...profile, ...presetProfileOverrides };

  const executeDiagnosis = async (
    textToUse: string,
    codeToUse: string | null,
    factsToUse: Record<string, string>,
    profileToUse: CitizenProfile,
    langToUse = lang
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
        lang: langToUse,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to complete application defect diagnosis."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRescuePresets()
      .then(setPresets)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    if (result && rawText.trim()) {
      const safeText = scrubClientSidePII(rawText);
      diagnoseRescueStatus({
        raw_status_text: safeText,
        selected_symptom_code: selectedCode,
        supplied_facts: suppliedFacts,
        profile: activeProfile,
        lang,
      })
        .then((res) => {
          if (!ignore) setResult(res);
        })
        .catch(() => {});
    }
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleSelectPreset = (p: RescuePreset) => {
    setRawText(p.sample_status_text);
    setSelectedCode(p.symptom_code);
    setSuppliedFacts({});
    setPresetProfileOverrides(p.suggested_profile);
    const mergedProfile = { ...profile, ...p.suggested_profile };
    executeDiagnosis(p.sample_status_text, p.symptom_code, {}, mergedProfile, lang);
  };

  const combinedTextForSpeech = result
    ? [
        result.critical_trap_warning,
        result.actor_explanation,
        result.simple_explanation,
        ...result.remediation_steps.map(
          (s) => `${s.action_title}. ${s.detailed_instruction}`
        ),
      ]
        .filter(Boolean)
        .join(" ")
    : undefined;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Accessible Back Navigation */}
      <div className="flex items-center justify-between">
        <BackButton fallbackHref="/schemes" />
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-2xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>{t("rescue_badge")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213F] tracking-tight">
          {t("rescue_title")}
        </h1>
        <p className="text-sm text-[#667085] max-w-3xl leading-relaxed">
          {t("rescue_subtitle")}
        </p>

        <div className="pt-2">
          <VoiceAccessibilityBar
            onTranscriptText={(spoken) => {
              setRawText(spoken);
              setSelectedCode(null);
            }}
            textToReadAloud={combinedTextForSpeech}
          />
        </div>
      </div>

      {/* 1-Click Preset Scenarios */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[#667085] block">
          {t("rescue_presets_heading")}
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {presets.map((p) => (
            <button
              key={p.preset_id}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`text-start p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                selectedCode === p.symptom_code
                  ? "border-[#4F46E5] bg-[#4F46E5]/5 shadow-2xs"
                  : "border-[#E5E7EB] bg-white hover:border-[#4F46E5]/50"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-[#17213F]">{p.label}</div>
                <div dir="ltr" className="text-[11px] text-[#667085] mt-1 line-clamp-1 font-mono">
                  &ldquo;{p.sample_status_text}&rdquo;
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Defect Status Input Box */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-2xs">
        <label className="block text-sm font-bold text-[#17213F]">
          {t("rescue_input_label")}
        </label>
        <textarea
          rows={3}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setSelectedCode(null);
          }}
          placeholder="e.g., Application marked Defective by INO: Father name mismatch with income certificate..."
          className="w-full rounded-xl border border-gray-300 p-3.5 text-sm text-[#17213F] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
            <span className="font-bold">{t("rescue_pii_shield_label")}</span>{" "}
            <span dir="ltr">
              {scrubClientSidePII(rawText) || "8–16 digit numbers auto-redacted"}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              executeDiagnosis(rawText, selectedCode, suppliedFacts, activeProfile, lang)
            }
            disabled={!rawText.trim() || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "..." : t("rescue_btn_diagnose")}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Clarification Questions Card */}
      {result && result.verdict === "NEEDS_CLARIFICATION" && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-amber-950">
                {result.simple_explanation}
              </h2>
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
            type="button"
            onClick={() =>
              executeDiagnosis(rawText, selectedCode, suppliedFacts, activeProfile, lang)
            }
            className="px-5 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold cursor-pointer"
          >
            {t("rescue_btn_confirm_answers")}
          </button>
        </div>
      )}

      {/* Full Diagnosis Result */}
      {result && result.verdict !== "NEEDS_CLARIFICATION" && (
        <div className="space-y-6">
          {result.critical_trap_warning && (
            <div className="bg-red-50 border-s-4 border-red-600 rounded-xl p-5 flex items-start gap-3.5">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-950 leading-relaxed">
                  {result.critical_trap_warning}
                </p>
              </div>
            </div>
          )}

          {/* Simple Explanation & Who Needs to Act Banner */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs font-bold">
                <UserCheck className="w-4 h-4 text-[#4F46E5]" />
                <span>{result.actor_explanation}</span>
              </div>
              <span dir="ltr" className="text-xs font-mono text-gray-500">
                {result.matched_scheme_name}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold uppercase text-[#667085] mb-1">
                {t("rescue_simple_exp_heading")}
              </div>
              <p className="text-sm text-[#17213F] leading-relaxed font-medium">
                {result.simple_explanation}
              </p>
            </div>

            {/* Epistemic Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t("rescue_known_facts")}</span>
                </div>
                <ul className="text-xs text-emerald-950 space-y-1 list-disc ps-4">
                  {result.epistemic_state.known_facts.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{t("rescue_unknown_check")}</span>
                </div>
                <ul className="text-xs text-amber-950 space-y-1 list-disc ps-4">
                  {result.epistemic_state.unknown_to_verify.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span>{t("rescue_unverified_boundary")}</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1 list-disc ps-4">
                  {result.epistemic_state.unverified_boundaries.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Step-by-Step Recovery Instructions */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-[#17213F]">
                {t("rescue_steps_heading")}
              </h2>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-[#17213F] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                {t("rescue_print_slip")}
              </button>
            </div>

            <div className="space-y-3.5">
              {result.remediation_steps.map((step) => (
                <div
                  key={step.step_number}
                  className="rounded-xl border border-gray-200 p-4 space-y-2 bg-gray-50/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#4F46E5]">
                      #{step.step_number}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200">
                      {step.destination.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#17213F]">
                    {step.action_title}
                  </div>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {step.detailed_instruction}
                  </p>
                </div>
              ))}
            </div>

            {/* Polite Message Draft */}
            {result.polite_office_draft && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-700">
                    {t("rescue_draft_heading")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(result.polite_office_draft || "");
                      setCopiedDraft(true);
                      setTimeout(() => setCopiedDraft(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-gray-200 text-xs font-semibold text-[#17213F] hover:bg-gray-100 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedDraft ? "✓" : t("rescue_copy_draft")}</span>
                  </button>
                </div>
                <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono bg-white p-3.5 rounded-lg border border-slate-200 leading-relaxed">
                  {result.polite_office_draft}
                </pre>
              </div>
            )}
          </div>

          {/* Official Citations */}
          {result.citations.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#667085]">
                <FileText className="w-4 h-4 text-[#4F46E5]" />
                <span>{t("rescue_citations_heading")}</span>
              </div>
              {result.citations.map((cit, i) => (
                <div
                  key={i}
                  dir="ltr"
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#17213F]">
                      {cit.source_title} ({cit.section_ref})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {cit.freshness_status} · Tier {cit.source_tier}
                    </span>
                  </div>
                  <blockquote className="italic text-gray-700 border-s-2 border-[#4F46E5] ps-3">
                    &ldquo;{cit.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>Verified: {cit.last_verified_at.slice(0, 10)}</span>
                    <a
                      href={cit.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#4F46E5] font-semibold hover:underline"
                    >
                      {cit.source_url} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No-Dead-End Alternative Schemes */}
          {result.alternative_schemes.length > 0 && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-[#17213F]">
                {t("rescue_alternatives_heading")}
              </h3>
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
                      {alt.scheme_name} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 italic text-center pt-2">
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
