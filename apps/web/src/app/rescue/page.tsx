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
        err instanceof Error
          ? err.message
          : "Diagnosis request failed. Please check network connectivity."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRescuePresets()
      .then((data) => {
        setPresets(data);
        if (data.length > 0 && !rawText) {
          const first = data[0];
          setRawText(first.sample_status_text);
          setSelectedCode(first.symptom_code);
          setPresetProfileOverrides(first.suggested_profile);
          const merged = { ...profile, ...first.suggested_profile };
          executeDiagnosis(first.sample_status_text, first.symptom_code, {}, merged, lang);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
    >
      {/* Accessible Back Navigation */}
      <div className="flex items-center justify-between">
        <BackButton fallbackHref="/schemes" />
      </div>

      {/* Header Banner with Editorial Foliage */}
      <div className="folio-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 brass-badge px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#8C6D3B]" />
          <span>{t("rescue_badge")}</span>
        </div>
        <h1 className="font-editorial text-2xl sm:text-4xl font-semibold text-[#141815] tracking-tight">
          {t("rescue_title")}
        </h1>
        <p className="text-xs sm:text-sm text-[#4A524C] max-w-3xl leading-relaxed">
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
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6B726C] block">
          {t("rescue_presets_heading")}
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {presets.map((p) => (
            <button
              key={p.preset_id}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`text-start p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 folio-card folio-card-interactive ${
                selectedCode === p.symptom_code
                  ? "border-[#163026] ring-2 ring-[#163026]/10 bg-[#EFECE2]"
                  : ""
              }`}
            >
              <div>
                <div className="text-xs font-bold text-[#141815]">{p.label}</div>
                <div dir="ltr" className="text-[11px] text-[#6B726C] mt-1 line-clamp-1 font-mono">
                  &ldquo;{p.sample_status_text}&rdquo;
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#163026] shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Defect Status Input Box */}
      <div className="folio-card rounded-2xl p-6 sm:p-7 space-y-4">
        <label className="block text-xs sm:text-sm font-bold text-[#141815]">
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
          className="w-full rounded-xl border border-[#D8D1C2] bg-[#FCFBF7] p-3.5 text-xs sm:text-sm text-[#141815] focus:outline-none focus:ring-2 focus:ring-[#163026]"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-[#163026] bg-[#E6ECE7] border border-[#CFDBD1] px-3.5 py-2 rounded-xl font-medium">
            <span className="font-bold">{t("rescue_pii_shield_label")}</span>{" "}
            <span dir="ltr" className="font-mono text-[#163026]">
              {scrubClientSidePII(rawText) || "8–16 digit numbers auto-redacted"}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              executeDiagnosis(rawText, selectedCode, suppliedFacts, activeProfile, lang)
            }
            disabled={!rawText.trim() || loading}
            className="btn-forest inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-[#C5A572]" />
            <span>{loading ? "..." : t("rescue_btn_diagnose")}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#F2EADB] border border-[#D4C098] text-[#694F25] rounded-2xl p-4 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Clarification Questions Card */}
      {result && result.verdict === "NEEDS_CLARIFICATION" && (
        <div className="folio-card rounded-2xl p-6 space-y-5 border-[#C5A572]">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-[#8C6D3B] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-editorial text-base font-semibold text-[#141815]">
                {result.simple_explanation}
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {result.clarification_questions.map((q) => (
              <div
                key={q.fact_key}
                className="bg-[#FCFBF7] rounded-xl border border-[#D8D1C2] p-4 space-y-2.5"
              >
                <div className="text-xs sm:text-sm font-bold text-[#141815]">{q.question_text}</div>
                <div className="text-xs text-[#6B726C]">{q.why_this_matters}</div>
                <div className="flex flex-wrap gap-3 pt-1">
                  {q.options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                        suppliedFacts[q.fact_key] === opt.value
                          ? "border-[#163026] bg-[#E6ECE7] text-[#163026]"
                          : "border-[#D8D1C2] hover:bg-[#EFECE2] text-[#4A524C]"
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
                      <span>{opt.label}</span>
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
            className="btn-forest px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            {t("rescue_btn_confirm_answers")}
          </button>
        </div>
      )}

      {/* Full Diagnosis Result */}
      {result && result.verdict !== "NEEDS_CLARIFICATION" && (
        <div className="space-y-6">
          {result.critical_trap_warning && (
            <div className="bg-[#F2EADB] border-s-4 border-[#8B261D] rounded-2xl p-5 sm:p-6 flex items-start gap-3.5">
              <ShieldAlert className="w-6 h-6 text-[#8B261D] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8B261D] block">
                  {t("rescue_criticalTrapWarning") || "Critical Mistake Warning"}
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#141815] leading-relaxed">
                  {result.critical_trap_warning}
                </p>
              </div>
            </div>
          )}

          {/* Simple Explanation & Who Needs to Act Banner */}
          <div className="folio-card rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E6ECE7] border border-[#CFDBD1] text-[#163026] text-xs font-bold">
                <UserCheck className="w-4 h-4 text-[#163026]" />
                <span>
                  <strong>{t("rescue_whoMustAct") || "Action Required By:"}</strong>{" "}
                  {result.actor_explanation}
                </span>
              </div>
              <span dir="ltr" className="text-xs font-mono text-[#6B726C]">
                {result.matched_scheme_name}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl embossed-well">
              <div className="text-xs font-bold uppercase text-[#6B726C] mb-1">
                {t("rescue_simple_exp_heading")}
              </div>
              <p className="text-xs sm:text-sm text-[#141815] leading-relaxed font-semibold">
                {result.simple_explanation}
              </p>
            </div>

            {/* Epistemic Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#E6ECE7] border border-[#CFDBD1] rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#163026]">
                  <CheckCircle2 className="w-4 h-4 text-[#163026]" />
                  <span>{t("rescue_known_facts")}</span>
                </div>
                <ul className="text-xs text-[#141815] space-y-1 list-disc ps-4">
                  {result.epistemic_state.known_facts.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#F2EADB] border border-[#D4C098] rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#694F25]">
                  <AlertTriangle className="w-4 h-4 text-[#8C6D3B]" />
                  <span>{t("rescue_unknown_check")}</span>
                </div>
                <ul className="text-xs text-[#694F25] space-y-1 list-disc ps-4">
                  {result.epistemic_state.unknown_to_verify.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="embossed-well rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A524C]">
                  <ShieldCheck className="w-4 h-4 text-[#6B726C]" />
                  <span>{t("rescue_unverified_boundary")}</span>
                </div>
                <ul className="text-xs text-[#4A524C] space-y-1 list-disc ps-4">
                  {result.epistemic_state.unverified_boundaries.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Step-by-Step Recovery Instructions */}
          <div className="folio-card rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D1C2] pb-4">
              <h2 className="font-editorial text-lg font-semibold text-[#141815]">
                {t("rescue_remediationSteps") || t("rescue_steps_heading")}
              </h2>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-parchment inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#163026]" />
                <span>{t("rescue_printSlip") || t("rescue_print_slip")}</span>
              </button>
            </div>

            <div className="space-y-4">
              {result.remediation_steps.map((step) => (
                <div
                  key={step.step_number}
                  className="rounded-2xl border border-[#D8D1C2] p-5 space-y-2.5 bg-[#FCFBF7]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#163026]">
                      #{step.step_number}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6ECE7] text-[#163026] border border-[#CFDBD1]">
                      {step.target_actor}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#141815]">
                    {step.action_title}
                  </h3>
                  <p className="text-xs text-[#4A524C] leading-relaxed">
                    {step.detailed_instruction}
                  </p>

                  {step.evidence_reference && (
                    <div className="pt-2 border-t border-[#D8D1C2] flex items-center justify-between text-[11px] text-[#6B726C]">
                      <span>{step.evidence_reference}</span>
                      {step.portal_url && (
                        <a
                          href={step.portal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#163026] hover:underline inline-flex items-center gap-1"
                        >
                          Official Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Polite Office Request Letter Generator */}
          {result.draft_office_letter && (
            <div className="folio-card rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D1C2] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#8C6D3B]" />
                  <h2 className="font-editorial text-base font-semibold text-[#141815]">
                    {t("rescue_officeDraftTitle") || t("rescue_draft_heading")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.draft_office_letter || "");
                    setCopiedDraft(true);
                    setTimeout(() => setCopiedDraft(false), 2500);
                  }}
                  className="btn-parchment inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#163026]" />
                  <span>
                    {copiedDraft
                      ? (t("rescue_copiedDraft") || "Draft Copied to Clipboard!")
                      : (t("rescue_copyDraft") || t("rescue_copy_draft"))}
                  </span>
                </button>
              </div>

              <div className="embossed-well rounded-2xl p-5 text-xs text-[#141815] whitespace-pre-wrap font-sans leading-relaxed">
                {result.draft_office_letter}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
