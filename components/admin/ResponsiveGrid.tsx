'use client';

import { ReactNode, useMemo } from 'react';
import styles from './ResponsiveGrid.module.css';

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

// Column class mappings (moved outside component to avoid recreation)
const colsClasses: Record<number, string> = {
  1: styles.cols1,
  2: styles.cols2,
  3: styles.cols3,
  4: styles.cols4,
  5: styles.cols5,
  6: styles.cols6,
};

const smColsClasses: Record<number, string> = {
  1: styles.smCols1,
  2: styles.smCols2,
  3: styles.smCols3,
  4: styles.smCols4,
  5: styles.smCols5,
  6: styles.smCols6,
};

const mdColsClasses: Record<number, string> = {
  1: styles.mdCols1,
  2: styles.mdCols2,
  3: styles.mdCols3,
  4: styles.mdCols4,
  5: styles.mdCols5,
  6: styles.mdCols6,
};

const lgColsClasses: Record<number, string> = {
  1: styles.lgCols1,
  2: styles.lgCols2,
  3: styles.lgCols3,
  4: styles.lgCols4,
  5: styles.lgCols5,
  6: styles.lgCols6,
};

const gapClasses: Record<string, string> = {
  tight: styles.gapTight,
  base: styles.gapBase,
  loose: styles.gapLoose,
};

/**
 * Responsive grid component for admin pages
 * Uses CSS Grid with responsive breakpoints via CSS modules (no runtime style generation)
 */
export function ResponsiveGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'base'
}: ResponsiveGridProps) {
  const className = useMemo(() => {
    const classes = [
      styles.responsiveGrid,
      gapClasses[gap],
      colsClasses[columns.xs || 1],
      smColsClasses[columns.sm || 2],
      mdColsClasses[columns.md || 3],
      lgColsClasses[columns.lg || 4],
    ].filter(Boolean).join(' ');
    return classes;
  }, [columns.xs, columns.sm, columns.md, columns.lg, gap]);

  return (
    <div className={className}>
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

// Tone class mappings (moved outside component)
const toneClasses: Record<string, string> = {
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  critical: styles.toneCritical,
  info: styles.toneInfo,
  default: styles.toneDefault,
};

const trendClasses: Record<string, string> = {
  up: styles.trendUp,
  down: styles.trendDown,
  neutral: styles.trendNeutral,
};

/**
 * Stat card with consistent styling
 */
export function StatCard({ title, value, subtitle, trend, tone = 'default', icon }: StatCardProps) {
  const cardClassName = `${styles.statCard} ${toneClasses[tone]}`;

  return (
    <div className={cardClassName}>
      <div className={styles.statCardHeader}>
        <span className={styles.statCardTitle}>{title}</span>
        {icon && <span className={styles.statCardIcon}>{icon}</span>}
      </div>
      <div className={styles.statCardValueRow}>
        <span className={styles.statCardValue}>{value}</span>
        {trend && (
          <span className={`${styles.statCardTrend} ${trendClasses[trend.direction]}`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && <span className={styles.statCardSubtitle}>{subtitle}</span>}
    </div>
  );
}

interface ScrollContainerProps {
  children: ReactNode;
  maxHeight?: string;
  showScrollbar?: boolean;
}

/**
 * Scrollable container with custom scrollbar
 */
export function ScrollContainer({ children, maxHeight = '400px', showScrollbar = true }: ScrollContainerProps) {
  const className = showScrollbar
    ? styles.scrollContainer
    : `${styles.scrollContainer} ${styles.hideScrollbar}`;

  return (
    <div className={className} style={{ maxHeight }}>
      {children}
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Consistent page section layout
 */
export function PageSection({
  children,
  title,
  description,
  action,
}: PageSectionProps) {
  return (
    <div className={styles.pageSection}>
      {(title || action) && (
        <div className={styles.pageSectionHeader}>
          <div>
            {title && <h2 className={styles.pageSectionTitle}>{title}</h2>}
            {description && <p className={styles.pageSectionDescription}>{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
