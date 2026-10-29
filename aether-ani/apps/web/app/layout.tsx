import React from 'react';
import './globals.css';

export const metadata = {
  title: 'AETHER-ANI // Neo-Tokyo Spatial Anime Streaming HUD',
  description: 'Futuristic WebGL & HLS.js Anime Streaming Platform powered by pystardust/ani-cli architecture',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-void text-slate-100 antialiased selection:bg-cyan-500/30">
        {children}
      </body>
    </html>
  );
}
