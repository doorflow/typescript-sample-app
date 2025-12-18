/**
 * Type definitions for the Member Access Portal example application.
 *
 * This file defines the core data models used throughout the app:
 * - CRM Members (local database simulation)
 * - OAuth token storage
 * - API response types
 */

// =============================================================================
// CRM Team Types
// =============================================================================

/**
 * A team in our CRM system.
 * Teams are mapped to DoorFlow groups - when a member belongs to a team,
 * they get assigned to the corresponding DoorFlow group during sync.
 */
export interface CrmTeam {
  /** Unique identifier (UUID) */
  id: string;
  /** Team name */
  name: string;
  /** Team description (optional) */
  description?: string;
  /**
   * Mapped DoorFlow group ID.
   * When a member belongs to this team, they get assigned to this DoorFlow group.
   * null = not yet mapped to a DoorFlow group
   */
  doorflowGroupId?: number | null;
  /** ISO timestamp of when this team was created */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Input for creating a new CRM team.
 */
export type CrmTeamInput = Omit<CrmTeam, 'id' | 'createdAt' | 'updatedAt'>;

// =============================================================================
// CRM Member Types
// =============================================================================

/**
 * A member in our local CRM system.
 * This represents someone in YOUR database that you want to sync with DoorFlow.
 *
 * Fields map to DoorFlow Person API:
 * @see https://developer.doorflow.com/api-ref/doorflow/createperson
 */
export interface CrmMember {
  /** Unique identifier (UUID) */
  id: string;
  /** Member's first name → DoorFlow: first_name */
  firstName: string;
  /** Member's last name → DoorFlow: last_name */
  lastName: string;
  /** Email address → DoorFlow: email (used for matching) */
  email: string;
  /** Phone number → DoorFlow: telephone */
  phone?: string;
  /** Department → DoorFlow: department */
  department?: string;
  /** Job title → DoorFlow: job_title */
  jobTitle?: string;
  /** Additional notes → DoorFlow: notes */
  notes?: string;
  /** Organisation ID → DoorFlow: organisation_id */
  organisationId?: number;
  /** Membership tier in your system → DoorFlow: custom_1 */
  membershipType: 'standard' | 'premium';
  /**
   * Team IDs this member belongs to.
   * Teams map to DoorFlow groups for access control.
   * → DoorFlow: group_ids
   */
  teamIds: string[];
  /**
   * Link to DoorFlow - when synced, this stores the DoorFlow person ID.
   * null = not yet synced to DoorFlow
   */
  doorflowPersonId?: number | null;
  /** ISO timestamp of when this member was created */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Input for creating a new CRM member.
 * id, createdAt, updatedAt are generated automatically.
 */
export type CrmMemberInput = Omit<CrmMember, 'id' | 'createdAt' | 'updatedAt'>;

// =============================================================================
// OAuth Token Types
// =============================================================================

/**
 * OAuth tokens stored on the server.
 *
 * SECURITY NOTE: In production, refreshToken should be encrypted at rest!
 * This example stores it in plain text for simplicity.
 */
export interface StoredTokens {
  /** Access token for API calls - expires in 1 hour */
  accessToken: string;
  /**
   * Refresh token for getting new access tokens.
   * IMPORTANT: DoorFlow rotates refresh tokens - you must store the NEW one
   * returned after each refresh!
   */
  refreshToken: string;
  /** Unix timestamp (seconds) when the access token expires */
  expiresAt: number;
  /** OAuth scopes that were granted */
  scope: string;
}

// =============================================================================
// Sync Types
// =============================================================================

/**
 * Result of a sync operation between CRM members and DoorFlow people.
 */
export interface SyncResult {
  /** Members that were matched to existing DoorFlow people (by email) */
  matched: Array<{
    member: CrmMember;
    personId: number;
  }>;
  /** Members that were created as new people in DoorFlow */
  created: Array<{
    member: CrmMember;
    personId: number;
  }>;
  /** Members that couldn't be matched and weren't created */
  unmatched: CrmMember[];
  /** Members that failed to sync (with error messages) */
  errors: Array<{
    member: CrmMember;
    error: string;
  }>;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Standard error response from our API routes.
 */
export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Connection status response.
 */
export interface ConnectionStatus {
  connected: boolean;
  expiresAt?: number;
  scope?: string;
  /** Whether the required environment variables are configured */
  configured: boolean;
  /** Which environment variables are missing (if any) */
  missingConfig?: string[];
}
