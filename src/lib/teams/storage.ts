/**
 * CRM Team Storage Utilities
 *
 * This module manages teams in the CRM.
 * Teams are mapped to DoorFlow groups - when a member belongs to a team,
 * they get assigned to the corresponding DoorFlow group during sync.
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { CrmTeam, CrmTeamInput } from '../types';

// Path to our JSON "database"
const DATA_DIR = path.join(process.cwd(), 'data');
const TEAMS_PATH = path.join(DATA_DIR, 'teams.json');

/**
 * Ensure the data directory exists.
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

/**
 * Load all teams from the JSON file.
 * Returns an empty array if the file doesn't exist.
 */
export async function loadAllTeams(): Promise<CrmTeam[]> {
  try {
    const data = await fs.readFile(TEAMS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist yet - return empty array
    return [];
  }
}

/**
 * Save all teams to the JSON file.
 */
async function saveAllTeams(teams: CrmTeam[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TEAMS_PATH, JSON.stringify(teams, null, 2));
}

/**
 * Get a single team by ID.
 */
export async function getTeam(id: string): Promise<CrmTeam | null> {
  const teams = await loadAllTeams();
  return teams.find((t) => t.id === id) || null;
}

/**
 * Get a team by its linked DoorFlow group ID.
 */
export async function getTeamByDoorflowGroupId(
  doorflowGroupId: number
): Promise<CrmTeam | null> {
  const teams = await loadAllTeams();
  return teams.find((t) => t.doorflowGroupId === doorflowGroupId) || null;
}

/**
 * Create a new team.
 * Automatically generates id, createdAt, and updatedAt.
 */
export async function createTeam(input: CrmTeamInput): Promise<CrmTeam> {
  const teams = await loadAllTeams();

  const now = new Date().toISOString();
  const newTeam: CrmTeam = {
    id: uuidv4(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  teams.push(newTeam);
  await saveAllTeams(teams);

  return newTeam;
}

/**
 * Update an existing team.
 * Returns the updated team, or null if not found.
 */
export async function updateTeam(
  id: string,
  updates: Partial<Omit<CrmTeam, 'id' | 'createdAt'>>
): Promise<CrmTeam | null> {
  const teams = await loadAllTeams();
  const index = teams.findIndex((t) => t.id === id);

  if (index === -1) {
    return null;
  }

  const updatedTeam: CrmTeam = {
    ...teams[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  teams[index] = updatedTeam;
  await saveAllTeams(teams);

  return updatedTeam;
}

/**
 * Delete a team by ID.
 * Returns true if deleted, false if not found.
 */
export async function deleteTeam(id: string): Promise<boolean> {
  const teams = await loadAllTeams();
  const index = teams.findIndex((t) => t.id === id);

  if (index === -1) {
    return false;
  }

  teams.splice(index, 1);
  await saveAllTeams(teams);

  return true;
}

/**
 * Get teams that are mapped to DoorFlow groups.
 */
export async function getMappedTeams(): Promise<CrmTeam[]> {
  const teams = await loadAllTeams();
  return teams.filter((t) => t.doorflowGroupId != null);
}

/**
 * Get teams that are NOT mapped to DoorFlow groups.
 */
export async function getUnmappedTeams(): Promise<CrmTeam[]> {
  const teams = await loadAllTeams();
  return teams.filter((t) => t.doorflowGroupId == null);
}

/**
 * Map a CRM team to a DoorFlow group.
 */
export async function mapTeamToDoorflowGroup(
  teamId: string,
  doorflowGroupId: number
): Promise<CrmTeam | null> {
  return updateTeam(teamId, { doorflowGroupId });
}

/**
 * Unmap a CRM team from its DoorFlow group.
 */
export async function unmapTeamFromDoorflowGroup(
  teamId: string
): Promise<CrmTeam | null> {
  return updateTeam(teamId, { doorflowGroupId: null });
}

/**
 * Get multiple teams by their IDs.
 */
export async function getTeamsByIds(ids: string[]): Promise<CrmTeam[]> {
  const teams = await loadAllTeams();
  return teams.filter((t) => ids.includes(t.id));
}

/**
 * Get the DoorFlow group IDs for a list of team IDs.
 * Only returns group IDs for teams that have a mapping.
 */
export async function getDoorflowGroupIdsForTeams(
  teamIds: string[]
): Promise<number[]> {
  const teams = await getTeamsByIds(teamIds);
  return teams
    .filter((t) => t.doorflowGroupId != null)
    .map((t) => t.doorflowGroupId as number);
}

/**
 * Reset teams to sample data.
 * Used for factory reset - restores demo state without DoorFlow group mappings.
 */
export async function resetTeams(): Promise<void> {
  const now = new Date().toISOString();
  const sampleTeams: CrmTeam[] = [
    {
      id: 'team-001',
      name: 'Engineering',
      description: 'Software development team',
      doorflowGroupId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'team-002',
      name: 'Sales',
      description: 'Sales and business development',
      doorflowGroupId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'team-003',
      name: 'Operations',
      description: 'Operations and support',
      doorflowGroupId: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await saveAllTeams(sampleTeams);
}

// =============================================================================
// TeamStorage class - alternative API for those who prefer class-based access
// =============================================================================

export const TeamStorage = {
  loadAll: loadAllTeams,
  get: getTeam,
  getByDoorflowGroupId: getTeamByDoorflowGroupId,
  getByIds: getTeamsByIds,
  create: createTeam,
  update: updateTeam,
  delete: deleteTeam,
  getMapped: getMappedTeams,
  getUnmapped: getUnmappedTeams,
  mapToDoorflowGroup: mapTeamToDoorflowGroup,
  unmapFromDoorflowGroup: unmapTeamFromDoorflowGroup,
  getDoorflowGroupIdsForTeams,
  reset: resetTeams,
};
