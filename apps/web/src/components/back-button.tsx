"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n-context";

interface BackButtonProps {
  /** Safe destination when user opens the page directly without browser history */
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-[#17213F] shadow-2xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
    >
      {isRtl ? (
        <ArrowRight className="w-3.5 h-3.5 text-[#4F46E5]" />
      ) : (
        <ArrowLeft className="w-3.5 h-3.5 text-[#4F46E5]" />
      )}
      <span>{labelOverride || t("btn_back")}</span>
    </button>
  );
}
