import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Horizon - Empowering Youth Through Erasmus+",
  description: "Swedish nonprofit creating meaningful international opportunities for young people through Erasmus+ youth exchanges, training, and inclusive participation projects",
  keywords: ["Erasmus+", "youth exchange", "youth mobility", "youth worker training", "Sweden", "nonprofit", "inclusion", "youth participation"],
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
