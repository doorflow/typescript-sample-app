/**
 * Sync Status Badge Component
 *
 * Shows whether a CRM member is linked to a DoorFlow person
 * with a polished visual design.
 */

'use client';

import { Box, HStack, Text } from '@chakra-ui/react';

interface SyncStatusBadgeProps {
  doorflowPersonId?: number | null;
}

export function SyncStatusBadge({ doorflowPersonId }: SyncStatusBadgeProps) {
  if (doorflowPersonId) {
    return (
      <HStack
        gap={2}
        bg="green.50"
        color="green.700"
        px={3}
        py={1.5}
        borderRadius="full"
        fontSize="xs"
        fontWeight="semibold"
      >
        <Box
          w={2}
          h={2}
          borderRadius="full"
          bg="green.500"
          boxShadow="0 0 6px rgba(72, 187, 120, 0.5)"
        />
        <Text>Linked to DoorFlow</Text>
        <Text color="green.500" fontFamily="mono">
          #{doorflowPersonId}
        </Text>
      </HStack>
    );
  }

  return (
    <HStack
      gap={2}
      bg="gray.100"
      color="gray.600"
      px={3}
      py={1.5}
      borderRadius="full"
      fontSize="xs"
      fontWeight="semibold"
    >
      <Box
        w={2}
        h={2}
        borderRadius="full"
        bg="gray.400"
      />
      <Text>Not Linked to DoorFlow</Text>
    </HStack>
  );
}
