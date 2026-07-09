import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Krystle's Pistols",
  description: "A discreet, 21+ members platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
