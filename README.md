# DoorFlow TypeScript Sample Application

A sample Next.js application demonstrating DoorFlow API integration. While this example uses a fictional coworking space ("CoWork HQ"), the patterns apply to any system that manages people and access — gyms, offices, universities, property management, etc.

Built for developers integrating DoorFlow into their applications.

See how easy it is to develop on DoorFlow. Get up and running in minutes.

![CoWork HQ Screenshot](docs/screenshot.png)

## What This Demonstrates

- **OAuth 2.0 Flow** — Secure authorization with automatic token refresh
- **Member ↔ People Sync** — Match CRM members to DoorFlow people by email, create missing records
- **Group-Based Access** — Map CRM teams to DoorFlow groups for door access control
- **Server-Side Security** — All API calls happen in Next.js API routes, secrets never reach the browser
- **Credential Management** — Issue cards, PINs, and mobile credentials

## Prerequisites

- Node.js 18+
- A DoorFlow developer account
- OAuth application credentials from [developer.doorflow.com](https://developer.doorflow.com/applications) in a 'Testing' state.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app will guide you through connecting to DoorFlow.

## SDK Usage

This app uses the official [`doorflow`](https://www.npmjs.com/package/doorflow) SDK. The unified client provides access to all API resources:

### Initialize the Client

```typescript
import { DoorFlow, FileTokenStorage } from 'doorflow';

const doorflow = new DoorFlow({
  clientId: process.env.DOORFLOW_CLIENT_ID!,
  clientSecret: process.env.DOORFLOW_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/api/auth/callback',
  storage: new FileTokenStorage('./data/tokens.json'),
});
```

### OAuth Flow

```typescript
// Start authorization
const { url, state, codeVerifier } = await doorflow.getAuthorizationUrl({
  scopes: ['account.person', 'account.channel.readonly', 'account.event.access.readonly'],
});

// Handle callback
await doorflow.handleCallback(code, state, expectedState, codeVerifier);

// Check connection
const connected = await doorflow.isAuthenticated();

// Disconnect
await doorflow.disconnect();
```

### People

```typescript
// List all people
const people = await doorflow.people.listPeople({ skipPagination: true });

// Find by email
const people = await doorflow.people.listPeople({ email: 'alice@example.com' });

// Create a person with photo
const person = await doorflow.people.createPerson({
  personInput: {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    department: 'Engineering',
    jobTitle: 'Software Developer',
    groupIds: [1, 2],
    imageBase64: 'iVBORw0KGgo...', // Base64-encoded image
  },
});

// Update group assignments
await doorflow.people.updatePerson({
  id: person.id,
  personInput: { groupIds: [1, 2, 3] },
});
```

### Credentials

```typescript
// List credential types
const types = await doorflow.credentialTypes.listCredentialTypes();

// Create a card credential
await doorflow.credentials.createCredential({
  personId: 123,
  credentialInput: {
    personCredential: {
      credentialTypeId: 1,
      value: '12345678', // Card number
    },
  },
});

// Create a PIN (auto-generate)
await doorflow.credentials.createCredential({
  personId: 123,
  credentialInput: {
    personCredential: {
      credentialTypeId: 2,
      value: '******', // Auto-generates PIN
    },
  },
});

// Create mobile credential (invitation sent to email)
await doorflow.credentials.createCredential({
  personId: 123,
  credentialInput: {
    personCredential: {
      credentialTypeId: 3,
      // No value needed
    },
  },
});

// Delete credential
await doorflow.credentials.deleteCredential({ id: credentialId });
```

### Groups

```typescript
// List all groups
const groups = await doorflow.groups.listGroups();
```

## Architecture

### Team → Group Mapping

Teams provide an abstraction layer between your CRM and DoorFlow:

```
CRM Teams              DoorFlow Groups
┌─────────────┐        ┌─────────────┐
│ Engineering │ ─────► │ Tech Floor  │
└─────────────┘        └─────────────┘
┌─────────────┐        ┌─────────────┐
│ Sales       │ ─────► │ Sales Wing  │
└─────────────┘        └─────────────┘
┌─────────────┐        ┌─────────────┐
│ Executives  │ ─────► │ All Access  │
└─────────────┘        └─────────────┘
```

1. **Create Teams** — Define teams in your CRM (Engineering, Sales, etc.)
2. **Map to Groups** — Link each team to a DoorFlow group in Settings
3. **Assign Members** — Members can belong to multiple teams
4. **Sync** — During sync, members get assigned to DoorFlow groups based on their teams

Your CRM remains the source of truth; DoorFlow handles physical access control.

### Security

| Concern | Approach |
|---------|----------|
| Client Secret | Server-side only (API routes), never exposed to browser |
| Access Tokens | Stored in `data/tokens.json`, auto-refreshed with 5-min buffer |
| API Calls | All DoorFlow calls proxied through `/api/doorflow/*` routes |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/connect` | GET | Start OAuth flow |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/auth/status` | GET | Connection status + token info |
| `/api/auth/disconnect` | POST | Revoke tokens |
| `/api/auth/refresh` | POST | Force token refresh |
| `/api/members` | GET/POST | List/create CRM members |
| `/api/members/[id]` | GET/PUT/DELETE | Member CRUD |
| `/api/members/sync` | POST | Sync members to DoorFlow |
| `/api/teams` | GET/POST | List/create teams |
| `/api/teams/[id]` | GET/PUT/DELETE | Team CRUD |
| `/api/doorflow/people` | GET/POST | DoorFlow people |
| `/api/doorflow/people/[id]` | GET/PUT/DELETE | Single person |
| `/api/doorflow/credentials` | GET/POST | Credentials |
| `/api/doorflow/credentials/[id]` | DELETE | Delete credential |
| `/api/doorflow/credential-types` | GET | Credential types (cached) |
| `/api/doorflow/groups` | GET | Groups (cached) |
| `/api/reset` | POST | Factory reset to demo state |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **SDK**: [`doorflow`](https://www.npmjs.com/package/doorflow)

## For Developers

This sample app includes `<DevNote>` components throughout the UI that explain implementation details, SDK usage, and architecture decisions. Look for the dark code-themed boxes when exploring the app.

## License

MIT
