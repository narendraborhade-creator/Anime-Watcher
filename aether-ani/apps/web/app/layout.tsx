import React from 'react';
import './globals.css';

export const metadata = {
  title: 'AETHER-ANI // Neo-Tokyo Spatial Anime Streaming HUD',
  description: 'Futuristic WebGL & HLS.js Anime Streaming Platform powered by pystardust/ani-cli architecture',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Orbitron:wght@600;700;800;900&family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#06070B] text-slate-100 font-sans antialiased selection:bg-cyan-500/30">
        {children}
      </body>
    </html>
  );
}
