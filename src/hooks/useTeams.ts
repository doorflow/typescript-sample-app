/**
 * Teams Hook
 *
 * Custom hook to manage CRM teams.
 * Teams are mapped to DoorFlow groups for access control.
 */

import useSWR from 'swr';

interface Team {
  id: string;
  name: string;
  description?: string;
  doorflowGroupId?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateTeamInput {
  name: string;
  description?: string;
  doorflowGroupId?: number | null;
}

interface UpdateTeamInput {
  name?: string;
  description?: string;
  doorflowGroupId?: number | null;
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
 * Hook to get and manage CRM teams.
 */
export function useTeams() {
  const {
    data: teams,
    error,
    mutate,
    isLoading,
  } = useSWR<Team[]>('/api/teams', fetcher);

  /**
   * Create a new team.
   */
  const createTeam = async (input: CreateTeamInput): Promise<Team> => {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create team');
    }

    const newTeam = await response.json();
    mutate(); // Refresh the list
    return newTeam;
  };

  /**
   * Update a team.
   */
  const updateTeam = async (id: string, input: UpdateTeamInput): Promise<Team> => {
    const response = await fetch(`/api/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update team');
    }

    const updatedTeam = await response.json();
    mutate(); // Refresh the list
    return updatedTeam;
  };

  /**
   * Delete a team.
   */
  const deleteTeam = async (id: string): Promise<void> => {
    const response = await fetch(`/api/teams/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete team');
    }

    mutate(); // Refresh the list
  };

  /**
   * Map a team to a DoorFlow group.
   */
  const mapToGroup = async (teamId: string, doorflowGroupId: number): Promise<Team> => {
    return updateTeam(teamId, { doorflowGroupId });
  };

  /**
   * Unmap a team from its DoorFlow group.
   */
  const unmapFromGroup = async (teamId: string): Promise<Team> => {
    return updateTeam(teamId, { doorflowGroupId: null });
  };

  return {
    teams: teams ?? [],
    isLoading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    mapToGroup,
    unmapFromGroup,
    refresh: mutate,
  };
}

/**
 * Hook to get a single team by ID.
 */
export function useTeam(id: string | null) {
  const {
    data: team,
    error,
    mutate,
    isLoading,
  } = useSWR<Team>(
    id ? `/api/teams/${id}` : null,
    async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch team');
      }
      return data;
    }
  );

  return {
    team,
    isLoading,
    error,
    refresh: mutate,
  };
}
