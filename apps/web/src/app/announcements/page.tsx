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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton fallbackHref="/schemes" />
        {trackingState && (
          <div className="text-[11px] font-mono bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600">
            Last Successful Verification:{" "}
            <strong>
              {trackingState.last_successful_verification_at.slice(0, 10)}
            </strong>{" "}
            · Last Attempted Check:{" "}
            <strong>{trackingState.last_attempted_check_at.slice(0, 19)}Z</strong>
          </div>
        )}
      </div>

      {/* Dashboard Hero Header */}
      <div className="glossy-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-semibold">
            <Bell className="w-4 h-4" />
            <span>{t("announcements_badge")}</span>
          </div>

          <button
            type="button"
            onClick={handleRunSourceCheck}
            disabled={checking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#17213F] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            <span>{t("announcements_btn_check")}</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213F] tracking-tight">
          Scheme Updates, Application Tracker &amp; Notification Center
        </h1>
        <p className="text-sm text-[#667085] max-w-3xl leading-relaxed">
          Monitor verified ministry announcements, manage schemes you have marked as{" "}
          <strong>Applied</strong>, review official <strong>Results Guidance</strong>, and
          control your personalized in-app notifications.
        </p>

        <VoiceAccessibilityBar textToReadAloud={speechSummary} compact />

        {/* Navigation Tabs for C1, C2, C3/C5/C6, and C4 */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("updates")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "updates"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-white text-[#17213F] border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Official Scheme Updates ({verifiedItems.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "applications"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-white text-[#17213F] border border-gray-200 hover:bg-gray-50"
            }`}
          >
            My Applications ({myApplications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "recent"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-white text-[#17213F] border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Recently Visited ({recentlyVisited.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "notifications"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-white text-[#17213F] border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span>Personalized Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-[#17213F] text-[10px] font-extrabold">
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
            <div className="flex items-center gap-1.5 font-bold text-[#17213F]">
              <Server className="w-4 h-4 text-[#4F46E5]" />
              <span>
                Mode: {auditResult.monitoring_mode} (Background Cron Active:{" "}
                {String(auditResult.scheduler_active)})
              </span>
            </div>
            <span className="font-mono text-[11px] bg-white px-2.5 py-0.5 rounded border border-gray-200">
              Checked: {auditResult.total_sources_checked} · Verified:{" "}
              {auditResult.verified_announcements_count} · Review:{" "}
              {auditResult.awaiting_review_count} · Duplicates Blocked:{" "}
              {auditResult.duplicates_prevented}
            </span>
          </div>
          <p className="text-[#667085] leading-relaxed">
            {auditResult.external_requirements_note}
          </p>
        </div>
      )}

      {/* TAB 1: OFFICIAL SCHEME UPDATES & LIFECYCLE STATUSES */}
      {activeTab === "updates" && !loading && (
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-[#17213F]">
                {t("announcements_verified_section")} ({verifiedItems.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {verifiedItems.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      VERIFIED · {ann.level} {ann.state ? `(${ann.state})` : ""}
                    </span>
                    <div
                      dir="ltr"
                      className="flex items-center gap-3 text-[11px] text-gray-500 font-mono"
                    >
                      {ann.published_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Published: {ann.published_date}
                        </span>
                      )}
                      <span>Verified: {ann.last_verified_at.slice(0, 10)}</span>
                      <span>SHA256: {ann.content_hash}</span>
                    </div>
                  </div>

                  <div>
                    <div
                      dir="ltr"
                      className="text-xs font-bold uppercase tracking-wider text-[#667085]"
                    >
                      {ann.official_scheme_name} · {ann.department}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#17213F] mt-1">
                      {ann.title}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                      {ann.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-[#17213F] block">
                        {t("announcements_benefits_label")}
                      </span>
                      <p className="text-gray-700 mt-1">{ann.benefits_summary}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#17213F] block">
                        {t("announcements_eligibility_label")}
                      </span>
                      <p className="text-gray-700 mt-1">{ann.eligibility_summary}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#17213F] block">
                        {t("announcements_deadline_label")}
                      </span>
                      <p className="text-gray-700 mt-1">{ann.deadline_info}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div dir="ltr" className="flex flex-wrap items-center gap-4 text-xs">
                      <a
                        href={ann.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#4F46E5] hover:underline"
                      >
                        {ann.source_title} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {ann.application_url && (
                        <a
                          href={ann.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                        >
                          {t("announcements_official_portal")}{" "}
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
                          className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                        >
                          Mark as Applied
                        </button>
                        <Link
                          href={`/schemes/${ann.scheme_slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-[#4F46E5] text-xs font-semibold hover:bg-indigo-100"
                        >
                          {t("nav_check_eligibility")} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {reviewItems.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-amber-950">
                  {t("announcements_review_section")} ({reviewItems.length})
                </h2>
              </div>

              {reviewItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-amber-50/60 border border-amber-300 rounded-2xl p-5 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 text-[10px]">
                      {item.verification_status} · Status Unverified
                    </span>
                    <span dir="ltr" className="font-mono text-gray-500">
                      {item.published_date} · SHA256: {item.content_hash}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-[#17213F]">{item.title}</div>
                  <p className="text-gray-700">{item.summary}</p>
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

      {/* TAB 2: MY APPLICATIONS (C2) & RESULTS GUIDANCE (C5) */}
      {activeTab === "applications" && (
        <section className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>External Portal Submission Disclaimer:</strong> PolicyPilot records
              your self-confirmed &ldquo;Applied&rdquo; status and timestamp for personal
              tracking only. It cannot independently verify submission or guarantee benefit
              approval on external government portals.
            </span>
          </div>

          {myApplications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center space-y-3">
              <BookmarkCheck className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-sm font-bold text-[#17213F]">
                No Tracked Applications Yet
              </div>
              <p className="text-xs text-[#667085] max-w-md mx-auto">
                When you submit an application on an official portal (such as NSP or
                PM-KISAN), mark it as &ldquo;Applied&rdquo; in Scheme Discovery or Scheme
                Updates to track its lifecycle and results guidance here.
              </p>
              <Link
                href="/schemes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F46E5] text-white text-xs font-bold"
              >
                Browse Schemes <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((rec: any) => (
                <div
                  key={rec.scheme_slug}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                        Your Status: {rec.user_confirmed_status.replace(/_/g, " ")}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Official Scheme Lifecycle: {rec.official_lifecycle_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {rec.applied_at && (
                        <span className="font-mono text-gray-500">
                          Marked Applied: {rec.applied_at.slice(0, 10)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          removeTrackedApplication(rec.scheme_slug).then(setTrackingState)
                        }
                        className="inline-flex items-center gap-1 text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Record</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-[#17213F]">
                      {rec.scheme_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-gray-600">Update Status:</span>
                      <select
                        aria-label={`Update status for ${rec.scheme_name}`}
                        value={rec.user_confirmed_status}
                        onChange={(e) =>
                          updateSchemeApplicationStatus(
                            rec.scheme_slug,
                            e.target.value as UserApplicationStatus
                          ).then(setTrackingState)
                        }
                        className="rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-[#17213F]"
                      >
                        <option value="BOOKMARKED">Bookmarked</option>
                        <option value="PREPARING_DOCUMENTS">Preparing Documents</option>
                        <option value="APPLIED">Applied on Official Portal</option>
                        <option value="MARKED_DEFECTIVE">Marked Defective</option>
                        <option value="BENEFIT_RECEIVED">Benefit Received</option>
                      </select>
                    </div>
                  </div>

                  {/* Results Guidance Box (Part C5) */}
                  {rec.results_guidance && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#17213F]">
                          Official Results &amp; Verification Guidance
                        </span>
                        {rec.results_guidance.announcement_date && (
                          <span className="font-mono text-gray-500">
                            Results / Batch Date: {rec.results_guidance.announcement_date}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {rec.results_guidance.how_to_check}
                      </p>
                      {rec.results_guidance.official_next_steps?.length > 0 && (
                        <ul className="list-disc ps-4 space-y-1 text-gray-700">
                          {rec.results_guidance.official_next_steps.map(
                            (st: string, idx: number) => (
                              <li key={idx}>{st}</li>
                            )
                          )}
                        </ul>
                      )}
                      <p className="text-[11px] text-gray-500 italic pt-1">
                        {rec.results_guidance.distinction_disclaimer}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    {rec.official_application_url && (
                      <a
                        href={rec.official_application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#4F46E5] hover:underline"
                      >
                        Official Portal Link ({rec.official_application_url}){" "}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link
                      href={`/schemes/${rec.scheme_slug}`}
                      className="font-bold text-[#17213F] hover:underline inline-flex items-center gap-1"
                    >
                      Open Scheme Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: RECENTLY VISITED SCHEMES (C1) */}
      {activeTab === "recent" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#17213F] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4F46E5]" />
              <span>Recently Visited Schemes ({recentlyVisited.length})</span>
            </h2>
            {recentlyVisited.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllRecentVisits().then(setTrackingState)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Recent History</span>
              </button>
            )}
          </div>

          {recentlyVisited.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-xs text-gray-500">
              No recently visited schemes recorded in this session. Opening any scheme detail
              page automatically logs the visit timestamp here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentlyVisited.map((rec: any) => (
                <div
                  key={rec.scheme_slug}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {rec.official_lifecycle_status}
                      </span>
                      <span className="font-mono text-[11px] text-gray-500">
                        Visited: {rec.last_visited_at?.slice(0, 19)}Z ({rec.visit_count}x)
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#17213F]">
                      {rec.scheme_name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        removeRecentVisit(rec.scheme_slug).then(setTrackingState)
                      }
                      className="text-red-600 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
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
                        className="px-2.5 py-1 rounded bg-indigo-50 text-[#4F46E5] font-bold cursor-pointer"
                      >
                        Mark Applied
                      </button>
                      <Link
                        href={`/schemes/${rec.scheme_slug}`}
                        className="font-bold text-[#17213F] hover:underline inline-flex items-center gap-1"
                      >
                        Open <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: PERSONALIZED NOTIFICATIONS & PREFERENCES (C4) */}
      {activeTab === "notifications" && trackingState && (
        <section className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-2xs text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-sm text-[#17213F]">
                Notification Channel &amp; Event Preferences
              </span>
              <span className="font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded text-slate-700">
                Duplicate Events Blocked: {trackingState.duplicates_suppressed}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
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

              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
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

              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
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

              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
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
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-xs text-gray-500">
              No personalized alerts at this time. Verified alerts are created automatically for
              schemes you visit or mark as applied.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <div
                  key={n.notification_id}
                  className={`bg-white rounded-2xl border p-5 space-y-2 text-xs shadow-2xs transition ${
                    n.read ? "border-gray-200 opacity-80" : "border-indigo-300 ring-1 ring-indigo-100"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-[#4F46E5]">
                        {n.event_type.replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-[#17213F]">{n.scheme_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <span className="font-mono text-[11px]">{n.created_at.slice(0, 10)}</span>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() =>
                            markNotificationRead(n.notification_id).then(setTrackingState)
                          }
                          className="text-[#4F46E5] hover:underline font-semibold cursor-pointer"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="font-semibold text-gray-900">{n.title}</div>
                  <p className="text-gray-700 leading-relaxed">{n.message}</p>

                  {n.source_url && (
                    <div className="pt-1">
                      <a
                        href={n.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#4F46E5] hover:underline"
                      >
                        Official Source Document <ExternalLink className="w-3 h-3" />
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
