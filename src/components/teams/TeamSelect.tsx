/**
 * Team Select Component
 *
 * Allows selecting which teams a member belongs to.
 * Teams map to DoorFlow groups for access control.
 */

'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  SimpleGrid,
} from '@chakra-ui/react';
import { Users, Check } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { useState } from 'react';
import Link from 'next/link';
import { DevNote } from '@/components/DevNote';

interface TeamSelectProps {
  currentTeamIds: string[];
  onUpdateTeams: (teamIds: string[]) => Promise<void>;
}

export function TeamSelect({
  currentTeamIds,
  onUpdateTeams,
}: TeamSelectProps) {
  const { teams, isLoading, error } = useTeams();
  const [selectedIds, setSelectedIds] = useState<string[]>(currentTeamIds);
  const [isSaving, setIsSaving] = useState(false);

  // Sync selectedIds when currentTeamIds changes
  const currentTeamIdsKey = [...currentTeamIds].sort().join(',');
  const [lastSyncedKey, setLastSyncedKey] = useState(currentTeamIdsKey);
  if (currentTeamIdsKey !== lastSyncedKey) {
    setSelectedIds(currentTeamIds);
    setLastSyncedKey(currentTeamIdsKey);
  }

  const hasChanges =
    selectedIds.length !== currentTeamIds.length ||
    selectedIds.some((id) => !currentTeamIds.includes(id));

  const toggleTeam = (teamId: string) => {
    setSelectedIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateTeams(selectedIds);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update teams');
      setSelectedIds(currentTeamIds);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="md" color="orange.500" />
        <Text mt={3} fontSize="sm" color="gray.500">
          Loading teams...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} borderRadius="xl" bg="red.50">
        <Text color="red.600" fontSize="sm" fontWeight="medium">
          Error loading teams: {error.message}
        </Text>
      </Box>
    );
  }

  if (teams.length === 0) {
    return (
      <Box
        p={8}
        textAlign="center"
        bg="gray.50"
        borderRadius="xl"
      >
        <Box display="flex" justifyContent="center" mb={2}>
          <Users size={32} color="#718096" />
        </Box>
        <Text color="gray.500" fontWeight="medium" mb={3}>
          No teams created yet.
        </Text>
        <Link href="/teams">
          <Button
            size="sm"
            bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            color="white"
            borderRadius="full"
            _hover={{
              transform: 'translateY(-2px)',
            }}
          >
            Create Teams
          </Button>
        </Link>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
        {teams.map((team) => {
          const isSelected = selectedIds.includes(team.id);
          const isMapped = team.doorflowGroupId != null;
          return (
            <Box
              key={team.id}
              p={4}
              borderRadius="xl"
              border="2px solid"
              borderColor={isSelected ? 'orange.400' : 'gray.200'}
              bg={isSelected ? 'orange.50' : 'white'}
              cursor="pointer"
              onClick={() => toggleTeam(team.id)}
              _hover={{
                borderColor: isSelected ? 'orange.500' : 'gray.300',
                transform: 'translateY(-2px)',
              }}
              transition="all 0.2s"
            >
              <HStack justify="space-between">
                <Box flex={1}>
                  <Text
                    fontWeight="semibold"
                    color={isSelected ? 'orange.700' : 'gray.700'}
                    fontSize="sm"
                  >
                    {team.name}
                  </Text>
                  {isMapped && (
                    <Text fontSize="xs" color="green.600">
                      Mapped to group
                    </Text>
                  )}
                  {!isMapped && (
                    <Text fontSize="xs" color="gray.400">
                      Not mapped yet to a DoorFlow group
                    </Text>
                  )}
                </Box>
                <Box
                  w={5}
                  h={5}
                  borderRadius="full"
                  border="2px solid"
                  borderColor={isSelected ? 'orange.500' : 'gray.300'}
                  bg={isSelected ? 'orange.500' : 'white'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {isSelected && (
                    <Check size={12} color="white" />
                  )}
                </Box>
              </HStack>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* Save Button */}
      {hasChanges && (
        <Button
          bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          color="white"
          borderRadius="xl"
          fontWeight="bold"
          onClick={handleSave}
          loading={isSaving}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(240, 147, 251, 0.35)',
          }}
        >
          Save Team Changes
        </Button>
      )}

      {/* Developer Note */}
      <DevNote title="Team → Group Sync" variant="code">
        Teams marked &quot;Mapped to group&quot; have a <code>doorflowGroupId</code>. During sync,
        member team assignments are converted to <code>groupIds</code> and sent to the API.
        Map teams to groups in <a href="/settings">Settings</a>.
      </DevNote>
    </VStack>
  );
}
