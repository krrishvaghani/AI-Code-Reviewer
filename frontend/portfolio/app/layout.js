import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Krrish Vaghani — AI & Full-Stack Developer',
  description:
    'Portfolio of Krrish Vaghani — a full-stack developer specialising in AI, LLM integration, FastAPI, and React.',
  keywords: ['developer', 'portfolio', 'AI', 'FastAPI', 'React', 'Next.js', 'LLM'],
  openGraph: {
    title: 'Krrish Vaghani — AI & Full-Stack Developer',
    description: 'Building AI-powered developer tools and production-ready full-stack applications.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}>
      <body className="bg-[#050508] text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
