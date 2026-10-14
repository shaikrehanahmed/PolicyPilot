"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Compass,
  CreditCard,
  FileText,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { fetchBillingAccount, fetchSchemes } from "@/lib/api";
import { useLanguage } from "@/lib/i18n-context";
import { VoiceAccessibilityBar } from "@/components/voice-accessibility-bar";
import { Scheme } from "@/lib/types";

const HOME_COPY = {
  badge: {
    en: "Deterministic Rules Engine · Official Gazette Citations · Zero-PII Triage",
    te: "నిబంధనల ఆధారిత ఇంజిన్ · అధికారిక గెజిట్ ఆధారాలు · గోప్యతా రక్షణ",
    hi: "नियम-आधारित इंजन · आधिकारिक गजट प्रमाण · शून्य-PII सुरक्षा",
    ur: "قواعد پر مبنی انجن · سرکاری گزٹ شواہد · رازداری کا تحفظ",
  },
  title: {
    en: "Navigate Government Schemes & Resolve Portal Defects with Verified Evidence",
    te: "అధికారిక ఆధారాలతో ప్రభుత్వ పథకాలను అన్వేషించండి & దరఖాస్తు లోపాలను పరిష్కరించండి",
    hi: "सत्यापित प्रमाणों के साथ सरकारी योजनाओं की पात्रता जांचें और पोर्टल दोष सुधारें",
    ur: "تصدیق شدہ شواہد کے ساتھ سرکاری اسکیموں کی اہلیت جانچیں اور درخواست کی خرابیاں دور کریں",
  },
  subtitle: {
    en: "PolicyPilot never guesses your eligibility. We evaluate your profile using deterministic statutory rules, cite exact ministry clauses, track your applications, and guide you out of National Scholarship Portal (NSP) and PFMS payment defects.",
    te: "PolicyPilot మీ అర్హతను ఊహించదు. ఖచ్చితమైన ప్రభుత్వ నిబంధనలతో మీ ప్రొఫైల్ను పరిశీలించి, అధికారిక ఆధారాలతో నెక్స్ట్ స్టెప్స్ మరియు స్కాలర్షిప్ రెస్క్యూ పరిష్కారాలను అందిస్తుంది.",
    hi: "PolicyPilot आपकी पात्रता का अनुमान नहीं लगाता। हम आधिकारिक नियमों से आपकी प्रोफ़ाइल का मूल्यांकन करते हैं, सटीक मंत्रालय संदर्भ दिखाते हैं, और NSP छात्रवृत्ति व PFMS भुगतान समस्याओं का समाधान देते हैं।",
    ur: "PolicyPilot آپ کی اہلیت کا اندازہ نہیں لگاتا بلکہ سرکاری قواعد اور مستند شواہد کی بنیاد پر مرحلہ وار رہنمائی فراہم کرتا ہے۔",
  },
  cta_analyze: {
    en: "Run Policy Analysis",
    te: "పాలసీ విశ్లేషణ రన్ చేయండి (Run Policy Analysis)",
    hi: "नीति विश्लेषण चलाएं (Run Policy Analysis)",
    ur: "پالیسی تجزیہ چلائیں (Run Policy Analysis)",
  },
  cta_explore: {
    en: "Browse All Available Schemes",
    te: "అన్ని ప్రభుత్వ పథకాలను చూడండి",
    hi: "सभी उपलब्ध योजनाएं देखें",
    ur: "تمام دستیاب اسکیمیں دیکھیں",
  },
  cta_rescue: {
    en: "Open Scholarship Defect Rescue",
    te: "స్కాలర్షిప్ రెస్క్యూ తెరవండి",
    hi: "छात्रवृत्ति दोष निवारण (Rescue)",
    ur: "اسکالرشپ ریسکیو کھولیں",
  },
};

const DEFAULT_VERIFIED_SCHEMES: Scheme[] = [
  {
    id: "b1000000-0000-0000-0000-000000000001",
    slug: "pm-kisan",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    category: "agriculture",
    level: "CENTRAL",
    department: "Ministry of Agriculture and Farmers Welfare, Govt of India",
    description: "Centrally sponsored income support of ₹6,000 per year directly via DBT to all landholding farmer families across the country.",
    active: true,
    verification_status: "VERIFIED",
  },
  {
    id: "b2000000-0000-0000-0000-000000000002",
    slug: "pm-jay",
    name: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
    category: "healthcare",
    level: "CENTRAL",
    department: "National Health Authority, Govt of India",
    description: "Health cover of ₹5,00,000 per family per year for secondary and tertiary care hospitalization, plus universal coverage for all seniors aged 70+.",
    active: true,
    verification_status: "VERIFIED",
  },
  {
    id: "b3000000-0000-0000-0000-000000000003",
    slug: "pmay-g",
    name: "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
    category: "housing",
    level: "CENTRAL",
    department: "Ministry of Rural Development, Govt of India",
    description: "Financial assistance for construction of pucca house to rural houseless families living in kutcha houses.",
    active: true,
    verification_status: "VERIFIED",
  },
  {
    id: "b4000000-0000-0000-0000-000000000004",
    slug: "nsp-post-matric",
    name: "Post-Matric Scholarship for SC Students",
    category: "education",
    level: "CENTRAL",
    department: "Ministry of Social Justice and Empowerment, Govt of India",
    description: "Centrally Sponsored Post-Matric Scholarship Scheme for SC Students studying in recognized post-secondary courses with parental income up to ₹2,50,000.",
    active: true,
    verification_status: "VERIFIED",
  },
  {
    id: "b5000000-0000-0000-0000-000000000005",
    slug: "rythu-bharosa",
    name: "Rythu Bharosa (Telangana Agriculture Investment Support)",
    category: "agriculture",
    level: "STATE",
    state: "TS",
    department: "Department of Agriculture, Govt of Telangana",
    description: "Agricultural investment assistance of ₹12,000 per acre annually to landholding farmers possessing digital Pattadar Passbooks.",
    active: true,
    verification_status: "VERIFIED",
  },
];

