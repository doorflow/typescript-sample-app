/**
 * DoorFlow Single Person API Proxy
 *
 * GET /api/doorflow/people/[id] - Get a person from DoorFlow
 * PUT /api/doorflow/people/[id] - Update a person in DoorFlow
 * DELETE /api/doorflow/people/[id] - Delete a person from DoorFlow
 */

import { NextRequest, NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';
import { ResponseError } from 'doorflow';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/doorflow/people/[id]
 *
 * Get a single person from DoorFlow by ID.
 *
 * SDK METHOD: PeopleApi.getPerson()
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);

    if (isNaN(personId)) {
      return NextResponse.json(
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }

    // SDK CALL: Get a single person by ID
    const person = await doorflow.people.getPerson({ id: personId });

    return NextResponse.json(person);
  } catch (error) {
    console.error('[DoorFlow People] Error getting person:', error);

    if (error instanceof ResponseError) {
      if (error.response.status === 401) {
        return NextResponse.json(
          { error: 'Not authenticated. Please connect to DoorFlow first.' },
          { status: 401 }
        );
      }
      if (error.response.status === 404) {
        return NextResponse.json(
          { error: 'Person not found in DoorFlow' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `DoorFlow API error: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get person from DoorFlow' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/doorflow/people/[id]
 *
 * Update a person in DoorFlow.
 *
 * Body: Partial person fields to update
 * - firstName?: string
 * - lastName?: string
 * - email?: string
 * - phone?: string
 * - groupIds?: number[] - REPLACES current groups (use for adding/removing from groups)
 * - enabled?: boolean
 *
 * SDK METHOD: PeopleApi.updatePerson()
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);
    const body = await request.json();

    if (isNaN(personId)) {
      return NextResponse.json(
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }

    // SDK CALL: Update a person
    // Note: groupIds REPLACES the current groups - it doesn't add to them
    // So to add a group, you need to include ALL existing groups plus the new one
    const updatedPerson = await doorflow.people.updatePerson({
      id: personId,
      personInput: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        telephone: body.phone,
        enabled: body.enabled,
        groupIds: body.groupIds,
      },
    });

    return NextResponse.json(updatedPerson);
  } catch (error) {
    console.error('[DoorFlow People] Error updating person:', error);

    if (error instanceof ResponseError) {
      if (error.response.status === 401) {
        return NextResponse.json(
          { error: 'Not authenticated. Please connect to DoorFlow first.' },
          { status: 401 }
        );
      }
      if (error.response.status === 404) {
        return NextResponse.json(
          { error: 'Person not found in DoorFlow' },
          { status: 404 }
        );
      }
      if (error.response.status === 422) {
        try {
          const errorBody = await error.response.json();
          return NextResponse.json(errorBody, { status: 422 });
        } catch {
          return NextResponse.json(
            { error: 'Validation failed' },
            { status: 422 }
          );
        }
      }
      return NextResponse.json(
        { error: `DoorFlow API error: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update person in DoorFlow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/doorflow/people/[id]
 *
 * Delete a person from DoorFlow.
 *
 * SDK METHOD: PeopleApi.deletePerson()
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);

    if (isNaN(personId)) {
      return NextResponse.json(
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }

    // SDK CALL: Delete a person
    await doorflow.people.deletePerson({ id: personId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DoorFlow People] Error deleting person:', error);

    if (error instanceof ResponseError) {
      if (error.response.status === 401) {
        return NextResponse.json(
          { error: 'Not authenticated. Please connect to DoorFlow first.' },
          { status: 401 }
        );
      }
      if (error.response.status === 404) {
        return NextResponse.json(
          { error: 'Person not found in DoorFlow' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `DoorFlow API error: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete person from DoorFlow' },
      { status: 500 }
    );
  }
}
