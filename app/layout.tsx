import type { Metadata } from 'next';
import AuthProvider from '@/components/AuthProvider';
import { SettingsProvider } from '@/components/SettingsProvider';
import UserMenu from '@/components/UserMenu';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pokemon Price Tracker',
  description: 'Track your Pokemon Cardmarket prices in real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('poketracker-theme');
                if (!theme || theme === 'system') {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <SettingsProvider>
            <main className="container">
              <header className="pokeball-header">
                <UserMenu />
                <img src="/images/pokeball-bg.svg" alt="PokeTracker Logo" className="main-logo" />
                <h1 className="header-title">Poke<span>Tracker</span></h1>
              </header>
              <div className="background-pokeballs">
                <img src="/images/pokeball-bg.svg" alt="" className="bg-pb pb-1" />
                <img src="/images/pokeball-bg.svg" alt="" className="bg-pb pb-2" />
                <img src="/images/pokeball-bg.svg" alt="" className="bg-pb pb-3" />
                <img src="/images/pokeball-bg.svg" alt="" className="bg-pb pb-4" />
                <img src="/images/pokeball-bg.svg" alt="" className="bg-pb pb-5" />
                <img src="/images/pokeball-bg.svg" alt="" className="bg-pb pb-6" />
              </div>
              {children}
            </main>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
