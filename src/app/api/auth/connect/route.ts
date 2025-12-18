/**
 * OAuth Connect Route - Start the OAuth Authorization Flow
 *
 * GET /api/auth/connect
 *
 * Uses the DoorFlow client to generate the authorization URL.
 */

import { NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';

export async function GET() {
  // Validate that we have the required environment variables
  if (!process.env.DOORFLOW_CLIENT_ID) {
    return NextResponse.json(
      { error: 'DOORFLOW_CLIENT_ID not configured' },
      { status: 500 }
    );
  }

  // Generate authorization URL using the SDK
  const { url, state } = await doorflow.getAuthorizationUrl();

  console.log('[OAuth] Starting authorization flow');

  // Return the URL as JSON so the client can open it
  const response = NextResponse.json({ url });

  // Store state in an HTTP-only cookie for verification in the callback
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
