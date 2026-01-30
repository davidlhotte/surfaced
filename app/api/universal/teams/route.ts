import { NextRequest, NextResponse } from 'next/server';
import { verifyUniversalSession } from '@/lib/auth/universal-session';
import {
  createTeam,
  getUserTeams,
  getTeamMembers,
  inviteToTeam,
  acceptInvite,
  updateMemberRole,
  removeMember,
  shareBrandWithTeam,
  isTeamMember,
  TeamRole,
} from '@/lib/services/universal/teams';
import { logger } from '@/lib/monitoring/logger';

// GET - Get user's teams
export async function GET(request: NextRequest) {
  try {
    const session = await verifyUniversalSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Get team members
      const role = await isTeamMember(session.userId, teamId);
      if (!role) {
        return NextResponse.json(
          { error: 'Not a team member' },
          { status: 403 }
        );
      }

      const members = await getTeamMembers(teamId);
      return NextResponse.json({
        success: true,
        members,
        yourRole: role,
      });
    }

    // Get all user's teams
    const teams = await getUserTeams(session.userId);
    return NextResponse.json({
      success: true,
      teams,
    });
  } catch (error) {
    logger.error({ error }, 'Get teams error');
    return NextResponse.json(
      { error: 'Failed to get teams' },
      { status: 500 }
    );
  }
}

// POST - Create team or perform team actions
export async function POST(request: NextRequest) {
  try {
    const session = await verifyUniversalSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check plan
    if (session.plan !== 'ENTERPRISE' && session.plan !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Team features require Business or Enterprise plan' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const { name } = body;
        if (!name) {
          return NextResponse.json(
            { error: 'Team name is required' },
            { status: 400 }
          );
        }

        const team = await createTeam(name, session.userId);
        if (!team) {
          return NextResponse.json(
            { error: 'Failed to create team' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          team,
        });
      }

      case 'invite': {
        const { teamId, email, role } = body;
        if (!teamId || !email) {
          return NextResponse.json(
            { error: 'Team ID and email are required' },
            { status: 400 }
          );
        }

        const invite = await inviteToTeam(
          teamId,
          email,
          (role as TeamRole) || 'member',
          session.userId
        );

        if (!invite) {
          return NextResponse.json(
            { error: 'Failed to create invite' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          invite: {
            id: invite.id,
            email: invite.email,
            role: invite.role,
            expiresAt: invite.expiresAt,
          },
        });
      }

      case 'accept-invite': {
        const { token } = body;
        if (!token) {
          return NextResponse.json(
            { error: 'Invite token is required' },
            { status: 400 }
          );
        }

        const success = await acceptInvite(token, session.userId);
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to accept invite' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Invite accepted',
        });
      }

      case 'update-role': {
        const { teamId, memberId, role } = body;
        if (!teamId || !memberId || !role) {
          return NextResponse.json(
            { error: 'Team ID, member ID, and role are required' },
            { status: 400 }
          );
        }

        const success = await updateMemberRole(
          teamId,
          memberId,
          role as TeamRole,
          session.userId
        );

        if (!success) {
          return NextResponse.json(
            { error: 'Failed to update role' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Role updated',
        });
      }

      case 'remove-member': {
        const { teamId, memberId } = body;
        if (!teamId || !memberId) {
          return NextResponse.json(
            { error: 'Team ID and member ID are required' },
            { status: 400 }
          );
        }

        const success = await removeMember(teamId, memberId, session.userId);
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to remove member' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Member removed',
        });
      }

      case 'share-brand': {
        const { teamId, brandId } = body;
        if (!teamId || !brandId) {
          return NextResponse.json(
            { error: 'Team ID and brand ID are required' },
            { status: 400 }
          );
        }

        const success = await shareBrandWithTeam(
          brandId,
          teamId,
          session.userId
        );

        if (!success) {
          return NextResponse.json(
            { error: 'Failed to share brand' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Brand shared with team',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error({ error }, 'Team action error');
    return NextResponse.json(
      { error: 'Failed to process team action' },
      { status: 500 }
    );
  }
}
