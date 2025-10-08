import Link from 'next/link';
import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from 'next-auth/react';

import './globals.css';

// --- Metadata ---
export const metadata: Metadata = {
  metadataBase: new URL('https://seoan.vercel.app'),
  title: 'Seoan AI',
  description: 'Welcome to Seoan AI',
};

// --- Viewport 설정 ---
export const viewport = {
  maximumScale: 1, // 모바일 Safari에서 자동 확대 방지
};

// --- Google Fonts ---
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

// --- Theme Colors ---
const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';

const THEME_COLOR_SCRIPT = `
(function() {
  const html = document.documentElement;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  const updateThemeColor = () => {
    const isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  };
  const observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();
`;

// --- Footer 링크 스타일 ---
const textXxsStyle = { fontSize: '0.65rem' };

// --- RootLayout ---
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_COLOR_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster position="top-center" />
          <SessionProvider>
            {children}
            <footer
              className="hidden sm:block fixed bottom-0 left-0 right-0 z-1000 dark:bg-gray-900 bg-gray-50"
              style={{ backgroundColor: 'var(--geist-background-light)' }}
            >
              <div className="h-full flex flex-col justify-end">
                <div className="flex justify-center gap-4 py-2">
                  <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" style={textXxsStyle}>
                    개인정보 처리방침
                  </Link>
                  <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" style={textXxsStyle}>
                    이용약관
                  </Link>
                  <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" style={textXxsStyle}>
                    사이트 소개 및 문의
                  </Link>
                </div>
              </div>
            </footer>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}