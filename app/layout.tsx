Import { Toaster } from 'sonner';
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
            {/* ↓↓↓ 색상이 더 연해진 면책 조항 코드 ↓↓↓ */}
            {/* ========================================================= */}
            <div 
              style={{
                position: 'fixed', // 화면 하단에 고정
                bottom: 0, 
                left: 0, 
                right: 0,
                padding: '8px 0',
                fontSize: '0.7rem', // 글씨 크기 더 작게
                textAlign: 'center',
                zIndex: 1000, 
              }}
              // 배경색을 아주 연한 그레이(light: gray-50, dark: gray-900)로, 
              // 텍스트 색상을 더 연한 그레이(light: gray-500, dark: gray-500)로 설정
              className="dark:bg-gray-900 dark:text-gray-500 bg-gray-50 text-gray-500 border-t border-gray-200 dark:border-gray-800"
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
