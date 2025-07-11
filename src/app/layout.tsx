import type {Metadata} from 'next';
import { Lato, Montserrat } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/contexts/AppContext';

const lato = Lato({
  subsets: ['latin'],
  variable: '--font-lato',
  weight: ['400', '700'],
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SurfaceStory',
  description: 'Design your own device decals.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lato.variable} ${montserrat.variable} dark`} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning>
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
