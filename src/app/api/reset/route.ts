/**
 * Factory Reset Route
 *
 * POST /api/reset
 *
 * Resets the application to its initial demo state:
 * - Revokes OAuth tokens and disconnects from DoorFlow
 * - Restores sample members (without DoorFlow links)
 * - Restores sample teams (without DoorFlow group mappings)
 */

import { NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';
import { resetMembers } from '@/lib/members/storage';
import { resetTeams } from '@/lib/teams/storage';

export async function POST() {
  try {
    // 1. Disconnect from DoorFlow (revokes tokens + clears storage)
    try {
      await doorflow.disconnect();
      console.log('[Factory Reset] Disconnected from DoorFlow');
    } catch (error) {
      // Continue even if disconnect fails (might not be connected)
      console.log('[Factory Reset] Disconnect skipped:', error instanceof Error ? error.message : 'Not connected');
    }

    // 2. Reset members to sample data
    await resetMembers();
    console.log('[Factory Reset] Members reset to sample data');

    // 3. Reset teams to sample data
    await resetTeams();
    console.log('[Factory Reset] Teams reset to sample data');

    return NextResponse.json({
      success: true,
      message: 'Application reset to demo state',
    });
  } catch (error) {
    console.error('[Factory Reset] Error:', error);

    return NextResponse.json(
      { error: 'Failed to reset application' },
      { status: 500 }
    );
  }
}
