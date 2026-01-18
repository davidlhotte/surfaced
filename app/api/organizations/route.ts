import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { prisma } from '@/lib/db/prisma';
import {
  createOrganization,
  getOrganizationByShop,
  getOrganizationDashboard,
  addStoreToOrganization,
  removeStoreFromOrganization,
  inviteMember,
  acceptInvite,
  updateMemberRole,
  removeMember,
} from '@/lib/services/multi-store';
import type { OrgRole } from '@prisma/client';

/**
 * GET /api/organizations
 * Get organization info for current shop
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get org for current shop
    const org = await getOrganizationByShop(shopDomain);

    if (action === 'dashboard' && org) {
      // Get shop email for permission check
      const shop = await prisma.shop.findUnique({
        where: { shopDomain },
        select: { email: true },
      });

      if (shop?.email) {
        const dashboard = await getOrganizationDashboard(org.id, shop.email);
        return NextResponse.json({
          success: true,
          data: dashboard,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { organization: org },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/organizations
 * Create or manage organizations
 */
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });
    const body = await request.json();
    const { action } = body;

    // Get shop info
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { id: true, email: true, organizationId: true },
    });

    if (!shop?.email) {
      return NextResponse.json(
        { success: false, error: 'Shop email not found' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create': {
        const { name } = body;
        if (!name) {
          return NextResponse.json(
            { success: false, error: 'Organization name is required' },
            { status: 400 }
          );
        }

        const org = await createOrganization(name, shop.email);

        // Add current shop to org
        await addStoreToOrganization(org.id, shopDomain, shop.email);

        return NextResponse.json({ success: true, data: org });
      }

      case 'add-store': {
        const { organizationId, targetShopDomain } = body;
        if (!organizationId || !targetShopDomain) {
          return NextResponse.json(
            { success: false, error: 'Organization ID and shop domain required' },
            { status: 400 }
          );
        }

        const result = await addStoreToOrganization(organizationId, targetShopDomain, shop.email);
        return NextResponse.json({
          success: result,
          error: result ? undefined : 'Failed to add store',
        });
      }

      case 'remove-store': {
        const { organizationId, targetShopDomain } = body;
        if (!organizationId || !targetShopDomain) {
          return NextResponse.json(
            { success: false, error: 'Organization ID and shop domain required' },
            { status: 400 }
          );
        }

        const result = await removeStoreFromOrganization(organizationId, targetShopDomain, shop.email);
        return NextResponse.json({
          success: result,
          error: result ? undefined : 'Failed to remove store',
        });
      }

      case 'invite': {
        const { organizationId, email, role } = body;
        if (!organizationId || !email) {
          return NextResponse.json(
            { success: false, error: 'Organization ID and email required' },
            { status: 400 }
          );
        }

        const token = await inviteMember(
          organizationId,
          shop.email,
          email,
          (role as OrgRole) || 'viewer'
        );

        if (!token) {
          return NextResponse.json(
            { success: false, error: 'Failed to invite member' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: { token, inviteUrl: `/org/invite/${token}` },
        });
      }

      case 'accept-invite': {
        const { token, name } = body;
        if (!token) {
          return NextResponse.json(
            { success: false, error: 'Invite token required' },
            { status: 400 }
          );
        }

        const result = await acceptInvite(token, name);
        return NextResponse.json({
          success: result,
          error: result ? undefined : 'Invalid or expired invite',
        });
      }

      case 'update-role': {
        const { organizationId, memberEmail, role } = body;
        if (!organizationId || !memberEmail || !role) {
          return NextResponse.json(
            { success: false, error: 'Organization ID, member email, and role required' },
            { status: 400 }
          );
        }

        const result = await updateMemberRole(
          organizationId,
          shop.email,
          memberEmail,
          role as OrgRole
        );
        return NextResponse.json({
          success: result,
          error: result ? undefined : 'Failed to update role',
        });
      }

      case 'remove-member': {
        const { organizationId, memberEmail } = body;
        if (!organizationId || !memberEmail) {
          return NextResponse.json(
            { success: false, error: 'Organization ID and member email required' },
            { status: 400 }
          );
        }

        const result = await removeMember(organizationId, shop.email, memberEmail);
        return NextResponse.json({
          success: result,
          error: result ? undefined : 'Failed to remove member',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
