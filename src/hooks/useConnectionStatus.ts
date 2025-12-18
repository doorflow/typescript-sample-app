/**
 * Connection Status Hook
 *
 * Custom hook to manage the OAuth connection status.
 * Uses SWR for data fetching with automatic revalidation.
 */

import useSWR from 'swr';
import type { ConnectionStatus } from '@/lib/types';

// Simple fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to get and manage the DoorFlow connection status.
 *
 * Usage:
 * ```tsx
 * const { isConnected, isLoading, error, disconnect, refresh } = useConnectionStatus();
 *
 * if (isLoading) return <Spinner />;
 * if (isConnected) {
 *   // Show connected UI
 * } else {
 *   // Show connect button
 * }
 * ```
 */
export function useConnectionStatus() {
  const { data, error, mutate, isLoading } = useSWR<ConnectionStatus>(
    '/api/auth/status',
    fetcher,
    {
      // Revalidate every 30 seconds
      refreshInterval: 30000,
      // Revalidate when window gets focus
      revalidateOnFocus: true,
    }
  );

  /**
   * Disconnect from DoorFlow.
   * This revokes tokens and clears local storage.
   */
  const disconnect = async () => {
    try {
      const response = await fetch('/api/auth/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      // Refresh the status after disconnecting
      mutate({ connected: false, configured: true });
    } catch (err) {
      console.error('Disconnect error:', err);
      // Still refresh status even on error
      mutate();
      throw err;
    }
  };

  /**
   * Start the OAuth connection flow.
   * Fetches the authorize URL and navigates to DoorFlow.
   */
  const connect = async () => {
    try {
      const response = await fetch('/api/auth/connect');
      const data = await response.json();

      if (data.url) {
        // Navigate to DoorFlow's authorize page
        window.location.href = data.url;
      } else if (data.error) {
        console.error('Connect error:', data.error);
        alert(data.error);
      }
    } catch (err) {
      console.error('Connect error:', err);
    }
  };

  /**
   * Manually refresh the OAuth token.
   * Forces a token refresh even if the current token is still valid.
   */
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh token');
      }

      // Refresh the status to get updated expiry time
      mutate();

      return result;
    } catch (err) {
      console.error('Token refresh error:', err);
      throw err;
    }
  };

  return {
    /** Whether we're connected to DoorFlow */
    isConnected: data?.connected ?? false,
    /** Whether the required environment variables are configured */
    isConfigured: data?.configured ?? true,
    /** Which environment variables are missing (if any) */
    missingConfig: data?.missingConfig,
    /** When the access token expires (Unix timestamp) */
    expiresAt: data?.expiresAt,
    /** The OAuth scopes that were granted */
    scope: data?.scope,
    /** Whether we're loading the status */
    isLoading,
    /** Any error that occurred */
    error,
    /** Start the OAuth connection flow */
    connect,
    /** Disconnect from DoorFlow */
    disconnect,
    /** Manually refresh the OAuth token */
    refreshToken,
    /** Manually refresh the status */
    refresh: mutate,
  };
}
