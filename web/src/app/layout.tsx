import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Outreach AI",
  description: "AI-powered outreach email workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", inter.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="h-full flex flex-col bg-[#fdfdfc] text-brand-text font-sans">
        <Header />
        <main className="flex-1 bg-white overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
