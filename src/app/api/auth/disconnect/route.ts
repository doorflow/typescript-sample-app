/**
 * OAuth Disconnect Route - Revoke Tokens and Disconnect
 *
 * POST /api/auth/disconnect
 *
 * Uses the DoorFlow client to revoke tokens and clear storage.
 */

import { NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';

export async function POST() {
  try {
    // Disconnect using the SDK (revokes tokens + clears storage)
    await doorflow.disconnect();

    console.log('[Disconnect] Disconnected from DoorFlow');

    return NextResponse.json({ success: true, message: 'Disconnected from DoorFlow' });
  } catch (error) {
    console.error('[Disconnect] Error disconnecting:', error);

    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
