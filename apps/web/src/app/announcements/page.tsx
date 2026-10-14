"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  checkAnnouncementUpdates,
  clearAllRecentVisits,
  fetchAnnouncements,
  fetchTrackingState,
  markNotificationRead,
  removeRecentVisit,
  removeTrackedApplication,
  updateNotificationPreferences,
  updateSchemeApplicationStatus,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n-context";
import { BackButton } from "@/components/back-button";
import { VoiceAccessibilityBar } from "@/components/voice-accessibility-bar";
import {
  AnnouncementItem,
  SourceChangeCheckResult,
  TrackingCenterResponse,
  UserApplicationStatus,
} from "@/lib/types";

export default function SchemeUpdatesAndTrackingDashboard() {
  const { lang, isRtl, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "updates" | "applications" | "recent" | "notifications"
  >("updates");

  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [auditResult, setAuditResult] = useState<SourceChangeCheckResult | null>(null);
  const [trackingState, setTrackingState] = useState<TrackingCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAnnouncements(lang, false), fetchTrackingState()])
      .then(([annRes, trackRes]) => {
        setItems(annRes);
        setTrackingState(trackRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lang]);

  const handleRunSourceCheck = async () => {
    setChecking(true);
    try {
      const [res, trackRes] = await Promise.all([
        checkAnnouncementUpdates(lang),
        fetchTrackingState(),
      ]);
      setAuditResult(res);
      setItems(res.announcements);
      setTrackingState(trackRes);
    } finally {
      setChecking(false);
    }
  };

  const verifiedItems = items.filter((i) => i.verification_status === "VERIFIED");
  const reviewItems = items.filter((i) => i.verification_status !== "VERIFIED");
  const myApplications = trackingState?.my_applications || [];
  const recentlyVisited = trackingState?.recently_visited || [];
  const notifications = trackingState?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const speechSummary = verifiedItems
    .map((i) => `${i.official_scheme_name}. ${i.title}. ${i.summary}`)
    .join(" ");

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton fallbackHref="/schemes" />
        {trackingState && (
          <div className="text-[11px] font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 shadow-2xs ltr-inline">
            Last Verified: <strong>{trackingState.last_successful_verification_at.slice(0, 10)}</strong>
          </div>
        )}
      </div>

      {/* Dashboard Hero Header */}
      <div className="folio-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 brass-badge px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Bell className="w-4 h-4 text-[#8C6D3B]" />
            <span>{t("announcements_badge")}</span>
          </div>

          <button
            type="button"
            onClick={handleRunSourceCheck}
            disabled={checking}
            className="btn-forest inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A572] ${checking ? "animate-spin" : ""}`} />
            <span>{t("announcements_btn_check")}</span>
          </button>
        </div>

        <h1 className="font-editorial text-2xl sm:text-4xl font-semibold text-[#141815] tracking-tight">
          {t("updates_title") || "Scheme Updates, Application Tracker & Notification Center"}
        </h1>
        <p className="text-xs sm:text-sm text-[#4A524C] max-w-3xl leading-relaxed">
          {t("updates_subtitle") ||
            "Monitor verified ministry announcements, manage schemes you have marked as Applied, review official Results Guidance, and control your personalized in-app notifications."}
        </p>

        <VoiceAccessibilityBar textToReadAloud={speechSummary} compact />

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#D8D1C2]">
          <button
            type="button"
            onClick={() => setActiveTab("updates")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "updates"
                ? "bg-[#163026] text-[#F7F4EC]"
                : "btn-parchment"
            }`}
          >
            {t("updates_tabUpdates") || "Official Scheme Updates"} ({verifiedItems.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "applications"
                ? "bg-[#163026] text-[#F7F4EC]"
                : "btn-parchment"
            }`}
          >
            {t("updates_tabApplications") || "My Applications"} ({myApplications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "recent"
                ? "bg-[#163026] text-[#F7F4EC]"
                : "btn-parchment"
            }`}
          >
            {t("updates_tabRecent") || "Recently Visited"} ({recentlyVisited.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "notifications"
                ? "bg-[#163026] text-[#F7F4EC]"
                : "btn-parchment"
            }`}
          >
            <span>{t("updates_tabNotifications") || "Personalized Notifications"}</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#C5A572] text-[#0F221A] text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Honest Source Check & Persistence Telemetry */}
      {auditResult && (
        <div
          dir="ltr"
          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
              <Server className="w-4 h-4 text-[#4F46E5]" />
              <span>
                Mode: {auditResult.monitoring_mode} (Background Cron Active:{" "}
                {String(auditResult.scheduler_active)})
              </span>
            </div>
            <span className="font-mono text-[11px] bg-white px-2.5 py-0.5 rounded border border-slate-200">
              Checked: {auditResult.total_sources_checked} · Verified:{" "}
              {auditResult.verified_announcements_count} · Review:{" "}
              {auditResult.awaiting_review_count} · Duplicates Blocked:{" "}
              {auditResult.duplicates_prevented}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {auditResult.external_requirements_note}
          </p>
        </div>
      )}

      {/* TAB 1: OFFICIAL SCHEME UPDATES */}
      {activeTab === "updates" && !loading && (
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-extrabold text-[#0F172A]">
                {t("announcements_verified_section")} ({verifiedItems.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {verifiedItems.map((ann) => (
                <div
                  key={ann.id}
                  className="card-3d rounded-2xl p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      VERIFIED · {ann.level} {ann.state ? `(${ann.state})` : ""}
                    </span>
                    <div
                      dir="ltr"
                      className="flex items-center gap-3 text-[11px] text-slate-500 font-mono"
                    >
                      {ann.published_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Published: {ann.published_date}
                        </span>
                      )}
                      <span>Verified: {ann.last_verified_at.slice(0, 10)}</span>
                    </div>
                  </div>

                  <div>
                    <div
                      dir="ltr"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {ann.official_scheme_name} · {ann.department}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0F172A] mt-1 leading-snug">
                      {ann.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {ann.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-[#0F172A] block">
                        {t("announcements_benefits_label")}
                      </span>
                      <p className="text-slate-600 mt-1 leading-relaxed">{ann.benefits_summary}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#0F172A] block">
                        {t("announcements_eligibility_label")}
                      </span>
                      <p className="text-slate-600 mt-1 leading-relaxed">{ann.eligibility_summary}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#0F172A] block">
                        {t("announcements_deadline_label")}
                      </span>
                      <p className="text-slate-600 mt-1 leading-relaxed">{ann.deadline_info}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                    <div dir="ltr" className="flex flex-wrap items-center gap-4 text-xs">
                      <a
                        href={ann.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#4F46E5] hover:underline"
                      >
                        <span>{ann.source_title}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {ann.application_url && (
                        <a
                          href={ann.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                        >
                          <span>{t("announcements_official_portal")}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {ann.scheme_slug && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateSchemeApplicationStatus(
                              ann.scheme_slug!,
                              "APPLIED"
                            ).then((updated) => {
                              setTrackingState(updated);
                              setActiveTab("applications");
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-bold hover:bg-emerald-100 cursor-pointer btn-3d"
                        >
                          {t("detail_markAsApplied") || "Mark as Applied"}
                        </button>
                        <Link
                          href={`/schemes/${ann.scheme_slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-[#4F46E5] text-xs font-bold hover:bg-indigo-100 transition btn-3d"
                        >
                          <span>{t("nav_check_eligibility")}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {reviewItems.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-amber-950">
                  {t("announcements_review_section")} ({reviewItems.length})
                </h2>
              </div>

              {reviewItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 space-y-2.5 text-xs card-3d"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 text-[10px]">
                      {item.verification_status} · Status Unverified
                    </span>
                    <span dir="ltr" className="font-mono text-slate-500">
                      {item.published_date}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-[#0F172A]">{item.title}</div>
                  <p className="text-slate-700 leading-relaxed">{item.summary}</p>
                  {item.review_note && (
                    <div className="flex items-center gap-1.5 text-amber-900 font-medium pt-1">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>{item.review_note}</span>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {/* TAB 2: MY APPLICATIONS */}
      {activeTab === "applications" && (
        <section className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-2.5 card-3d">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>External Portal Submission Disclaimer:</strong> PolicyPilot records
              your self-confirmed &ldquo;Applied&rdquo; status and timestamp for personal
              tracking only. It cannot independently verify submission or guarantee benefit
              approval on external government portals.
            </span>
          </div>

          {myApplications.length === 0 ? (
            <div className="card-3d rounded-2xl p-10 text-center space-y-3">
              <BookmarkCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-[#0F172A]">
                {t("updates_emptyApplications") || "No Tracked Applications Yet"}
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                When you submit an application on an official portal (such as NSP or
                PM-KISAN), mark it as &ldquo;Applied&rdquo; in Scheme Discovery or Scheme
                Updates to track its lifecycle and results guidance here.
              </p>
              <Link
                href="/schemes"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-bold btn-3d shadow-xs"
              >
                <span>{t("home_pillar1_cta") || "Browse Schemes"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((rec: any) => (
                <div
                  key={rec.scheme_slug}
                  className="card-3d rounded-2xl p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                        {rec.user_confirmed_status.replace(/_/g, " ")}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {t("detail_officialLifecycle") || "Official Lifecycle:"} {rec.official_lifecycle_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {rec.applied_at && (
                        <span className="font-mono text-slate-500 ltr-inline">
                          Applied: {rec.applied_at.slice(0, 10)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          removeTrackedApplication(rec.scheme_slug).then(setTrackingState)
                        }
                        className="inline-flex items-center gap-1 text-red-600 hover:underline font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      {rec.scheme_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-600">Update Status:</span>
                      <select
                        aria-label={`Update status for ${rec.scheme_name}`}
                        value={rec.user_confirmed_status}
                        onChange={(e) =>
                          updateSchemeApplicationStatus(
                            rec.scheme_slug,
                            e.target.value as UserApplicationStatus
                          ).then(setTrackingState)
                        }
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 font-bold text-[#0F172A] bg-white"
                      >
                        <option value="BOOKMARKED">Bookmarked</option>
                        <option value="PREPARING_DOCUMENTS">Preparing Documents</option>
                        <option value="APPLIED">Applied on Official Portal</option>
                        <option value="MARKED_DEFECTIVE">Marked Defective</option>
                        <option value="BENEFIT_RECEIVED">Benefit Received</option>
                      </select>
                    </div>
                  </div>

                  {/* Results Guidance Box */}
                  {rec.results_guidance && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#0F172A]">
                          {t("detail_resultsGuidanceTitle") || "Official Results & Verification Guidance"}
                        </span>
                        {rec.results_guidance.announcement_date && (
                          <span className="font-mono text-slate-500 ltr-inline">
                            Batch / Date: {rec.results_guidance.announcement_date}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {rec.results_guidance.how_to_check}
                      </p>
                      {rec.results_guidance.official_next_steps?.length > 0 && (
                        <ul className="list-disc ps-4 space-y-1 text-slate-700">
                          {rec.results_guidance.official_next_steps.map(
                            (st: string, idx: number) => (
                              <li key={idx}>{st}</li>
                            )
                          )}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    {rec.official_application_url && (
                      <a
                        href={rec.official_application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#4F46E5] hover:underline"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link
                      href={`/schemes/${rec.scheme_slug}`}
                      className="font-bold text-[#0F172A] hover:text-[#4F46E5] inline-flex items-center gap-1"
                    >
                      <span>Open Scheme Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: RECENTLY VISITED SCHEMES */}
      {activeTab === "recent" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4F46E5]" />
              <span>{t("updates_tabRecent") || "Recently Visited Schemes"} ({recentlyVisited.length})</span>
            </h2>
            {recentlyVisited.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllRecentVisits().then(setTrackingState)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 cursor-pointer btn-3d"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("updates_clearRecent") || "Clear All History"}</span>
              </button>
            )}
          </div>

          {recentlyVisited.length === 0 ? (
            <div className="card-3d rounded-2xl p-8 text-center text-xs text-slate-500">
              {t("updates_emptyRecent") ||
                "No recently visited schemes recorded in this session. Opening any scheme detail page automatically logs the visit timestamp here."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentlyVisited.map((rec: any) => (
                <div
                  key={rec.scheme_slug}
                  className="card-3d rounded-2xl p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {rec.official_lifecycle_status}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 ltr-inline">
                        {rec.last_visited_at?.slice(0, 10)} ({rec.visit_count}x)
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">
                      {rec.scheme_name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        removeRecentVisit(rec.scheme_slug).then(setTrackingState)
                      }
                      className="text-red-600 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateSchemeApplicationStatus(
                            rec.scheme_slug,
                            "APPLIED"
                          ).then((updated) => {
                            setTrackingState(updated);
                            setActiveTab("applications");
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[#4F46E5] font-bold cursor-pointer btn-3d"
                      >
                        {t("detail_markAsApplied") || "Mark Applied"}
                      </button>
                      <Link
                        href={`/schemes/${rec.scheme_slug}`}
                        className="font-bold text-[#0F172A] hover:text-[#4F46E5] inline-flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: PERSONALIZED NOTIFICATIONS */}
      {activeTab === "notifications" && trackingState && (
        <section className="space-y-5">
          <div className="card-3d rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-sm text-[#0F172A]">
                Notification Channel &amp; Event Preferences
              </span>
              <span className="font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded text-slate-700 ltr-inline">
                Duplicates Blocked: {trackingState.duplicates_suppressed}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={trackingState.preferences.scheme_updates_enabled}
                  onChange={(e) =>
                    updateNotificationPreferences({
                      ...trackingState.preferences,
                      scheme_updates_enabled: e.target.checked,
                    }).then(setTrackingState)
                  }
                  className="rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                />
                <span>Scheme Updates</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={trackingState.preferences.deadline_warnings_enabled}
                  onChange={(e) =>
                    updateNotificationPreferences({
                      ...trackingState.preferences,
                      deadline_warnings_enabled: e.target.checked,
                    }).then(setTrackingState)
                  }
                  className="rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                />
                <span>Deadline Warnings</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={trackingState.preferences.results_announcements_enabled}
                  onChange={(e) =>
                    updateNotificationPreferences({
                      ...trackingState.preferences,
                      results_announcements_enabled: e.target.checked,
                    }).then(setTrackingState)
                  }
                  className="rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                />
                <span>Results Announcements</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={trackingState.preferences.defect_recovery_tips_enabled}
                  onChange={(e) =>
                    updateNotificationPreferences({
                      ...trackingState.preferences,
                      defect_recovery_tips_enabled: e.target.checked,
                    }).then(setTrackingState)
                  }
                  className="rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                />
                <span>Defect Recovery Tips</span>
              </label>
            </div>
          </div>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div className="card-3d rounded-2xl p-8 text-center text-xs text-slate-500">
              No personalized alerts at this time. Verified alerts are created automatically for
              schemes you visit or mark as applied.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <div
                  key={n.notification_id}
                  className={`card-3d rounded-2xl p-5 space-y-2 text-xs transition ${
                    n.read ? "opacity-75" : "border-indigo-300 ring-1 ring-indigo-100"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-[#4F46E5]">
                        {n.event_type.replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-[#0F172A]">{n.scheme_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span className="font-mono text-[11px] ltr-inline">{n.created_at.slice(0, 10)}</span>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() =>
                            markNotificationRead(n.notification_id).then(setTrackingState)
                          }
                          className="text-[#4F46E5] hover:underline font-bold cursor-pointer"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="font-bold text-slate-900">{n.title}</div>
                  <p className="text-slate-600 leading-relaxed">{n.message}</p>

                  {n.source_url && (
                    <div className="pt-1">
                      <a
                        href={n.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#4F46E5] hover:underline"
                      >
                        <span>Official Source Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
