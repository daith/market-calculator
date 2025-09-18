import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "./auth";
import "./dark-mode-fixes.css";
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
  title: "Demo 商品計算器工具",
  description: "商品計算器工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              -webkit-text-size-adjust: 100% !important;
              -ms-text-size-adjust: 100% !important;
              text-size-adjust: 100% !important;
              touch-action: manipulation !important;
              -webkit-touch-callout: none !important;
              -webkit-user-select: none !important;
              user-select: none !important;
              zoom: 1 !important;
              transform: scale(1) !important;
            }
            input, textarea, select {
              font-size: 16px !important;
              -webkit-appearance: none !important;
              -moz-appearance: none !important;
              appearance: none !important;
              -webkit-user-select: text !important;
              user-select: text !important;
              touch-action: manipulation !important;
            }
            * {
              -webkit-tap-highlight-color: transparent !important;
              -webkit-touch-callout: none !important;
              touch-action: manipulation !important;
            }
          `
        }} />
        <script src="/prevent-zoom.js" async></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
