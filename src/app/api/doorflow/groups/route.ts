/**
 * DoorFlow Groups API Proxy
 *
 * GET /api/doorflow/groups - List all groups
 *
 * Groups in DoorFlow control access permissions.
 * People are assigned to groups, and groups have roles that
 * determine which doors/channels they can access.
 */

import { NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';
import { ResponseError } from 'doorflow';

/**
 * GET /api/doorflow/groups
 *
 * List all groups from DoorFlow.
 *
 * Groups have two types:
 * - static: Manually managed membership
 * - dynamic: Membership based on LDAP/AD rules
 *
 * SDK METHOD: GroupsApi.listGroups()
 */
export async function GET() {
  try {
    // SDK CALL: List all groups
    const groups = await doorflow.groups.listGroups({});

    return NextResponse.json(groups);
  } catch (error) {
    console.error('[DoorFlow Groups] Error listing groups:', error);

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

    return NextResponse.json(
      { error: 'Failed to list groups' },
      { status: 500 }
    );
  }
}
