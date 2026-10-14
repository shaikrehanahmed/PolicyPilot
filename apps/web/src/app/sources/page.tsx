"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ExternalLink,
  Building2,
  Calendar,
  Hash,
} from "lucide-react";
import { fetchSources, fetchSourcesStatus } from "@/lib/api";
import { Source } from "@/lib/types";
import { BackButton } from "@/components/back-button";
import { useLanguage } from "@/lib/i18n-context";

interface SourcesStatusData {
  total_sources: number;
  verified_sources: number;
  tier_1_sources: number;
  unverified_examples: number;
  demo_mode: boolean;
  retrieval_mode: string;
}

export default function SourcesPage() {
  const { t, isRtl } = useLanguage();
  const [sources, setSources] = useState<Source[]>([]);
  const [status, setStatus] = useState<SourcesStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSources() {
      setLoading(true);
      try {
        const [srcs, stat] = await Promise.all([fetchSources(), fetchSourcesStatus()]);
        setSources(srcs);
        setStatus(stat);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSources();
  }, []);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <BackButton fallbackHref="/" />
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t("sources.badge")}
        </div>
        <h1 className="text-3xl font-extrabold text-[#17213F] tracking-tight">
          {t("sources.title")}
        </h1>
        <p className="text-sm text-[#667085] max-w-3xl">
          {t("sources.subtitle")}
        </p>
      </div>

      {/* Source Status KPI Cards */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium block">{t("sources.total")}</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">
              {status.total_sources}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium block">{t("sources.verified")}</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {status.verified_sources}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium block">{t("sources.tier1")}</span>
            <span className="text-2xl font-bold text-indigo-600 mt-1 block">
              {status.tier_1_sources}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium block">{t("sources.retrieval")}</span>
            <span className="text-xs font-mono font-bold text-amber-600 mt-2 block capitalize">
              {status.retrieval_mode.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      {/* Sources List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-base text-[#17213F]">Ingested Gazette Publications</h2>
          <span className="text-xs text-gray-500 font-medium">
            Trust Tier 1 = Primary Central Gazette
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sources.map((source) => (
              <div key={source.id} className="p-6 hover:bg-gray-50/70 transition-colors space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                        Tier {source.source_tier}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {source.verification_status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 capitalize">
                        {source.doc_type}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-gray-900 leading-snug">
                      {source.title}
                    </h3>

                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      Publisher: {source.publisher}
                    </p>
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
                  >
                    View Official URL <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-gray-500 pt-1">
                  {source.last_verified_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      Verified: {new Date(source.last_verified_at).toLocaleDateString()}
                    </span>
                  )}
                  {source.content_hash && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-gray-400">
                      <Hash className="w-3 h-3" />
                      Hash: {source.content_hash.slice(0, 24)}...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
