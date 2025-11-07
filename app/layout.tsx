import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Image Editor - PWA',
  description:
    'Edit your photos with AI-powered presets. Remove backgrounds, enhance colors, and more.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Image Editor',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'AI Image Editor',
    title: 'AI Image Editor - PWA',
    description: 'Edit your photos with AI-powered presets',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script src="/register-sw.js" defer></script>
      </head>
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}
