import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SubscriptionAccessWatch from "./SubscriptionAccessWatch";
import DevicePresenceTracker from "./DevicePresenceTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bottle World",
  description: "Truck Dashboard",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="Bottle World"
        />
      </head>

      <body className="min-h-full flex flex-col">
        <SubscriptionAccessWatch />
        <DevicePresenceTracker />
        {children}
        <footer
          className="w-full border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-600"
          style={{ colorScheme: "light" }}
        >
          <span>© 2026 Bottle World. All Rights Reserved.</span>
          <span aria-hidden="true" className="mx-2">·</span>
          <Link href="/copyright" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
            Copyright &amp; IP Policy
          </Link>
        </footer>
      </body>
    </html>
  );
}