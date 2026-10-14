"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Building2,
  ArrowRight,
  AlertTriangle,
  RotateCw,
  Info,
  Mic,
  MicOff,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { fetchSchemes, rankSchemesByProfile } from "@/lib/api";
import { RankedSchemeDiscoveryItem, Scheme } from "@/lib/types";
import { useProfile } from "@/lib/profile-context";
import { useLanguage } from "@/lib/i18n-context";
import { BackButton } from "@/components/back-button";

export default function SchemesPage() {
  const { profile } = useProfile();
  const { t, speechLang, localizeScheme, isRtl } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [rankedItems, setRankedItems] = useState<RankedSchemeDiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRankedForProfile, setIsRankedForProfile] = useState(false);
  const [rankingNotice, setRankingNotice] = useState<string | null>(null);
  const [isListeningSearch, setIsListeningSearch] = useState(false);

  const loadAllSchemes = async () => {
    setLoading(true);
    setError(null);
    setIsRankedForProfile(false);
    setRankingNotice(null);
    try {
      const data = await fetchSchemes({
        category: activeCategory !== "all" ? activeCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      setSchemes(data);
    } catch (e: unknown) {
      console.error("Failed to load schemes:", e);
      const msg = e instanceof Error ? e.message : "Failed to connect to schemes service";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRankForProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rankSchemesByProfile(profile);
      setRankedItems(data);
      setIsRankedForProfile(true);
      setRankingNotice(null);
    } catch (e: unknown) {
      console.error("Profile ranking error:", e);
      const msg = e instanceof Error ? e.message : "Profile ranking failed";
      setRankingNotice(`Could not complete custom ranking: ${msg}. Displaying full scheme catalog.`);
      setIsRankedForProfile(false);
      loadAllSchemes();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isRankedForProfile) {
      loadAllSchemes();
    }
  }, [activeCategory, searchQuery]);

  const categories = [
    { id: "all", label: t("schemes.catAll") || "All Schemes" },
    { id: "agriculture", label: t("schemes.catAgri") || "Agriculture" },
    { id: "healthcare", label: t("schemes.catHealth") || "Healthcare" },
    { id: "housing", label: t("schemes.catHousing") || "Housing" },
    { id: "education", label: t("schemes.catEdu") || "Education" },
  ];

  const startVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningSearch(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setSearchQuery(text);
        setIsListeningSearch(false);
      };
      recognition.onerror = () => setIsListeningSearch(false);
      recognition.onend = () => setIsListeningSearch(false);
      recognition.start();
    } catch {
      setIsListeningSearch(false);
    }
  };

  const matchedItems = rankedItems.filter((i) => i.discovery_bucket === "MATCHED_TO_PROFILE");
  const incompleteItems = rankedItems.filter(
    (i) => i.discovery_bucket === "INSUFFICIENT_INFORMATION"
  );
  const excludedItems = rankedItems.filter((i) => i.discovery_bucket === "NOT_MATCHED");

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
    >
      <div>
        <BackButton fallbackHref="/" />
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#17213F] tracking-tight">
            {t("nav_schemes") || "Government Schemes Discovery"}
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Browse all verified government welfare schemes or rank them against your Citizen Profile.
            {!loading && !error && !isRankedForProfile && (
              <span className="font-semibold text-indigo-700 ml-1.5">
                ({schemes.length} verified schemes available)
              </span>
            )}
          </p>
        </div>

        {/* Discovery Action Button */}
        <div className="flex items-center gap-3">
          {isRankedForProfile ? (
            <button
              onClick={loadAllSchemes}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#17213F] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              View All Schemes by Category
            </button>
          ) : (
            <button
              onClick={handleRankForProfile}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Rank by My Profile ({profile.occupation || "Farmer"}, {profile.state || "TS"})
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar (Default View) */}
      {!isRankedForProfile && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-[#4F46E5] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 flex items-center">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schemes by name, keyword..."
              className="w-full text-xs pl-9 pr-9 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`absolute right-2.5 p-1 rounded-md transition-colors cursor-pointer ${
                isListeningSearch
                  ? "bg-red-50 text-red-600 animate-pulse"
                  : "text-gray-400 hover:text-[#4F46E5]"
              }`}
              title="Search by voice"
            >
              {isListeningSearch ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Notice if ranking notice exists */}
      {rankingNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-medium">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{rankingNotice}</span>
          </div>
          <button
            onClick={() => setRankingNotice(null)}
            className="text-xs text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error State Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Backend Connection Error</p>
              <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
          <button
            onClick={loadAllSchemes}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-60 bg-gray-100/80 rounded-xl animate-pulse border border-gray-200/50" />
          ))}
        </div>
      )}

      {/* VIEW A: PROFILE-RANKED 3-BUCKET RESULTS (Part B1) */}
      {!loading && isRankedForProfile && (
        <div className="space-y-10">
          <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-950 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4F46E5] shrink-0" />
              <span>
                Deterministic rules evaluated against your profile:{" "}
                <strong>{profile.occupation || "Citizen"}</strong>, State:{" "}
                <strong>{profile.state || "TS"}</strong>.
              </span>
            </div>
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-emerald-700">{matchedItems.length} Matched</span>
              <span>·</span>
              <span className="text-amber-700">{incompleteItems.length} Needs Clarification</span>
              <span>·</span>
              <span className="text-gray-500">{excludedItems.length} Excluded</span>
            </div>
          </div>

          {/* BUCKET 1: MATCHED TO PROFILE */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-[#17213F]">
                1. Profile-Matched Schemes ({matchedItems.length})
              </h2>
            </div>

            {matchedItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-xs text-gray-500">
                No schemes met 100% of statutory criteria with current profile demographics. Review
                the &ldquo;Needs Clarification&rdquo; bucket below to complete missing details.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedItems.map((item) => {
                  const s = item.scheme;
                  const { displayName, displayDescription } = localizeScheme(s);
                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs hover:border-emerald-400 transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ELIGIBLE ({item.met_count} rules met)
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {item.official_lifecycle_status}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-base text-[#17213F]">{displayName}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">{s.department}</p>
                        </div>

                        <p className="text-xs text-[#667085] line-clamp-3 leading-relaxed">
                          {displayDescription}
                        </p>

                        <div className="bg-emerald-50/60 rounded-xl p-2.5 text-[11px] text-emerald-950 border border-emerald-100">
                          <span className="font-semibold block">Assessment Rationale:</span>
                          {item.why_this_result}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <Link
                          href={`/schemes/${s.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline"
                        >
                          View Criteria &amp; Action Plan <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* BUCKET 2: INSUFFICIENT INFORMATION / NEEDS CLARIFICATION */}
          <section className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-[#17213F]">
                2. Needs Profile Clarification / Incomplete Demographics ({incompleteItems.length})
              </h2>
            </div>

            {incompleteItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-xs text-gray-500">
                All profile parameters required for verified evaluation are complete.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {incompleteItems.map((item) => {
                  const s = item.scheme;
                  const { displayName } = localizeScheme(s);
                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl border border-amber-200 p-6 shadow-xs hover:border-amber-300 transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {item.eligibility_status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {item.official_lifecycle_status}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-base text-[#17213F]">{displayName}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">{s.department}</p>
                        </div>

                        <div className="bg-amber-50/70 rounded-xl p-3 text-xs text-amber-950 border border-amber-200/60 space-y-1.5">
                          <span className="font-bold block">Missing Required Profile Data:</span>
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            {item.missing_profile_fields.length > 0
                              ? item.missing_profile_fields.join(", ")
                              : "Additional statutory answers required"}
                          </p>
                        </div>

                        <p className="text-[11px] text-gray-600">{item.why_this_result}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <Link
                          href="/profile"
                          className="font-bold text-[#4F46E5] hover:underline inline-flex items-center gap-1"
                        >
                          Complete Profile <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/schemes/${s.slug}`}
                          className="font-semibold text-gray-600 hover:text-gray-900"
                        >
                          Inspect Rules
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* BUCKET 3: EXCLUDED / NOT MATCHED */}
          <section className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-[#17213F]">
                3. Not Matched / Statutory Exclusions ({excludedItems.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {excludedItems.map((item) => {
                const s = item.scheme;
                const { displayName } = localizeScheme(s);
                return (
                  <div
                    key={s.id}
                    className="bg-white/80 rounded-2xl border border-gray-200 p-6 shadow-2xs opacity-85 hover:opacity-100 transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          EXCLUDED / NOT ELIGIBLE
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          {s.category}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-gray-800">{displayName}</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">{s.department}</p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 text-xs text-gray-700 border border-slate-200">
                        <span className="font-bold text-[#17213F] block">Statutory Reason:</span>
                        <p className="text-[11px] text-gray-600 mt-1">{item.why_this_result}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <Link
                        href={`/schemes/${s.slug}`}
                        className="text-xs font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                      >
                        Inspect Criteria &amp; Clauses <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* VIEW B: ALL AVAILABLE SCHEMES (Default) */}
      {!loading && !isRankedForProfile && (
        <div>
          {schemes.length === 0 && !error ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-3 shadow-xs">
              <p className="text-base font-semibold text-gray-800">
                No schemes found matching your criteria.
              </p>
              <p className="text-xs">Try selecting a different category or clearing the search query.</p>
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                  loadAllSchemes();
                }}
                className="text-xs px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-medium cursor-pointer transition-colors"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemes.map((scheme: Scheme) => {
                const verificationStatus =
                  scheme.verification_status ||
                  (scheme.source as { verification_status?: string } | undefined)?.verification_status ||
                  "VERIFIED";
                const criteriaCount = scheme.criteria_count ?? (scheme.criteria?.length || 0);
                const documentsCount = scheme.documents_count ?? (scheme.documents?.length || 0);
                const { displayName, displayDescription } = localizeScheme(scheme);

                return (
                  <div
                    key={scheme.id}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs hover:border-[#4F46E5] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                            {scheme.category}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                            {scheme.level} {scheme.state ? `(${scheme.state})` : ""}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            verificationStatus === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {verificationStatus}
                        </span>
                      </div>

                      <div>
                        <h2 className="font-bold text-base text-[#17213F] leading-snug">
                          {displayName}
                        </h2>
                        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                          {scheme.department || "Government of India"}
                        </p>
                      </div>

                      <p className="text-xs text-[#667085] line-clamp-3 leading-relaxed">
                        {displayDescription}
                      </p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-medium">
                        {criteriaCount} Rules • {documentsCount} Docs
                      </span>
                      <Link
                        href={`/schemes/${scheme.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:underline"
                      >
                        Inspect Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
