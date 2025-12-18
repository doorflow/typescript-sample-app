/**
 * DoorFlow Credential Types API Proxy
 *
 * GET /api/doorflow/credential-types - List available credential types
 *
 * Credential types define what kinds of credentials can be issued
 * (cards, PINs, mobile credentials, etc.)
 */

import { NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';
import { ResponseError } from 'doorflow';

/**
 * GET /api/doorflow/credential-types
 *
 * List all credential types configured in DoorFlow.
 *
 * Common credential types:
 * - Card (various formats like HID, MIFARE, etc.)
 * - PIN (numeric access codes)
 * - Mobile (HID Mobile Access, PassFlow, etc.)
 *
 * Use the ID from these types when creating credentials.
 *
 * SDK METHOD: CredentialTypesApi.listCredentialTypes()
 */
export async function GET() {
  try {
    // SDK CALL: List all credential types
    const credentialTypes = await doorflow.credentialTypes.listCredentialTypes({});

    return NextResponse.json(credentialTypes);
  } catch (error) {
    console.error(
      '[DoorFlow Credential Types] Error listing credential types:',
      error
    );

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
      { error: 'Failed to list credential types' },
      { status: 500 }
    );
  }
}
