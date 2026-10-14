"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n-context";

interface BackButtonProps {
  fallbackHref?: string;
  labelOverride?: string;
  onBeforeNavigate?: () => void;
}

export function BackButton({
  fallbackHref = "/",
  labelOverride,
  onBeforeNavigate,
}: BackButtonProps) {
  const router = useRouter();
  const { t, isRtl } = useLanguage();

  const handleBack = () => {
    if (onBeforeNavigate) {
      onBeforeNavigate();
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={labelOverride || t("btn_back")}
      className="btn-parchment inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#163026]"
    >
      {isRtl ? (
        <ArrowRight className="w-3.5 h-3.5 text-[#163026]" />
      ) : (
        <ArrowLeft className="w-3.5 h-3.5 text-[#163026]" />
      )}
      <span>{labelOverride || t("btn_back")}</span>
    </button>
  );
}
