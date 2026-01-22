import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/app-shell/AppShell";

export const metadata: Metadata = {
  title: "CodeInsight",
  description: "AI-powered Git reporting platform dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
