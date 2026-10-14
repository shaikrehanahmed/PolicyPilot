import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ProfileProvider } from "@/lib/profile-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "PolicyPilot — Evidence-Grounded Public Policy & Welfare Navigation",
  description:
    "Deterministic eligibility evaluation, official Gazette citations, scholarship defect recovery, and institutional policy navigation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F4EC] text-[#141815] selection:bg-[#163026] selection:text-[#F7F4EC]">
        <ProfileProvider>
          <Suspense fallback={<div className="h-20 bg-[#F7F4EC] border-b border-[#D8D1C2]" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </ProfileProvider>
      </body>
    </html>
  );
}
