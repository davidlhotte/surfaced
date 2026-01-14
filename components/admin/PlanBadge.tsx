'use client';

import { Badge } from '@shopify/polaris';
import { Plan } from '@prisma/client';

interface PlanBadgeProps {
  plan: Plan;
}

const PLAN_CONFIG: Record<Plan, { label: string; tone: 'info' | 'success' | 'attention' | 'warning' }> = {
  FREE: { label: 'Free', tone: 'info' },
  BASIC: { label: 'Basic', tone: 'success' },
  PLUS: { label: 'Plus', tone: 'attention' },
  PREMIUM: { label: 'Premium', tone: 'warning' },
};

export function PlanBadge({ plan }: PlanBadgeProps) {
  const config = PLAN_CONFIG[plan];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

export default PlanBadge;
