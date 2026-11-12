import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReplyGenius — AI Customer & Sales Reply Copilot",
  description:
    "Generate empathetic, high-converting customer replies to angry reviews and sales inquiries with Gemini AI and Supabase Auth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-[#0D1117] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
