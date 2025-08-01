// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Layout/Footer'; 
import logo from '@/assets/logo-full-color.svg';

export const metadata: Metadata = {
  title: 'SimplyMeals | Warme maaltijden, simpel geregeld.',
  description:
    'Organiseer avondeten voor €5,50 p.p. in 3 minuten. Hoe? Start een bestelling en deel jouw unieke link. Wij verzorgen de inschrijvingen, bereiding én bezorging.',
  openGraph: {
    type: 'website',
    url: 'https://simplymeals.nl',
    title: 'SimplyMeals | Warme maaltijden, simpel geregeld.',
    description:
      'Organiseer avondeten voor €5,50 p.p. in 3 minuten. Hoe? Start een bestelling en deel jouw unieke link. Wij verzorgen de inschrijvingen, bereiding én bezorging.',
    images: [{ url: 'https://simplymeals.nl/og-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SimplyMeals | Warme maaltijden, simpel geregeld.',
    description:
      'Organiseer avondeten voor €5,50 p.p. in 3 minuten. Hoe? Start een bestelling en deel jouw unieke link. Wij verzorgen de inschrijvingen, bereiding én bezorging.',
    images: ['https://simplymeals.nl/og-image.png'],
  },
};

const tabs = [
  { label: 'Prijzen', href: '/#pricing' },
  { label: 'Contact', href: '/contact' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="relative flex flex-col min-h-screen w-screen font-outfit bg-[#EFEFEC] text-newBlack">
        {/* Header */}
        <header className="top-0 w-full h-20 md:h-24 sticky z-50 bg-[#EFEFEC]/75 backdrop-blur">
          <div className="max-w-screen-xl mx-auto h-full flex flex-row justify-between items-center p-4 gap-4">
            <Link href="/" className="block h-full">
              <Image src={logo} alt="SimplyMeals Logo" className="h-full w-auto" />
            </Link>

            <div className="hidden md:flex items-center gap-12 text-lg">
              {tabs.map((tab) => (
                <Link key={tab.href} href={tab.href} className="hover:underline">
                  {tab.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-center">
              <Link
                href="/list/create"
                className="bg-turquoise text-sm md:text-lg text-white rounded-lg text-center px-8 py-2 font-light hover:bg-richturquoise"
              >
                Bestelling starten
              </Link>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="max-w-screen-xl mx-auto space-y-16 grow px-4">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
