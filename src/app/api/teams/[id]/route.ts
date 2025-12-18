/**
 * CRM Single Team API
 *
 * GET /api/teams/[id] - Get a team
 * PUT /api/teams/[id] - Update a team (syncs affected members to DoorFlow if group mapping changes)
 * DELETE /api/teams/[id] - Delete a team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTeam, updateTeam, deleteTeam } from '@/lib/teams/storage';
import { MemberStorage } from '@/lib/members/storage';
import { TeamStorage } from '@/lib/teams/storage';
import { doorflow } from '@/lib/doorflow/token-manager';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Sync a member's DoorFlow groups based on their team memberships.
 */
async function syncMemberGroupsToDoorFlow(
  doorflowPersonId: number,
  teamIds: string[]
): Promise<void> {
  const groupIds = await TeamStorage.getDoorflowGroupIdsForTeams(teamIds);

  await doorflow.people.updatePerson({
    id: doorflowPersonId,
    personInput: {
      groupIds,
    },
  });

  console.log(
    `[Teams API] Synced person ${doorflowPersonId} to groups: [${groupIds.join(', ')}]`
  );
}

/**
 * Sync all members of a team to DoorFlow.
 * Called when a team's group mapping changes.
 */
async function syncTeamMembersToDoorFlow(teamId: string): Promise<number> {
  const members = await MemberStorage.loadAll();
  const teamMembers = members.filter(
    (m) => m.teamIds?.includes(teamId) && m.doorflowPersonId
  );

  let syncedCount = 0;
  for (const member of teamMembers) {
    try {
      await syncMemberGroupsToDoorFlow(
        member.doorflowPersonId!,
        member.teamIds || []
      );
      syncedCount++;
    } catch (err) {
      console.error(
        `[Teams API] Failed to sync member ${member.id} to DoorFlow:`,
        err
      );
    }
  }

  return syncedCount;
}

/**
 * GET /api/teams/[id]
 *
 * Get a single team by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const team = await getTeam(id);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('[Teams] Error getting team:', error);
    return NextResponse.json(
      { error: 'Failed to get team' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams/[id]
 *
 * Update a team. If the DoorFlow group mapping changes, all members
 * of this team will have their DoorFlow groups updated automatically.
 *
 * Body:
 * - name?: string
 * - description?: string
 * - doorflowGroupId?: number | null (null to unmap)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get existing team to check if group mapping is changing
    const existingTeam = await getTeam(id);
    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Build updates object
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (!body.name?.trim()) {
        return NextResponse.json(
          { error: 'Team name cannot be empty' },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || undefined;
    }

    // Check if group mapping is changing
    const groupMappingChanging =
      body.doorflowGroupId !== undefined &&
      body.doorflowGroupId !== existingTeam.doorflowGroupId;

    if (body.doorflowGroupId !== undefined) {
      updates.doorflowGroupId = body.doorflowGroupId;
    }

    const team = await updateTeam(id, updates);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // If group mapping changed, sync all team members to DoorFlow
    if (groupMappingChanging) {
      const isConnected = await doorflow.isAuthenticated();
      if (isConnected) {
        try {
          const syncedCount = await syncTeamMembersToDoorFlow(id);
          console.log(
            `[Teams API] Team ${id} group mapping changed, synced ${syncedCount} members to DoorFlow`
          );
        } catch (syncError) {
          // Log but don't fail - team update succeeded
          console.error('[Teams API] Failed to sync team members:', syncError);
        }
      }
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('[Teams] Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]
 *
 * Delete a team.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await deleteTeam(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Teams] Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
