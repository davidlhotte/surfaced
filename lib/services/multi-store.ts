import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';
import type { OrgRole } from '@prisma/client';

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  plan: string;
  maxStores: number;
  storesCount: number;
  membersCount: number;
  createdAt: string;
};

export type StoreOverview = {
  id: string;
  shopDomain: string;
  name: string | null;
  plan: string;
  aiScore: number | null;
  productsCount: number;
  lastAuditAt: string | null;
  criticalIssues: number;
  warningIssues: number;
};

export type OrganizationDashboard = {
  organization: OrganizationSummary;
  stores: StoreOverview[];
  aggregateMetrics: {
    totalProducts: number;
    averageScore: number;
    totalCriticalIssues: number;
    totalWarningIssues: number;
    storesNeedingAttention: number;
  };
  members: {
    email: string;
    name: string | null;
    role: OrgRole;
    joinedAt: string;
  }[];
};

/**
 * Create a new organization
 */
export async function createOrganization(
  name: string,
  ownerEmail: string
): Promise<OrganizationSummary> {
  // Generate slug from name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Check if slug exists and make unique
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      ownerEmail,
      members: {
        create: {
          email: ownerEmail,
          role: 'owner',
        },
      },
    },
    include: {
      shops: { select: { id: true } },
      members: { select: { id: true } },
    },
  });

  logger.info({ orgId: org.id, ownerEmail }, 'Organization created');

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    ownerEmail: org.ownerEmail,
    plan: org.plan,
    maxStores: org.maxStores,
    storesCount: org.shops.length,
    membersCount: org.members.length,
    createdAt: org.createdAt.toISOString(),
  };
}

/**
 * Get organization by shop domain (if shop belongs to an org)
 */
export async function getOrganizationByShop(shopDomain: string): Promise<OrganizationSummary | null> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      organization: {
        include: {
          shops: { select: { id: true } },
          members: { select: { id: true } },
        },
      },
    },
  });

  if (!shop?.organization) {
    return null;
  }

  const org = shop.organization;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    ownerEmail: org.ownerEmail,
    plan: org.plan,
    maxStores: org.maxStores,
    storesCount: org.shops.length,
    membersCount: org.members.length,
    createdAt: org.createdAt.toISOString(),
  };
}

/**
 * Get organization dashboard with all stores
 */
export async function getOrganizationDashboard(
  organizationId: string,
  userEmail: string
): Promise<OrganizationDashboard | null> {
  // Check user has access
  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email: userEmail,
      },
    },
  });

  if (!member) {
    return null;
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      shops: {
        include: {
          productsAudit: {
            select: {
              issues: true,
            },
          },
        },
      },
      members: true,
    },
  });

  if (!org) {
    return null;
  }

  // Build store overviews
  const stores: StoreOverview[] = org.shops.map((shop) => {
    // Count issues from audit data
    let criticalIssues = 0;
    let warningIssues = 0;

    for (const audit of shop.productsAudit) {
      const issues = audit.issues as Array<{ severity: string }>;
      for (const issue of issues) {
        if (issue.severity === 'critical' || issue.severity === 'error') {
          criticalIssues++;
        } else if (issue.severity === 'warning') {
          warningIssues++;
        }
      }
    }

    return {
      id: shop.id,
      shopDomain: shop.shopDomain,
      name: shop.name,
      plan: shop.plan,
      aiScore: shop.aiScore,
      productsCount: shop.productsCount,
      lastAuditAt: shop.lastAuditAt?.toISOString() || null,
      criticalIssues,
      warningIssues,
    };
  });

  // Calculate aggregate metrics
  const totalProducts = stores.reduce((sum, s) => sum + s.productsCount, 0);
  const scoresWithData = stores.filter((s) => s.aiScore !== null);
  const averageScore = scoresWithData.length > 0
    ? Math.round(scoresWithData.reduce((sum, s) => sum + (s.aiScore || 0), 0) / scoresWithData.length)
    : 0;
  const totalCriticalIssues = stores.reduce((sum, s) => sum + s.criticalIssues, 0);
  const totalWarningIssues = stores.reduce((sum, s) => sum + s.warningIssues, 0);
  const storesNeedingAttention = stores.filter(
    (s) => s.criticalIssues > 0 || (s.aiScore !== null && s.aiScore < 50)
  ).length;

  return {
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      ownerEmail: org.ownerEmail,
      plan: org.plan,
      maxStores: org.maxStores,
      storesCount: stores.length,
      membersCount: org.members.length,
      createdAt: org.createdAt.toISOString(),
    },
    stores,
    aggregateMetrics: {
      totalProducts,
      averageScore,
      totalCriticalIssues,
      totalWarningIssues,
      storesNeedingAttention,
    },
    members: org.members.map((m) => ({
      email: m.email,
      name: m.name,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    })),
  };
}

