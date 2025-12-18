/**
 * DoorFlow Credentials API Proxy
 *
 * GET /api/doorflow/credentials - List credentials for a person
 * POST /api/doorflow/credentials - Create a credential for a person
 *
 * API Reference: https://developer.doorflow.com/docs/categories/api/articles/47862
 *
 * CREDENTIAL TYPES (from /api/doorflow/credential-types):
 * - Card credentials: value is the card number
 * - PIN credentials: value is the PIN code
 * - Mobile credentials: value is ignored (invitation-based)
 *
 * NOTE: Each person can only have one credential of each type.
 */

import { NextRequest, NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';
import { ResponseError } from 'doorflow';

/**
 * GET /api/doorflow/credentials
 *
 * List credentials for a person.
 *
 * Query params:
 * - person_id: DoorFlow person ID (required)
 *
 * SDK METHOD: CredentialsApi.listPersonCredentials()
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const personIdParam = searchParams.get('person_id');

    if (!personIdParam) {
      return NextResponse.json(
        { error: 'person_id query parameter is required' },
        { status: 400 }
      );
    }

    const personId = parseInt(personIdParam, 10);
    if (isNaN(personId)) {
      return NextResponse.json(
        { error: 'Invalid person_id' },
        { status: 400 }
      );
    }

    // SDK CALL: List credentials for a specific person
    const credentials = await doorflow.credentials.listPersonCredentials({
      personId,
    });

    return NextResponse.json(credentials);
  } catch (error) {
    console.error('[DoorFlow Credentials] Error listing credentials:', error);

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
      { error: 'Failed to list credentials' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doorflow/credentials
 *
 * Create a new credential for a person.
 *
 * API Reference: https://developer.doorflow.com/docs/categories/api/articles/47862
 *
 * Body:
 * - personId: number (required) - DoorFlow person ID
 * - credentialTypeId: number (required) - ID from /api/doorflow/credential-types
 * - value?: string - The credential value (card number, PIN, etc.)
 *
 * Value behavior by credential type:
 * - Card/Fob: The card or fob number
 * - PIN: The PIN code (digits)
 * - Mobile (PassFlow, HID Mobile): Ignored - an invitation is sent instead
 *
 * NOTE: Each person can only have ONE credential of each type.
 *
 * SDK METHOD: CredentialsApi.createCredential()
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.personId || !body.credentialTypeId) {
      return NextResponse.json(
        { error: 'personId and credentialTypeId are required' },
        { status: 400 }
      );
    }

    // SDK CALL: Create a new credential
    // The SDK wraps the data under personCredential which maps to person_credential in the API
    const credential = await doorflow.credentials.createCredential({
      personId: body.personId,
      credentialInput: {
        personCredential: {
          credentialTypeId: body.credentialTypeId,
          value: body.value || null,
        },
      },
    });

    return NextResponse.json(credential, { status: 201 });
  } catch (error) {
    console.error('[DoorFlow Credentials] Error creating credential:', error);

    if (error instanceof ResponseError) {
      // Log response body for debugging
      try {
        const errorBody = await error.response.text();
        console.error('[DoorFlow Credentials] Response body:', errorBody);
      } catch {}

      if (error.response.status === 401) {
        return NextResponse.json(
          { error: 'Not authenticated. Please connect to DoorFlow first.' },
          { status: 401 }
        );
      }
      if (error.response.status === 422) {
        return NextResponse.json(
          { error: 'This person already has a credential of this type, or the value is invalid.' },
          { status: 422 }
        );
      }
      return NextResponse.json(
        { error: `DoorFlow API error: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create credential' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/doorflow/credentials
 *
 * Delete a credential.
 *
 * Query params:
 * - person_id: DoorFlow person ID (required)
 * - id: Credential ID (hashid) (required)
 *
 * SDK METHOD: CredentialsApi.deleteCredential()
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const personIdParam = searchParams.get('person_id');
    const credentialId = searchParams.get('id');

    if (!personIdParam || !credentialId) {
      return NextResponse.json(
        { error: 'person_id and id query parameters are required' },
        { status: 400 }
      );
    }

    const personId = parseInt(personIdParam, 10);
    if (isNaN(personId)) {
      return NextResponse.json(
        { error: 'Invalid person_id' },
        { status: 400 }
      );
    }

    // SDK CALL: Delete a credential
    await doorflow.credentials.deleteCredential({
      personId,
      id: credentialId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DoorFlow Credentials] Error deleting credential:', error);

    if (error instanceof ResponseError) {
      if (error.response.status === 401) {
        return NextResponse.json(
          { error: 'Not authenticated. Please connect to DoorFlow first.' },
          { status: 401 }
        );
      }
      if (error.response.status === 404) {
        return NextResponse.json(
          { error: 'Credential not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `DoorFlow API error: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }
}
