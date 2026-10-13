"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { validateProfile } from "@/lib/api";

const INDIAN_STATES = [
  { code: "TS", name: "Telangana" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "DL", name: "Delhi" },
  { code: "MH", name: "Maharashtra" },
  { code: "KA", name: "Karnataka" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "BR", name: "Bihar" },
  { code: "WB", name: "West Bengal" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "RJ", name: "Rajasthan" },
  { code: "GJ", name: "Gujarat" },
  { code: "KL", name: "Kerala" },
  { code: "PB", name: "Punjab" },
  { code: "HR", name: "Haryana" },
  { code: "OD", name: "Odisha" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { profile, updateProfile, loadDemoProfile, clearProfile } = useProfile();

  const [validationState, setValidationState] = useState<{
    valid: boolean;
    warnings: string[];
    recognized: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await validateProfile(profile);
      setValidationState({
        valid: res.valid,
        warnings: res.warnings,
        recognized: res.fields_recognized,
      });
      // Update with normalized values
      updateProfile(res.normalized_profile);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to connect to validation service";
      setValidationState({
        valid: false,
        warnings: [msg],
        recognized: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveAndDiscover = async () => {
    await handleValidate();
    router.push("/schemes");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
          <User className="w-3.5 h-3.5" />
          Citizen Demographic Onboarding
        </div>
        <h1 className="text-3xl font-extrabold text-[#17213F] tracking-tight">
          Citizen Eligibility Profile
        </h1>
        <p className="text-sm text-[#667085]">
          Fill in your demographic details. PolicyPilot uses deterministic rule formulas to match
          and assess government schemes. Only demographic bands are evaluated; no PII is stored.
        </p>
      </div>

      {/* Preset Switcher Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Quick Evaluation Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadDemoProfile("farmer")}
            className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
          >
            🌾 Telangana Farmer (TS)
          </button>
          <button
            type="button"
            onClick={() => loadDemoProfile("student")}
            className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
          >
            🎓 SC Student (DL)
          </button>
          <button
            type="button"
            onClick={() => loadDemoProfile("vulnerable_family")}
            className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
          >
            🏠 Rural EWS Family (UP)
          </button>
          <button
            type="button"
            onClick={() => loadDemoProfile("senior_citizen")}
            className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
          >
            🧓 Senior Citizen 70+ (Universal Route)
          </button>
          <button
            type="button"
            onClick={clearProfile}
            className="text-xs px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
          >
            Clear Form
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Basic Demographics */}
          <div>
            <h2 className="text-base font-bold text-[#17213F] pb-2 border-b border-gray-100 mb-4">
              1. Basic Demographics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  State of Residence *
                </label>
                <select
                  value={profile.state || ""}
                  onChange={(e) => updateProfile({ state: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Required for state-specific welfare grants.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Age (Years) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  value={profile.age ?? ""}
                  onChange={(e) =>
                    updateProfile({ age: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  placeholder="e.g. 35"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Ages 70+ qualify for universal AB PM-JAY coverage irrespective of income.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                <select
                  value={profile.gender || ""}
                  onChange={(e) => updateProfile({ gender: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Social Category
                </label>
                <select
                  value={profile.category || ""}
                  onChange={(e) => updateProfile({ category: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Category</option>
                  <option value="GEN">General (GEN)</option>
                  <option value="OBC">Other Backward Class (OBC)</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                  <option value="EWS">Economically Weaker Section (EWS)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Economic & Land Factors */}
          <div>
            <h2 className="text-base font-bold text-[#17213F] pb-2 border-b border-gray-100 mb-4">
              2. Economic & Occupation Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Occupation *
                </label>
                <select
                  value={profile.occupation || ""}
                  onChange={(e) => updateProfile({ occupation: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Occupation</option>
                  <option value="farmer">Farmer (Landholder / Cultivator)</option>
                  <option value="student">Student / Scholar</option>
                  <option value="laborer">Daily Wage Laborer / Artisan</option>
                  <option value="salaried">Salaried Employee</option>
                  <option value="retired">Retired / Senior Citizen</option>
                  <option value="unemployed">Unemployed / Job Seeker</option>
                  <option value="other">Other / Self-employed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Annual Household Income (₹ INR) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={profile.annual_income_inr ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      annual_income_inr: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="e.g. 150000"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Evaluated against scheme ceilings (e.g. ₹2.5L for PM-JAY/NSP; ₹1.8L for PMAY-G Q11).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Agricultural Landholding (Acres)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={profile.landholding_acres ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      landholding_acres: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="e.g. 2.5"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Required for PM-KISAN (no 2-ha ceiling) and Rythu Bharosa criteria.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Education Level
                </label>
                <select
                  value={profile.education_level || ""}
                  onChange={(e) => updateProfile({ education_level: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Level</option>
                  <option value="Secondary (Class 10)">Secondary (Class 10)</option>
                  <option value="Senior Secondary (Class 12)">Senior Secondary (Class 12)</option>
                  <option value="undergraduate">Undergraduate Degree</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="diploma">Diploma / Polytechnic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3A: PMAY-G Official 15-Point Questionnaire */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                  PMAY-G Questionnaire
                </span>
                <h3 className="text-sm font-bold text-gray-900">
                  Housing & Rural Exclusions (Live netiayHome/questions.html)
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Official 15-question framework. Questions left unspecified remain <span className="font-semibold text-amber-700">unknown</span> and trigger honest incomplete assessments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q2: Residence Area
                </label>
                <select
                  value={profile.residence_area || ""}
                  onChange={(e) => updateProfile({ residence_area: e.target.value || undefined })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="rural">Rural Gram Panchayat Area</option>
                  <option value="urban">Urban Municipality Area</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q3: Owns Pucca House? (Disqualifier)
                </label>
                <select
                  value={profile.owns_pucca_house === undefined ? "" : String(profile.owns_pucca_house)}
                  onChange={(e) =>
                    updateProfile({
                      owns_pucca_house: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No (Does not own pucca house)</option>
                  <option value="true">Yes (Owns pucca dwelling — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q4: Resides in Kutcha House or Houseless?
                </label>
                <select
                  value={profile.lives_in_kutcha_house === undefined ? "" : String(profile.lives_in_kutcha_house)}
                  onChange={(e) =>
                    updateProfile({
                      lives_in_kutcha_house: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="true">Yes (Living in kutcha dwelling or houseless)</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q5: House has more than 2 pucca rooms? (Disqualifier)
                </label>
                <select
                  value={profile.has_more_than_two_pucca_rooms === undefined ? "" : String(profile.has_more_than_two_pucca_rooms)}
                  onChange={(e) =>
                    updateProfile({
                      has_more_than_two_pucca_rooms: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No (0, 1, or 2 rooms only)</option>
                  <option value="true">Yes (More than 2 rooms — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q6: Owns Motorized 2/3/4 Wheeler / Boat? (Exclusion 1)
                </label>
                <select
                  value={profile.has_motorized_vehicle === undefined ? "" : String(profile.has_motorized_vehicle)}
                  onChange={(e) =>
                    updateProfile({
                      has_motorized_vehicle: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No (No motorized vehicle)</option>
                  <option value="true">Yes (Owns motorized vehicle — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q7: Owns Mechanized Agri Equipment? (Exclusion 2)
                </label>
                <select
                  value={profile.has_mechanized_agri_equipment === undefined ? "" : String(profile.has_mechanized_agri_equipment)}
                  onChange={(e) =>
                    updateProfile({
                      has_mechanized_agri_equipment: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No</option>
                  <option value="true">Yes (Owns mechanized equipment — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q8: Kisan Credit Card limit ≥ ₹50,000? (Exclusion 3)
                </label>
                <select
                  value={profile.has_kcc_above_50k === undefined ? "" : String(profile.has_kcc_above_50k)}
                  onChange={(e) =>
                    updateProfile({
                      has_kcc_above_50k: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No (Limit &lt; ₹50,000 or no KCC)</option>
                  <option value="true">Yes (KCC limit ≥ ₹50,000 — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q10: Registered Non-Agri Enterprise? (Exclusion 5)
                </label>
                <select
                  value={profile.has_registered_non_agri_enterprise === undefined ? "" : String(profile.has_registered_non_agri_enterprise)}
                  onChange={(e) =>
                    updateProfile({
                      has_registered_non_agri_enterprise: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No</option>
                  <option value="true">Yes (Registered non-agri enterprise — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q11: Any member earning &gt; ₹15,000/month? (Exclusion 6)
                </label>
                <select
                  value={profile.earns_above_15k_monthly === undefined ? "" : String(profile.earns_above_15k_monthly)}
                  onChange={(e) =>
                    updateProfile({
                      earns_above_15k_monthly: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Derived from Annual Income)</option>
                  <option value="false">No (Earns ≤ ₹15,000/month)</option>
                  <option value="true">Yes (Earns &gt; ₹15,000/month — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Q13: Any member paying Professional Tax? (Exclusion 8)
                </label>
                <select
                  value={profile.pays_professional_tax === undefined ? "" : String(profile.pays_professional_tax)}
                  onChange={(e) =>
                    updateProfile({
                      pays_professional_tax: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No (Does not pay professional tax)</option>
                  <option value="true">Yes (Pays professional tax — Excluded)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3B: PM-KISAN Statutory Exclusions & Exceptions */}
          <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  PM-KISAN Exclusions & Exceptions
                </span>
                <h3 className="text-sm font-bold text-gray-900">
                  Statutory Family Exclusions (Operational Guidelines Clause 2(b) &amp; 3)
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Family-level statutory restrictions. Notice the official exception: Multi-Tasking Staff (MTS) / Class IV employees and pensioners are <span className="font-semibold text-emerald-700">exempt from exclusion</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Institutional Landholder? (Clause 3(a))
                </label>
                <select
                  value={profile.is_institutional_landholder === undefined ? "" : String(profile.is_institutional_landholder)}
                  onChange={(e) =>
                    updateProfile({
                      is_institutional_landholder: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No (Individual/Family farmer)</option>
                  <option value="true">Yes (Institutional entity — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Constitutional Post Holder in Family? (Clause 2(b)(i))
                </label>
                <select
                  value={profile.has_constitutional_post_holder === undefined ? "" : String(profile.has_constitutional_post_holder)}
                  onChange={(e) =>
                    updateProfile({
                      has_constitutional_post_holder: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No</option>
                  <option value="true">Yes (Former/Present Constitutional Post — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Elected Representative in Family? (Clause 2(b)(ii))
                </label>
                <select
                  value={profile.has_specified_elected_representative === undefined ? "" : String(profile.has_specified_elected_representative)}
                  onChange={(e) =>
                    updateProfile({
                      has_specified_elected_representative: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No</option>
                  <option value="true">Yes (Minister, MP, MLA, Mayor, District Panchayat Chair — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Serving/Retired Government Employee? (Clause 2(b)(iii))
                </label>
                <select
                  value={profile.is_government_employee === undefined ? "" : String(profile.is_government_employee)}
                  onChange={(e) =>
                    updateProfile({
                      is_government_employee: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No (No regular government employee)</option>
                  <option value="true">Yes (Government employee in family)</option>
                </select>
              </div>

              {profile.is_government_employee && (
                <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Multi-Tasking Staff (MTS) / Class IV / Group D Exemption (Clause 2(b)(iii))
                  </label>
                  <select
                    value={profile.is_mts_or_class_iv === undefined ? "" : String(profile.is_mts_or_class_iv)}
                    onChange={(e) =>
                      updateProfile({
                        is_mts_or_class_iv: e.target.value === "" ? undefined : e.target.value === "true",
                      })
                    }
                    className="w-full text-sm border border-emerald-300 rounded-lg p-2 bg-white text-emerald-950 font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Employee Class (Unknown)</option>
                    <option value="true">Yes — Class IV / MTS / Group D (EXEMPT FROM EXCLUSION)</option>
                    <option value="false">No — Officer / Regular Non-MTS (EXCLUDED from PM-KISAN)</option>
                  </select>
                  <span className="text-[11px] text-emerald-700 mt-1 block">
                    Statutory Operational Guidelines explicitly exempt Class IV/MTS/Group D workers from disqualification.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pensioner with ₹10,000+ monthly pension? (Clause 2(b)(iv))
                </label>
                <select
                  value={profile.has_pensioner_above_10k_non_mts === undefined ? "" : String(profile.has_pensioner_above_10k_non_mts)}
                  onChange={(e) =>
                    updateProfile({
                      has_pensioner_above_10k_non_mts: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No</option>
                  <option value="true">Yes (Monthly pension ≥ ₹10,000 non-MTS — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Income Tax Payee in Family? (Clause 2(b)(v))
                </label>
                <select
                  value={profile.is_income_tax_payee === undefined ? "" : String(profile.is_income_tax_payee)}
                  onChange={(e) =>
                    updateProfile({
                      is_income_tax_payee: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No (Non-taxpaying household)</option>
                  <option value="true">Yes (Paid income tax in last AY — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Practicing Registered Professional? (Clause 2(b)(vi))
                </label>
                <select
                  value={profile.has_practicing_professional === undefined ? "" : String(profile.has_practicing_professional)}
                  onChange={(e) =>
                    updateProfile({
                      has_practicing_professional: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No</option>
                  <option value="true">Yes (Doctor, Engineer, Lawyer, CA, Architect — Excluded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Non-Resident Indian (NRI) / Foreign Resident?
                </label>
                <select
                  value={profile.is_nri_or_foreign_resident === undefined ? "" : String(profile.is_nri_or_foreign_resident)}
                  onChange={(e) =>
                    updateProfile({
                      is_nri_or_foreign_resident: e.target.value === "" ? undefined : e.target.value === "true",
                    })
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Not Specified (Unknown)</option>
                  <option value="false">No (Resident Indian Farmer Family)</option>
                  <option value="true">Yes (NRI / Foreign Resident — Excluded)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Assistance Goal */}
          <div>
            <h2 className="text-base font-bold text-[#17213F] pb-2 border-b border-gray-100 mb-4">
              4. Assistance Goal / Primary Search Need
            </h2>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                What support or subsidy are you looking for?
              </label>
              <input
                type="text"
                value={profile.goal || ""}
                onChange={(e) => updateProfile({ goal: e.target.value })}
                placeholder="e.g. farming input subsidy, college tuition scholarship, housing grant"
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Used to rank and prioritize relevant schemes during discovery.
              </span>
            </div>
          </div>
        </div>

        {/* Validation Result Box */}
        {validationState && (
          <div
            className={`border-t px-6 py-4 text-xs ${
              validationState.valid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
              {validationState.valid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-800">Profile Normalization Successful</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-800">Validation Notice</span>
                </>
              )}
            </div>

            {validationState.recognized.length > 0 && (
              <p className="text-emerald-700">
                Attributes verified: {validationState.recognized.join(", ")}.
              </p>
            )}

            {validationState.warnings.length > 0 && (
              <ul className="list-disc list-inside mt-1 text-amber-700 space-y-0.5">
                {validationState.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="bg-[#F8FAFC] border-t border-gray-200 p-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? "animate-spin" : ""}`} />
            Validate Profile via API
          </button>

          <button
            type="button"
            onClick={handleSaveAndDiscover}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Save & Discover Eligible Schemes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
