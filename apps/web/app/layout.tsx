import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { QueryProvider } from '@/components/shared/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Homewolves — African Real Estate Operating System',
  description: 'Discover, verify, and transact real estate across Africa. Homewolves is the platform for agents, buyers, developers, and homeowners.',
  keywords: ['real estate', 'Nigeria', 'Africa', 'property', 'agent CRM', 'PropTech'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
