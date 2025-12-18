/**
 * Members Hook
 *
 * Custom hook to manage CRM members with SWR for data fetching.
 */

import useSWR from 'swr';
import type { CrmMember, CrmMemberInput } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to get and manage CRM members.
 */
export function useMembers(options?: { linked?: boolean }) {
  // Build URL with optional filter
  let url = '/api/members';
  if (options?.linked !== undefined) {
    url += `?linked=${options.linked}`;
  }

  const { data, error, mutate, isLoading } = useSWR<CrmMember[]>(url, fetcher, {
    revalidateOnFocus: true,
  });

  /**
   * Create a new CRM member.
   */
  const createMember = async (input: CrmMemberInput): Promise<CrmMember> => {
    const response = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create member');
    }

    const newMember = await response.json();
    mutate(); // Refresh the list
    return newMember;
  };

  /**
   * Update a CRM member.
   */
  const updateMember = async (
    id: string,
    updates: Partial<CrmMember>
  ): Promise<CrmMember> => {
    const response = await fetch(`/api/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update member');
    }

    const updatedMember = await response.json();
    mutate(); // Refresh the list
    return updatedMember;
  };

  /**
   * Delete a CRM member.
   */
  const deleteMember = async (id: string): Promise<void> => {
    const response = await fetch(`/api/members/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete member');
    }

    mutate(); // Refresh the list
  };

  return {
    members: data ?? [],
    isLoading,
    error,
    createMember,
    updateMember,
    deleteMember,
    refresh: mutate,
  };
}

/**
 * Hook to get a single CRM member by ID.
 */
export function useMember(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR<CrmMember>(
    id ? `/api/members/${id}` : null,
    fetcher
  );

  return {
    member: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
