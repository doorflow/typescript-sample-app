/**
 * Single Member API Route - Get, Update, Delete CRM Members
 *
 * GET /api/members/[id] - Get a single member
 * PUT /api/members/[id] - Update a member (and sync groups to DoorFlow if teams change)
 * DELETE /api/members/[id] - Delete a member
 */

import { NextRequest, NextResponse } from 'next/server';
import { MemberStorage } from '@/lib/members/storage';
import { TeamStorage } from '@/lib/teams/storage';
import { doorflow } from '@/lib/doorflow/token-manager';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Sync a member's DoorFlow groups based on their team memberships.
 * This is called automatically when a member's teams are updated.
 */
async function syncMemberGroupsToDoorFlow(
  doorflowPersonId: number,
  teamIds: string[]
): Promise<void> {
  // Get the DoorFlow group IDs for the member's teams
  const groupIds = await TeamStorage.getDoorflowGroupIdsForTeams(teamIds);

  // Update the person's groups in DoorFlow
  await doorflow.people.updatePerson({
    id: doorflowPersonId,
    personInput: {
      groupIds,
    },
  });

  console.log(
    `[Member API] Synced person ${doorflowPersonId} to groups: [${groupIds.join(', ')}]`
  );
}

/**
 * GET /api/members/[id]
 * Get a single CRM member by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const member = await MemberStorage.get(id);

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('[Member API] Error getting member:', error);
    return NextResponse.json(
      { error: 'Failed to get member' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/members/[id]
 * Update a CRM member.
 *
 * Body: Partial member fields to update
 * - firstName?: string
 * - lastName?: string
 * - email?: string
 * - phone?: string
 * - membershipType?: 'standard' | 'premium'
 * - teamIds?: string[] (updates teams and syncs groups to DoorFlow)
 * - doorflowPersonId?: number | null (to link/unlink from DoorFlow)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if member exists
    const existing = await MemberStorage.get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // If changing email, check for duplicates
    if (body.email && body.email !== existing.email) {
      const emailExists = await MemberStorage.getByEmail(body.email);
      if (emailExists) {
        return NextResponse.json(
          { error: 'A member with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Check if teams are being updated
    const teamsChanging = body.teamIds !== undefined;
    const newTeamIds = body.teamIds ?? existing.teamIds ?? [];

    // Update the member in our CRM
    const updated = await MemberStorage.update(id, body);

    // If teams changed and member is linked to DoorFlow, sync groups
    if (teamsChanging && updated?.doorflowPersonId) {
      // Check if we're connected to DoorFlow
      const isConnected = await doorflow.isAuthenticated();
      if (isConnected) {
        try {
          await syncMemberGroupsToDoorFlow(updated.doorflowPersonId, newTeamIds);
        } catch (syncError) {
          // Log but don't fail the request - CRM update succeeded
          console.error('[Member API] Failed to sync groups to DoorFlow:', syncError);
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Member API] Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/members/[id]
 * Delete a CRM member and their corresponding DoorFlow person.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get the member first to check if they're linked to DoorFlow
    const member = await MemberStorage.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // If linked to DoorFlow, delete the person there first
    if (member.doorflowPersonId) {
      const isConnected = await doorflow.isAuthenticated();
      if (isConnected) {
        try {
          await doorflow.people.deletePerson({ id: member.doorflowPersonId });
          console.log(
            `[Member API] Deleted DoorFlow person ${member.doorflowPersonId}`
          );
        } catch (doorflowError) {
          // Log but don't fail - still delete the CRM member
          console.error(
            '[Member API] Failed to delete DoorFlow person:',
            doorflowError
          );
        }
      }
    }

    // Delete from CRM
    await MemberStorage.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Member API] Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
