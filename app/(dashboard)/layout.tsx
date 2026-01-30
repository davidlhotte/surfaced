import { redirect } from 'next/navigation';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import { getUniversalUser } from '@/lib/auth/universal';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import '../globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
});

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUniversalUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}>
        <div className="flex min-h-screen bg-slate-50">
          <DashboardSidebar user={user} />
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
