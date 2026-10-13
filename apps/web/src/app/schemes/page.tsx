"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Building2,
  ArrowRight,
} from "lucide-react";
import { discoverSchemes, fetchSchemes } from "@/lib/api";
import { Scheme } from "@/lib/types";
import { useProfile } from "@/lib/profile-context";

const CATEGORIES = [
  { id: "all", label: "All Schemes" },
  { id: "agriculture", label: "Agriculture" },
  { id: "healthcare", label: "Healthcare" },
  { id: "housing", label: "Housing" },
  { id: "education", label: "Education" },
];

export default function SchemesPage() {
  const { profile } = useProfile();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRankedForProfile, setIsRankedForProfile] = useState(false);

  const loadAllSchemes = async () => {
    setLoading(true);
    setIsRankedForProfile(false);
    try {
      const data = await fetchSchemes({
        category: activeCategory !== "all" ? activeCategory : undefined,
        search: searchQuery || undefined,
      });
      setSchemes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRankForProfile = async () => {
    setLoading(true);
    try {
      const data = await discoverSchemes(profile, profile.goal);
      setSchemes(data);
      setIsRankedForProfile(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await fetchSchemes({
          category: activeCategory !== "all" ? activeCategory : undefined,
          search: searchQuery || undefined,
        });
        if (!ignore) {
          setSchemes(data);
          setIsRankedForProfile(false);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [activeCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#17213F] tracking-tight">
            Scheme Discovery
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Browse and match central and state welfare initiatives with verified Gazette rules.
          </p>
        </div>

        {/* Discovery Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRankForProfile}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Rank for My Profile ({profile.occupation || "Farmer"}, {profile.state || "TS"})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-[#4F46E5] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Keyword Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadAllSchemes()}
            placeholder="Search schemes or benefits..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Status Notice if Ranked for Profile */}
      {isRankedForProfile && (
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-900 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>
              Schemes ranked specifically for your profile:{" "}
              <strong>{profile.occupation}</strong> in <strong>{profile.state}</strong>.
            </span>
          </div>
          <button
            onClick={loadAllSchemes}
            className="text-xs text-indigo-700 hover:text-indigo-900 underline font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Scheme Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : schemes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-3">
          <p className="text-base font-semibold text-gray-800">No schemes found matching your criteria.</p>
          <p className="text-xs">Try selecting a different category or clearing the search query.</p>
          <button
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
              loadAllSchemes();
            }}
            className="text-xs px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md font-medium"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme: Scheme) => (
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
                      scheme.verification_status === "VERIFIED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {scheme.verification_status}
                  </span>
                </div>

                {/* Title & Ministry */}
                <div>
                  <h2 className="font-bold text-base text-[#17213F] leading-snug">
                    {scheme.name}
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-gray-400" />
                    {scheme.department || "Government of India"}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-[#667085] line-clamp-3 leading-relaxed">
                  {scheme.description}
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
                  {scheme.criteria_count} Rules • {scheme.documents_count} Docs
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
          ))}
        </div>
      )}
    </div>
  );
}
