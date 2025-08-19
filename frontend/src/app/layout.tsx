import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lindle - AI-powered Contract Assistant",
  description: "All your contracts. One companion. Smart. Clear. Fun. AI-powered contract assistant for freelancers, consultants, and agencies.",
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
