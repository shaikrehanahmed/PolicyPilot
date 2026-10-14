"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
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

export default function PlansAndPricingPage() {
  const { isRtl } = useLanguage();

  const [pricing, setPricing] = useState<any>({
    individual_price_inr: "19.00",
    org_discount_percent: 25,
    free_successful_analyses_limit: 2,
  });
  const [account, setAccount] = useState<any>(null);

  // Live Organization Seat Calculator State (Default 100 seats -> ₹1,900 -> 25% off ₹475 -> ₹1,425)
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

  // Organization Dashboard State
  const [orgName, setOrgName] = useState("Global Institute Scholarship Cell");
  const [orgDashboard, setOrgDashboard] = useState<any>(null);
  const [memberEmail, setMemberEmail] = useState("");

  // Checkout Status
  const [checkoutBanner, setCheckoutBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchCurrentPricing(), fetchBillingAccount(), fetchOrganizationQuote(100)])
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
      // In development/sandbox mode, verify via server HMAC-SHA256 test signature
      const sigBundle = await fetchSandboxTestSignature(order.order_id);
      const updatedAccount = await verifyCheckoutPayment(sigBundle);
      setAccount(updatedAccount);
      setCheckoutBanner(
        `Verified HMAC-SHA256 Payment (${sigBundle.razorpay_payment_id})! Individual Plan active at locked rate ₹${pricing.individual_price_inr}/month.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndSubscribeOrganization = async () => {
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
        `Organization Subscription Activated for ${seats} seats at ₹${orgQuote.final_monthly_inr}/month (25% bulk discount saved ₹${orgQuote.discount_amount_inr})!`
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 overflow-x-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton fallbackHref="/schemes" />

        {account && (
          <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-950">
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>
              Free Successful Analyses Remaining:{" "}
              <strong>
                {account.free_analyses_remaining} / {account.free_analyses_limit}
              </strong>
            </span>
            <span className="text-indigo-400">·</span>
            <span>
              Plan:{" "}
              <strong>
                {account.has_unlimited_analysis_entitlement
                  ? "Unlimited Active"
                  : "Free Starter Tier"}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Sandbox Demo & Architectural Disclosure */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-indigo-400/40 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Interactive Sandbox Demo &amp; Architectural Disclosure</span>
        </div>
        <p className="text-gray-300 leading-relaxed text-[11px] sm:text-xs">
          This pricing calculator, organization seat quota model, and checkout flow are demonstrated in <strong>Sandbox Demo Mode</strong> with server-side HMAC-SHA256 signature verification. Real payment gateway transactions and persistent multi-tenant account isolation will activate when production Razorpay credentials and a live PostgreSQL database are configured on the backend.
        </p>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          Transparent Citizen &amp; Institutional Pricing
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17213F] tracking-tight">
          Start with 2 Free Successful Analyses. Scale Across Your Campus or NGO.
        </h1>
        <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
          Ordinary scheme browsing and failed/incomplete requests are always free. After your{" "}
          <strong>2 free successful policy analyses</strong>, unlock unlimited analyses for{" "}
          <strong>₹{pricing.individual_price_inr}/month</strong> or equip your entire college
          scholarship desk with an automatic <strong>25% bulk seat discount</strong>.
        </p>
      </div>

      {checkoutBanner && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl p-4 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{checkoutBanner}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 text-xs sm:text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Glossy 3D-Perspective Pricing Cards Grid (Requirement H1 & H2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch [perspective:1200px]">
        {/* CARD 1: INDIVIDUAL PLAN */}
        <div className="group relative rounded-3xl bg-gradient-to-br from-white via-white to-indigo-50/60 border border-indigo-200/80 p-6 sm:p-8 shadow-xl transition-transform duration-300 motion-safe:hover:[transform:rotateY(2deg)_translateY(-4px)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-[#4F46E5]">
                Individual Citizen Plan
              </span>
              <span className="text-xs font-medium text-gray-500">
                Includes 2 Free Starter Analyses
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#17213F]">
                ₹{pricing.individual_price_inr}
              </span>
              <span className="text-sm text-[#667085] font-medium">
                / user / month
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
              Ideal for students, farmers, and households navigating central and state
              welfare schemes, NSP defect recovery, and personalized deadline tracking.
            </p>

            <ul className="space-y-2.5 text-xs sm:text-sm text-[#17213F] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>2 free successful policy analyses</strong> included for every new account
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Failed, cancelled, or incomplete requests <strong>never</strong> count against your quota
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Unlimited eligibility evaluations, action plans &amp; Scholarship Defect Rescue
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Locked subscriber price guarantee (no silent rate increases)
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-indigo-100 space-y-3">
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
              <span>
                You will pay ₹{pricing.individual_price_inr}/month. Cancel anytime in 1 click.
              </span>
            </div>
            <button
              type="button"
              onClick={handleIndividualCheckout}
              disabled={loading}
              className="w-full py-3 px-5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {account?.individual_subscription_status === "ACTIVE"
                ? `Active Plan (Locked at ₹${account.locked_subscription_price_inr}/mo)`
                : `Subscribe to Individual Plan — ₹${pricing.individual_price_inr}/month`}
            </button>
          </div>
        </div>

        {/* CARD 2: ORGANIZATION PLAN WITH LIVE 25%-OFF SEAT CALCULATOR */}
        <div className="group relative rounded-3xl bg-gradient-to-br from-[#17213F] via-[#1E293B] to-[#312E81] text-white border border-indigo-400/30 p-6 sm:p-8 shadow-2xl transition-transform duration-300 motion-safe:hover:[transform:rotateY(-2deg)_translateY(-4px)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                Organization &amp; Campus Plan
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                Automatic {orgQuote.discount_percent}% Bulk Seat Discount
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white">
                ₹{orgQuote.final_monthly_inr}
              </span>
              <span className="text-sm text-indigo-200">
                / month for {orgQuote.seats} seats
              </span>
            </div>

            {/* Live Dynamic Seat Calculator */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="seat-quantity-input"
                  className="font-bold text-indigo-100 flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-indigo-300" />
                  <span>Adjustable Seat Quantity:</span>
                </label>
                <input
                  id="seat-quantity-input"
                  type="number"
                  min={1}
                  max={100000}
                  value={seats}
                  onChange={(e) =>
                    setSeats(Math.max(1, parseInt(e.target.value || "1", 10)))
                  }
                  className="w-28 rounded-lg bg-slate-900/90 border border-indigo-300/40 px-3 py-1.5 text-sm font-bold text-white text-center"
                />
              </div>

              <input
                type="range"
                aria-label="Seat Quantity Slider"
                min={5}
                max={500}
                step={5}
                value={Math.min(500, seats)}
                onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-400 cursor-pointer"
              />

              {/* Exact Mathematical Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-white/10 text-indigo-100">
                <div className="flex justify-between">
                  <span>Current Individual Price:</span>
                  <span className="font-mono font-semibold">
                    ₹{orgQuote.unit_price_inr} / seat
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Original Monthly Total ({orgQuote.seats} × ₹{orgQuote.unit_price_inr}):
                  </span>
                  <span className="font-mono line-through text-indigo-300">
                    ₹{orgQuote.original_total_inr}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-300 font-semibold">
                  <span>{orgQuote.discount_percent}% Organization Discount:</span>
                  <span className="font-mono">- ₹{orgQuote.discount_amount_inr}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-1 border-t border-white/10">
                  <span>Final Monthly Organization Price (75%):</span>
                  <span className="font-mono">₹{orgQuote.final_monthly_inr} / mo</span>
                </div>
                <div className="flex justify-between text-[11px] text-indigo-200">
                  <span>Effective Price Per Seat:</span>
                  <span className="font-mono">₹{orgQuote.effective_per_seat_inr} / seat</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization / College Name..."
              className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-xs text-white placeholder:text-indigo-200"
            />
            <button
              type="button"
              onClick={handleCreateAndSubscribeOrganization}
              disabled={loading}
              className="w-full py-3 px-5 rounded-xl bg-white hover:bg-indigo-50 text-[#17213F] text-xs sm:text-sm font-extrabold shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              Purchase {orgQuote.seats} Organization Seats — ₹{orgQuote.final_monthly_inr}/month
            </button>
          </div>
        </div>
      </div>

      {/* Organization Admin Seat Management Dashboard (Part E3) */}
      {orgDashboard && (
        <section className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-[#4F46E5]" />
              <div>
                <h2 className="text-lg font-bold text-[#17213F]">
                  Organization Seat &amp; Billing Dashboard: {orgDashboard.name}
                </h2>
                <p className="text-xs text-[#667085]">
                  Org ID: {orgDashboard.org_id} · Admin: {orgDashboard.admin_user_id}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                Purchased: {orgDashboard.purchased_seats}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Assigned/Invited: {orgDashboard.assigned_or_invited_seats}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Available: {orgDashboard.available_seats}
              </span>
            </div>
          </div>

          <form onSubmit={handleAssignSeat} className="flex flex-wrap gap-2">
            <input
              type="email"
              required
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Invite or assign seat by member email (e.g., clerk@college.edu)..."
              className="flex-1 min-w-[220px] rounded-xl border border-gray-300 px-3.5 py-2 text-xs text-[#17213F]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F46E5] text-white text-xs font-bold cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Assign Seat</span>
            </button>
          </form>

          {orgDashboard.seats_roster?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-gray-500">
                Assigned &amp; Invited Seats Roster
              </h3>
              <div className="divide-y border rounded-xl">
                {orgDashboard.seats_roster.map((s: any) => (
                  <div
                    key={s.seat_id}
                    className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#17213F]">{s.member_email}</span>
                      <span className="ms-2 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
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
                        className="inline-flex items-center gap-1 text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
