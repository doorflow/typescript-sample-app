/**
 * Event Timeline Component
 *
 * Displays recent access events with a clean timeline design.
 */

'use client';

import { Box, VStack, HStack, Text, Spinner } from '@chakra-ui/react';
import { Check, X, Unlock, AlertTriangle, BarChart3 } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';

interface EventTimelineProps {
  firstName?: string;
  lastName?: string;
  limit?: number;
}

function getEventInfo(eventCode: number): { label: string; color: string; icon: React.ReactNode } {
  if ((eventCode >= 10 && eventCode <= 18) || eventCode === 70) {
    return { label: 'Access Granted', color: 'green', icon: <Check size={16} /> };
  }
  if ((eventCode >= 20 && eventCode <= 29) || (eventCode >= 71 && eventCode <= 73)) {
    return { label: 'Access Denied', color: 'red', icon: <X size={16} /> };
  }
  if (eventCode >= 40 && eventCode <= 42) {
    return { label: 'Auto-Unlock', color: 'blue', icon: <Unlock size={16} /> };
  }
  if (eventCode >= 90 && eventCode <= 91) {
    return { label: 'Tamper Alert', color: 'orange', icon: <AlertTriangle size={16} /> };
  }
  return { label: 'Event', color: 'gray', icon: '•' };
}

export function EventTimeline({ firstName, lastName, limit = 10 }: EventTimelineProps) {
  const { events, isLoading, error } = useEvents({
    firstName,
    lastName,
    limit,
  });

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="md" color="pink.500" />
        <Text mt={3} fontSize="sm" color="gray.500">
          Loading events...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} borderRadius="xl" bg="red.50">
        <Text color="red.600" fontSize="sm" fontWeight="medium">
          Error loading events: {error.message}
        </Text>
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box
        p={8}
        textAlign="center"
        bg="gray.50"
        borderRadius="xl"
      >
        <Box display="flex" justifyContent="center" mb={2}>
          <BarChart3 size={32} color="#718096" />
        </Box>
        <Text color="gray.500" fontWeight="medium">
          No recent access events.
        </Text>
        <Text color="gray.400" fontSize="sm">
          Events will appear here when this person uses their credentials.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={0}>
      {events.map((event, index) => {
        const { label, color, icon } = getEventInfo(event.eventCode);
        const isLast = index === events.length - 1;

        return (
          <HStack key={event.id} align="start" gap={4}>
            {/* Timeline Dot & Line */}
            <Box position="relative" display="flex" flexDirection="column" alignItems="center">
              <Box
                w={10}
                h={10}
                borderRadius="full"
                bg={`${color}.100`}
                color={`${color}.600`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
                fontSize="sm"
                zIndex={1}
              >
                {icon}
              </Box>
              {!isLast && (
                <Box
                  w="2px"
                  flex={1}
                  minH={8}
                  bg="gray.200"
                />
              )}
            </Box>

            {/* Event Content */}
            <Box flex={1} pb={isLast ? 0 : 6}>
              <HStack justify="space-between" align="start" mb={1}>
                <Box
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  bg={`${color}.100`}
                  color={`${color}.700`}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {label}
                </Box>
                <Text fontSize="xs" color="gray.400">
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.700" fontWeight="medium">
                {event.channelName || event.doorControllerName || 'Unknown location'}
              </Text>
              {event.description && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {event.description}
                </Text>
              )}
            </Box>
          </HStack>
        );
      })}
    </VStack>
  );
}
