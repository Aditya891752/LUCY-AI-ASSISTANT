import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandBar } from "@/components/layout/command-bar";

export const metadata: Metadata = {
  title: "Lucy - Personal Life Assistant",
  description: "Permanent memory personal assistant for habits, health, nutrition, and winter arc discipline.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lucy",
  },
};

export const viewport: Viewport = {
  themeColor: "#090A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen flex flex-col selection:bg-accent selection:text-accent-foreground">
        <QueryProvider>
          <main className="flex-1 max-w-md w-full mx-auto pb-20 px-4 pt-4">
            {children}
          </main>
          <CommandBar />
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}
