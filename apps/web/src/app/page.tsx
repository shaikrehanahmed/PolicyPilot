"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  FileCheck2,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { fetchBillingAccount, fetchSchemes } from "@/lib/api";
import { useLanguage } from "@/lib/i18n-context";
import { VoiceAccessibilityBar } from "@/components/voice-accessibility-bar";
import { Scheme } from "@/lib/types";

export default function EditorialHomePage() {
  const { isRtl, t, localizeScheme } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [account, setAccount] = useState<any>(null);

  useEffect(() => {
    fetchSchemes()
      .then((res) => setSchemes(res.slice(0, 5)))
      .catch(() => {});
    fetchBillingAccount()
      .then(setAccount)
      .catch(() => {});
  }, []);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-16 sm:space-y-24 pb-8">
      {/* SECTION 1: EDITORIAL HERO WITH LAYERED ARCHITECTURAL DOSSIER ILLUSTRATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline & Primary Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 brass-badge px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.12em]">
              <Scale className="w-3.5 h-3.5 text-[#8C6D3B]" />
              <span>{t("home_eyebrow")}</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-5xl lg:text-[3.35rem] font-semibold text-[#141815] leading-[1.12] tracking-tight">
              {t("home_headline")}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#4A524C] max-w-2xl leading-relaxed">
              {t("home_lead")}
            </p>

            {/* Two Clear Primary Actions: "Explore Schemes" & "Check Eligibility" */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/schemes"
                className="btn-forest inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold"
              >
                <Compass className="w-4 h-4 text-[#C5A572]" />
                <span>{t("nav_explore_schemes")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/profile"
                className="btn-parchment inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold"
              >
                <ShieldCheck className="w-4 h-4 text-[#163026]" />
                <span>{t("nav_check_eligibility")}</span>
              </Link>

              <Link
                href="/rescue"
                className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-bold text-[#163026] hover:underline"
              >
                <span>{t("nav_rescue")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Subtle Entitlement & Safeguard Footnote */}
            <div className="pt-4 border-t border-[#D8D1C2] flex flex-wrap items-center gap-6 text-xs text-[#6B726C]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#163026]" />
                <span>
                  Deterministic Python Rule Evaluation (Zero LLM Override)
                </span>
              </div>
              {account && (
                <Link
                  href="/pricing"
                  className="font-semibold text-[#163026] hover:underline"
                >
                  {account.has_unlimited_analysis_entitlement
                    ? "Institutional / Active Plan Unlocked"
                    : `${account.free_analyses_remaining} of ${account.free_analyses_limit} Free Successful Analyses Available`}
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Art-Directed Layered Physical Dossier Composition */}
          <div className="lg:col-span-5 architectural-stage">
            <div className="dossier-stack-base relative mx-auto max-w-md space-y-3 p-5 sm:p-6 rounded-2xl bg-[#EFECE2] border border-[#D8D1C2] shadow-lg">
              {/* Layer 1: Top Embossed Gazette Header Folio */}
              <div className="folio-card rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#6B726C]">
                  <span>DOSSIER NO. PP-2026-GAZETTE</span>
                  <span className="brass-badge px-2 py-0.5 rounded font-bold">
                    TIER-1 SOURCE
                  </span>
                </div>
                <div className="font-editorial text-base font-semibold text-[#141815]">
                  Statutory Eligibility &amp; Evidence Ledger
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="embossed-well rounded-lg p-2.5">
                    <span className="text-[#6B726C] block">Citizen Context</span>
                    <strong className="text-[#141815] font-semibold">
                      Normalized Profile
                    </strong>
                  </div>
                  <div className="embossed-well rounded-lg p-2.5">
                    <span className="text-[#6B726C] block">Verification</span>
                    <strong className="text-[#163026] font-semibold">
                      Clause-Grounded
                    </strong>
                  </div>
                </div>
              </div>

              {/* Layer 2: Deep Forest Deterministic Rule Matrix Card */}
              <div className="forest-panel rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A572]">
                    Deterministic Rule Evaluation
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#E6ECE7]">
                    Zero AI Guesswork
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                    <span className="text-[#D5E0D7]">
                      Clause 2.1: Cultivable Landholding
                    </span>
                    <span className="font-mono text-[11px] text-[#C5A572] font-semibold">
                      MET
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                    <span className="text-[#D5E0D7]">
                      Clause 2.4: Annual Income Ceiling
                    </span>
                    <span className="font-mono text-[11px] text-[#C5A572] font-semibold">
                      ≤ ₹2,50,000
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#D5E0D7]">
                      NSP OTR v2.2 Withdrawal Guardrail
                    </span>
                    <span className="font-mono text-[11px] text-emerald-300 font-semibold">
                      PROTECTED
                    </span>
                  </div>
                </div>
              </div>

              {/* Layer 3: Next-Step Resolution & Provenance Card */}
              <div className="folio-card rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E6ECE7] border border-[#CFDBD1] flex items-center justify-center text-[#163026] shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-[#141815]">
                      Verified Action Checklist &amp; Office Draft
                    </div>
                    <div className="text-[11px] text-[#6B726C]">
                      Known · Unknown · Unverified Epistemic Split
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Multilingual Voice & Conversational Counsel */}
        <div className="mt-10">
          <VoiceAccessibilityBar />
        </div>
      </section>

      {/* SECTION 2: DEEP FOREST ARCHITECTURAL FEATURE BAND */}
      <section className="bg-[#163026] text-[#F7F4EC] border-y border-[#C5A572]/30 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#C5A572]">
              Architectural Discipline
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#F7F4EC]">
              {t("home_architecture_title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/schemes"
              className="rounded-2xl bg-[#1F4235]/70 hover:bg-[#1F4235] border border-[#C5A572]/25 p-6 space-y-4 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="font-editorial text-2xl text-[#C5A572]">01</span>
                <h3 className="text-base font-bold text-[#F7F4EC]">
                  Scheme Discovery &amp; Profile Ranking
                </h3>
                <p className="text-xs text-[#D5E0D7] leading-relaxed">
                  Inspect all available verified schemes by default, or rank them against
                  your demographic profile into Matched, Insufficient Info, and Excluded
                  buckets.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C5A572] pt-2">
                {t("nav_explore_schemes")} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/rescue"
              className="rounded-2xl bg-[#1F4235]/70 hover:bg-[#1F4235] border border-[#C5A572]/25 p-6 space-y-4 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="font-editorial text-2xl text-[#C5A572]">02</span>
                <h3 className="text-base font-bold text-[#F7F4EC]">
                  Scholarship &amp; DBT Defect Rescue
                </h3>
                <p className="text-xs text-[#D5E0D7] leading-relaxed">
                  Resolve &ldquo;Marked Defective by INO&rdquo; and &ldquo;PFMS Bank
                  Mapper Inactive&rdquo; notices with step-by-step official recovery plans
                  and office letters.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C5A572] pt-2">
                {t("nav_rescue")} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/updates"
              className="rounded-2xl bg-[#1F4235]/70 hover:bg-[#1F4235] border border-[#C5A572]/25 p-6 space-y-4 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="font-editorial text-2xl text-[#C5A572]">03</span>
                <h3 className="text-base font-bold text-[#F7F4EC]">
                  Lifecycle Ledger &amp; Application Tracker
                </h3>
                <p className="text-xs text-[#D5E0D7] leading-relaxed">
                  Monitor official lifecycle statuses (Active, Deadline Extended, Results
                  Announced), log your Applied status, and review Results Guidance.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C5A572] pt-2">
                {t("nav_updates")} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/pricing"
              className="rounded-2xl bg-[#1F4235]/70 hover:bg-[#1F4235] border border-[#C5A572]/25 p-6 space-y-4 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="font-editorial text-2xl text-[#C5A572]">04</span>
                <h3 className="text-base font-bold text-[#F7F4EC]">
                  Citizen &amp; Institutional Subscriptions
                </h3>
                <p className="text-xs text-[#D5E0D7] leading-relaxed">
                  Begin with 2 free successful analyses. Continue for ₹19/month or
                  provision campus scholarship desks with a 25% bulk seat discount.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C5A572] pt-2">
                {t("nav_pricing")} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3: WARM PARCHMENT GAZETTE REPOSITORY LEDGER */}
      {schemes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D8D1C2] pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#8C6D3B] font-bold">
                Verified Statutory Catalogue
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#141815] mt-1">
                Configured Central &amp; State Schemes
              </h2>
            </div>
            <Link
              href="/schemes"
              className="btn-parchment inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#163026]" />
              <span>Open Full Catalogue ({schemes.length})</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {schemes.slice(0, 3).map((s) => {
              const loc = localizeScheme(s);
              return (
                <Link
                  key={s.id}
                  href={`/schemes/${s.slug}`}
                  className="folio-card folio-card-interactive rounded-2xl p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="brass-badge px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {s.level} {s.state ? `· ${s.state}` : ""} · {s.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#163026]">
                        <CheckCircle2 className="w-3 h-3" />
                        VERIFIED
                      </span>
                    </div>

                    <h3 className="font-editorial text-lg font-semibold text-[#141815] leading-snug">
                      {loc.displayName}
                    </h3>
                    <p className="text-xs text-[#4A524C] line-clamp-3 leading-relaxed">
                      {loc.displayDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D8D1C2] flex items-center justify-between text-xs font-bold text-[#163026]">
                    <span>Inspect Criteria &amp; Evidence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
