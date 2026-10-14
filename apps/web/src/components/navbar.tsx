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
  Scale,
  MoreHorizontal,
} from "lucide-react";
import { LanguageCode } from "@/lib/types";
import { useProfile } from "@/lib/profile-context";
import { LANGUAGE_OPTIONS, useLanguage } from "@/lib/i18n-context";
import { VoiceAccessibilityBar } from "./voice-accessibility-bar";

export function Navbar() {
  const pathname = usePathname();
  const { loadDemoProfile, profile } = useProfile();
  const { lang, setLang, isRtl, t } = useLanguage();

  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target as Node)
      ) {
        setShowToolsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/schemes", label: t("nav_schemes"), icon: Compass },
    { href: "/updates", label: t("nav_updates"), icon: Bell },
    { href: "/rescue", label: t("nav_rescue"), icon: ShieldCheck },
    { href: "/pricing", label: t("nav_pricing"), icon: CreditCard },
    { href: "/profile", label: t("nav_profile"), icon: User },
    { href: "/sources", label: t("nav_sources"), icon: FileText },
  ];

  return (
    <header
      dir={isRtl ? "rtl" : "ltr"}
      className="sticky top-0 z-50 bg-[#F7F4EC]/95 backdrop-blur-md border-b border-[#D8D1C2]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Brand Monogram & Editorial Lockup */}
        <div className="flex items-center gap-4 lg:gap-7 min-w-0">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-lg bg-[#163026] border border-[#C5A572]/50 flex items-center justify-center text-[#F7F4EC] shadow-sm group-hover:bg-[#1F4235] transition-colors">
              <Scale className="w-5 h-5 text-[#C5A572]" />
            </div>
            <div className="truncate">
              <span className="font-editorial font-semibold text-xl text-[#141815] tracking-tight block leading-none">
                PolicyPilot
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#6B726C] block font-semibold mt-1 truncate">
                {t("brand_tagline")}
              </span>
            </div>
          </Link>

          {/* Desktop Primary Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#163026] text-[#F7F4EC] shadow-xs"
                      : "text-[#4A524C] hover:text-[#141815] hover:bg-[#EFECE2]"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? "text-[#C5A572]" : "text-[#6B726C]"
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Secondary Controls: Innovative 3-Dots Citizen Hub */}
        <div className="hidden xl:flex items-center gap-2.5 shrink-0 relative" ref={toolsMenuRef}>
          <button
            type="button"
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            aria-expanded={showToolsMenu}
            aria-label="Citizen Tools and Settings Menu"
            title="Language, Voice Assistant, Persona & Quick Actions"
            className={`btn-parchment flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
              showToolsMenu ? "border-[#163026] bg-[#EFECE2]" : ""
            }`}
          >
            <span className="font-bold text-[#163026] uppercase text-[11px] tracking-wider">
              {lang.toUpperCase()}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#C5A572]" />
            <span className="text-[#4A524C] capitalize truncate max-w-[85px]">
              {profile.occupation || "Citizen"}
            </span>
            <MoreHorizontal className="w-4 h-4 text-[#163026] ms-0.5" />
          </button>

          {showToolsMenu && (
            <div className="absolute end-0 top-full mt-2 w-72 folio-card rounded-2xl p-4 shadow-2xl z-50 space-y-3.5 border border-[#D8D1C2]">
              {/* Primary Action: Check Eligibility */}
              <div>
                <Link
                  href="/profile"
                  onClick={() => setShowToolsMenu(false)}
                  className="btn-forest w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C5A572]" />
                  <span>{t("nav_check_eligibility")}</span>
                </Link>
              </div>

              {/* Voice & Chat Assistant Toggle */}
              <div className="pt-2 border-t border-[#D8D1C2]">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoiceDrawer(!showVoiceDrawer);
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#EFECE2] text-xs font-semibold text-[#141815] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#E6ECE7] border border-[#CFDBD1] flex items-center justify-center text-[#163026]">
                      <Mic className="w-3.5 h-3.5 text-[#8C6D3B]" />
                    </div>
                    <div className="text-start">
                      <div className="font-bold">{t("voice_btn_speak")}</div>
                      <div className="text-[10px] text-[#6B726C]">Multilingual Assistant</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#8C6D3B] bg-[#F2EADB] px-2 py-0.5 rounded">
                    {showVoiceDrawer ? "Active" : "Open"}
                  </span>
                </button>
              </div>

              {/* Language Switcher */}
              <div className="pt-2 border-t border-[#D8D1C2] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#6B726C] px-1">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-[#163026]" />
                    Language / భాష / भाषा
                  </span>
                  <span className="font-mono text-[#163026]">{lang.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        setLang(opt.code);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        lang === opt.code
                          ? "bg-[#163026] text-[#F7F4EC]"
                          : "bg-[#FCFBF7] hover:bg-[#EFECE2] text-[#141815] border border-[#D8D1C2]"
                      }`}
                    >
                      <span>{opt.nativeLabel}</span>
                      <span className="text-[10px] font-mono opacity-80">{opt.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo Persona Preset */}
              <div className="pt-2 border-t border-[#D8D1C2] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#6B726C] px-1">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-[#163026]" />
                    {t("persona_label")}
                  </span>
                  <span className="text-[10px] font-bold text-[#163026] capitalize">
                    {profile.occupation || "Farmer"}
                  </span>
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      loadDemoProfile("farmer");
                      setShowToolsMenu(false);
                    }}
                    className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                      profile.occupation === "farmer"
                        ? "bg-[#E6ECE7] text-[#163026] font-bold border border-[#CFDBD1]"
                        : "hover:bg-[#EFECE2] text-[#4A524C]"
                    }`}
                  >
                    <span>🌾 Telangana Farmer (TS)</span>
                    <span className="text-[10px] text-[#6B726C]">PM-KISAN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loadDemoProfile("student");
                      setShowToolsMenu(false);
                    }}
                    className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                      profile.occupation === "student"
                        ? "bg-[#E6ECE7] text-[#163026] font-bold border border-[#CFDBD1]"
                        : "hover:bg-[#EFECE2] text-[#4A524C]"
                    }`}
                  >
                    <span>🎓 SC Student (DL)</span>
                    <span className="text-[10px] text-[#6B726C]">NSP Scholarship</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loadDemoProfile("vulnerable_family");
                      setShowToolsMenu(false);
                    }}
                    className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                      profile.occupation === "vulnerable_family"
                        ? "bg-[#E6ECE7] text-[#163026] font-bold border border-[#CFDBD1]"
                        : "hover:bg-[#EFECE2] text-[#4A524C]"
                    }`}
                  >
                    <span>🏠 Rural Household (UP)</span>
                    <span className="text-[10px] text-[#6B726C]">AB-PMJAY</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-parchment p-2.5 rounded-lg text-[#141815]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Voice & Chat Counsel Drawer */}
      {showVoiceDrawer && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 border-t border-[#D8D1C2] bg-[#EFECE2]/90">
          <VoiceAccessibilityBar
            compact
            onCloseDrawer={() => setShowVoiceDrawer(false)}
          />
        </div>
      )}

      {/* Intentional Mobile Navigation Drawer (320px–1024px) */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#D8D1C2] bg-[#FCFBF7] px-4 pt-4 pb-8 space-y-5 shadow-xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between embossed-well px-3.5 py-2.5 rounded-xl">
            <span className="text-xs font-bold text-[#141815] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#163026]" />
              <span>Language / భాష / भाषा</span>
            </span>
            <select
              aria-label="Select Language Mobile"
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              className="bg-[#FCFBF7] border border-[#D8D1C2] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#141815]"
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

          <nav className="grid grid-cols-1 gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[#163026] text-[#F7F4EC]"
                      : "text-[#141815] hover:bg-[#EFECE2]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[#C5A572]" : "text-[#6B726C]"
                    }`}
                  />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#D8D1C2] space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B726C] px-1">
              {t("persona_label")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  loadDemoProfile("farmer");
                  setMobileMenuOpen(false);
                }}
                className="btn-parchment text-start px-3.5 py-2.5 text-xs rounded-xl font-semibold"
              >
                Telangana Farmer (TS)
              </button>
              <button
                type="button"
                onClick={() => {
                  loadDemoProfile("student");
                  setMobileMenuOpen(false);
                }}
                className="btn-parchment text-start px-3.5 py-2.5 text-xs rounded-xl font-semibold"
              >
                SC Student (DL)
              </button>
              <button
                type="button"
                onClick={() => {
                  loadDemoProfile("vulnerable_family");
                  setMobileMenuOpen(false);
                }}
                className="btn-parchment text-start px-3.5 py-2.5 text-xs rounded-xl font-semibold"
              >
                Rural Household (UP)
              </button>
            </div>

            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-forest w-full flex items-center justify-center py-3 px-4 rounded-xl font-semibold text-xs"
            >
              {t("nav_check_eligibility")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
