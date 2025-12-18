/**
 * Group Select Component
 *
 * Modern group selection UI with visual feedback.
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
import { Link, Users, Check } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useState } from 'react';

interface GroupSelectProps {
  personId: number | null;
  currentGroupIds: number[];
  onUpdateGroups: (groupIds: number[]) => Promise<void>;
}

export function GroupSelect({
  personId,
  currentGroupIds,
  onUpdateGroups,
}: GroupSelectProps) {
  const { groups, isLoading, error } = useGroups();
  const [selectedIds, setSelectedIds] = useState<number[]>(currentGroupIds);
  const [isSaving, setIsSaving] = useState(false);

  // Sync selectedIds when currentGroupIds changes (e.g., after fetch completes)
  const currentGroupIdsKey = currentGroupIds.sort().join(',');
  const [lastSyncedKey, setLastSyncedKey] = useState(currentGroupIdsKey);
  if (currentGroupIdsKey !== lastSyncedKey) {
    setSelectedIds(currentGroupIds);
    setLastSyncedKey(currentGroupIdsKey);
  }

  const hasChanges =
    selectedIds.length !== currentGroupIds.length ||
    selectedIds.some((id) => !currentGroupIds.includes(id));

  const toggleGroup = (groupId: number) => {
    setSelectedIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateGroups(selectedIds);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update groups');
      setSelectedIds(currentGroupIds);
    } finally {
      setIsSaving(false);
    }
  };

  if (!personId) {
    return (
      <Box
        p={8}
        textAlign="center"
        bg="gray.50"
        borderRadius="xl"
      >
        <Box display="flex" justifyContent="center" mb={2}>
          <Link size={32} color="#718096" />
        </Box>
        <Text color="gray.500" fontWeight="medium">
          Link this member to DoorFlow to manage group assignments.
        </Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="md" color="purple.500" />
        <Text mt={3} fontSize="sm" color="gray.500">
          Loading groups...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} borderRadius="xl" bg="red.50">
        <Text color="red.600" fontSize="sm" fontWeight="medium">
          Error loading groups: {error.message}
        </Text>
      </Box>
    );
  }

  if (groups.length === 0) {
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
        <Text color="gray.500" fontWeight="medium">
          No groups available in DoorFlow.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={6}>
      {/* All Groups */}
      <Box>
        <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={3}>
          Select Groups
        </Text>
        <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
          {groups.map((group) => {
            const isSelected = selectedIds.includes(group.id);
            return (
              <Box
                key={group.id}
                p={4}
                borderRadius="xl"
                border="2px solid"
                borderColor={isSelected ? 'purple.400' : 'gray.200'}
                bg={isSelected ? 'purple.50' : 'white'}
                cursor="pointer"
                onClick={() => toggleGroup(group.id)}
                _hover={{
                  borderColor: isSelected ? 'purple.500' : 'gray.300',
                  transform: 'translateY(-2px)',
                }}
                transition="all 0.2s"
              >
                <HStack justify="space-between">
                  <Text
                    fontWeight="semibold"
                    color={isSelected ? 'purple.700' : 'gray.700'}
                    fontSize="sm"
                  >
                    {group.name}
                  </Text>
                  <Box
                    w={5}
                    h={5}
                    borderRadius="full"
                    border="2px solid"
                    borderColor={isSelected ? 'purple.500' : 'gray.300'}
                    bg={isSelected ? 'purple.500' : 'white'}
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
      </Box>

      {/* Save Button */}
      {hasChanges && (
        <Button
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="white"
          borderRadius="xl"
          fontWeight="bold"
          onClick={handleSave}
          loading={isSaving}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.35)',
          }}
        >
          Save Group Changes
        </Button>
      )}
    </VStack>
  );
}
