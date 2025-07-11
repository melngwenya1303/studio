import type {Metadata} from 'next';
import { Roboto, Montserrat } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/contexts/AppContext';

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['500', '700', '800'],
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
    <html lang="en" className={`${roboto.variable} ${montserrat.variable} dark`} suppressHydrationWarning>
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
