/**
 * Member Sync API Route - Match CRM Members with DoorFlow People
 *
 * POST /api/members/sync - Execute sync operation
 *
 * NOTE: This is NOT the DoorFlow /api/sync endpoint (which syncs config to hardware).
 * This syncs your local CRM members to DoorFlow people records.
 *
 * This is the core integration logic that:
 * 1. Loads all CRM members
 * 2. Loads all DoorFlow people
 * 3. Matches them by email address
 * 4. Optionally creates DoorFlow people for unmatched members
 * 5. Updates CRM records with DoorFlow IDs
 * 6. Assigns DoorFlow groups based on team memberships
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { doorflow } from '@/lib/doorflow/token-manager';
import { MemberStorage } from '@/lib/members/storage';
import { TeamStorage } from '@/lib/teams/storage';
import { ResponseError, type PeopleApi } from 'doorflow';
import type { SyncResult, CrmMember } from '@/lib/types';

/**
 * Get base64-encoded photo for a member if one exists.
 * Photos are stored in public/photos/{firstname}_{lastname}.png
 */
async function getMemberPhotoBase64(member: CrmMember): Promise<string | null> {
  const photoName = `${member.firstName.toLowerCase()}_${member.lastName.toLowerCase()}.png`;
  const photoPath = path.join(process.cwd(), 'public', 'photos', photoName);

  try {
    const imageBuffer = await readFile(photoPath);
    return imageBuffer.toString('base64');
  } catch {
    // Photo doesn't exist for this member
    return null;
  }
}

/**
 * POST /api/members/sync
 *
 * Execute a sync operation between CRM members and DoorFlow people.
 *
 * Body:
 * - createMissing: boolean - If true, create DoorFlow people for unmatched members
 * - dryRun: boolean - If true, don't actually create people, just show what would happen
 *
 * Returns a SyncResult with:
 * - matched: Members matched to existing DoorFlow people
 * - created: Members with newly created DoorFlow people
 * - unmatched: Members that couldn't be matched (and weren't created)
 * - errors: Members that failed to sync with error messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { createMissing = false, dryRun = false } = body;

    // -------------------------------------------------------------------------
    // Step 1: Load all CRM members and teams
    // -------------------------------------------------------------------------
    const members = await MemberStorage.loadAll();
    const teams = await TeamStorage.loadAll();

    // Build a map from team ID to DoorFlow group ID for quick lookups
    const teamToGroupMap = new Map<string, number>();
    for (const team of teams) {
      if (team.doorflowGroupId != null) {
        teamToGroupMap.set(team.id, team.doorflowGroupId);
      }
    }

    // -------------------------------------------------------------------------
    // Step 2: Load all DoorFlow people
    // -------------------------------------------------------------------------
    // SDK CALL: List all people from DoorFlow
    // skipPagination=true returns all results in one request
    const doorflowPeople = await doorflow.people.listPeople({
      skipPagination: true,
    });

    // -------------------------------------------------------------------------
    // Step 3: Build email lookup map for DoorFlow people
    // -------------------------------------------------------------------------
    // This allows O(1) lookups when matching by email
    const peopleByEmail = new Map(
      doorflowPeople
        .filter((p) => p.email)
        .map((p) => [p.email!.toLowerCase(), p])
    );

    // -------------------------------------------------------------------------
    // Step 4: Process each CRM member
    // -------------------------------------------------------------------------
    const results: SyncResult = {
      matched: [],
      created: [],
      unmatched: [],
      errors: [],
    };

    for (const member of members) {
      // Skip members that are already linked
      if (member.doorflowPersonId) {
        // Verify the link is still valid
        const existingPerson = doorflowPeople.find(
          (p) => p.id === member.doorflowPersonId
        );
        if (existingPerson) {
          results.matched.push({
            member,
            personId: member.doorflowPersonId,
          });
        } else {
          // Person was deleted in DoorFlow - unlink
          if (!dryRun) {
            await MemberStorage.update(member.id, { doorflowPersonId: null });
          }
          // Try to rematch by email
          const photoBase64 = await getMemberPhotoBase64(member);
          await tryMatchMember(
            member,
            peopleByEmail,
            results,
            createMissing,
            dryRun,
            doorflow.people,
            teamToGroupMap,
            photoBase64
          );
        }
        continue;
      }

      // Try to match unlinked member
      const photoBase64 = await getMemberPhotoBase64(member);
      await tryMatchMember(
        member,
        peopleByEmail,
        results,
        createMissing,
        dryRun,
        doorflow.people,
        teamToGroupMap,
        photoBase64
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('[Sync API] Error during sync:', error);

    // Log more details for debugging
    if (error instanceof ResponseError) {
      console.error('[Sync API] Response status:', error.response.status);
      try {
        const body = await error.response.text();
        console.error('[Sync API] Response body:', body);
      } catch {}
    }

    if (error instanceof ResponseError) {
      if (error.response.status === 401) {
        return NextResponse.json(
          { error: 'Not authenticated. Please connect to DoorFlow first.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `DoorFlow API error: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

/**
 * Get DoorFlow group IDs for a member based on their team memberships.
 */
