/**
 * Team Management Service
 * Teams, roles, and member management for enterprise plans
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';
import crypto from 'crypto';

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Team {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  ownerId: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface TeamInvite {
  id: string;
  email: string;
  role: TeamRole;
  teamId: string;
  expiresAt: Date;
  token: string;
}

/**
 * Create a new team
 */
export async function createTeam(
  name: string,
  ownerId: string
): Promise<Team | null> {
  try {
    // Check if user has enterprise plan
    const user = await prisma.universalUser.findUnique({
      where: { id: ownerId },
      select: { plan: true },
    });

    if (user?.plan !== 'ENTERPRISE' && user?.plan !== 'BUSINESS') {
      logger.warn({ ownerId }, 'User does not have team access');
      return null;
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const team = await prisma.team.create({
      data: {
        name,
        slug: `${slug}-${crypto.randomBytes(3).toString('hex')}`,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'owner',
          },
        },
      },
    });

    logger.info({ teamId: team.id, ownerId }, 'Team created');
    return team;
  } catch (error) {
    logger.error({ error, ownerId }, 'Failed to create team');
    return null;
  }
}

/**
 * Get team by ID
 */
export async function getTeam(teamId: string): Promise<Team | null> {
  try {
    return await prisma.team.findUnique({
      where: { id: teamId },
    });
  } catch (error) {
    logger.error({ error, teamId }, 'Failed to get team');
    return null;
  }
}

/**
 * Get all teams for a user
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: { team: true },
    });

    return memberships.map((m) => m.team);
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get user teams');
    return [];
  }
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      teamId: m.teamId,
      role: m.role as TeamRole,
      user: m.user,
    }));
  } catch (error) {
    logger.error({ error, teamId }, 'Failed to get team members');
    return [];
  }
}

/**
 * Check if user is team member
 */
export async function isTeamMember(
  userId: string,
  teamId: string
): Promise<TeamRole | null> {
  try {
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return member?.role as TeamRole || null;
  } catch (error) {
    logger.error({ error, userId, teamId }, 'Failed to check team membership');
    return null;
  }
}

/**
 * Invite a user to a team
 */
export async function inviteToTeam(
  teamId: string,
  email: string,
  role: TeamRole,
  invitedBy: string
): Promise<TeamInvite | null> {
  try {
    // Check if inviter has permission
    const inviterRole = await isTeamMember(invitedBy, teamId);
    if (!inviterRole || (inviterRole !== 'owner' && inviterRole !== 'admin')) {
      logger.warn({ invitedBy, teamId }, 'User cannot invite to team');
      return null;
    }

    // Check if user is already a member
    const existingUser = await prisma.universalUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await isTeamMember(existingUser.id, teamId);
      if (existingMember) {
        logger.warn({ email, teamId }, 'User is already a team member');
        return null;
      }
    }

    // Create invite
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email,
        role,
        token,
        expiresAt,
        invitedBy,
      },
    });

    // In production, would send email here
    logger.info({ email, teamId }, 'Team invite created');

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role as TeamRole,
      teamId: invite.teamId,
      expiresAt: invite.expiresAt,
      token: invite.token,
    };
  } catch (error) {
    logger.error({ error, teamId, email }, 'Failed to create team invite');
    return null;
  }
}

/**
 * Accept a team invite
 */
export async function acceptInvite(
  token: string,
  userId: string
): Promise<boolean> {
  try {
    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invite) {
      logger.warn({ token }, 'Invite not found');
      return false;
    }

    if (invite.expiresAt < new Date()) {
      logger.warn({ token }, 'Invite expired');
      return false;
    }

    // Check if user email matches invite
    const user = await prisma.universalUser.findUnique({
      where: { id: userId },
    });

    if (!user || user.email !== invite.email) {
      logger.warn({ userId, inviteEmail: invite.email }, 'Email mismatch');
      return false;
    }

    // Add user to team
    await prisma.teamMember.create({
      data: {
        userId,
        teamId: invite.teamId,
        role: invite.role,
      },
    });

    // Delete invite
    await prisma.teamInvite.delete({
      where: { id: invite.id },
    });

    logger.info({ userId, teamId: invite.teamId }, 'Team invite accepted');
    return true;
  } catch (error) {
    logger.error({ error, token }, 'Failed to accept team invite');
    return false;
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  teamId: string,
  memberId: string,
  newRole: TeamRole,
  updatedBy: string
): Promise<boolean> {
  try {
    // Check if updater has permission
    const updaterRole = await isTeamMember(updatedBy, teamId);
    if (!updaterRole || updaterRole !== 'owner') {
      logger.warn({ updatedBy, teamId }, 'User cannot update roles');
      return false;
    }

    // Can't change owner role
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (member?.role === 'owner') {
      logger.warn({ memberId }, 'Cannot change owner role');
      return false;
    }

    await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    logger.info({ memberId, newRole }, 'Member role updated');
    return true;
  } catch (error) {
    logger.error({ error, memberId }, 'Failed to update member role');
    return false;
  }
}

/**
 * Remove member from team
 */
export async function removeMember(
  teamId: string,
  memberId: string,
  removedBy: string
): Promise<boolean> {
  try {
    // Check if remover has permission
    const removerRole = await isTeamMember(removedBy, teamId);
    if (!removerRole || (removerRole !== 'owner' && removerRole !== 'admin')) {
      logger.warn({ removedBy, teamId }, 'User cannot remove members');
      return false;
    }

    // Can't remove owner
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (member?.role === 'owner') {
      logger.warn({ memberId }, 'Cannot remove owner');
      return false;
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    logger.info({ memberId, teamId }, 'Member removed from team');
    return true;
  } catch (error) {
    logger.error({ error, memberId }, 'Failed to remove member');
    return false;
  }
}

/**
 * Get team brands (brands shared with team)
 */
export async function getTeamBrands(teamId: string): Promise<string[]> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        brands: {
          select: { id: true },
        },
      },
    });

    return team?.brands.map((b) => b.id) || [];
  } catch (error) {
    logger.error({ error, teamId }, 'Failed to get team brands');
    return [];
  }
}

/**
 * Share a brand with a team
 */
export async function shareBrandWithTeam(
  brandId: string,
  teamId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if user owns the brand
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId },
    });

    if (!brand) {
      logger.warn({ brandId, userId }, 'User does not own brand');
      return false;
    }

    // Check if user is team member
    const role = await isTeamMember(userId, teamId);
    if (!role) {
      logger.warn({ userId, teamId }, 'User is not team member');
      return false;
    }

    await prisma.brand.update({
      where: { id: brandId },
      data: {
        teamId,
      },
    });

    logger.info({ brandId, teamId }, 'Brand shared with team');
    return true;
  } catch (error) {
    logger.error({ error, brandId, teamId }, 'Failed to share brand');
    return false;
  }
}
