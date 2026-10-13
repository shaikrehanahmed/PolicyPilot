import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#E5E7EB] mt-16 text-sm text-[#667085]">
      {/* Top Disclaimer Section */}
      <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#4F46E5] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[#475467]">
            <strong className="text-[#17213F] font-semibold">
              Official Evidence & Non-Fabrication Commitment:
            </strong>{" "}
            PolicyPilot strictly anchors all eligibility criteria and benefit information to official government publications,
            Gazette notifications, and verified department guidelines. The system never generates synthetic criteria, fabricated
            deadlines, or imaginary benefit amounts. All eligibility determinations are calculated by a deterministic rule engine
            independent of LLM output. Final benefit approvals rest solely with the competent government authority.
          </div>
        </div>
      </div>

      {/* Main Footer Links & Team Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#4F46E5] flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="font-bold text-base text-[#17213F]">PolicyPilot</span>
          </div>
          <p className="text-xs max-w-md leading-relaxed text-[#667085]">
            Bridging the last-mile gap between complex welfare policies and citizens through deterministic rules, verified evidence retrieval, and personalized action roadmaps.
          </p>
          <div className="pt-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Team Axiom | HACK-X 2026</span>
            <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-gray-600">
              <span>Mariya Fatima (Team Lead)</span>
              <span>•</span>
              <span>Nameera Sadaf</span>
              <span>•</span>
              <span>Shaik Rehan Ahmed</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-xs text-[#17213F] uppercase tracking-wider mb-3">
            Core Modules
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/schemes" className="hover:text-[#4F46E5] transition-colors">
                Scheme Discovery
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-[#4F46E5] transition-colors">
                Citizen Demographic Profile
              </Link>
            </li>
            <li>
              <Link href="/sources" className="hover:text-[#4F46E5] transition-colors">
                Official Sources & Evidence
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-xs text-[#17213F] uppercase tracking-wider mb-3">
            Official Portals
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://pmkisan.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#4F46E5] flex items-center gap-1 transition-colors"
              >
                PM-KISAN Portal <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </li>
            <li>
              <a
                href="https://nha.gov.in/PM-JAY"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#4F46E5] flex items-center gap-1 transition-colors"
              >
                Ayushman Bharat PM-JAY <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </li>
            <li>
              <a
                href="https://pmayg.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#4F46E5] flex items-center gap-1 transition-colors"
              >
                PMAY-Gramin Portal <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </li>
            <li>
              <a
                href="https://scholarships.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#4F46E5] flex items-center gap-1 transition-colors"
              >
                National Scholarship Portal <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </li>
            <li>
              <a
                href="https://rythubharosa.telangana.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#4F46E5] flex items-center gap-1 transition-colors"
              >
                Telangana Rythu Bharosa <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB] py-4 text-center text-xs text-[#98A2B3]">
        © 2026 PolicyPilot • Built for HACK-X 2026 by Team Axiom • Evidence-Grounded Policy Navigation
      </div>
    </footer>
  );
}
