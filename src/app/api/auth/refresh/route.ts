/**
 * Token Refresh API Route
 *
 * POST /api/auth/refresh - Force a token refresh
 *
 * This endpoint demonstrates manual token refresh. In production,
 * the SDK handles this automatically - you rarely need to call this.
 */

import { NextResponse } from 'next/server';
import { doorflowAuth } from '@/lib/doorflow/token-manager';

export async function POST() {
  try {
    // Check if we're connected
    const isConnected = await doorflowAuth.isAuthenticated();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Not connected to DoorFlow' },
        { status: 401 }
      );
    }

    // Force a token refresh
    const tokens = await doorflowAuth.refreshAccessToken();

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: tokens.expiresAt,
    });
  } catch (error) {
    console.error('[Auth Refresh] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to refresh token',
      },
      { status: 500 }
    );
  }
}
