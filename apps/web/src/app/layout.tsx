import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ProfileProvider } from "@/lib/profile-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "PolicyPilot — Evidence-Grounded Policy Navigation",
  description:
    "Discover government schemes, understand your eligibility criteria, review official Gazette evidence, and generate personalized application action plans.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F8FC] text-[#17213F]">
        <ProfileProvider>
          <Suspense fallback={<div className="h-16 bg-white border-b" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1">
            <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading...</div>}>
              {children}
            </Suspense>
          </main>
          <Footer />
        </ProfileProvider>
      </body>
    </html>
  );
}
