/**
 * OAuth Callback Route - Exchange Authorization Code for Tokens
 *
 * GET /api/auth/callback?code=xxx&state=xxx
 *
 * Uses the DoorFlow client to exchange the code for tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Check for OAuth errors from DoorFlow
  if (error) {
    console.error('[OAuth Callback] Error from DoorFlow:', error, errorDescription);
    return NextResponse.redirect(
      `${appUrl}/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // Validate state parameter (CSRF protection)
  const storedState = request.cookies.get('oauth_state')?.value;

  if (!state || !code) {
    console.error('[OAuth Callback] Missing code or state');
    return NextResponse.redirect(
      `${appUrl}/?error=invalid_request&error_description=${encodeURIComponent('Missing authorization code or state.')}`
    );
  }

  try {
    // Exchange authorization code for tokens using the SDK
    await doorflow.handleCallback(code, state, storedState);

    console.log('[OAuth Callback] Token exchange successful');

    // Clear state cookie and redirect to settings
    const response = NextResponse.redirect(`${appUrl}/settings?connected=true`);
    response.cookies.delete('oauth_state');

    return response;
  } catch (err) {
    console.error('[OAuth Callback] Token exchange failed:', err);

    const errorMessage =
      err instanceof Error ? err.message : 'Token exchange failed';

    return NextResponse.redirect(
      `${appUrl}/?error=token_exchange_failed&error_description=${encodeURIComponent(errorMessage)}`
    );
  }
}
