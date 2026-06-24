import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/ui/BottomNav';
import AppInitializer from '@/components/AppInitializer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jjannaewang.vercel.app';

export const metadata: Metadata = {
  title: {
    default: '짠내왕 — 최저가 추적 & 절약 커뮤니티',
    template: '%s | 짠내왕',
  },
  description: '생활용품 최저가를 주식 차트처럼 추적하고, 절약 꿀팁을 나누는 커뮤니티. 지금 얼마가 제일 쌀까? 짠내왕이 알려드려요.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: APP_URL,
    siteName: '짠내왕',
    title: '짠내왕 — 최저가 추적 & 절약 커뮤니티',
    description: '생활용품 최저가를 주식 차트처럼 추적하고, 절약 꿀팁을 나누는 커뮤니티',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '짠내왕 — 최저가 추적 & 절약 커뮤니티',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '짠내왕 — 최저가 추적 & 절약 커뮤니티',
    description: '생활용품 최저가를 주식 차트처럼 추적하고, 절약 꿀팁을 나누는 커뮤니티',
    images: [`${APP_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#ffb700" />
        {/* Material Symbols loaded via globals.css @import */}
      </head>
      <body className="bg-background-light font-display text-slate-900 antialiased">
        <div className="relative mx-auto min-h-screen max-w-[430px] bg-white shadow-xl overflow-x-hidden">
          <AppInitializer />
          <main className="pb-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
