import '@payloadcms/next/css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Surfaced Blog Admin',
  description: 'Manage your blog content',
};

export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
