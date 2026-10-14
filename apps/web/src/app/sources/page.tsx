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
        <div className="inline-flex items-center gap-2 brass-badge px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8C6D3B]" />
          <span>{t("sources.badge")}</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#141815] tracking-tight">
          {t("sources.title")}
        </h1>
        <p className="text-xs sm:text-sm text-[#4A524C] max-w-3xl leading-relaxed">
          {t("sources.subtitle")}
        </p>
      </div>

      {/* Source Status KPI Cards */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="folio-card rounded-2xl p-5">
            <span className="text-xs text-[#6B726C] font-bold uppercase tracking-wider block">{t("sources.total")}</span>
            <span className="text-2xl sm:text-3xl font-editorial font-semibold text-[#141815] mt-1.5 block ltr-inline">
              {status.total_sources}
            </span>
          </div>
          <div className="folio-card rounded-2xl p-5">
            <span className="text-xs text-[#6B726C] font-bold uppercase tracking-wider block">{t("sources.verified")}</span>
            <span className="text-2xl sm:text-3xl font-editorial font-semibold text-[#163026] mt-1.5 block ltr-inline">
              {status.verified_sources}
            </span>
          </div>
          <div className="folio-card rounded-2xl p-5">
            <span className="text-xs text-[#6B726C] font-bold uppercase tracking-wider block">{t("sources.tier1")}</span>
            <span className="text-2xl sm:text-3xl font-editorial font-semibold text-[#8C6D3B] mt-1.5 block ltr-inline">
              {status.tier_1_sources}
            </span>
          </div>
          <div className="folio-card rounded-2xl p-5">
            <span className="text-xs text-[#6B726C] font-bold uppercase tracking-wider block">{t("sources.retrieval")}</span>
            <span className="text-xs font-mono font-bold text-[#694F25] mt-2.5 block capitalize bg-[#F2EADB] border border-[#D4C098] px-2.5 py-1 rounded-md inline-block">
              {status.retrieval_mode.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      {/* Sources List */}
      <div className="folio-card rounded-3xl overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-[#D8D1C2] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial text-lg font-semibold text-[#141815]">Ingested Gazette Publications</h2>
            <p className="text-xs text-[#6B726C] mt-0.5">Trust Tier 1 = Primary Central Gazette and State Acts</p>
          </div>
          <span className="text-xs font-mono bg-[#E6ECE7] px-3 py-1 rounded-lg text-[#163026] font-bold border border-[#CFDBD1]">
            SHA-256 Verified
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#EFECE2] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#D8D1C2]">
            {sources.map((source) => (
              <div key={source.id} className="p-6 hover:bg-[#EFECE2]/50 transition-colors space-y-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="brass-badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        Tier {source.source_tier}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#E6ECE7] text-[#163026] border border-[#CFDBD1]">
                        {source.verification_status}
                      </span>
                      <span className="embossed-well px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-[#6B726C] capitalize">
                        {source.doc_type}
                      </span>
                    </div>

                    <h3 className="font-editorial font-semibold text-base text-[#141815] leading-snug">
                      {source.title}
                    </h3>

                    <p className="text-xs text-[#6B726C] flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-[#8C6D3B]" />
                      <span>Publisher: {source.publisher}</span>
                    </p>
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-parchment inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    View Official URL <ExternalLink className="w-3.5 h-3.5 text-[#163026]" />
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-[#6B726C] pt-1 font-mono">
                  {source.last_verified_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8C6D3B]" />
                      Verified: <span className="ltr-inline">{new Date(source.last_verified_at).toLocaleDateString()}</span>
                    </span>
                  )}
                  {source.content_hash && (
                    <span className="flex items-center gap-1.5 text-[#6B726C]">
                      <Hash className="w-3.5 h-3.5" />
                      Hash: <span className="ltr-inline">{source.content_hash.slice(0, 24)}...</span>
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
