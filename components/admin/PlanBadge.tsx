'use client';

import { Badge } from '@shopify/polaris';
import { Plan } from '@prisma/client';

interface PlanBadgeProps {
  plan: Plan;
}

const PLAN_CONFIG: Record<Plan, { label: string; tone: 'info' | 'success' | 'attention' | 'warning' }> = {
  FREE: { label: 'Free Trial', tone: 'info' },
  BASIC: { label: 'Starter', tone: 'success' },
  PLUS: { label: 'Growth', tone: 'attention' },
  PREMIUM: { label: 'Scale', tone: 'warning' },
};

export function PlanBadge({ plan }: PlanBadgeProps) {
  const config = PLAN_CONFIG[plan];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

export default PlanBadge;
