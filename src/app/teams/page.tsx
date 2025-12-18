/**
 * Teams Management Page
 *
 * Create and manage CRM teams.
 * Teams are mapped to DoorFlow groups in Settings → Team Mappings.
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Spinner,
  SimpleGrid,
  Flex,
} from '@chakra-ui/react';
import { Users } from 'lucide-react';
import { DevNote } from '@/components/DevNote';
import Link from 'next/link';
import { useTeams } from '@/hooks/useTeams';

export default function TeamsPage() {
  const { teams, isLoading, createTeam, updateTeam, deleteTeam } = useTeams();

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsCreating(true);
    try {
      await createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined,
      });
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTeam = async (teamId: string) => {
    if (!editName.trim()) return;

    try {
      await updateTeam(teamId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingTeamId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await deleteTeam(teamId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  const startEditing = (team: { id: string; name: string; description?: string }) => {
    setEditingTeamId(team.id);
    setEditName(team.name);
    setEditDescription(team.description || '');
  };

  if (isLoading) {
    return (
      <Box bg="gray.50" minH="calc(100vh - 72px)">
        <Container maxW="container.lg" py={10}>
          <Box textAlign="center" py={20}>
            <Spinner size="xl" color="purple.500" />
            <Text mt={4} color="gray.600" fontWeight="medium">
              Loading teams...
            </Text>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="calc(100vh - 72px)">
      <Container maxW="container.lg" py={10}>
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <Box>
            <Heading size="xl" color="gray.800" mb={2}>
              Teams
            </Heading>
            <Text color="gray.600">
              Create and manage CRM teams. Map them to DoorFlow groups in{' '}
              <Link href="/settings">
                <Text as="span" color="purple.500" fontWeight="medium" textDecoration="underline">
                  Settings
                </Text>
              </Link>
              .
            </Text>
          </Box>

          {/* Create Team Form */}
          <Box
            as="form"
            onSubmit={handleCreateTeam}
            bg="white"
            borderRadius="2xl"
            p={6}
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
          >
            <Text fontWeight="bold" color="gray.800" mb={4}>
              Create New Team
            </Text>
            <VStack align="stretch" gap={3}>
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name"
                size="lg"
                borderRadius="xl"
              />
              <Input
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="Description (optional)"
                borderRadius="xl"
              />
              <Button
                type="submit"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                color="white"
                borderRadius="xl"
                fontWeight="bold"
                loading={isCreating}
                disabled={!newTeamName.trim()}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.35)',
                }}
              >
                Create Team
              </Button>
            </VStack>
          </Box>

          {/* Teams List */}
          {teams.length === 0 ? (
            <Box
              bg="white"
              borderRadius="2xl"
              p={10}
              textAlign="center"
              boxShadow="0 4px 20px rgba(0,0,0,0.08)"
            >
              <Box display="flex" justifyContent="center" mb={4}>
                <Users size={48} color="#805AD5" />
              </Box>
              <Heading size="md" color="gray.700" mb={2}>
                No Teams Yet
              </Heading>
              <Text color="gray.500">
                Create your first team to organize members and control access.
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {teams.map((team) => {
                const isEditing = editingTeamId === team.id;
                const isMapped = team.doorflowGroupId != null;

                return (
                  <Box
                    key={team.id}
                    bg="white"
                    borderRadius="2xl"
                    boxShadow="0 4px 20px rgba(0,0,0,0.08)"
                    overflow="hidden"
                  >
                    {/* Team Header */}
                    <Box
                      bg={isMapped
                        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }
                      px={5}
                      py={3}
                    >
                      <Flex justify="space-between" align="center">
                        <HStack gap={2}>
                          <Users size={20} color="white" />
                          {isEditing ? (
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              size="sm"
                              bg="whiteAlpha.200"
                              border="none"
                              color="white"
                              fontWeight="bold"
                              _placeholder={{ color: 'whiteAlpha.700' }}
                            />
                          ) : (
                            <Text fontWeight="bold" color="white">
                              {team.name}
                            </Text>
                          )}
                        </HStack>
                        {isMapped && (
                          <Box
                            px={2}
                            py={0.5}
                            bg="whiteAlpha.200"
                            borderRadius="full"
                            fontSize="xs"
                            color="white"
                            fontWeight="medium"
                          >
                            Mapped
                          </Box>
                        )}
                      </Flex>
                    </Box>

                    {/* Team Content */}
                    <Box p={5}>
                      <VStack align="stretch" gap={4}>
                        {/* Description */}
                        {isEditing ? (
                          <Input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description (optional)"
                            size="sm"
                            borderRadius="lg"
                          />
                        ) : (
                          <Text fontSize="sm" color="gray.600">
                            {team.description || 'No description'}
                          </Text>
                        )}

                        {/* Mapping Status */}
                        <Box>
                          <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={1}>
                            DoorFlow Group
                          </Text>
                          <Text fontSize="sm" color={isMapped ? 'green.600' : 'gray.400'} fontWeight="medium">
                            {isMapped ? 'Mapped (see Settings)' : 'Not mapped'}
                          </Text>
                        </Box>

                        {/* Actions */}
                        <HStack justify="flex-end" gap={2}>
                          {isEditing ? (
                            <>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setEditingTeamId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="xs"
                                colorPalette="green"
                                onClick={() => handleUpdateTeam(team.id)}
                              >
                                Save
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => startEditing(team)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                onClick={() => handleDeleteTeam(team.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}

          {/* Developer Note */}
          <DevNote title="Team → Group Mapping" variant="code">
            Teams are a CRM concept — DoorFlow uses groups for access control. Map each team
            to a DoorFlow group in <a href="/settings">Settings</a>. When members are synced,
            their team memberships are converted to <code>groupIds</code> and sent to the API.
          </DevNote>
        </VStack>
      </Container>
    </Box>
  );
}
