"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Compass,
  FileText,
  ShieldCheck,
  User,
  ChevronDown,
  Menu,
  X,
  Bell,
  Globe,
  Mic,
  CreditCard,
} from "lucide-react";
import { LanguageCode } from "@/lib/types";
import { useProfile } from "@/lib/profile-context";
import { LANGUAGE_OPTIONS, useLanguage } from "@/lib/i18n-context";
import { VoiceAccessibilityBar } from "./voice-accessibility-bar";

export function Navbar() {
  const pathname = usePathname();
  const { loadDemoProfile, profile } = useProfile();
  const { lang, setLang, t } = useLanguage();

  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (demoRef.current && !demoRef.current.contains(event.target as Node)) {
        setShowDemoMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/schemes", label: t("nav_schemes"), icon: Compass },
    { href: "/updates", label: t("nav_announcements"), icon: Bell },
    { href: "/rescue", label: t("nav_rescue"), icon: ShieldCheck },
    { href: "/pricing", label: "Plans & Pricing", icon: CreditCard },
    { href: "/profile", label: t("nav_profile"), icon: User },
    { href: "/sources", label: t("nav_sources"), icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand & Primary Navigation (Visible Demo Mode badge removed per Requirement H4) */}
        <div className="flex items-center gap-3 lg:gap-5 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-lg shadow-xs group-hover:bg-[#4338CA] transition-colors">
              P
            </div>
            <div className="truncate">
              <span className="font-bold text-lg text-[#17213F] tracking-tight block leading-tight">
                PolicyPilot
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#667085] block font-medium truncate">
                {t("brand_tagline")}
              </span>
            </div>
          </Link>

          {/* Desktop Primary Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#4F46E5]/10 text-[#4F46E5]"
                      : "text-[#667085] hover:text-[#17213F] hover:bg-gray-100/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Utility Cluster */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Global Language Selector */}
          <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-[#4F46E5]" />
            <select
              aria-label="Select Language"
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              className="bg-transparent text-xs font-bold text-[#17213F] focus:outline-none cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.nativeLabel} ({opt.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Voice Assistant Button */}
          <button
            type="button"
            onClick={() => setShowVoiceDrawer(!showVoiceDrawer)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              showVoiceDrawer
                ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                : "bg-white text-[#17213F] border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{t("voice_btn_speak")}</span>
          </button>

          {/* Profile Preset Selector */}
          <div className="relative" ref={demoRef}>
            <button
              type="button"
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200/80 text-[#17213F] rounded-md transition-colors border border-gray-200 cursor-pointer"
            >
              <span className="font-bold text-[#4F46E5] capitalize">
                {profile.occupation || "Farmer"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {showDemoMenu && (
              <div className="absolute end-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    loadDemoProfile("farmer");
                    setShowDemoMenu(false);
                  }}
                  className="w-full text-start px-3 py-2 hover:bg-indigo-50 flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">Telangana Farmer (TS)</span>
                  <span className="text-gray-500 text-[11px]">PM-KISAN & Rythu Bharosa</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadDemoProfile("student");
                    setShowDemoMenu(false);
                  }}
                  className="w-full text-start px-3 py-2 hover:bg-indigo-50 flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">SC Student (DL)</span>
                  <span className="text-gray-500 text-[11px]">Post-Matric Scholarship</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadDemoProfile("vulnerable_family");
                    setShowDemoMenu(false);
                  }}
                  className="w-full text-start px-3 py-2 hover:bg-indigo-50 flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">Rural EWS Family (UP)</span>
                  <span className="text-gray-500 text-[11px]">PM-JAY & PMAY-G</span>
                </button>
              </div>
            )}
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-md text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors whitespace-nowrap"
          >
            Run Policy Analysis
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Expandable Global Voice Assistant Drawer */}
      {showVoiceDrawer && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 border-t border-gray-100 bg-slate-50/90">
          <VoiceAccessibilityBar
            compact
            onCloseDrawer={() => setShowVoiceDrawer(false)}
          />
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#4F46E5]" />
              Language / భాష / भाषा
            </span>
            <select
              aria-label="Select Language Mobile"
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold text-[#17213F]"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.nativeLabel} ({opt.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <VoiceAccessibilityBar
            compact
            onCloseDrawer={() => setMobileMenuOpen(false)}
          />

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#4F46E5]/10 text-[#4F46E5]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#4F46E5] text-white font-semibold text-xs transition-colors"
          >
            Run Policy Analysis
          </Link>
        </div>
      )}
    </header>
  );
}
