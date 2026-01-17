'use client';

import { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    xs?: number;  // < 500px
    sm?: number;  // 500-768px
    md?: number;  // 768-1024px
    lg?: number;  // > 1024px
  };
  gap?: 'tight' | 'base' | 'loose';
}

/**
 * Responsive grid component for admin pages
 * Uses CSS Grid with responsive breakpoints
 */
export function ResponsiveGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'base'
}: ResponsiveGridProps) {
  const gapValues = {
    tight: '8px',
    base: '16px',
    loose: '24px',
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: gapValues[gap],
        gridTemplateColumns: `repeat(${columns.xs || 1}, 1fr)`,
      }}
      className="responsive-grid"
    >
      <style>{`
        .responsive-grid {
          grid-template-columns: repeat(${columns.xs || 1}, 1fr) !important;
        }
        @media (min-width: 500px) {
          .responsive-grid {
            grid-template-columns: repeat(${columns.sm || 2}, 1fr) !important;
          }
        }
        @media (min-width: 768px) {
          .responsive-grid {
            grid-template-columns: repeat(${columns.md || 3}, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .responsive-grid {
            grid-template-columns: repeat(${columns.lg || 4}, 1fr) !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  tone?: 'success' | 'warning' | 'critical' | 'info' | 'default';
  icon?: ReactNode;
}

/**
 * Stat card with consistent styling
 */
export function StatCard({ title, value, subtitle, trend, tone = 'default', icon }: StatCardProps) {
  const toneColors = {
    success: { bg: 'var(--p-color-bg-fill-success-secondary)', border: 'var(--p-color-border-success)' },
    warning: { bg: 'var(--p-color-bg-fill-warning-secondary)', border: 'var(--p-color-border-warning)' },
    critical: { bg: 'var(--p-color-bg-fill-critical-secondary)', border: 'var(--p-color-border-critical)' },
    info: { bg: 'var(--p-color-bg-fill-info-secondary)', border: 'var(--p-color-border-info)' },
    default: { bg: 'var(--p-color-bg-surface-secondary)', border: 'var(--p-color-border)' },
  };

  const trendColors = {
    up: '#108043',
    down: '#D82C0D',
    neutral: '#6D7175',
  };

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: toneColors[tone].bg,
        border: `1px solid ${toneColors[tone].border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: 'var(--p-color-text-secondary)', fontWeight: 500 }}>
          {title}
        </span>
        {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '28px', fontWeight: 600, color: 'var(--p-color-text)' }}>
          {value}
        </span>
        {trend && (
          <span style={{ fontSize: '13px', color: trendColors[trend.direction], fontWeight: 500 }}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && (
        <span style={{ fontSize: '12px', color: 'var(--p-color-text-secondary)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

interface ScrollContainerProps {
  children: ReactNode;
  maxHeight?: string;
  showScrollbar?: boolean;
}

/**
 * Scrollable container with fade indicators
 */
export function ScrollContainer({ children, maxHeight = '400px', showScrollbar = true }: ScrollContainerProps) {
  return (
    <div
      style={{
        maxHeight,
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: showScrollbar ? 'thin' : 'none',
        msOverflowStyle: showScrollbar ? 'auto' : 'none',
      }}
      className="scroll-container"
    >
      <style>{`
        .scroll-container::-webkit-scrollbar {
          width: ${showScrollbar ? '6px' : '0'};
        }
        .scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background-color: var(--p-color-border);
          border-radius: 3px;
        }
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background-color: var(--p-color-border-hover);
        }
      `}</style>
      {children}
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * Consistent page section with optional collapsibility
 */
export function PageSection({
  children,
  title,
  description,
  action,
}: PageSectionProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      {(title || action) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div>
            {title && (
              <h2 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--p-color-text)',
                margin: 0,
              }}>
                {title}
              </h2>
            )}
            {description && (
              <p style={{
                fontSize: '13px',
                color: 'var(--p-color-text-secondary)',
                margin: '4px 0 0 0',
              }}>
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
