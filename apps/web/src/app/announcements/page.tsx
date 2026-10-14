"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import {
  checkAnnouncementUpdates,
  fetchAnnouncements,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n-context";
import { BackButton } from "@/components/back-button";
import { VoiceAccessibilityBar } from "@/components/voice-accessibility-bar";
import { AnnouncementItem, SourceChangeCheckResult } from "@/lib/types";

export default function AnnouncementsPage() {
  const { lang, isRtl, t } = useLanguage();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [auditResult, setAuditResult] = useState<SourceChangeCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchAnnouncements(lang, false)
      .then((data) => {
        if (!ignore) setItems(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [lang]);

  const handleRunSourceCheck = async () => {
    setChecking(true);
    try {
      const res = await checkAnnouncementUpdates(lang);
      setAuditResult(res);
      setItems(res.announcements);
    } finally {
      setChecking(false);
    }
  };

  const verifiedItems = items.filter((i) => i.verification_status === "VERIFIED");
  const reviewItems = items.filter((i) => i.verification_status !== "VERIFIED");

  const speechSummary = verifiedItems
    .map((i) => `${i.official_scheme_name}. ${i.title}. ${i.summary}`)
    .join(" ");

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <BackButton fallbackHref="/" />
      </div>

      {/* Header & Source Monitoring Disclosure */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-2xs space-y-4">
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
          {t("announcements_title")}
        </h1>
        <p className="text-sm text-[#667085] max-w-3xl leading-relaxed">
          {t("announcements_subtitle")}
        </p>

        <VoiceAccessibilityBar textToReadAloud={speechSummary} compact />

        {auditResult && (
          <div
            dir="ltr"
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-[#17213F]">
                <Server className="w-4 h-4 text-[#4F46E5]" />
                <span>
                  Mode: {auditResult.monitoring_mode} (Scheduler Active:{" "}
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
      </div>

      {!loading && (
        <>
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
                    <div dir="ltr" className="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                      {ann.published_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ann.published_date}
                        </span>
                      )}
                      <span>Verified: {ann.last_verified_at.slice(0, 10)}</span>
                      <span>SHA256: {ann.content_hash}</span>
                    </div>
                  </div>

                  <div>
                    <div dir="ltr" className="text-xs font-bold uppercase tracking-wider text-[#667085]">
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
                      <Link
                        href={`/schemes/${ann.scheme_slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-[#4F46E5] text-xs font-semibold hover:bg-indigo-100"
                      >
                        {t("nav_check_eligibility")} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
                      {item.verification_status}
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
        </>
      )}
    </div>
  );
}
