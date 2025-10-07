import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  metadataBase: new URL('https://seoan.vercel.app'),
  title: 'Seoan AI',
  description: 'Welcome to Seoan  AI',
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
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
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
            
            {/* 메인 콘텐츠 (챗봇 화면 등) */}
            {children}
            
            {/* ========================================================= */}
            {/* ↓↓↓ 여기에 면책 조항을 추가했습니다. ↓↓↓ */}
            {/* ========================================================= */}
            <div 
              style={{
                position: 'fixed', // 화면 하단에 고정
                bottom: 0, 
                left: 0, 
                right: 0,
                padding: '8px 0',
                backgroundColor: 'var(--geist-background-light)', // 배경색 설정 (테마에 따라 조정)
                color: 'var(--geist-foreground-dark)', // 텍스트 색상 설정
                textAlign: 'center',
                fontSize: '0.75rem', 
                borderTop: '1px solid var(--geist-separator)', // 상단에 얇은 구분선
                zIndex: 1000, // 다른 요소 위에 오도록 z-index 설정
              }}
              className="dark:bg-gray-800 dark:text-gray-400 bg-gray-50 text-gray-600 border-t border-gray-200 dark:border-gray-700"
            >
              Seoan AI는 실수할 수 있습니다. 중요한 정보는 다시 확인해주세요.
            </div>
            {/* ========================================================= */}
            
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
