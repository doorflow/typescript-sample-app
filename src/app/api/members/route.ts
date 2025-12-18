/**
 * Members API Route - List and Create CRM Members
 *
 * GET /api/members - List all CRM members
 * POST /api/members - Create a new CRM member (also creates DoorFlow person)
 *
 * This manages the LOCAL CRM database (JSON file) and syncs to DoorFlow.
 * When a member is created, a corresponding DoorFlow person is automatically created.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MemberStorage } from '@/lib/members/storage';
import { TeamStorage } from '@/lib/teams/storage';
import { doorflow } from '@/lib/doorflow/token-manager';
import type { CrmMemberInput } from '@/lib/types';

/**
 * GET /api/members
 * Returns all CRM members.
 *
 * Query params:
 * - linked=true: Only return members linked to DoorFlow
 * - linked=false: Only return members NOT linked to DoorFlow
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const linkedParam = searchParams.get('linked');

    let members;

    if (linkedParam === 'true') {
      members = await MemberStorage.getLinked();
    } else if (linkedParam === 'false') {
      members = await MemberStorage.getUnlinked();
    } else {
      members = await MemberStorage.loadAll();
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error('[Members API] Error listing members:', error);
    return NextResponse.json(
      { error: 'Failed to load members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/members
 * Create a new CRM member and automatically create a DoorFlow person.
 *
 * Body:
 * - firstName: string (required)
 * - lastName: string (required)
 * - email: string (required)
 * - phone?: string
 * - membershipType: 'standard' | 'premium'
 * - teamIds?: string[]
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'firstName, lastName, and email are required' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existing = await MemberStorage.getByEmail(body.email);
    if (existing) {
      return NextResponse.json(
        { error: 'A member with this email already exists' },
        { status: 409 }
      );
    }

    const teamIds = body.teamIds || [];
    let doorflowPersonId: number | null = null;

    // If connected to DoorFlow, create the person there first
    const isConnected = await doorflow.isAuthenticated();
    if (isConnected) {
      try {
        // Get DoorFlow group IDs from team memberships
        const groupIds = await TeamStorage.getDoorflowGroupIdsForTeams(teamIds);

        // Create person in DoorFlow using the SDK
        // Maps CRM member fields to DoorFlow person fields
        // @see https://developer.doorflow.com/api-ref/doorflow/createperson
        const doorflowPerson = await doorflow.people.createPerson({
          personInput: {
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            telephone: body.phone || null,
            department: body.department || null,
            jobTitle: body.jobTitle || null,
            notes: body.notes || null,
            organisationId: body.organisationId || null,
            custom1: body.membershipType,
            enabled: true,
            groupIds,
          },
        });

        doorflowPersonId = doorflowPerson.id!;
        console.log(
          `[Members API] Created DoorFlow person ${doorflowPersonId} for ${body.email}`
        );
      } catch (doorflowError) {
        // Log but don't fail - we'll create the CRM member without linking
        console.error(
          '[Members API] Failed to create DoorFlow person:',
          doorflowError
        );
      }
    }

    const input: CrmMemberInput = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      membershipType: body.membershipType || 'standard',
      teamIds,
      doorflowPersonId,
    };

    const member = await MemberStorage.create(input);

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('[Members API] Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}
