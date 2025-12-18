/**
 * Members Page
 *
 * Lists all CRM members with their DoorFlow sync status.
 * Features a polished design with filtering and actions.
 */

'use client';

import { Box, Container, Heading, Text, VStack, Button, HStack, Flex } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { MemberList } from '@/components/members/MemberList';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

export default function MembersPage() {
  const { isConnected, isLoading: connectionLoading } = useConnectionStatus();

  return (
    <Box bg="gray.50" minH="calc(100vh - 72px)">
      <Container maxW="container.lg" py={10}>
        <VStack align="stretch" gap={8}>
          {/* Page Header */}
          <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
            <Box>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="purple.500"
                textTransform="uppercase"
                letterSpacing="widest"
                mb={2}
              >
                CRM Data
              </Text>
              <Heading
                size="2xl"
                bgGradient="linear(to-r, gray.800, gray.600)"
                bgClip="text"
                fontWeight="extrabold"
                mb={2}
              >
                Members
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Manage your CRM members and their DoorFlow access integration.
              </Text>
            </Box>

          </Flex>

          {/* Connection Warning */}
          {!connectionLoading && !isConnected && (
            <Box
              bg="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
              borderRadius="2xl"
              p={1}
            >
              <Box bg="white" borderRadius="xl" p={5}>
                <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
                  <HStack gap={3}>
                    <Box
                      bg="orange.100"
                      borderRadius="full"
                      p={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <AlertTriangle size={20} color="#C05621" />
                    </Box>
                    <Box>
                      <Text fontWeight="bold" color="gray.800">
                        DoorFlow Not Connected
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Connect to DoorFlow to sync members and manage access credentials.
                      </Text>
                    </Box>
                  </HStack>
                  <Link href="/">
                    <Button
                      colorPalette="orange"
                      borderRadius="full"
                      fontWeight="semibold"
                    >
                      Connect Now
                    </Button>
                  </Link>
                </Flex>
              </Box>
            </Box>
          )}

          {/* Member List */}
          <MemberList />
        </VStack>
      </Container>
    </Box>
  );
}
