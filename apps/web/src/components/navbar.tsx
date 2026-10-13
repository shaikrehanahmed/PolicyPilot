"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Compass,
  FileText,
  ShieldCheck,
  User,
  Sparkles,
  Database,
  ChevronDown,
  Menu,
  X,
  Server,
  Layers,
} from "lucide-react";
import { fetchHealth } from "@/lib/api";
import { SystemHealth } from "@/lib/types";
import { useProfile } from "@/lib/profile-context";

export function Navbar() {
  const pathname = usePathname();
  const { loadDemoProfile, profile } = useProfile();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => {
        // Fallback indicator when api server is booting
        setHealth({
          status: "healthy",
          version: "0.1.0",
          environment: "local",
          demo_mode: true,
          database: "disconnected",
          pgvector: "unavailable",
          llm_status: "deterministic_fallback",
          llm_model: "gemini-3.8-flash",
          embedding_model: "gemini-embedding-2",
          embedding_dim: 768,
          retrieval_mode: "lexical",
        });
      });
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusPanel(false);
      }
      if (demoRef.current && !demoRef.current.contains(event.target as Node)) {
        setShowDemoMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/schemes", label: "Schemes Discovery", icon: Compass },
    { href: "/rescue", label: "Rescue Mode", icon: ShieldCheck },
    { href: "/profile", label: "Citizen Profile", icon: User },
    { href: "/sources", label: "Official Sources", icon: FileText },
  ];

  const isDbConnected = health?.database === "connected";
  const isLlmConnected = health?.llm_status === "connected";
  const isVectorRetrieval = health?.retrieval_mode === "hybrid_vector";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Primary Navigation */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-lg shadow-xs group-hover:bg-[#4338CA] transition-colors">
              P
            </div>
            <div>
              <span className="font-bold text-lg text-[#17213F] tracking-tight block leading-tight">
                PolicyPilot
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#667085] block font-medium">
                Evidence-Grounded Policy Nav
              </span>
            </div>
          </Link>

          {/* Neutral Demo Status Badge & System Status Disclosure */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => setShowStatusPanel(!showStatusPanel)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
              title="Click to view System Status"
              aria-expanded={showStatusPanel}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-700">Prototype · Demo data</span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                  showStatusPanel ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Compact System Status Disclosure Panel */}
            {showStatusPanel && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-[#4F46E5]" />
                    <span className="font-bold text-gray-900 text-xs">System Status</span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                    v{health?.version || "0.1.0"}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Rules Engine */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-gray-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Rules Engine</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Deterministic Python evaluator (Zero LLM reliance)
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[10px] shrink-0">
                      Deterministic
                    </span>
                  </div>

                  {/* AI Provider */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-gray-700">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>AI Provider</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {isLlmConnected
                          ? "Connected to Google Gemini provider"
                          : "Deterministic gazette synthesis (safe fallback)"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[10px] shrink-0 ${
                        isLlmConnected
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {isLlmConnected ? "Gemini connected" : "Deterministic fallback"}
                    </span>
                  </div>

                  {/* Evidence Retrieval */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-gray-700">
                        <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Retrieval</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {isVectorRetrieval
                          ? "Semantic vector search with pgvector"
                          : "Exact multi-field gazette clause matching"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[10px] shrink-0 ${
                        isVectorRetrieval
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {isVectorRetrieval ? "Hybrid vector" : "Lexical retrieval"}
                    </span>
                  </div>

                  {/* Database Engine */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-gray-700">
                        <Database className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Database</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {isDbConnected
                          ? "PostgreSQL with pgvector"
                          : "In-memory seed repository for local demo"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[10px] shrink-0 ${
                        isDbConnected
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isDbConnected ? "PostgreSQL connected" : "Demo repository"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                  All criteria anchored to official ministry notifications.
                </div>
              </div>
            )}
          </div>

          {/* Desktop Primary Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#4F46E5]/10 text-[#4F46E5]"
                      : "text-[#667085] hover:text-[#17213F] hover:bg-gray-100/70"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Utility Cluster & Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Preset Profile Dropdown */}
          <div className="relative" ref={demoRef}>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-gray-100 hover:bg-gray-200/80 text-[#17213F] rounded-md transition-colors border border-gray-200 cursor-pointer"
            >
              <span>Demo Profile:</span>
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
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-md text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-2xs transition-colors"
          >
            Check Eligibility
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
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
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="space-y-1">
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
              Check Eligibility
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
