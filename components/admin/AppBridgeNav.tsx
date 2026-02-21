'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  destination: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', destination: '/admin' },
  { label: 'Products', destination: '/admin/products' },
  { label: 'Visibility', destination: '/admin/visibility' },
  { label: 'Competitors', destination: '/admin/competitors' },
  { label: 'Statistics', destination: '/admin/insights' },
  { label: 'AEO Tools', destination: '/admin/aeo-tools' },
  { label: 'Settings', destination: '/admin/settings' },
];

/**
 * App Bridge Navigation Menu
 *
 * Uses the Shopify App Bridge ui-nav-menu web component
 * to render navigation in the Shopify admin sidebar.
 *
 * @see https://shopify.dev/docs/api/app-bridge-library/web-components/ui-nav-menu
 */
export function AppBridgeNav() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Create ui-nav-menu element
    const navMenu = document.createElement('ui-nav-menu');

    // Add navigation links
    NAV_ITEMS.forEach((item) => {
      const link = document.createElement('a');
      link.href = item.destination;
      link.textContent = item.label;
      if (pathname === item.destination) {
        link.setAttribute('rel', 'home');
      }
      navMenu.appendChild(link);
    });

    containerRef.current.appendChild(navMenu);
  }, [pathname]);

  // Render a container div that will hold the web component
  return <div ref={containerRef} style={{ display: 'none' }} />;
}
