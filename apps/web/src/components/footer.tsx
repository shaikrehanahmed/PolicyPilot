"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, Server, ShieldCheck } from "lucide-react";
import { fetchHealth } from "@/lib/api";
import { useLanguage } from "@/lib/i18n-context";
import { SystemHealth } from "@/lib/types";

export function Footer() {
  const { isRtl, t } = useLanguage();
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => {});
  }, []);

  return (
    <footer
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-[#0F221A] text-[#E6ECE7] border-t border-[#C5A572]/30 mt-20 no-print"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Colophon */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#163026] border border-[#C5A572]/50 flex items-center justify-center">
                <Scale className="w-4 h-4 text-[#C5A572]" />
              </div>
              <span className="font-editorial text-lg font-semibold text-[#F7F4EC] tracking-tight">
                PolicyPilot
              </span>
            </div>
            <p className="text-[#B8C4BB] leading-relaxed max-w-sm">
              An evidence-grounded public-benefit navigation and institutional compliance
              platform. Every eligibility rule and portal defect remediation step is
              anchored to verifiable Gazette clauses.
            </p>
          </div>

          {/* Directory Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C5A572]">
                Navigation
              </div>
              <ul className="space-y-2 text-[#D5E0D7]">
                <li>
                  <Link href="/schemes" className="hover:text-white transition">
                    {t("nav_schemes")}
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-white transition">
                    {t("nav_profile")}
                  </Link>
                </li>
                <li>
                  <Link href="/rescue" className="hover:text-white transition">
                    {t("nav_rescue")}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C5A572]">
                Dossier &amp; Billing
              </div>
              <ul className="space-y-2 text-[#D5E0D7]">
                <li>
                  <Link href="/updates" className="hover:text-white transition">
                    {t("nav_updates")}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition">
                    {t("nav_pricing")}
                  </Link>
                </li>
                <li>
                  <Link href="/sources" className="hover:text-white transition">
                    {t("nav_sources")}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-2.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C5A572]">
                Statutory Guardrails
              </div>
              <p className="text-[11px] text-[#B8C4BB] leading-relaxed">
                Zero-PII client &amp; server redaction. AI never overrides deterministic
                statutory eligibility criteria.
              </p>
            </div>
          </div>
        </div>

        {/* Honest Infrastructure & Prototype Data Disclosure */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-[#99A89E]">
          <div className="flex flex-wrap items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[#C5A572] shrink-0" />
            <span>
              Architecture Telemetry: Evaluator ={" "}
              <strong className="text-[#F7F4EC]">Deterministic Python</strong> ·
              Retrieval ={" "}
              <strong className="text-[#F7F4EC]">
                {health?.retrieval_mode || "lexical"}
              </strong>{" "}
              · Repository ={" "}
              <strong className="text-[#F7F4EC]">
                {health?.database === "connected"
                  ? "PostgreSQL Connected"
                  : "Verified Seed Repository (Session Store)"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A572] shrink-0" />
            <span>Independent civic-technology service. Not a government agency.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
