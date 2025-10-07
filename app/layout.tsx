import Link from 'next/link'; // Link 컴포넌트 추가
import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  metadataBase: new URL('https://seoan.vercel.app'),
  title: 'Seoan AI',
  description: 'Welcome to Seoan AI',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          <SessionProvider>
            
            {/* 메인 콘텐츠 */}
            {children}
            
            {/* ========================================================= */}
            {/* ↓↓↓ 필수 페이지 링크만 포함된 고정 푸터 ↓↓↓ */}
            {/* ========================================================= */}
            <footer 
              style={{
                position: 'fixed', 
                bottom: 0, 
                left: 0, 
                right: 0,
                backgroundColor: 'var(--geist-background-light)', 
                zIndex: 1000, 
                padding: '8px 0', // 상하 패딩으로 높이 조절
              }}
              className="dark:bg-gray-900 bg-gray-50 border-t border-gray-200 dark:border-gray-800"
            >
                {/* 필수 페이지 링크 */}
                <div className="flex justify-center gap-4 py-1">
                    <Link 
                        href="/privacy" // 👈 개인정보 처리방침 페이지 경로
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs"
                    >
                        개인정보 처리방침
                    </Link>
                    <Link 
                        href="/terms" // 👈 이용약관 페이지 경로
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs"
                    >
                        이용약관
                    </Link>
                    <Link 
                        href="/about" // 👈 사이트 소개/문의 페이지 경로
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs"
                    >
                        사이트 소개 및 문의
                    </Link>
                </div>
            </footer>
            {/* ========================================================= */}
            
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
