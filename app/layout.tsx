import Link from 'next/link';
import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from 'next-auth/react';
// Sidebar 컴포넌트가 있다고 가정하고 import
import { Sidebar } from '@/components/sidebar'; 
import './globals.css';

// --- Metadata ---
export const metadata: Metadata = {
  metadataBase: new URL('https://seoan.kro.kr'),
  title: 'Seoan AI', 
  description: 'Welcome to Seoan AI',
};

// --- Viewport 설정 ---
export const viewport = {
  maximumScale: 1, 
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

// --- Theme Colors (쿨 블루 HSL 값 유지) ---
const LIGHT_THEME_COLOR = 'hsl(240 5% 98%)'; 
const DARK_THEME_COLOR = 'hsl(240 10% 8%)'; 

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
const textXxsStyle = { fontSize: '0.65rem' }; // 기존 스타일 유지

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
            
            <div className="flex min-h-screen">
              {/* 1. 사이드바 영역: 데스크톱에 고정 (md:block) */}
              <div className="hidden md:block w-64 border-r border-border bg-sidebar-background flex-shrink-0">
                <Sidebar />
              </div>

              {/* 2. 메인 콘텐츠 영역: 유연하게 확장, relative 설정 필수! */}
              <main className="flex-1 overflow-auto relative p-0"> 
                
                {/* 메인 콘텐츠는 풋터 공간을 비워둬야 함 (padding-bottom) */}
                <div className="pb-16 min-h-full">
                  {children}
                </div>
                
                {/* 3. 풋터 영역: 메인 콘텐츠 영역 내부에 고정 배치 */}
                <footer
                  // 풋터 너비가 메인 영역을 벗어나지 않도록 relative 부모 아래 absolute 배치
                  className="fixed md:absolute bottom-0 left-0 right-0 z-1000 border-t border-border"
                  // 배경색은 변수를 활용해 테마에 맞춤
                  style={{ backgroundColor: 'var(--background)' }} 
                >
                  <div className="h-full flex flex-col justify-end">
                    <div className="flex justify-center gap-4 py-3">
                      <Link href="/privacy" className="text-muted-foreground hover:text-foreground" style={textXxsStyle}>
                        개인정보 처리방침
                      </Link>
                      <Link href="/terms" className="text-muted-foreground hover:text-foreground" style={textXxsStyle}>
                        이용약관
                      </Link>
                      <Link href="/about" className="text-muted-foreground hover:text-foreground" style={textXxsStyle}>
                        사이트 소개 및 문의
                      </Link>
                    </div>
                  </div>
                </footer>

              </main>
            </div>
            
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
