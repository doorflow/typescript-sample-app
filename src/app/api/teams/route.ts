/**
 * CRM Teams API
 *
 * GET /api/teams - List all teams
 * POST /api/teams - Create a new team
 *
 * Teams are mapped to DoorFlow groups. When a member belongs to a team,
 * they get assigned to the corresponding DoorFlow group during sync.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadAllTeams, createTeam } from '@/lib/teams/storage';

/**
 * GET /api/teams
 *
 * List all CRM teams.
 */
export async function GET() {
  try {
    const teams = await loadAllTeams();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('[Teams] Error loading teams:', error);
    return NextResponse.json(
      { error: 'Failed to load teams' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams
 *
 * Create a new CRM team.
 *
 * Body:
 * - name: string (required)
 * - description?: string
 * - doorflowGroupId?: number (optional - map to DoorFlow group)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const team = await createTeam({
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      doorflowGroupId: body.doorflowGroupId || null,
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('[Teams] Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
