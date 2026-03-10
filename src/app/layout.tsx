import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gartic-phone-omega.vercel.app'), // Replace with your actual domain
  title: {
    default: 'Gartic.phone - The Ultimate Drawing and Guessing Game',
    template: '%s | Gartic.phone',
  },
  description: "The free online drawing game where you try to guess the word! Play with friends in public or private rooms. The hilarious alternative to broken telephone.",
  keywords: ['drawing game', 'guessing game', 'online party game', 'gartic phone', 'broken telephone game', 'free online game', 'play with friends'],
  openGraph: {
    title: 'Gartic.phone - The Ultimate Drawing and Guessing Game',
    description: 'The free online drawing game where you try to guess the word! Hilarious and fun for parties.',
    url: 'https://gartic-phone-omega.vercel.app', // Replace with your actual domain
    siteName: 'Gartic.phone',
    images: [
      {
        url: '/og-image.png', // We need to create this image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gartic.phone - The Ultimate Drawing and Guessing Game',
    description: 'The free online drawing game where you try to guess the word! Hilarious and fun for parties.',
    images: ['/og-image.png'], // We need to create this image
  },
  icons: {
    icon: "/favicon.ico",
  },
};
export const viewport: Viewport = {
  themeColor: "#0085FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
