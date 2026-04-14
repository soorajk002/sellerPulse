import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SellerPulse — Amazon Product Research Tool",
  description: "Find winning Amazon products in minutes with SellerPulse. Research products, track keywords, and analyze competition.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
