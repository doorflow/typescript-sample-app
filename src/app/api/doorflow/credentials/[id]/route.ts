/**
 * DoorFlow Credential Detail API Proxy
 *
 * DELETE /api/doorflow/credentials/[id]?person_id=123 - Delete a credential
 */

import { NextRequest, NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';
import { ResponseError } from 'doorflow';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/doorflow/credentials/[id]
 *
 * Delete a credential from DoorFlow.
 *
 * Query params:
 * - person_id: Required - the person this credential belongs to
 *
 * SDK METHOD: CredentialsApi.deleteCredential()
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }

    // SDK CALL: Delete the credential
    // Note: DoorFlow credentials API is scoped to a person
    await doorflow.credentials.deleteCredential({
      personId,
      id,
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