export default function HomePage() {
  const { lang, isRtl, localizeScheme } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>(DEFAULT_VERIFIED_SCHEMES);
  const [account, setAccount] = useState<any>(null);

  useEffect(() => {
    fetchSchemes()
      .then((res) => {
        if (res && res.length > 0) setSchemes(res.slice(0, 5));
      })
      .catch(() => {});
    fetchBillingAccount()
      .then(setAccount)
      .catch(() => {});
  }, []);

  const copy = (key: keyof typeof HOME_COPY) =>
    HOME_COPY[key][lang] || HOME_COPY[key].en;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12"
    >
      {/* Hero Section */}
      <section className="glossy-card rounded-3xl p-6 sm:p-10 lg:p-12 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{copy("badge")}</span>
          </div>

          {account && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {account.has_unlimited_analysis_entitlement
                  ? "Unlimited Policy Analyses Active"
                  : `${account.free_analyses_remaining} of ${account.free_analyses_limit} Free Successful Analyses Available`}
              </span>
            </Link>
          )}
        </div>

        <div className="max-w-4xl space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17213F] tracking-tight leading-tight">
            {copy("title")}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[#667085] leading-relaxed">
            {copy("subtitle")}
          </p>
        </div>

        {/* Primary Action Buttons (Renamed "Run LangGraph" -> "Run Policy Analysis" per Requirement H3) */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-bold shadow-md transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{copy("cta_analyze")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/schemes"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#17213F] border border-gray-300 text-xs sm:text-sm font-bold shadow-2xs transition"
          >
            <Compass className="w-4 h-4 text-[#4F46E5]" />
            <span>{copy("cta_explore")}</span>
          </Link>

          <Link
            href="/rescue"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs sm:text-sm font-bold transition"
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>{copy("cta_rescue")}</span>
          </Link>
        </div>

        {/* Conversational Voice & Chat Assistant Bar */}
        <div className="pt-2">
          <VoiceAccessibilityBar />
        </div>
      </section>

      {/* 4-Pillar Core Capabilities Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          href="/schemes"
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 shadow-2xs hover:border-[#4F46E5] transition flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#17213F]">
              1. Scheme Discovery &amp; Profile Ranking
            </h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Browse all verified schemes by default, or rank them against your Citizen
              Profile to separate Eligible, Partially Eligible, and Excluded schemes.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] pt-2">
            Explore Schemes <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/rescue"
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 shadow-2xs hover:border-[#4F46E5] transition flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#17213F]">
              2. Scholarship &amp; DBT Defect Rescue
            </h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Stuck on &ldquo;Marked Defective by INO&rdquo; or &ldquo;PFMS Rejected&rdquo;?
              Block fatal Fresh-application withdrawal mistakes and generate an office letter.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 pt-2">
            Diagnose Application <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/updates"
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 shadow-2xs hover:border-[#4F46E5] transition flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#17213F]">
              3. Scheme Updates &amp; Tracking Center
            </h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Track Recently Visited schemes, confirm your personal &ldquo;Applied&rdquo;
              status, inspect official Results Guidance, and manage verified alerts.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 pt-2">
            Open Tracking Center <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          href="/pricing"
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 shadow-2xs hover:border-[#4F46E5] transition flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#17213F]">
              4. Citizen &amp; Campus Subscriptions
            </h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              Start with 2 free successful analyses. Upgrade for ₹19/month or equip your
              college scholarship cell with a 25% bulk seat discount.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 pt-2">
            View Plans &amp; Calculator <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </section>

      {/* Featured Verified Schemes Preview */}
      {schemes.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#17213F]">
                Verified Government Schemes in Repository ({schemes.length})
              </h2>
              <p className="text-xs text-[#667085]">
                Every criterion is deterministically evaluated and linked to Tier-1 official
                ministry guidelines.
              </p>
            </div>
            <Link
              href="/schemes"
              className="text-xs font-bold text-[#4F46E5] hover:underline inline-flex items-center gap-1"
            >
              View All &amp; Rank by Profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schemes.slice(0, 3).map((s) => {
              const loc = localizeScheme(s);
              return (
                <Link
                  key={s.id}
                  href={`/schemes/${s.slug}`}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-2xs hover:border-[#4F46E5] transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                        {s.level} {s.state ? `(${s.state})` : ""} · {s.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        VERIFIED
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#17213F]">
                      {loc.displayName}
                    </h3>
                    <p className="text-xs text-[#667085] line-clamp-3 leading-relaxed">
                      {loc.displayDescription}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#4F46E5]">
                    <span>Inspect Eligibility &amp; Documents</span>
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
