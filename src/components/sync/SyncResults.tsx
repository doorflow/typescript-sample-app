/**
 * Sync Results Component
 *
 * Displays the results of a sync operation with a polished UI.
 */

'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Accordion,
} from '@chakra-ui/react';
import { Search, CheckCircle, Link, Plus, SkipForward, AlertTriangle } from 'lucide-react';
import type { SyncResult } from '@/lib/types';

interface SyncResultsProps {
  results: SyncResult;
  isDryRun: boolean;
}

export function SyncResults({ results, isDryRun }: SyncResultsProps) {
  const totalProcessed =
    results.matched.length +
    results.created.length +
    results.unmatched.length +
    results.errors.length;

  return (
    <VStack align="stretch" gap={6}>
      {/* Summary Header */}
      <Box
        bg="white"
        borderRadius="2xl"
        p={6}
        boxShadow="0 4px 20px rgba(0,0,0,0.08)"
      >
        <HStack gap={2} mb={4}>
          {isDryRun ? <Search size={20} color="#4A5568" /> : <CheckCircle size={20} color="#38A169" />}
          <Heading size="md" color="gray.800">
            {isDryRun ? 'Dry Run Results' : 'Sync Complete'}
          </Heading>
        </HStack>
        <HStack flexWrap="wrap" gap={4}>
          <StatBox
            label="Matched"
            value={results.matched.length}
            color="green"
            icon={<Link size={20} />}
          />
          <StatBox
            label={isDryRun ? 'Would Create' : 'Created'}
            value={results.created.length}
            color="blue"
            icon={<Plus size={20} />}
          />
          <StatBox
            label="Unmatched"
            value={results.unmatched.length}
            color="gray"
            icon={<SkipForward size={20} />}
          />
          {results.errors.length > 0 && (
            <StatBox
              label="Errors"
              value={results.errors.length}
              color="red"
              icon={<AlertTriangle size={20} />}
            />
          )}
        </HStack>
        <Text fontSize="sm" color="gray.500" mt={4}>
          {totalProcessed} member{totalProcessed !== 1 ? 's' : ''} processed
        </Text>
      </Box>

      {/* Detailed Results */}
      <Box
        bg="white"
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="0 4px 20px rgba(0,0,0,0.08)"
      >
        <Accordion.Root multiple>
          {/* Matched Members */}
          {results.matched.length > 0 && (
            <Accordion.Item value="matched">
              <Accordion.ItemTrigger p={4} _hover={{ bg: 'gray.50' }}>
                <HStack flex="1" gap={3}>
                  <Box
                    bg="green.100"
                    color="green.700"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {results.matched.length}
                  </Box>
                  <Text fontWeight="semibold" color="gray.800">
                    Matched Members
                  </Text>
                </HStack>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <VStack align="stretch" gap={2} p={4} pt={0}>
                  {results.matched.map(({ member, personId }) => (
                    <HStack
                      key={member.id}
                      justify="space-between"
                      p={3}
                      bg="green.50"
                      borderRadius="lg"
                    >
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text fontSize="xs" color="green.600" fontFamily="mono">
                        → DoorFlow #{personId}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Accordion.ItemContent>
            </Accordion.Item>
          )}

          {/* Created Members */}
          {results.created.length > 0 && (
            <Accordion.Item value="created">
              <Accordion.ItemTrigger p={4} _hover={{ bg: 'gray.50' }}>
                <HStack flex="1" gap={3}>
                  <Box
                    bg="blue.100"
                    color="blue.700"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {results.created.length}
                  </Box>
                  <Text fontWeight="semibold" color="gray.800">
                    {isDryRun ? 'Would Be Created' : 'Created in DoorFlow'}
                  </Text>
                </HStack>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <VStack align="stretch" gap={2} p={4} pt={0}>
                  {results.created.map(({ member, personId }) => (
                    <HStack
                      key={member.id}
                      justify="space-between"
                      p={3}
                      bg="blue.50"
                      borderRadius="lg"
                    >
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text fontSize="xs" color="blue.600" fontFamily="mono">
                        {isDryRun ? '(will create)' : `→ DoorFlow #${personId}`}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Accordion.ItemContent>
            </Accordion.Item>
          )}

          {/* Unmatched Members */}
          {results.unmatched.length > 0 && (
            <Accordion.Item value="unmatched">
              <Accordion.ItemTrigger p={4} _hover={{ bg: 'gray.50' }}>
                <HStack flex="1" gap={3}>
                  <Box
                    bg="gray.100"
                    color="gray.600"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {results.unmatched.length}
                  </Box>
                  <Text fontWeight="semibold" color="gray.800">
                    Unmatched (Skipped)
                  </Text>
                </HStack>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <VStack align="stretch" gap={2} p={4} pt={0}>
                  {results.unmatched.map((member) => (
                    <HStack
                      key={member.id}
                      justify="space-between"
                      p={3}
                      bg="gray.50"
                      borderRadius="lg"
                    >
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {member.email}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Accordion.ItemContent>
            </Accordion.Item>
          )}

          {/* Errors */}
          {results.errors.length > 0 && (
            <Accordion.Item value="errors">
              <Accordion.ItemTrigger p={4} _hover={{ bg: 'gray.50' }}>
                <HStack flex="1" gap={3}>
                  <Box
                    bg="red.100"
                    color="red.700"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {results.errors.length}
                  </Box>
                  <Text fontWeight="semibold" color="gray.800">
                    Errors
                  </Text>
                </HStack>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <VStack align="stretch" gap={2} p={4} pt={0}>
                  {results.errors.map(({ member, error }) => (
                    <Box key={member.id} p={3} bg="red.50" borderRadius="lg">
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text fontSize="xs" color="red.600" mt={1}>
                        {error}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </Accordion.ItemContent>
            </Accordion.Item>
          )}
        </Accordion.Root>
      </Box>
    </VStack>
  );
}

function StatBox({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Box
      bg={`${color}.50`}
      borderRadius="xl"
      p={4}
      minW="120px"
      textAlign="center"
    >
      <Box display="flex" justifyContent="center" mb={1} color={`${color}.600`}>{icon}</Box>
      <Text fontSize="2xl" fontWeight="bold" color={`${color}.600`}>
        {value}
      </Text>
      <Text fontSize="xs" color={`${color}.600`} fontWeight="medium">
        {label}
      </Text>
    </Box>
  );
}
