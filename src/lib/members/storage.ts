/**
 * CRM Member Storage Utilities
 *
 * This module simulates a CRM database using a JSON file.
 * In a real application, you'd use a proper database (PostgreSQL, MongoDB, etc.)
 *
 * The pattern here demonstrates how to:
 * - Store your own member data
 * - Link members to DoorFlow people via doorflowPersonId
 * - Query members by various criteria
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { CrmMember, CrmMemberInput } from '../types';

// Path to our JSON "database"
const DATA_DIR = path.join(process.cwd(), 'data');
const MEMBERS_PATH = path.join(DATA_DIR, 'members.json');

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
 * Load all members from the JSON file.
 * Returns an empty array if the file doesn't exist.
 */
export async function loadAllMembers(): Promise<CrmMember[]> {
  try {
    const data = await fs.readFile(MEMBERS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist yet - return empty array
    return [];
  }
}

/**
 * Save all members to the JSON file.
 */
async function saveAllMembers(members: CrmMember[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(MEMBERS_PATH, JSON.stringify(members, null, 2));
}

/**
 * Get a single member by ID.
 */
export async function getMember(id: string): Promise<CrmMember | null> {
  const members = await loadAllMembers();
  return members.find((m) => m.id === id) || null;
}

/**
 * Get a member by their linked DoorFlow person ID.
 */
export async function getMemberByDoorflowId(
  doorflowPersonId: number
): Promise<CrmMember | null> {
  const members = await loadAllMembers();
  return members.find((m) => m.doorflowPersonId === doorflowPersonId) || null;
}

/**
 * Get a member by email address.
 */
export async function getMemberByEmail(
  email: string
): Promise<CrmMember | null> {
  const members = await loadAllMembers();
  return (
    members.find((m) => m.email.toLowerCase() === email.toLowerCase()) || null
  );
}

/**
 * Create a new member.
 * Automatically generates id, createdAt, and updatedAt.
 */
export async function createMember(input: CrmMemberInput): Promise<CrmMember> {
  const members = await loadAllMembers();

  const now = new Date().toISOString();
  const newMember: CrmMember = {
    id: uuidv4(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  members.push(newMember);
  await saveAllMembers(members);

  return newMember;
}

/**
 * Update an existing member.
 * Returns the updated member, or null if not found.
 */
export async function updateMember(
  id: string,
  updates: Partial<Omit<CrmMember, 'id' | 'createdAt'>>
): Promise<CrmMember | null> {
  const members = await loadAllMembers();
  const index = members.findIndex((m) => m.id === id);

  if (index === -1) {
    return null;
  }

  const updatedMember: CrmMember = {
    ...members[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  members[index] = updatedMember;
  await saveAllMembers(members);

  return updatedMember;
}

/**
 * Delete a member by ID.
 * Returns true if deleted, false if not found.
 */
export async function deleteMember(id: string): Promise<boolean> {
  const members = await loadAllMembers();
  const index = members.findIndex((m) => m.id === id);

  if (index === -1) {
    return false;
  }

  members.splice(index, 1);
  await saveAllMembers(members);

  return true;
}

/**
 * Get members that are linked to DoorFlow (have a doorflowPersonId).
 */
export async function getLinkedMembers(): Promise<CrmMember[]> {
  const members = await loadAllMembers();
  return members.filter((m) => m.doorflowPersonId != null);
}

/**
 * Get members that are NOT linked to DoorFlow.
 */
export async function getUnlinkedMembers(): Promise<CrmMember[]> {
  const members = await loadAllMembers();
  return members.filter((m) => m.doorflowPersonId == null);
}

/**
 * Link a CRM member to a DoorFlow person.
 * This is called after syncing to establish the relationship.
 */
export async function linkMemberToDoorflow(
  memberId: string,
  doorflowPersonId: number
): Promise<CrmMember | null> {
  return updateMember(memberId, { doorflowPersonId });
}

/**
 * Unlink a CRM member from DoorFlow.
 * This removes the doorflowPersonId relationship.
 */
export async function unlinkMemberFromDoorflow(
  memberId: string
): Promise<CrmMember | null> {
  return updateMember(memberId, { doorflowPersonId: null });
}

/**
 * Reset members to sample data.
 * Used for factory reset - restores demo state without DoorFlow links.
 */
export async function resetMembers(): Promise<void> {
  const now = new Date().toISOString();
  const sampleMembers: CrmMember[] = [
    {
      id: 'member-001',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@example.com',
      phone: '+1-555-0101',
      department: 'Engineering',
      jobTitle: 'Senior Developer',
      notes: 'Team lead for the mobile app project',
      membershipType: 'premium',
      teamIds: ['team-001'],
      doorflowPersonId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'member-002',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '+1-555-0102',
      department: 'Sales',
      jobTitle: 'Account Executive',
      membershipType: 'standard',
      teamIds: ['team-002'],
      doorflowPersonId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'member-003',
      firstName: 'Carol',
      lastName: 'Williams',
      email: 'carol.williams@example.com',
      phone: '+1-555-0103',
      department: 'Engineering',
      jobTitle: 'DevOps Engineer',
      notes: 'On-call rotation lead',
      membershipType: 'premium',
      teamIds: ['team-001', 'team-003'],
      doorflowPersonId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'member-004',
      firstName: 'Eva',
      lastName: 'Martinez',
      email: 'eva.martinez@example.com',
      department: 'Operations',
      jobTitle: 'Office Manager',
      membershipType: 'standard',
      teamIds: [],
      doorflowPersonId: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await saveAllMembers(sampleMembers);
}

// =============================================================================
// MemberStorage class - alternative API for those who prefer class-based access
// =============================================================================

export const MemberStorage = {
  loadAll: loadAllMembers,
  get: getMember,
  getByDoorflowId: getMemberByDoorflowId,
  getByEmail: getMemberByEmail,
  create: createMember,
  update: updateMember,
  delete: deleteMember,
  getLinked: getLinkedMembers,
  getUnlinked: getUnlinkedMembers,
  linkToDoorflow: linkMemberToDoorflow,
  unlinkFromDoorflow: unlinkMemberFromDoorflow,
  reset: resetMembers,
};
