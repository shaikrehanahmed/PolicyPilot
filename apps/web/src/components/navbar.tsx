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
  Globe,
  Mic,
  Bell,
  Check,
} from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useI18n } from "@/lib/i18n-context";
import { VoiceAccessibilityBar } from "./voice-accessibility-bar";

export function Navbar() {
  const pathname = usePathname();
  const { loadDemoProfile, profile } = useProfile();
  const { language, setLanguage, t, supportedLanguages } = useI18n();

  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);

  const demoRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (demoRef.current && !demoRef.current.contains(event.target as Node)) {
        setShowDemoMenu(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/schemes", label: t("nav.schemes"), icon: Compass },
    { href: "/rescue", label: t("nav.rescue"), icon: ShieldCheck },
    { href: "/updates", label: t("nav.updates"), icon: Bell },
    { href: "/profile", label: t("nav.profile"), icon: User },
    { href: "/sources", label: t("nav.sources"), icon: FileText },
  ];

  const currentLangObj = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  return (
    <header dir={language === "ur" ? "rtl" : "ltr"} className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Primary Navigation */}
        <div className="flex items-center gap-4 lg:gap-7">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-lg shadow-xs group-hover:bg-[#4338CA] transition-colors">
              P
            </div>
            <div>
              <span className="font-bold text-lg text-[#17213F] tracking-tight block leading-tight">
                PolicyPilot
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#667085] block font-medium">
                {t("nav.tagline")}
              </span>
            </div>
          </Link>

          {/* Desktop Primary Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-[#4F46E5]/10 text-[#4F46E5]"
                      : "text-[#667085] hover:text-[#17213F] hover:bg-gray-100/70"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Utility Cluster & Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Voice Accessibility Trigger Button */}
          <button
            onClick={() => setShowVoiceDrawer(!showVoiceDrawer)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] border border-indigo-200 transition-all cursor-pointer shadow-2xs"
            title="Open Voice Accessibility Assistant (English, తెలుగు, हिन्दी, اردو)"
            aria-label="Voice Accessibility Assistant"
          >
            <Mic className="w-4 h-4 text-[#4F46E5]" />
            <span className="hidden md:inline">{t("voice_btn_speak") || t("nav.voiceAssistant")}</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-[#17213F] rounded-lg transition-colors border border-gray-200 cursor-pointer"
              aria-label="Language Selector"
            >
              <Globe className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>{currentLangObj.nativeName}</span>
              <ChevronDown
                className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                  showLangMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                  {t("nav.selectLanguage")}
                </div>
                {supportedLanguages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-center justify-between cursor-pointer ${
                      language === l.code ? "bg-indigo-50/70 font-bold text-[#4F46E5]" : "text-gray-800"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{l.nativeName}</span>
                      <span className="text-[10px] text-gray-400">{l.label}</span>
                    </div>
                    {language === l.code && <Check className="w-4 h-4 text-[#4F46E5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preset Profile Dropdown */}
          <div className="relative" ref={demoRef}>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200/80 text-[#17213F] rounded-lg transition-colors border border-gray-200 cursor-pointer"
            >
              <span className="hidden lg:inline text-gray-500">{t("nav.demoProfile")}:</span>
              <span className="font-bold text-[#4F46E5] capitalize">
                {profile.occupation || "Telangana Farmer"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                  showDemoMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                  Evaluator Presets
                </div>
                <button
                  onClick={() => {
                    loadDemoProfile("farmer");
                    setShowDemoMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">🌾 Telangana Farmer (TS)</span>
                  <span className="text-gray-500 text-[11px]">Landholder • PM-KISAN & Rythu Bharosa</span>
                </button>
                <button
                  onClick={() => {
                    loadDemoProfile("student");
                    setShowDemoMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">🎓 SC Student (DL)</span>
                  <span className="text-gray-500 text-[11px]">College undergrad • Post-Matric Scholarship</span>
                </button>
                <button
                  onClick={() => {
                    loadDemoProfile("vulnerable_family");
                    setShowDemoMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">🏠 Rural EWS Family (UP)</span>
                  <span className="text-gray-500 text-[11px]">Low income • PM-JAY & PMAY-G</span>
                </button>
              </div>
            )}
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-2xs transition-colors"
          >
            {t("nav.checkEligibility")}
          </Link>
        </div>

        {/* Mobile Action Cluster */}
        <div className="flex lg:hidden items-center gap-1.5">
          <button
            onClick={() => setShowVoiceDrawer(!showVoiceDrawer)}
            className="p-2 rounded-lg bg-indigo-50 text-[#4F46E5] border border-indigo-200"
            aria-label="Open voice assistant"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {/* Language Selector Chips in Mobile */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              {t("nav.selectLanguage")}
            </span>
            <div className="flex flex-wrap gap-2">
              {supportedLanguages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    language === l.code
                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                      : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
          </div>

          <nav className="space-y-1 pt-2 border-t border-gray-100">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
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
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
              Demo Presets
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => {
                  loadDemoProfile("farmer");
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-xs rounded-md bg-gray-50 hover:bg-indigo-50 font-medium text-gray-800"
              >
                🌾 Telangana Farmer (TS)
              </button>
              <button
                onClick={() => {
                  loadDemoProfile("student");
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-xs rounded-md bg-gray-50 hover:bg-indigo-50 font-medium text-gray-800"
              >
                🎓 SC Student (DL)
              </button>
              <button
                onClick={() => {
                  loadDemoProfile("vulnerable_family");
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-xs rounded-md bg-gray-50 hover:bg-indigo-50 font-medium text-gray-800"
              >
                🏠 Rural EWS Family (UP)
              </button>
            </div>

            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#4F46E5] text-white font-semibold text-xs transition-colors"
            >
              {t("nav.checkEligibility")}
            </Link>
          </div>
        </div>
      )}

      {/* Expandable Global Voice & Chat Assistant Drawer */}
      {showVoiceDrawer && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 border-t border-gray-100 bg-slate-50/90">
          <VoiceAccessibilityBar
            compact
            onCloseDrawer={() => setShowVoiceDrawer(false)}
          />
        </div>
      )}
    </header>
  );
}
