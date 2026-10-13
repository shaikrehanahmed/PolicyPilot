"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  FileCheck,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  BookOpen,
} from "lucide-react";
import { fetchSchemes } from "@/lib/api";
import { Scheme, formatCurrencyINR } from "@/lib/types";
import { useProfile } from "@/lib/profile-context";

export default function HomePage() {
  const { profile, loadDemoProfile } = useProfile();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes()
      .then(setSchemes)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const journeySteps = [
    {
      num: "01",
      title: "Citizen Profile",
      desc: "Normalized demographic bands: State, Income, Land, Category",
      icon: UserCheck,
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      num: "02",
      title: "Scheme Discovery",
      desc: "Lexical & category ranking over verified Gazette rules",
      icon: Search,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    {
      num: "03",
      title: "Rules Evaluation",
      desc: "Deterministic Python logic (Zero LLM, Met/Not Met/Unknown)",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      num: "04",
      title: "Verified Evidence",
      desc: "Direct clause-by-clause citations from official gazettes",
      icon: BookOpen,
      color: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      num: "05",
      title: "Action Roadmap",
      desc: "Personalized step sequence, document checklist & portal links",
      icon: FileCheck,
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 text-center md:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Evidence-Grounded Policy Navigation
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#17213F] tracking-tight leading-[1.15]">
              Find the right schemes. <br />
              <span className="text-[#4F46E5]">Understand your next steps.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#667085] max-w-2xl leading-relaxed">
              Discover potentially relevant government schemes, understand their eligibility criteria,
              review official Gazette evidence, and prepare a personalized application action plan.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <Link
                href="/schemes"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium text-sm shadow-sm transition-all"
              >
                Explore Schemes
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white hover:bg-gray-50 text-[#17213F] border border-gray-300 font-medium text-sm transition-all shadow-xs"
              >
                Set Up Citizen Profile
              </Link>
            </div>

            {/* Quick Demo Walkthrough Switcher */}
            <div className="pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium block mb-2">
                Evaluator Quick Presets (Click to switch citizen profile):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadDemoProfile("farmer")}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                    profile.occupation === "farmer"
                      ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  🌾 Telangana Farmer (TS, 3.0 Acres)
                </button>
                <button
                  onClick={() => loadDemoProfile("student")}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                    profile.occupation === "student"
                      ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  🎓 SC Student (Undergrad, Scholarship)
                </button>
                <button
                  onClick={() => loadDemoProfile("vulnerable_family")}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                    profile.occupation === "daily-wage worker" || profile.occupation === "laborer"
                      ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  🏠 Low-Income Family (EWS, Health & Housing)
                </button>
              </div>
            </div>
          </div>

          {/* Hero Architecture Graphic */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-gray-800">
                    Active Citizen Session
                  </span>
                </div>
                <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {profile.state || "Central"} • {profile.category || "General"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Occupation</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {profile.occupation || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Annual Income</span>
                  <span className="font-semibold text-gray-900">
                    {profile.annual_income_inr ? `₹${formatCurrencyINR(profile.annual_income_inr)}` : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Landholding</span>
                  <span className="font-semibold text-gray-900">
                    {profile.landholding_acres != null ? `${profile.landholding_acres} Acres` : "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Assistance Goal</span>
                  <span className="font-semibold text-indigo-600 max-w-[200px] truncate text-right">
                    {profile.goal || "General Eligibility"}
                  </span>
                </div>
              </div>

              <Link
                href="/schemes"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-semibold text-xs transition-colors"
              >
                Match Schemes for this Profile →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Journey Visual (CSS/SVG Interactive Component) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xs uppercase tracking-widest text-indigo-600 font-bold">
              The Citizen Navigation Flow
            </h2>
            <h3 className="text-2xl font-bold text-[#17213F] mt-1">
              From Profile to Verified Application
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {journeySteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-[#F8FAFC] rounded-xl p-5 border border-gray-200 hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-gray-400">
                        {step.num}
                      </span>
                      <div className={`p-2 rounded-lg border ${step.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-[#17213F]">{step.title}</h4>
                    <p className="text-xs text-[#667085] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical Architecture Separation: Rules vs AI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Deterministic Engine */}
          <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-xs relative overflow-hidden">
            <div className="w-1.5 h-full bg-emerald-500 absolute left-0 top-0" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#17213F]">
                  Deterministic Rule Engine
                </h3>
                <span className="text-xs text-emerald-700 font-medium">
                  100% Python Code • Zero LLM Hallucination
                </span>
              </div>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed mb-4">
              Scheme eligibility conditions are executed strictly as deterministic boolean and numeric operators.
              Evaluations yield explicit states: <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">met</code>,{" "}
              <code className="text-rose-800 bg-rose-50 px-1 py-0.5 rounded">not_met</code>, or{" "}
              <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded">unknown</code>. Missing profile attributes never silently pass.
            </p>
            <div className="text-[11px] bg-[#F8FAFC] rounded-md p-3 text-gray-600 font-mono space-y-1">
              <div>✓ income &lt;= ceiling → MET / NOT_MET</div>
              <div>✓ state == TS → Exact Domicile Match</div>
              <div>✓ missing landholding → UNKNOWN (Incomplete Assessment)</div>
            </div>
          </div>

          {/* Card 2: Grounded AI Explanation */}
          <div className="bg-white rounded-xl border border-indigo-200 p-6 shadow-xs relative overflow-hidden">
            <div className="w-1.5 h-full bg-indigo-500 absolute left-0 top-0" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#17213F]">
                  Grounded AI Explanations
                </h3>
                <span className="text-xs text-indigo-700 font-medium">
                  Gemini 3.8 Flash • Strict Source Guardrails
                </span>
              </div>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed mb-4">
              AI is never allowed to invent eligibility decisions. It translates verified evaluation results into
              respectful, clear plain English, citing exact Gazette clauses and preparing personalized document preparation checklists.
            </p>
            <div className="text-[11px] bg-[#F8FAFC] rounded-md p-3 text-gray-600 font-mono space-y-1">
              <div>✓ Explains missing data in plain English</div>
              <div>✓ Quotes verified Gazette excerpts only</div>
              <div>✓ Transparent deterministic fallback if no API key</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Schemes Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#17213F]">Verified Government Schemes</h2>
            <p className="text-xs text-[#667085]">
              Traceable to official Gazettes and departmental implementation guidelines.
            </p>
          </div>
          <Link
            href="/schemes"
            className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1"
          >
            View All Schemes ({schemes.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {schemes.slice(0, 3).map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                      {scheme.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {scheme.verification_status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#17213F] leading-snug">
                    {scheme.name}
                  </h3>

                  <p className="text-xs text-[#667085] line-clamp-3 leading-relaxed">
                    {scheme.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">
                    {scheme.criteria_count} Criteria • {scheme.documents_count} Docs
                  </span>
                  <Link
                    href={`/schemes/${scheme.slug}`}
                    className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1"
                  >
                    Assess Eligibility →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