/**
 * Add a store to an organization
 */
export async function addStoreToOrganization(
  organizationId: string,
  shopDomain: string,
  userEmail: string
): Promise<boolean> {
  // Check user has admin access
  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email: userEmail,
      },
    },
  });

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return false;
  }

  // Check org store limit
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { shops: { select: { id: true } } },
  });

  if (!org || org.shops.length >= org.maxStores) {
    return false;
  }

  // Add store to org
  await prisma.shop.update({
    where: { shopDomain },
    data: { organizationId },
  });

  logger.info({ organizationId, shopDomain }, 'Store added to organization');
  return true;
}

/**
 * Remove a store from an organization
 */
export async function removeStoreFromOrganization(
  organizationId: string,
  shopDomain: string,
  userEmail: string
): Promise<boolean> {
  // Check user has admin access
  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email: userEmail,
      },
    },
  });

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return false;
  }

  // Remove store from org
  await prisma.shop.update({
    where: { shopDomain },
    data: { organizationId: null },
  });

  logger.info({ organizationId, shopDomain }, 'Store removed from organization');
  return true;
}

/**
 * Invite a member to an organization
 */
export async function inviteMember(
  organizationId: string,
  inviterEmail: string,
  email: string,
  role: OrgRole
): Promise<string | null> {
  // Check inviter has permission
  const inviter = await prisma.organizationMember.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email: inviterEmail,
      },
    },
  });

  if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
    return null;
  }

  // Check if already a member
  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email,
      },
    },
  });

  if (existingMember) {
    return null;
  }

  // Create invite
  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId,
      email,
      role,
      invitedBy: inviterEmail,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  logger.info({ organizationId, email, role }, 'Member invited');
  return invite.token;
}

/**
 * Accept an invite
 */
export async function acceptInvite(token: string, name?: string): Promise<boolean> {
  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
  });

  if (!invite || invite.expiresAt < new Date()) {
    return false;
  }

  // Create member
  await prisma.organizationMember.create({
    data: {
      organizationId: invite.organizationId,
      email: invite.email,
      role: invite.role,
      name,
    },
  });

  // Delete invite
  await prisma.organizationInvite.delete({
    where: { id: invite.id },
  });

  logger.info({ token, email: invite.email }, 'Invite accepted');
  return true;
}

/**
 * Update member role
 */
export async function updateMemberRole(
  organizationId: string,
  adminEmail: string,
  memberEmail: string,
  newRole: OrgRole
): Promise<boolean> {
  // Check admin has permission
  const admin = await prisma.organizationMember.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email: adminEmail,
      },
    },
  });

  if (!admin || admin.role !== 'owner') {
    return false;
  }

  // Can't change own role if owner
  if (adminEmail === memberEmail && admin.role === 'owner') {
    return false;
  }

  await prisma.organizationMember.update({
    where: {
      organizationId_email: {
        organizationId,
        email: memberEmail,
      },
    },
    data: { role: newRole },
  });

  logger.info({ organizationId, memberEmail, newRole }, 'Member role updated');
  return true;
}

/**
 * Remove a member from organization
 */
export async function removeMember(
  organizationId: string,
  adminEmail: string,
  memberEmail: string
): Promise<boolean> {
  // Check admin has permission
  const admin = await prisma.organizationMember.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email: adminEmail,
      },
    },
  });

  if (!admin || !['owner', 'admin'].includes(admin.role)) {
    return false;
  }

  // Can't remove owner
  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email: memberEmail,
      },
    },
  });

  if (!member || member.role === 'owner') {
    return false;
  }

  await prisma.organizationMember.delete({
    where: {
      organizationId_email: {
        organizationId,
        email: memberEmail,
      },
    },
  });

  logger.info({ organizationId, memberEmail }, 'Member removed');
  return true;
}
