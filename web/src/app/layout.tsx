import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Outreach AI — Life180",
  description: "AI-powered outreach engine for Life180 campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", inter.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="h-full flex flex-col bg-background text-foreground font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
