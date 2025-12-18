/**
 * DoorFlow People API Proxy
 *
 * GET /api/doorflow/people - List people from DoorFlow
 * POST /api/doorflow/people - Create a person in DoorFlow
 *
 * This proxies requests to the DoorFlow API, handling authentication
 * automatically via the TokenManager.
 */

import { NextRequest, NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';
import { ResponseError } from 'doorflow';

/**
 * GET /api/doorflow/people
 *
 * List people from DoorFlow with optional filters.
 *
 * Query params:
 * - email: Filter by exact email
 * - page: Page number (default 1)
 * - per_page: Results per page (default 500)
 * - skip_pagination: Get all results (true/false)
 *
 * SDK METHOD: PeopleApi.listPeople()
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // SDK CALL: List people with optional filters
    // The SDK handles authentication automatically
    const people = await doorflow.people.listPeople({
      email: searchParams.get('email') || undefined,
      page: searchParams.has('page')
        ? parseInt(searchParams.get('page')!)
        : undefined,
      perPage: searchParams.has('per_page')
        ? parseInt(searchParams.get('per_page')!)
        : undefined,
      skipPagination: searchParams.get('skip_pagination') === 'true',
    });

    return NextResponse.json(people);
  } catch (error) {
    console.error('[DoorFlow People] Error listing people:', error);

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
      { error: 'Failed to list people from DoorFlow' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doorflow/people
 *
 * Create a new person in DoorFlow.
 *
 * Body:
 * - firstName: string (required)
 * - lastName: string (required)
 * - email?: string
 * - phone?: string
 * - groupIds?: number[] - Array of group IDs to add the person to
 * - systemId?: string - External system ID for reverse lookup
 *
 * SDK METHOD: PeopleApi.createPerson()
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'firstName and lastName are required' },
        { status: 400 }
      );
    }

    // SDK CALL: Create a new person
    // The personInput structure follows the DoorFlow API schema
    const newPerson = await doorflow.people.createPerson({
      personInput: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        telephone: body.phone || null,
        enabled: body.enabled ?? true,
        groupIds: body.groupIds || [],
        // systemId can be used to store your CRM's member ID
        // for reverse lookups
        systemId: body.systemId || null,
      },
    });

    return NextResponse.json(newPerson, { status: 201 });
  } catch (error) {
    console.error('[DoorFlow People] Error creating person:', error);

    if (error instanceof ResponseError) {
      if (error.response.status === 401) {
        return NextResponse.json(
          { error: 'Not authenticated. Please connect to DoorFlow first.' },
          { status: 401 }
        );
      }
      if (error.response.status === 422) {
        // Validation error - try to get details
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
      { error: 'Failed to create person in DoorFlow' },
      { status: 500 }
    );
  }
}
