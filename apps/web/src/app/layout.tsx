import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { productConfig } from '@workpulse/config';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `${productConfig.name} Prototype`,
  description: 'Visual prototype for daily work progress and team intelligence.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
