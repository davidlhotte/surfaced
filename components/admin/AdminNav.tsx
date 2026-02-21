'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { InlineStack, Text } from '@shopify/polaris';
import {
  HomeIcon,
  ProductIcon,
  ViewIcon,
  TargetIcon,
  SettingsIcon,
  ChartVerticalFilledIcon,
  SearchIcon,
} from '@shopify/polaris-icons';
import { Icon } from '@shopify/polaris';

interface NavItem {
  href: string;
  labelEn: string;
  labelFr: string;
  icon: typeof HomeIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', labelEn: 'Dashboard', labelFr: 'Tableau de bord', icon: HomeIcon },
  { href: '/admin/products', labelEn: 'Products', labelFr: 'Produits', icon: ProductIcon },
  { href: '/admin/visibility', labelEn: 'Visibility', labelFr: 'Visibilité', icon: ViewIcon },
  { href: '/admin/competitors', labelEn: 'Competitors', labelFr: 'Concurrents', icon: TargetIcon },
  { href: '/admin/insights', labelEn: 'Statistics', labelFr: 'Statistiques', icon: ChartVerticalFilledIcon },
  { href: '/admin/aeo-tools', labelEn: 'AEO Tools', labelFr: 'Outils AEO', icon: SearchIcon },
  { href: '/admin/settings', labelEn: 'Settings', labelFr: 'Paramètres', icon: SettingsIcon },
];

interface AdminNavProps {
  locale?: string;
}

export function AdminNav({ locale = 'en' }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 100%)',
      borderRadius: '12px',
      padding: '8px',
      marginBottom: '16px',
    }}>
      <InlineStack gap="100" align="center" wrap>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname?.startsWith(item.href));
          const label = locale === 'fr' ? item.labelFr : item.labelEn;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                background: isActive
                  ? 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)'
                  : 'transparent',
                color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
              }}
            >
              <Icon source={item.icon} tone={isActive ? 'base' : 'subdued'} />
              <span style={{ color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)' }}>
                {label}
              </span>
            </Link>
          );
        })}
      </InlineStack>
    </div>
  );
}
