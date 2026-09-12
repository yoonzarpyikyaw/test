import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family Version - Movie & Series Streaming Catalog',
  description: 'Explore movies, series, trending titles, and watch on Telegram.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070709] text-white min-h-screen antialiased selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
