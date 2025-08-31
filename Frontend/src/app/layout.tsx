import type { Metadata } from "next";
import "./globals.css";
//import { AuthProvider } from "../contexts/AuthContext";
import { AuthProvider } from "@/components/AuthProvider";

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
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
} 