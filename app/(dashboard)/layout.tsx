import { redirect } from 'next/navigation';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect('/login');
  }

  // Map Supabase user to expected format
  const user = {
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || null,
    plan: supabaseUser.user_metadata?.plan || 'FREE',
  };

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
