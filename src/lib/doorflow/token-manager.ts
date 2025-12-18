/**
 * DoorFlow Client
 *
 * Shared DoorFlow client instance for the application.
 * Uses the unified DoorFlow class with file-based token storage.
 *
 * SECURITY NOTES:
 * - This file should ONLY be imported in server-side code (API routes, Server Components)
 * - NEVER import this in client components or expose tokens to the browser
 */

import { DoorFlow, DoorFlowAuth, FileTokenStorage } from 'doorflow';
import path from 'path';

// Token storage in the data directory
const DATA_DIR = path.join(process.cwd(), 'data');
const TOKENS_PATH = path.join(DATA_DIR, 'tokens.json');

// Shared token storage instance
const tokenStorage = new FileTokenStorage(TOKENS_PATH);

// Shared auth options
const authOptions = {
  clientId: process.env.DOORFLOW_CLIENT_ID!,
  clientSecret: process.env.DOORFLOW_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`,
  storage: tokenStorage,
  scopes: ['account.person', 'account.channel.readonly', 'account.event.access.readonly'],
  basePath: process.env.DOORFLOW_API_URL || 'https://api.doorflow.com',
};

/**
 * Shared DoorFlow client instance.
 *
 * Provides access to all DoorFlow APIs as properties:
 * - doorflow.people
 * - doorflow.credentials
 * - doorflow.credentialTypes
 * - doorflow.groups
 * - doorflow.events
 * - doorflow.channels
 * - etc.
 *
 * Also provides auth methods:
 * - doorflow.isAuthenticated()
 * - doorflow.getAuthorizationUrl()
 * - doorflow.handleCallback()
 * - doorflow.disconnect()
 */
export const doorflow = new DoorFlow(authOptions);

/**
 * Shared DoorFlowAuth instance for advanced auth operations.
 *
 * Use this when you need direct access to auth methods like:
 * - doorflowAuth.refreshAccessToken() - Force a token refresh
 * - doorflowAuth.getTokenInfo() - Get token metadata
 */
export const doorflowAuth = new DoorFlowAuth(authOptions);
