"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Lock,
  Scale,
  Users,
  UserPlus,
  UserX,
} from "lucide-react";
import {
  assignOrganizationSeat,
  createCheckoutOrder,
  createOrganizationAccount,
  fetchBillingAccount,
  fetchCurrentPricing,
  fetchOrganizationQuote,
  fetchSandboxTestSignature,
  revokeOrganizationSeat,
  verifyCheckoutPayment,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n-context";
import { BackButton } from "@/components/back-button";

export default function EditorialPricingPage() {
  const { isRtl } = useLanguage();

  const [pricing, setPricing] = useState<any>({
    individual_price_inr: "19.00",
    org_discount_percent: 25,
    free_successful_analyses_limit: 2,
  });
  const [account, setAccount] = useState<any>(null);

  // Exact Dynamic Seat Calculator (100 seats @ ₹19 = ₹1,900 -> 25% off ₹475 -> ₹1,425)
  const [seats, setSeats] = useState<number>(100);
  const [orgQuote, setOrgQuote] = useState<any>({
    seats: 100,
    unit_price_inr: "19.00",
    discount_percent: 25,
    original_total_inr: "1900.00",
    discount_amount_inr: "475.00",
    final_monthly_inr: "1425.00",
    effective_per_seat_inr: "14.25",
  });

  const [orgName, setOrgName] = useState("Global Institute Scholarship Desk");
  const [orgDashboard, setOrgDashboard] = useState<any>(null);
  const [memberEmail, setMemberEmail] = useState("");

  const [checkoutBanner, setCheckoutBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchCurrentPricing(),
      fetchBillingAccount(),
      fetchOrganizationQuote(100),
    ])
      .then(([priceRes, accRes, quoteRes]) => {
        setPricing(priceRes);
        setAccount(accRes);
        setOrgQuote(quoteRes);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const validSeats = Math.max(1, Math.min(100000, seats || 1));
    fetchOrganizationQuote(validSeats)
      .then(setOrgQuote)
      .catch(() => {});
  }, [seats]);

  const handleIndividualCheckout = async () => {
    setLoading(true);
    setError(null);
    setCheckoutBanner(null);
    try {
      const order = await createCheckoutOrder("INDIVIDUAL", 1);
      const sigBundle = await fetchSandboxTestSignature(order.order_id);
      const updatedAccount = await verifyCheckoutPayment(sigBundle);
      setAccount(updatedAccount);
      setCheckoutBanner(
        `HMAC-SHA256 Verified Payment (${sigBundle.razorpay_payment_id}) — Individual Plan active at locked rate ₹${pricing.individual_price_inr}/month.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationCheckout = async () => {
    setLoading(true);
    setError(null);
    setCheckoutBanner(null);
    try {
      let currentOrg = orgDashboard;
      if (!currentOrg) {
        currentOrg = await createOrganizationAccount(orgName, seats);
      }
      const order = await createCheckoutOrder(
        "ORGANIZATION",
        seats,
        currentOrg.org_id
      );
      const sigBundle = await fetchSandboxTestSignature(order.order_id);
      await verifyCheckoutPayment(sigBundle);
      const refreshedOrg = await createOrganizationAccount(orgName, seats);
      setOrgDashboard({
        ...refreshedOrg,
        subscription_status: "ACTIVE",
        purchased_seats: seats,
      });
      setCheckoutBanner(
        `Organization Subscription Activated for ${seats} seats at ₹${orgQuote.final_monthly_inr}/month (25% bulk discount saved ₹${orgQuote.discount_amount_inr}).`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Organization checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgDashboard || !memberEmail.trim()) return;
    setError(null);
    try {
      const updated = await assignOrganizationSeat(
        orgDashboard.org_id,
        memberEmail.trim()
      );
      setOrgDashboard(updated);
      setMemberEmail("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not assign seat.");
    }
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton fallbackHref="/" />

        {account && (
          <div className="brass-badge px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" />
            <span>
              Free Successful Analyses Remaining:{" "}
              <strong>
                {account.free_analyses_remaining} / {account.free_analyses_limit}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Editorial Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#8C6D3B] font-bold">
          Citizen Entitlement &amp; Institutional Licensing
        </span>
        <h1 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#141815] leading-tight">
          Transparent, Sustainable Public-Interest Pricing.
        </h1>
        <p className="text-sm sm:text-base text-[#4A524C] leading-relaxed">
          Every citizen receives{" "}
          <strong className="text-[#141815]">
            2 free successful policy analyses
          </strong>
          . Ordinary scheme browsing and failed or incomplete evaluations never
          consume your allowance. Continue with unlimited analyses for{" "}
          <strong className="text-[#141815]">
            ₹{pricing.individual_price_inr}/month
          </strong>
          , or license seats for your college or NGO with an automatic{" "}
          <strong className="text-[#141815]">25% bulk seat discount</strong>.
        </p>
      </div>

      {checkoutBanner && (
        <div className="sage-panel rounded-2xl p-4 text-xs sm:text-sm font-semibold text-[#163026] flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{checkoutBanner}</span>
        </div>
      )}

      {error && (
        <div className="bg-[#F2EADB] border border-[#D4C098] text-[#694F25] rounded-2xl p-4 text-xs sm:text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Controlled 3D Architectural Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch architectural-stage">
        {/* INDIVIDUAL PLAN (Warm Ivory Folio Card) */}
        <div className="lg:col-span-5 pricing-tilt-left folio-card rounded-3xl p-7 sm:p-9 flex flex-col justify-between space-y-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="brass-badge px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                Individual Citizen Dossier
              </span>
              <span className="text-xs font-mono text-[#6B726C]">
                2 Free Analyses Included
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="font-editorial text-4xl sm:text-5xl font-semibold text-[#141815]">
                ₹{pricing.individual_price_inr}
              </span>
              <span className="text-xs sm:text-sm text-[#6B726C] font-medium">
                / user / month
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#4A524C] leading-relaxed">
              Designed for individual students, smallholder farmers, and households
              seeking unlimited eligibility evaluations, NSP defect recovery, and
              application tracking.
            </p>

            <ul className="space-y-3 text-xs sm:text-sm text-[#141815] pt-2 border-t border-[#D8D1C2]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#163026] shrink-0 mt-0.5" />
                <span>
                  <strong>2 free successful analyses</strong> included for every new
                  account
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#163026] shrink-0 mt-0.5" />
                <span>
                  Failed, cancelled, or incomplete requests are never billed or counted
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#163026] shrink-0 mt-0.5" />
                <span>
                  Full access to Scholarship Defect Rescue &amp; printable office letters
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#163026] shrink-0 mt-0.5" />
                <span>
                  Price-lock protection: existing subscribers are never silently charged
                  higher rates
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#D8D1C2]">
            <div className="text-[11px] text-[#6B726C] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#8C6D3B] shrink-0" />
              <span>
                Server-verified Razorpay HMAC-SHA256 checkout · Cancel anytime
              </span>
            </div>
            <button
              type="button"
              onClick={handleIndividualCheckout}
              disabled={loading}
              className="btn-forest w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
            >
              {account?.individual_subscription_status === "ACTIVE"
                ? `Active Subscription (Locked at ₹${account.locked_subscription_price_inr}/mo)`
                : `Subscribe to Individual Plan — ₹${pricing.individual_price_inr}/month`}
            </button>
          </div>
        </div>

        {/* ORGANIZATION PLAN (Deep Forest Monolith with Brass Accents & Live 25% Calculator) */}
        <div className="lg:col-span-7 pricing-tilt-right forest-panel rounded-3xl p-7 sm:p-9 flex flex-col justify-between space-y-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#C5A572]/20 text-[#C5A572] border border-[#C5A572]/40">
                Institutional &amp; Campus Desk Plan
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6ECE7]/15 text-[#E6ECE7] border border-[#E6ECE7]/30">
                Fixed {orgQuote.discount_percent}% Bulk Seat Discount
              </span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="font-editorial text-4xl sm:text-5xl font-semibold text-[#F7F4EC]">
                  ₹{orgQuote.final_monthly_inr}
                </span>
                <span className="text-xs sm:text-sm text-[#D5E0D7]">
                  / month for {orgQuote.seats} seats
                </span>
              </div>
              <span className="font-mono text-xs text-[#C5A572]">
                Effective: ₹{orgQuote.effective_per_seat_inr} / seat / mo
              </span>
            </div>

            {/* Tactile Inset Seat Calculator */}
            <div className="rounded-2xl bg-[#0F221A]/85 border border-[#C5A572]/30 p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor="org-seat-input"
                  className="font-bold text-[#F7F4EC] flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-[#C5A572]" />
                  <span>Configure Institutional Seat Quantity:</span>
                </label>
                <input
                  id="org-seat-input"
                  type="number"
                  min={1}
                  max={100000}
                  value={seats}
                  onChange={(e) =>
                    setSeats(Math.max(1, parseInt(e.target.value || "1", 10)))
                  }
                  className="w-28 rounded-lg bg-[#163026] border border-[#C5A572]/50 px-3 py-1.5 text-sm font-mono font-bold text-[#F7F4EC] text-center"
                />
              </div>

              <input
                type="range"
                aria-label="Institutional Seat Slider"
                min={5}
                max={500}
                step={5}
                value={Math.min(500, seats)}
                onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                className="w-full accent-[#C5A572] cursor-pointer"
              />

              <div className="space-y-2 pt-3 border-t border-white/10 text-[#D5E0D7]">
                <div className="flex justify-between">
                  <span>Current Individual Unit Rate:</span>
                  <span className="font-mono">₹{orgQuote.unit_price_inr} / seat</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Original Monthly Total ({orgQuote.seats} × ₹
                    {orgQuote.unit_price_inr}):
                  </span>
                  <span className="font-mono line-through text-[#99A89E]">
                    ₹{orgQuote.original_total_inr}
                  </span>
                </div>
                <div className="flex justify-between text-[#C5A572] font-semibold">
                  <span>
                    {orgQuote.discount_percent}% Institutional Discount (Original × 25%):
                  </span>
                  <span className="font-mono">- ₹{orgQuote.discount_amount_inr}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#F7F4EC] pt-2 border-t border-white/10">
                  <span>Final Monthly Organization Total (Original × 75%):</span>
                  <span className="font-mono">₹{orgQuote.final_monthly_inr} / mo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter College, Scholarship Cell, or NGO Name..."
              className="w-full rounded-xl bg-[#0F221A]/80 border border-[#C5A572]/35 px-4 py-2.5 text-xs text-[#F7F4EC] placeholder:text-[#99A89E]"
            />
            <button
              type="button"
              onClick={handleOrganizationCheckout}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-[#C5A572] hover:bg-[#D4B685] text-[#0F221A] text-xs sm:text-sm font-extrabold transition cursor-pointer disabled:opacity-50"
            >
              Provision {orgQuote.seats} Institutional Seats — ₹
              {orgQuote.final_monthly_inr}/month
            </button>
          </div>
        </div>
      </div>

      {/* Organization Seat Roster & Audit Dashboard */}
      {orgDashboard && (
        <section className="folio-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D1C2] pb-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[#163026]" />
              <div>
                <h2 className="font-editorial text-xl font-semibold text-[#141815]">
                  Institutional Seat Administration: {orgDashboard.name}
                </h2>
                <p className="text-xs font-mono text-[#6B726C]">
                  Org ID: {orgDashboard.org_id} · Admin: {orgDashboard.admin_user_id}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="brass-badge px-3 py-1 rounded-md">
                Purchased Seats: {orgDashboard.purchased_seats}
              </span>
              <span className="px-3 py-1 rounded-md bg-[#E6ECE7] text-[#163026] border border-[#CFDBD1]">
                Assigned: {orgDashboard.assigned_or_invited_seats}
              </span>
              <span className="px-3 py-1 rounded-md bg-[#EFECE2] text-[#141815] border border-[#D8D1C2]">
                Available: {orgDashboard.available_seats}
              </span>
            </div>
          </div>

          <form onSubmit={handleAssignSeat} className="flex flex-wrap gap-2.5">
            <input
              type="email"
              required
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Assign seat to counselor or student email (e.g., scholarship-desk@college.edu)..."
              className="flex-1 min-w-[240px] rounded-xl border border-[#BFB6A4] bg-[#FCFBF7] px-3.5 py-2.5 text-xs text-[#141815]"
            />
            <button
              type="submit"
              className="btn-forest inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#C5A572]" />
              <span>Assign Seat</span>
            </button>
          </form>

          {orgDashboard.seats_roster?.length > 0 && (
            <div className="divide-y divide-[#D8D1C2] border border-[#D8D1C2] rounded-xl bg-[#FCFBF7]">
              {orgDashboard.seats_roster.map((s: any) => (
                <div
                  key={s.seat_id}
                  className="p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#141815]">{s.member_email}</span>
                    <span className="ms-2 px-2 py-0.5 rounded bg-[#E6ECE7] text-[#163026] font-mono text-[10px]">
                      {s.status}
                    </span>
                  </div>
                  {s.status !== "REVOKED" && (
                    <button
                      type="button"
                      onClick={() =>
                        revokeOrganizationSeat(orgDashboard.org_id, s.seat_id).then(
                          setOrgDashboard
                        )
                      }
                      className="inline-flex items-center gap-1 text-[#8B261D] hover:underline font-bold cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Revoke Seat</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
