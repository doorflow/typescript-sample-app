/**
 * Credentials Hook
 *
 * Custom hook to manage DoorFlow credentials for a person.
 * Provides functionality to list, create, and delete credentials.
 */

import useSWR from 'swr';

// Credential type matching SDK's Credential model
// Note: id is a hashid string, not a number
interface Credential {
  id: string;
  credentialTypeId: number;
  label: string;  // Human-readable label for the credential type
  personId: number;
  value?: string | null;
  status?: string | null;  // For mobile credentials: invited, active, revoking, revoked
  url?: string | null;     // PassFlow credential URL
  walletType?: string | null;  // apple or google
}

interface CredentialType {
  id: number;
  label: string;
  slug: string;
  code: number | null;
}

interface CreateCredentialInput {
  credentialTypeId: number;
  value: string;
  validFrom?: string;
  validTo?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch');
  }

  return Array.isArray(data) ? data : [];
};

/**
 * Hook to get and manage credentials for a DoorFlow person.
 */
export function useCredentials(personId: number | null) {
  const {
    data: credentials,
    error,
    mutate,
    isLoading,
  } = useSWR<Credential[]>(
    personId ? `/api/doorflow/credentials?person_id=${personId}` : null,
    fetcher
  );

  /**
   * Create a new credential for this person.
   *
   * SDK USAGE NOTES:
   * - For cards: value is the card number (e.g., "12345678")
   * - For PINs: use value "******" to auto-generate
   * - credentialTypeId must match a valid type from /api/doorflow/credential-types
   */
  const createCredential = async (input: CreateCredentialInput): Promise<Credential> => {
    if (!personId) {
      throw new Error('Person ID is required to create credentials');
    }

    const response = await fetch('/api/doorflow/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personId,
        ...input,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create credential');
    }

    const newCredential = await response.json();
    mutate(); // Refresh the list
    return newCredential;
  };

  /**
   * Delete a credential.
   * Note: personId is required by DoorFlow API (credentials are scoped to a person)
   * Note: credentialId is a hashid string, not a number
   */
  const deleteCredential = async (credentialId: string): Promise<void> => {
    if (!personId) {
      throw new Error('Person ID is required to delete credentials');
    }

    const response = await fetch(
      `/api/doorflow/credentials/${credentialId}?person_id=${personId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete credential');
    }

    mutate(); // Refresh the list
  };

  return {
    credentials: credentials ?? [],
    isLoading,
    error,
    createCredential,
    deleteCredential,
    refresh: mutate,
  };
}

/**
 * Hook to get available credential types.
 * These define what kinds of credentials can be created (cards, PINs, etc.)
 *
 * Credential types are cached and only fetched once per session since they rarely change.
 * Use `refresh()` to manually refresh the cache (e.g., from a settings page).
 */
export function useCredentialTypes() {
  const { data, error, isLoading, mutate } = useSWR<CredentialType[]>(
    '/api/doorflow/credential-types',
    fetcher,
    {
      // Cache for the entire session - credential types don't change often
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 3600000, // 1 hour
    }
  );

  return {
    credentialTypes: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
