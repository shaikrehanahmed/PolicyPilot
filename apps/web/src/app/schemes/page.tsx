"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookmarkCheck,
  Compass,
  ExternalLink,
  Filter,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  fetchSchemes,
  fetchTrackingState,
  rankSchemesByProfile,
  recordSchemeVisit,
  updateSchemeApplicationStatus,
} from "@/lib/api";
import { useProfile } from "@/lib/profile-context";
import { useLanguage } from "@/lib/i18n-context";
import { BackButton } from "@/components/back-button";
import {
  RankedSchemeDiscoveryItem,
  Scheme,
  TrackingCenterResponse,
  UserApplicationStatus,
} from "@/lib/types";

const USER_STATUS_OPTIONS: { value: UserApplicationStatus; label: string }[] = [
  { value: "NOT_APPLIED", label: "Not Applied" },
  { value: "BOOKMARKED", label: "Bookmarked" },
  { value: "PREPARING_DOCUMENTS", label: "Preparing Documents" },
  { value: "APPLIED", label: "Applied on Official Portal" },
  { value: "MARKED_DEFECTIVE", label: "Marked Defective / Stalled" },
  { value: "BENEFIT_RECEIVED", label: "Benefit Received" },
];

export default function SchemeDiscoveryEditorialPage() {
  const { profile } = useProfile();
  const { isRtl, t, localizeScheme } = useLanguage();

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [rankedItems, setRankedItems] = useState<RankedSchemeDiscoveryItem[] | null>(
    null
  );
  const [isProfileRankedMode, setIsProfileRankedMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const [trackingState, setTrackingState] =
    useState<TrackingCenterResponse | null>(null);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingSchemes(true);
    Promise.all([fetchSchemes(), fetchTrackingState()])
      .then(([allSchemes, trackRes]) => {
        setSchemes(allSchemes);
        setTrackingState(trackRes);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load schemes.");
      })
      .finally(() => setLoadingSchemes(false));
  }, []);

  const handleRequestProfileRanking = async () => {
    setRankingLoading(true);
    setError(null);
    try {
      const ranked = await rankSchemesByProfile(profile);
      setRankedItems(ranked);
      setIsProfileRankedMode(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to rank schemes by profile."
      );
    } finally {
      setRankingLoading(false);
    }
  };

  const handleStatusChange = async (
    slug: string,
    nextStatus: UserApplicationStatus
  ) => {
    try {
      const updated = await updateSchemeApplicationStatus(slug, nextStatus);
      setTrackingState(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update application status."
      );
    }
  };

  const trackedMap = new Map(
    (trackingState?.tracked_schemes || []).map((tr) => [tr.scheme_slug, tr])
  );

  const filterSchemeObj = (s: Scheme) => {
    if (categoryFilter !== "all" && s.category.toLowerCase() !== categoryFilter) {
      return false;
    }
    if (levelFilter !== "all" && s.level.toUpperCase() !== levelFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const loc = localizeScheme(s);
      return (
        s.name.toLowerCase().includes(q) ||
        loc.displayName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return true;
  };

  const filteredDefaultSchemes = schemes.filter(filterSchemeObj);
  const filteredRankedItems = (rankedItems || []).filter((item) =>
    filterSchemeObj(item.scheme)
  );

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton fallbackHref="/" />

        <Link
          href="/updates"
          className="btn-parchment inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold"
        >
          <Bell className="w-3.5 h-3.5 text-[#8C6D3B]" />
          <span>{t("nav_updates")}</span>
        </Link>
      </div>

      {/* Editorial Header & Profile Ranking Switcher */}
      <div className="folio-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 brass-badge px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>{t("discovery_eyebrow")}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isProfileRankedMode ? (
              <button
                type="button"
                onClick={handleRequestProfileRanking}
                disabled={rankingLoading}
                className="btn-forest inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Scale className="w-3.5 h-3.5 text-[#C5A572]" />
                <span>
                  {rankingLoading ? "..." : t("discovery_btn_rank")}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsProfileRankedMode(false);
                  setRankedItems(null);
                }}
                className="btn-parchment inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t("discovery_btn_reset")}</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2 max-w-3xl">
          <h1 className="font-editorial text-2xl sm:text-4xl font-semibold text-[#141815]">
            {t("discovery_title")}
          </h1>
          <p className="text-xs sm:text-sm text-[#4A524C] leading-relaxed">
            {t("discovery_subtitle")}
          </p>
        </div>

        {/* Search & Filter Well */}
        <div className="embossed-well rounded-xl p-3.5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-[#6B726C] absolute start-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schemes by title, ministry, or benefit..."
              className="w-full ps-9 pe-3.5 py-2 rounded-lg border border-[#D8D1C2] bg-[#FCFBF7] text-xs sm:text-sm text-[#141815] focus:outline-none focus:ring-2 focus:ring-[#163026]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6B726C] shrink-0" />
            <select
              aria-label="Filter by Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-[#D8D1C2] bg-[#FCFBF7] px-3 py-2 text-xs font-semibold text-[#141815]"
            >
              <option value="all">All Categories</option>
              <option value="agriculture">Agriculture</option>
              <option value="education">Education &amp; Scholarships</option>
              <option value="healthcare">Healthcare</option>
              <option value="housing">Rural Housing</option>
            </select>
          </div>

          <div>
            <select
              aria-label="Filter by Jurisdiction"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full rounded-lg border border-[#D8D1C2] bg-[#FCFBF7] px-3 py-2 text-xs font-semibold text-[#141815]"
            >
              <option value="all">All Jurisdictions</option>
              <option value="CENTRAL">Central Government</option>
              <option value="STATE">State Government (Telangana)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#F2EADB] border border-[#D4C098] text-[#694F25] rounded-xl p-4 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Catalogue Content */}
      {loadingSchemes ? (
        <div className="folio-card rounded-2xl p-12 text-center text-sm text-[#6B726C]">
          Loading verified statutory scheme records...
        </div>
      ) : isProfileRankedMode && filteredRankedItems ? (
        /* RANKED BY PROFILE VIEW (Separates Matched, Insufficient Info, and Not Matched) */
        <div className="space-y-4">
          {filteredRankedItems.map((item) => {
            const s = item.scheme;
            const loc = localizeScheme(s);
            const tracked = trackedMap.get(s.slug);
            const currentUserStatus =
              tracked?.user_confirmed_status || "NOT_APPLIED";

            return (
              <div
                key={s.id}
                className="folio-card rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-bold ${
                        item.eligibility_status === "ELIGIBLE"
                          ? "bg-[#163026] text-[#F7F4EC]"
                          : item.eligibility_status === "PARTIALLY_ELIGIBLE"
                          ? "brass-badge"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {item.discovery_bucket.replace(/_/g, " ")} ·{" "}
                      {item.eligibility_status} ({item.met_count} Met /{" "}
                      {item.unknown_count} Unknown)
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E6ECE7] text-[#163026] border border-[#CFDBD1]">
                      Lifecycle: {item.official_lifecycle_status}
                    </span>
                  </div>

                  {item.last_verified_at && (
                    <span className="text-[11px] font-mono text-[#6B726C]">
                      Verified: {item.last_verified_at.slice(0, 10)}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="font-editorial text-xl font-semibold text-[#141815]">
                    {loc.displayName}
                  </h2>
                  {loc.displayName !== loc.officialName && (
                    <div className="text-xs text-[#6B726C]">
                      Official Gazette Title: {loc.officialName}
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-[#4A524C] mt-1.5 leading-relaxed">
                    {loc.displayDescription}
                  </p>
                </div>

                <div className="sage-panel rounded-xl p-3.5 text-xs space-y-1">
                  <div className="font-bold text-[#163026] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Deterministic Assessment &amp; Results Guidance:</span>
                  </div>
                  <p className="text-[#141815]">{item.why_this_result}</p>
                  <p className="text-[#4A524C]">{item.results_guidance}</p>
                </div>

                <div className="pt-3 border-t border-[#D8D1C2] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#141815]">
                      My Application Status:
                    </span>
                    <select
                      aria-label={`Application status for ${s.name}`}
                      value={currentUserStatus}
                      onChange={(e) =>
                        handleStatusChange(
                          s.slug,
                          e.target.value as UserApplicationStatus
                        )
                      }
                      className="rounded-lg border border-[#BFB6A4] bg-[#FCFBF7] px-2.5 py-1.5 text-xs font-semibold text-[#141815]"
                    >
                      {USER_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Link
                    href={`/schemes/${s.slug}`}
                    onClick={() => recordSchemeVisit(s.slug).catch(() => {})}
                    className="btn-forest inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <span>Inspect Statutory Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DEFAULT VIEW: ALL AVAILABLE VERIFIED SCHEMES */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDefaultSchemes.map((s) => {
            const loc = localizeScheme(s);
            const tracked = trackedMap.get(s.slug);
            const currentUserStatus =
              tracked?.user_confirmed_status || "NOT_APPLIED";
            const hasVerifiedEvidence =
              s.verification_status === "VERIFIED" &&
              Boolean(s.source?.url) &&
              Boolean(s.source?.last_verified_at);

            const lifecycleLabel = hasVerifiedEvidence
              ? tracked?.official_lifecycle_status || "Active"
              : "Status Unverified";

            return (
              <div
                key={s.id}
                className="folio-card folio-card-interactive rounded-2xl p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="brass-badge px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {s.level} {s.state ? `· ${s.state}` : ""} · {s.category}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        lifecycleLabel === "Status Unverified"
                          ? "bg-[#F2EADB] text-[#694F25] border border-[#D4C098]"
                          : "bg-[#E6ECE7] text-[#163026] border border-[#CFDBD1]"
                      }`}
                    >
                      {lifecycleLabel}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-editorial text-xl font-semibold text-[#141815] leading-snug">
                      {loc.displayName}
                    </h2>
                    {loc.displayName !== loc.officialName && (
                      <div className="text-[11px] text-[#6B726C] mt-0.5">
                        {loc.officialName}
                      </div>
                    )}
                    <p className="text-xs sm:text-sm text-[#4A524C] mt-2 leading-relaxed">
                      {loc.displayDescription}
                    </p>
                  </div>

                  <div className="embossed-well rounded-xl p-3 text-[11px] text-[#4A524C] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#141815]">
                        Provenance:
                      </span>
                      <span className="font-mono">
                        Verified:{" "}
                        {s.source?.last_verified_at
                          ? String(s.source.last_verified_at).slice(0, 10)
                          : "Status Unverified"}
                      </span>
                    </div>
                    {s.source?.url ? (
                      <a
                        href={s.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#163026] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        {s.source.title || s.source.url}{" "}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span>Status Unverified</span>
                    )}
                  </div>
                </div>

                <div className="pt-3.5 border-t border-[#D8D1C2] space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#141815] flex items-center gap-1.5">
                      <BookmarkCheck className="w-3.5 h-3.5 text-[#8C6D3B]" />
                      <span>My Status:</span>
                    </span>
                    <select
                      aria-label={`Track status for ${s.name}`}
                      value={currentUserStatus}
                      onChange={(e) =>
                        handleStatusChange(
                          s.slug,
                          e.target.value as UserApplicationStatus
                        )
                      }
                      className="rounded-lg border border-[#BFB6A4] bg-[#FCFBF7] px-2.5 py-1 text-xs font-semibold text-[#141815]"
                    >
                      {USER_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {currentUserStatus === "MARKED_DEFECTIVE" ? (
                      <Link
                        href="/rescue"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#8B261D] hover:underline"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Open Defect Rescue
                      </Link>
                    ) : (
                      <span className="text-[11px] font-mono text-[#6B726C]">
                        {tracked?.visit_count
                          ? `Visited ${tracked.visit_count}x`
                          : "Unvisited"}
                      </span>
                    )}

                    <Link
                      href={`/schemes/${s.slug}`}
                      onClick={() => recordSchemeVisit(s.slug).catch(() => {})}
                      className="btn-forest inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      <span>Open Scheme Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
