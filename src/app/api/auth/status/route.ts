/**
 * OAuth Status Route - Check Connection Status
 *
 * GET /api/auth/status
 *
 * Uses the DoorFlow client to check connection status.
 * Returns token expiry and scopes when connected.
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { doorflow } from '@/lib/doorflow/token-manager';
import type { ConnectionStatus, StoredTokens } from '@/lib/types';

// Token file path (same as in token-manager.ts)
const TOKENS_PATH = path.join(process.cwd(), 'data', 'tokens.json');

/**
 * Load tokens directly from the file.
 * This is needed because the DoorFlow SDK doesn't expose token info.
 */
async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const data = await fs.readFile(TOKENS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Check if required environment variables are configured
    const missingConfig: string[] = [];
    if (!process.env.DOORFLOW_CLIENT_ID) {
      missingConfig.push('DOORFLOW_CLIENT_ID');
    }
    if (!process.env.DOORFLOW_CLIENT_SECRET) {
      missingConfig.push('DOORFLOW_CLIENT_SECRET');
    }

    const configured = missingConfig.length === 0;

    // If not configured, return early with setup instructions
    if (!configured) {
      const status: ConnectionStatus = {
        connected: false,
        configured: false,
        missingConfig,
      };
      return NextResponse.json(status);
    }

    // Check if we have valid stored tokens
    const connected = await doorflow.isAuthenticated();

    // If connected, get token info for display
    let expiresAt: number | undefined;
    let scope: string | undefined;

    if (connected) {
      const tokens = await loadTokens();
      if (tokens) {
        expiresAt = tokens.expiresAt;
        scope = tokens.scope;
      }
    }

    const status: ConnectionStatus = {
      connected,
      configured: true,
      expiresAt,
      scope,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('[Auth Status] Error checking connection status:', error);

    // Return disconnected status on error
    const status: ConnectionStatus = { connected: false, configured: true };
    return NextResponse.json(status);
  }
}
