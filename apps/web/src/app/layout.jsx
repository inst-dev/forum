import '@/styles/globals.css';
import '@/styles/components.css';
import '@/styles/pages.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NotificationBarWrapper } from '@/components/layout/NotificationBar';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from 'sonner';

export const metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME || 'NullForum',
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME || 'NullForum'}`,
  },
  description: 'Enterprise-grade community forum platform',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: { type: 'website', siteName: process.env.NEXT_PUBLIC_APP_NAME || 'NullForum', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <div className="b7nq3p">
              <NotificationBarWrapper />
              <Header />
              <main className="r4hw8c">
                <div className="xk2m9f">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
