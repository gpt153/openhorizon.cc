import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Horizon - Empowering Youth Through Erasmus+",
  description: "Swedish nonprofit creating meaningful international opportunities for young people and organisations through Erasmus+ projects.",
  keywords: ["Erasmus+", "youth exchange", "youth mobility", "international opportunities", "youth worker training"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
