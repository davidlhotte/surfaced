// Server Component Layout - sets dynamic to prevent static generation
// The actual client layout is imported below
export const dynamic = 'force-dynamic';

import { AdminLayoutClient } from './layout-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
