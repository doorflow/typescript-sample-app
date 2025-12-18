/**
 * DoorFlow Events API Proxy
 *
 * GET /api/doorflow/events - List access events
 *
 * Events are the audit trail of access attempts - who tried to enter
 * which door, when, and whether they were granted or denied access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { doorflow } from '@/lib/doorflow/token-manager';
import { ResponseError } from 'doorflow';

/**
 * GET /api/doorflow/events
 *
 * List access events from DoorFlow.
 *
 * Query params:
 * - first_name: Filter by person's first name
 * - last_name: Filter by person's last name
 * - since: ISO timestamp - only events after this time
 * - event_codes: Comma-separated list of event codes to filter
 * - limit: Maximum number of events to return
 *
 * EVENT CODES:
 * - 10-18, 70: Admission events (access granted)
 * - 20-29, 71-73: Rejection events (access denied)
 * - 40-42: Auto-unlock events
 * - 90-91: Tamper events
 *
 * SDK METHOD: EventsApi.listEvents()
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse event codes if provided
    let eventCodes: number[] | undefined;
    const eventCodesParam = searchParams.get('event_codes');
    if (eventCodesParam) {
      eventCodes = eventCodesParam.split(',').map((c) => parseInt(c.trim(), 10));
    }

    // Parse since timestamp if provided
    const sinceParam = searchParams.get('since');
    const since = sinceParam ? new Date(sinceParam) : undefined;

    // SDK CALL: List events with optional filters
    // Note: 'n' is the number of events to return (limit)
    const events = await doorflow.events.listEvents({
      firstName: searchParams.get('first_name') || undefined,
      lastName: searchParams.get('last_name') || undefined,
      since: since,
      eventCodes: eventCodes,
      n: searchParams.has('limit')
        ? parseInt(searchParams.get('limit')!, 10)
        : 50,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('[DoorFlow Events] Error listing events:', error);

    if (error instanceof ResponseError) {
      // Log the response body for debugging
      try {
        const body = await error.response.text();
        console.error('[DoorFlow Events] Response body:', body);
      } catch {}

      if (error.response.status === 401) {
        return NextResponse.json(
          { error: 'Not authenticated. Please connect to DoorFlow first.' },
          { status: 401 }
        );
      }
      if (error.response.status === 403) {
        return NextResponse.json(
          { error: 'Access denied. The account.event.access.readonly scope may be required.' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: `DoorFlow API error: ${error.response.status}` },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to list events' },
      { status: 500 }
    );
  }
}
