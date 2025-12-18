/**
 * Events Hook
 *
 * Custom hook to fetch access events from DoorFlow.
 * Events are the audit trail of access attempts.
 */

import useSWR from 'swr';

interface AccessEvent {
  id: number;
  eventCode: number;
  eventType: string;
  personId?: number;
  firstName?: string;
  lastName?: string;
  channelId?: number;
  channelName?: string;
  doorControllerId?: number;
  doorControllerName?: string;
  timestamp: string;
  description?: string;
}

interface UseEventsOptions {
  firstName?: string;
  lastName?: string;
  since?: string;
  limit?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();

  // If the response is an error object, throw it so SWR handles it
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch events');
  }

  // Ensure we always return an array
  return Array.isArray(data) ? data : [];
};

/**
 * Hook to get access events from DoorFlow.
 *
 * EVENT CODES:
 * - 10-18, 70: Admission events (access granted)
 * - 20-29, 71-73: Rejection events (access denied)
 * - 40-42: Auto-unlock events
 * - 90-91: Tamper events
 */
export function useEvents(options?: UseEventsOptions) {
  // Build URL with filters
  const params = new URLSearchParams();
  if (options?.firstName) params.set('first_name', options.firstName);
  if (options?.lastName) params.set('last_name', options.lastName);
  if (options?.since) params.set('since', options.since);
  if (options?.limit) params.set('limit', options.limit.toString());

  const queryString = params.toString();
  const url = `/api/doorflow/events${queryString ? `?${queryString}` : ''}`;

  const { data, error, mutate, isLoading } = useSWR<AccessEvent[]>(url, fetcher);

  return {
    events: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
