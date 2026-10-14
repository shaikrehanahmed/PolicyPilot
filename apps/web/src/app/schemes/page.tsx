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
} from "lucide-react";
import { discoverSchemes, fetchSchemes } from "@/lib/api";
import { Scheme } from "@/lib/types";
import { useProfile } from "@/lib/profile-context";
import { useLanguage } from "@/lib/i18n-context";
import { BackButton } from "@/components/back-button";

export default function SchemesPage() {
  const { profile } = useProfile();
  const { t, speechLang, localizeScheme, isRtl } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
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
      const data = await discoverSchemes(profile, profile.goal);
      if (!data || data.length === 0) {
        setRankingNotice(
          `No schemes exclusively matched criteria for ${profile.occupation || "your profile"}. Retaining full catalog.`
        );
        const all = await fetchSchemes();
        setSchemes(all);
        setIsRankedForProfile(false);
      } else {
        setSchemes(data);
        setIsRankedForProfile(true);
        setRankingNotice(null);
      }
    } catch (e: unknown) {
      console.error("Profile ranking error:", e);
      const msg = e instanceof Error ? e.message : "Profile ranking failed";
      setRankingNotice(`Could not complete custom ranking: ${msg}. Displaying full scheme catalog.`);
      try {
        const all = await fetchSchemes();
        setSchemes(all);
      } catch {
        // preserve existing list if fallback fails
      }
      setIsRankedForProfile(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      setIsRankedForProfile(false);
      setRankingNotice(null);
      try {
        const data = await fetchSchemes({
          category: activeCategory !== "all" ? activeCategory : undefined,
          search: searchQuery.trim() || undefined,
        });
        if (!ignore) {
          setSchemes(data);
          setError(null);
          setLoading(false);
        }
      } catch (e: unknown) {
        console.error("Failed to fetch schemes:", e);
        if (!ignore) {
          const msg = e instanceof Error ? e.message : "Failed to load schemes";
          setError(msg);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [activeCategory, searchQuery]);

  const categories = [
    { id: "all", label: t("schemes.catAll") },
    { id: "agriculture", label: t("schemes.catAgri") },
    { id: "healthcare", label: t("schemes.catHealth") },
    { id: "housing", label: t("schemes.catHousing") },
    { id: "education", label: t("schemes.catEdu") },
  ];

  const startVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningSearch(true);
      recognition.onresult = (event) => {
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
            {t("nav_schemes") || t("schemes.title")}
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            {t("schemes.desc")}
            {!loading && !error && (
              <span className="font-semibold text-indigo-700 ml-1.5">
                ({schemes.length} active {schemes.length === 1 ? "scheme" : "schemes"} available)
              </span>
            )}
          </p>
        </div>

        {/* Discovery Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRankForProfile}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {t("schemes.rankForMe")} ({profile.occupation || "Farmer"}, {profile.state || "TS"})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Pills */}
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

        {/* Keyword Search Input with Voice Dictation */}
        <div className="relative w-full md:w-80 flex items-center">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadAllSchemes()}
            placeholder={t("schemes.searchPlaceholder")}
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

      {/* Status Notice if Ranked for Profile */}
      {isRankedForProfile && (
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-3 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Schemes ranked specifically for your profile:{" "}
              <strong>{profile.occupation || "Citizen"}</strong> in <strong>{profile.state || "India"}</strong>.
            </span>
          </div>
          <button
            onClick={loadAllSchemes}
            className="text-xs text-indigo-700 hover:text-indigo-900 underline font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Notice if ranking fell back */}
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

      {/* Scheme Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-60 bg-gray-100/80 rounded-xl animate-pulse border border-gray-200/50" />
          ))}
        </div>
      ) : schemes.length === 0 && !error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-3 shadow-xs">
          <p className="text-base font-semibold text-gray-800">No schemes found matching your criteria.</p>
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
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Badges */}
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

                  {/* Title & Ministry */}
                  <div>
                    <h2 className="font-bold text-base text-[#17213F] leading-snug">
                      {displayName}
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                      {scheme.department || "Government of India"}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#667085] line-clamp-3 leading-relaxed">
                    {displayDescription}
                  </p>

                  {/* Match Rationale if available */}
                  {scheme.relevance_rationale && (
                    <div className="bg-indigo-50/60 rounded-lg p-2.5 text-[11px] text-indigo-900 border border-indigo-100">
                      <span className="font-semibold block text-indigo-950">Match Rationale:</span>
                      {scheme.relevance_rationale}
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">
                    {criteriaCount} Rules • {documentsCount} Docs
                  </span>
                  <Link
                    href={`/schemes/${scheme.slug}`}
                    className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 group"
                  >
                    View Eligibility & Evidence
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
