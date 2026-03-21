import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Kalam } from "next/font/google";
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

const kalam = Kalam({
  variable: "--font-kalam",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://garticphone.space'), // Replace with your actual domain
  title: {
    default: 'Gartic.phone - лучшая игра в рисование и угадывание',
    template: '%s | Gartic.phone',
  },
  description: "Бесплатная онлайн-игра в рисование, в которой вы пытаетесь угадать слово! Играйте с друзьями в публичных или приватных комнатах. Веселая альтернатива испорченному телефону.",
  keywords: ['drawing game', 'guessing game', 'online party game', 'gartic phone', 'broken telephone game', 'free online game', 'play with friends', 'рисование онлайн', 'игра угадай слово', 'веселые игры для компании', 'игры для вечеринок', 'сломанный телефон игра', 'онлайн игра с друзьями', 'бесплатные онлайн игры', 'браузерная игра', 'творческая игра', 'игра в слова'],
  openGraph: {
    title: 'Gartic.phone - лучшая игра в рисование и угадывание',
    description: 'Бесплатная онлайн-игра в рисование, в которой вы пытаетесь угадать слово! Весело и забавно для вечеринок.',
    url: 'https://garticphone.space', // Replace with your actual domain
    siteName: 'Gartic.phone',
    images: [
      {
        url: '/og-image.png', // We need to create this image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gartic.phone - лучшая игра в рисование и угадывание',
    description: 'Бесплатная онлайн-игра в рисование, в которой вы пытаетесь угадать слово! Весело и забавно для вечеринок.',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script>window.yaContextCb=window.yaContextCb||[]</script>
        <script src="https://yandex.ru/ads/system/context.js" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
