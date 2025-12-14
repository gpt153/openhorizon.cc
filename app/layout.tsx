import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenHorizon - AI-Powered Erasmus+ Project Management",
  description: "Streamline planning, compliance, and collaboration for EU-funded projects with intelligent automation",
  keywords: ["Erasmus+", "project management", "AI", "EU funding", "collaboration"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
