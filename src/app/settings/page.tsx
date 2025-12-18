/**
 * DoorFlow Integration Settings Page
 *
 * Manage cached DoorFlow data and team→group mappings.
 * - Refresh credential types and groups from DoorFlow
 * - Map CRM teams to DoorFlow groups for access control
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Spinner,
  Flex,
  Alert,
} from '@chakra-ui/react';
import { PlugZap, Link as LinkIcon, Users, ClipboardList, CreditCard, Check, RotateCcw, RefreshCw, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useCredentialTypes } from '@/hooks/useCredentials';
import { useGroups } from '@/hooks/useGroups';
import { useTeams } from '@/hooks/useTeams';
import { useMembers } from '@/hooks/useMembers';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';
import { DevNote } from '@/components/DevNote';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, isLoading: connectionLoading } = useConnectionStatus();
  const { credentialTypes, isLoading: typesLoading, refresh: refreshTypes } = useCredentialTypes();
  const { groups, isLoading: groupsLoading, refresh: refreshGroups } = useGroups();
  const { teams, isLoading: teamsLoading, updateTeam } = useTeams();
  const { members, isLoading: membersLoading, refresh: refreshMembers } = useMembers();

  // Calculate member sync stats
  const linkedMembers = members.filter(m => m.doorflowPersonId != null);
  const unlinkedMembers = members.filter(m => m.doorflowPersonId == null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshingTypes, setRefreshingTypes] = useState(false);

  // Handle OAuth callback success message
  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected === 'true') {
      setSuccessMessage('Successfully connected to DoorFlow!');
      // Clear the URL params
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/members/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createMissing: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const result = await response.json();
      const total = result.matched.length + result.created.length;
      setSuccessMessage(`Synced ${total} member${total !== 1 ? 's' : ''} to DoorFlow`);
      refreshMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const [refreshingGroups, setRefreshingGroups] = useState(false);
  const [mappingTeamId, setMappingTeamId] = useState<string | null>(null);
  const [savingMapping, setSavingMapping] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleRefreshTypes = async () => {
    setRefreshingTypes(true);
    try {
      await refreshTypes();
    } finally {
      setRefreshingTypes(false);
    }
  };

  const handleRefreshGroups = async () => {
    setRefreshingGroups(true);
    try {
      await refreshGroups();
    } finally {
      setRefreshingGroups(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshingTypes(true);
    setRefreshingGroups(true);
    try {
      await Promise.all([refreshTypes(), refreshGroups()]);
    } finally {
      setRefreshingTypes(false);
      setRefreshingGroups(false);
    }
  };

  const handleMapToGroup = async (teamId: string, groupId: number | null) => {
    setSavingMapping(true);
    try {
      await updateTeam(teamId, { doorflowGroupId: groupId });
      setMappingTeamId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update mapping');
    } finally {
      setSavingMapping(false);
    }
  };

  const handleFactoryReset = async () => {
    if (!confirm('Are you sure you want to reset to demo state?\n\nThis will:\n- Disconnect from DoorFlow\n- Reset all members to sample data\n- Reset all teams to sample data\n\nThis cannot be undone.')) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Reset failed');
      }
      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset application');
      setIsResetting(false);
    }
  };

  if (connectionLoading) {
    return (
      <Box bg="gray.50" minH="calc(100vh - 72px)">
        <Container maxW="container.lg" py={10}>
          <Box textAlign="center" py={20}>
            <Spinner size="xl" color="purple.500" />
            <Text mt={4} color="gray.600" fontWeight="medium">
              Loading...
            </Text>
          </Box>
        </Container>
      </Box>
    );
  }

  if (!isConnected) {
    return (
      <Box bg="gray.50" minH="calc(100vh - 72px)">
        <Container maxW="container.lg" py={10}>
          <Box
            bg="white"
            borderRadius="2xl"
            p={10}
            textAlign="center"
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
          >
            <Box display="flex" justifyContent="center" mb={4}>
              <PlugZap size={64} color="#805AD5" />
            </Box>
            <Heading size="lg" color="gray.800" mb={2}>
              Not Connected
            </Heading>
            <Text color="gray.600" mb={6}>
              Connect to DoorFlow to manage settings.
            </Text>
            <Link href="/">
              <Button
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                color="white"
                borderRadius="full"
                fontWeight="bold"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.35)',
                }}
              >
                Go to Connect
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="calc(100vh - 72px)">
      <Container maxW="container.lg" py={10}>
        <VStack align="stretch" gap={6}>
          {/* Success Message */}
          {successMessage && (
            <Alert.Root status="success" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{successMessage}</Alert.Title>
            </Alert.Root>
          )}

          {/* Header */}
          <Box>
            <Heading size="xl" color="gray.800" mb={2}>
              DoorFlow Integration Settings
            </Heading>
            <Text color="gray.600">
              Manage cached data and configure team-to-group mappings.
            </Text>
          </Box>

          {/* Connection Status */}
          <ConnectionStatus />

          {/* Member ↔ People Sync */}
          <Box
            bg="white"
            borderRadius="2xl"
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
            overflow="hidden"
          >
            <Box
              bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              px={6}
              py={4}
            >
              <HStack gap={3}>
                <RefreshCw size={20} color="white" />
                <Text fontWeight="bold" color="white">
                  Member ↔ People Sync
                </Text>
              </HStack>
            </Box>
            <Box p={6}>
              <VStack align="stretch" gap={5}>
                {/* Sync Stats */}
                <SimpleGrid columns={3} gap={4}>
                  <Box textAlign="center" p={4} bg="gray.50" borderRadius="xl">
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                      {membersLoading ? '...' : members.length}
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase">
                      Total Members
                    </Text>
                  </Box>
                  <Box textAlign="center" p={4} bg="green.50" borderRadius="xl">
                    <HStack justify="center" gap={1}>
                      <UserCheck size={18} color="#38A169" />
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {membersLoading ? '...' : linkedMembers.length}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="green.600" fontWeight="medium" textTransform="uppercase">
                      Linked
                    </Text>
                  </Box>
                  <Box textAlign="center" p={4} bg="orange.50" borderRadius="xl">
                    <HStack justify="center" gap={1}>
                      <UserX size={18} color="#DD6B20" />
                      <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                        {membersLoading ? '...' : unlinkedMembers.length}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="orange.600" fontWeight="medium" textTransform="uppercase">
                      Unlinked
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Sync Button - only show if there are unlinked members */}
                {unlinkedMembers.length > 0 && (
                  <Button
                    w="full"
                    bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                    color="white"
                    borderRadius="xl"
                    fontWeight="bold"
                    size="lg"
                    onClick={handleSync}
                    loading={isSyncing}
                    loadingText="Syncing..."
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(79, 172, 254, 0.35)',
                    }}
                    transition="all 0.2s"
                  >
                    <HStack gap={2}>
                      <RefreshCw size={18} />
                      <Text>Sync {unlinkedMembers.length} Unlinked Member{unlinkedMembers.length !== 1 ? 's' : ''}</Text>
                    </HStack>
                  </Button>
                )}

                {/* Developer Note */}
                <DevNote
                  title="Sync Implementation"
                  variant="code"
                  sdkMethod="doorflow.people.createPerson({ personInput })"
                  filePath="src/app/api/members/sync/route.ts"
                >
                  This sync matches CRM members to DoorFlow people by email. Unmatched members
                  are created via the SDK. In production, handle CRUD operations automatically
                  when members change. For large datasets, use a job queue (BullMQ, Inngest) —
                  the SDK calls stay the same.
                </DevNote>
              </VStack>
            </Box>
          </Box>

          {/* Team to Group Mappings */}
          <Box
            bg="white"
            borderRadius="2xl"
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
            overflow="hidden"
          >
            <Box
              bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              px={6}
              py={4}
            >
              <HStack justify="space-between" align="center">
                <HStack gap={3}>
                  <LinkIcon size={20} color="white" />
                  <Text fontWeight="bold" color="white">
                    Team → Group Mappings
                  </Text>
                </HStack>
                <Link href="/teams">
                  <Button
                    size="sm"
                    bg="whiteAlpha.200"
                    color="white"
                    borderRadius="full"
                    _hover={{ bg: 'whiteAlpha.300' }}
                  >
                    Manage Teams
                  </Button>
                </Link>
              </HStack>
            </Box>
            <Box p={6}>
              {teamsLoading || groupsLoading ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="md" color="pink.500" />
                  <Text mt={3} fontSize="sm" color="gray.500">
                    Loading teams and groups...
                  </Text>
                </Box>
              ) : teams.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Box display="flex" justifyContent="center" mb={3}>
                    <Users size={40} color="#718096" />
                  </Box>
                  <Text color="gray.500" fontWeight="medium" mb={4}>
                    No teams created yet.
                  </Text>
                  <Link href="/teams">
                    <Button
                      size="sm"
                      bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                      color="white"
                      borderRadius="full"
                      _hover={{ transform: 'translateY(-2px)' }}
                    >
                      Create Teams
                    </Button>
                  </Link>
                </Box>
              ) : groups.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Box display="flex" justifyContent="center" mb={3}>
                    <ClipboardList size={40} color="#718096" />
                  </Box>
                  <Text color="gray.500" fontWeight="medium">
                    No DoorFlow groups available.
                  </Text>
                  <Text color="gray.400" fontSize="sm" mt={1}>
                    Create groups in DoorFlow, then refresh below.
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" gap={3}>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                    {teams.length} team{teams.length !== 1 ? 's' : ''} • {teams.filter(t => t.doorflowGroupId).length} mapped
                  </Text>
                  {teams.map((team) => {
                    const mappedGroup = groups.find((g) => g.id === team.doorflowGroupId);
                    const isMapping = mappingTeamId === team.id;

                    return (
                      <Box
                        key={team.id}
                        p={4}
                        bg="gray.50"
                        borderRadius="xl"
                        border="2px solid"
                        borderColor={mappedGroup ? 'green.200' : 'gray.200'}
                      >
                        <Flex justify="space-between" align="start" gap={4}>
                          <Box flex={1}>
                            <HStack gap={2} mb={1}>
                              <Text fontWeight="semibold" color="gray.800">
                                {team.name}
                              </Text>
                              {mappedGroup && (
                                <Box
                                  px={2}
                                  py={0.5}
                                  bg="green.100"
                                  borderRadius="full"
                                  fontSize="xs"
                                  color="green.700"
                                  fontWeight="medium"
                                >
                                  Mapped
                                </Box>
                              )}
                            </HStack>
                            {team.description && (
                              <Text fontSize="sm" color="gray.500" mb={2}>
                                {team.description}
                              </Text>
                            )}
                            {isMapping ? (
                              <VStack align="stretch" gap={2} mt={3}>
                                <Text fontSize="xs" color="gray.500" fontWeight="medium">
                                  Select a DoorFlow group:
                                </Text>
                                {groups.map((group) => (
                                  <Box
                                    key={group.id}
                                    p={3}
                                    borderRadius="lg"
                                    border="2px solid"
                                    borderColor={team.doorflowGroupId === group.id ? 'green.400' : 'gray.200'}
                                    bg={team.doorflowGroupId === group.id ? 'green.50' : 'white'}
                                    cursor="pointer"
                                    onClick={() => !savingMapping && handleMapToGroup(team.id, group.id)}
                                    _hover={{ borderColor: 'gray.300', bg: 'gray.50' }}
                                    transition="all 0.15s"
                                  >
                                    <HStack justify="space-between">
                                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                                        {group.name}
                                      </Text>
                                      {team.doorflowGroupId === group.id && (
                                        <Check size={16} color="#38A169" />
                                      )}
                                    </HStack>
                                  </Box>
                                ))}
                                <HStack gap={2} mt={2}>
                                  {team.doorflowGroupId && (
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      colorPalette="red"
                                      onClick={() => handleMapToGroup(team.id, null)}
                                      disabled={savingMapping}
                                    >
                                      Remove Mapping
                                    </Button>
                                  )}
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => setMappingTeamId(null)}
                                    disabled={savingMapping}
                                  >
                                    Cancel
                                  </Button>
                                </HStack>
                              </VStack>
                            ) : (
                              <HStack gap={2} mt={2}>
                                <Text fontSize="sm" color={mappedGroup ? 'green.600' : 'gray.400'}>
                                  {mappedGroup ? `→ ${mappedGroup.name}` : 'Not mapped to a group'}
                                </Text>
                              </HStack>
                            )}
                          </Box>
                          {!isMapping && (
                            <Button
                              size="sm"
                              variant="outline"
                              borderRadius="full"
                              onClick={() => setMappingTeamId(team.id)}
                            >
                              {mappedGroup ? 'Change' : 'Map'}
                            </Button>
                          )}
                        </Flex>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>
          </Box>

          {/* Developer Note - Team Mappings */}
          <DevNote
            title="Group Assignment"
            variant="code"
            sdkMethod="doorflow.people.updatePerson({ id, personInput: { groupIds } })"
          >
            Team→Group mappings are stored locally. During sync, each member&apos;s <code>teamIds</code> are
            resolved to DoorFlow <code>groupIds</code> and passed to the API. This controls which
            doors they can access. Groups must exist in DoorFlow first — create them in the admin portal.
          </DevNote>

          {/* Refresh All Button */}
          <Box>
            <Button
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              color="white"
              borderRadius="xl"
              fontWeight="bold"
              onClick={handleRefreshAll}
              loading={refreshingTypes || refreshingGroups}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.35)',
              }}
              transition="all 0.2s"
            >
              Refresh All Cached Data
            </Button>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            {/* Credential Types Card */}
            <Box
              bg="white"
              borderRadius="2xl"
              boxShadow="0 4px 20px rgba(0,0,0,0.08)"
              overflow="hidden"
            >
              <Box
                bg="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                px={6}
                py={4}
              >
                <HStack justify="space-between" align="center">
                  <HStack gap={3}>
                    <CreditCard size={20} color="white" />
                    <Text fontWeight="bold" color="white">
                      Credential Types
                    </Text>
                  </HStack>
                  <Button
                    size="sm"
                    bg="whiteAlpha.200"
                    color="white"
                    borderRadius="full"
                    _hover={{ bg: 'whiteAlpha.300' }}
                    onClick={handleRefreshTypes}
                    loading={refreshingTypes}
                  >
                    Refresh
                  </Button>
                </HStack>
              </Box>
              <Box p={6}>
                {typesLoading ? (
                  <Box textAlign="center" py={4}>
                    <Spinner size="sm" color="green.500" />
                    <Text mt={2} fontSize="sm" color="gray.500">
                      Loading...
                    </Text>
                  </Box>
                ) : credentialTypes.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Text color="gray.500" fontSize="sm">
                      No credential types found
                    </Text>
                  </Box>
                ) : (
                  <VStack align="stretch" gap={2}>
                    <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                      {credentialTypes.length} type{credentialTypes.length !== 1 ? 's' : ''} cached
                    </Text>
                    {credentialTypes.map((type) => (
                      <Box
                        key={type.id}
                        p={3}
                        bg="gray.50"
                        borderRadius="lg"
                      >
                        <HStack justify="space-between">
                          <Text fontWeight="medium" color="gray.700" fontSize="sm">
                            {type.label}
                          </Text>
                          <Text fontSize="xs" color="gray.400" fontFamily="mono">
                            ID: {type.id}
                          </Text>
                        </HStack>
                        {type.slug && (
                          <Text fontSize="xs" color="gray.400">
                            {type.slug}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Box>

            {/* Groups Card */}
            <Box
              bg="white"
              borderRadius="2xl"
              boxShadow="0 4px 20px rgba(0,0,0,0.08)"
              overflow="hidden"
            >
              <Box
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                px={6}
                py={4}
              >
                <HStack justify="space-between" align="center">
                  <HStack gap={3}>
                    <Users size={20} color="white" />
                    <Text fontWeight="bold" color="white">
                      DoorFlow Groups
                    </Text>
                  </HStack>
                  <Button
                    size="sm"
                    bg="whiteAlpha.200"
                    color="white"
                    borderRadius="full"
                    _hover={{ bg: 'whiteAlpha.300' }}
                    onClick={handleRefreshGroups}
                    loading={refreshingGroups}
                  >
                    Refresh
                  </Button>
                </HStack>
              </Box>
              <Box p={6}>
                {groupsLoading ? (
                  <Box textAlign="center" py={4}>
                    <Spinner size="sm" color="purple.500" />
                    <Text mt={2} fontSize="sm" color="gray.500">
                      Loading...
                    </Text>
                  </Box>
                ) : groups.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Text color="gray.500" fontSize="sm">
                      No groups found
                    </Text>
                  </Box>
                ) : (
                  <VStack align="stretch" gap={2}>
                    <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                      {groups.length} group{groups.length !== 1 ? 's' : ''} cached
                    </Text>
                    {groups.map((group) => (
                      <Box
                        key={group.id}
                        p={3}
                        bg="gray.50"
                        borderRadius="lg"
                      >
                        <HStack justify="space-between">
                          <Text fontWeight="medium" color="gray.700" fontSize="sm">
                            {group.name}
                          </Text>
                          <Text fontSize="xs" color="gray.400" fontFamily="mono">
                            ID: {group.id}
                          </Text>
                        </HStack>
                        {group.notes && (
                          <Text fontSize="xs" color="gray.400" mt={1}>
                            {group.notes}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Box>
          </SimpleGrid>

          {/* Developer Note - Caching */}
          <DevNote title="Why Cache?" variant="tip">
            Credential types and groups rarely change, so we recommend that you cache them.
            This avoids unnecessary API calls. In production, you might use Redis
            or your database instead. The SDK calls (<code>doorflow.credentialTypes.listCredentialTypes()</code>,{' '}
            <code>doorflow.groups.listGroups()</code>) are the same either way.
          </DevNote>

          {/* Factory Reset */}
          <Box
            bg="white"
            borderRadius="2xl"
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
            overflow="hidden"
            borderWidth="2px"
            borderColor="red.100"
          >
            <Box
              bg="red.50"
              px={6}
              py={4}
            >
              <HStack gap={3}>
                <RotateCcw size={20} color="#C53030" />
                <Text fontWeight="bold" color="red.700">
                  Factory Reset
                </Text>
              </HStack>
            </Box>
            <Box p={6}>
              <Text color="gray.600" fontSize="sm" mb={4}>
                Reset the application to its initial demo state. This will disconnect from DoorFlow,
                restore sample members and teams, and clear all DoorFlow links and group mappings.
              </Text>
              <Button
                colorPalette="red"
                variant="outline"
                borderRadius="full"
                fontWeight="semibold"
                onClick={handleFactoryReset}
                loading={isResetting}
                loadingText="Resetting..."
              >
                Reset to Demo State
              </Button>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <Box bg="gray.50" minH="calc(100vh - 72px)">
        <Container maxW="container.lg" py={10}>
          <Box textAlign="center" py={20}>
            <Spinner size="xl" color="purple.500" />
            <Text mt={4} color="gray.600" fontWeight="medium">
              Loading...
            </Text>
          </Box>
        </Container>
      </Box>
    }>
      <SettingsContent />
    </Suspense>
  );
}