function getGroupIdsForMember(
  member: CrmMember,
  teamToGroupMap: Map<string, number>
): number[] {
  const groupIds: number[] = [];
  for (const teamId of member.teamIds || []) {
    const groupId = teamToGroupMap.get(teamId);
    if (groupId != null) {
      groupIds.push(groupId);
    }
  }
  return groupIds;
}

/**
 * Try to match a CRM member to a DoorFlow person.
 * If no match is found and createMissing is true, create a new person.
 * Also updates DoorFlow group assignments based on team memberships.
 * Uploads member photo if available.
 */
async function tryMatchMember(
  member: CrmMember,
  peopleByEmail: Map<string, { id: number; email?: string | null }>,
  results: SyncResult,
  createMissing: boolean,
  dryRun: boolean,
  peopleApi: PeopleApi,
  teamToGroupMap: Map<string, number>,
  photoBase64: string | null
): Promise<void> {
  // Try to match by email
  const existingPerson = member.email
    ? peopleByEmail.get(member.email.toLowerCase())
    : null;

  // Get the DoorFlow group IDs based on team memberships
  const groupIds = getGroupIdsForMember(member, teamToGroupMap);

  if (existingPerson) {
    // Found a match by email - link them and update groups
    if (!dryRun) {
      await MemberStorage.update(member.id, {
        doorflowPersonId: existingPerson.id,
      });

      // Update the person's group assignments and photo in DoorFlow
      if (groupIds.length > 0 || photoBase64) {
        try {
          // SDK CALL: Update person's group assignments and photo
          await peopleApi.updatePerson({
            id: existingPerson.id,
            personInput: {
              ...(groupIds.length > 0 && { groupIds }),
              ...(photoBase64 && { imageBase64: photoBase64 }),
            },
          });
        } catch (err) {
          console.error(
            `[Sync] Failed to update person ${existingPerson.id}:`,
            err
          );
        }
      }
    }
    results.matched.push({
      member: { ...member, doorflowPersonId: existingPerson.id },
      personId: existingPerson.id,
    });
  } else if (createMissing) {
    // No match found - create a new person in DoorFlow
    if (dryRun) {
      // In dry run mode, just report what would be created
      results.created.push({
        member,
        personId: 0, // Placeholder for dry run
      });
    } else {
      try {
        // SDK CALL: Create a new person in DoorFlow with group assignments and photo
        // Maps CRM member fields to DoorFlow person fields
        // @see https://developer.doorflow.com/api-ref/doorflow/createperson
        const newPerson = await peopleApi.createPerson({
          personInput: {
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email || null,
            telephone: member.phone || null,
            department: member.department || null,
            jobTitle: member.jobTitle || null,
            notes: member.notes || null,
            organisationId: member.organisationId || null,
            // Store membership type in custom field
            custom1: member.membershipType,
            enabled: true,
            // Store the CRM member ID in systemId for reverse lookups
            systemId: member.id,
            // Assign to groups based on team memberships
            groupIds: groupIds.length > 0 ? groupIds : undefined,
            // Upload member photo if available
            imageBase64: photoBase64 || undefined,
          },
        });

        // Update CRM record with DoorFlow ID
        await MemberStorage.update(member.id, {
          doorflowPersonId: newPerson.id,
        });

        results.created.push({
          member: { ...member, doorflowPersonId: newPerson.id },
          personId: newPerson.id,
        });
      } catch (err) {
        // Record the error but continue processing other members
        results.errors.push({
          member,
          error: err instanceof Error ? err.message : 'Failed to create person',
        });
      }
    }
  } else {
    // No match and not creating - add to unmatched
    results.unmatched.push(member);
  }
}
