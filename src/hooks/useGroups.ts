/**
 * Groups Hook
 *
 * Custom hook to fetch DoorFlow groups.
 * Groups control access permissions - people assigned to groups
 * can access doors/channels based on the group's roles.
 */

import useSWR from 'swr';

interface Group {
  id: number;
  name: string;
  notes?: string | null;
  globalAcrossSites: boolean;
  createdAt: string;
  updatedAt: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch groups');
  }

  return Array.isArray(data) ? data : [];
};

/**
 * Hook to get all DoorFlow groups.
 *
 * Groups control access permissions - people assigned to groups
 * can access doors/channels based on the group's assigned roles.
 *
 * Groups are cached and only fetched once per session since they rarely change.
 * Use `refresh()` to manually refresh the cache (e.g., from a settings page).
 */
export function useGroups() {
  const { data, error, isLoading, mutate } = useSWR<Group[]>(
    '/api/doorflow/groups',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 3600000, // 1 hour
    }
  );

  return {
    groups: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
