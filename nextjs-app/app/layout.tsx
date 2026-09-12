import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family Version | Cinema & Series Streaming Hub',
  description: 'Family Version cinema streaming platform with Discover, Trending, Series, and Collections.',
  referrer: 'no-referrer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f1f3f6] text-gray-900 min-h-screen antialiased selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
