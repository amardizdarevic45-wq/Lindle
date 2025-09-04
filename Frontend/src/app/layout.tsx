import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import LayoutWrapper from "./LayoutWrapper";

export const metadata: Metadata = {
  title: "Lindle - AI-powered Contract Assistant",
  description: "All your contracts. One companion. Smart. Clear. Fun. AI-powered contract assistant for freelancers, consultants, and agencies.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
} 