'use client';

/**
 * Connection Status Component
 *
 * Displays the current DoorFlow connection status with a polished UI.
 */

import { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { Settings } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { DevNote } from '@/components/DevNote';

export function ConnectionStatus() {
  const {
    isConnected,
    isConfigured,
    missingConfig,
    isLoading,
    expiresAt,
    scope,
    connect,
    disconnect,
    refreshToken,
  } = useConnectionStatus();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      await refreshToken();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to refresh token');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        bg="white"
        borderRadius="2xl"
        p={8}
        boxShadow="0 4px 20px rgba(0,0,0,0.08)"
        border="1px solid"
        borderColor="gray.100"
      >
        <Flex align="center" justify="center" gap={4}>
          <Spinner size="md" color="purple.500" />
          <Text color="gray.600" fontWeight="medium">
            Checking connection status...
          </Text>
        </Flex>
      </Box>
    );
  }

  // Show setup instructions when environment variables are missing
  if (!isConfigured) {
    return (
      <Box
        bg="linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
        borderRadius="2xl"
        p={1}
        boxShadow="0 4px 20px rgba(255, 154, 158, 0.3)"
      >
        <Box bg="white" borderRadius="xl" p={6}>
          <VStack align="stretch" gap={5}>
            <Flex align="start" gap={4}>
              <Box
                bg="orange.100"
                borderRadius="xl"
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Settings size={28} color="#C05621" />
              </Box>
              <Box flex={1}>
                <Text fontWeight="bold" fontSize="lg" color="gray.800">
                  Setup Required
                </Text>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Configure your DoorFlow credentials to get started.
                </Text>
              </Box>
            </Flex>

            <Box bg="gray.50" borderRadius="xl" p={4}>
              <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={3}>
                Missing Environment Variables
              </Text>
              <VStack align="stretch" gap={2}>
                {missingConfig?.map((varName) => (
                  <HStack key={varName} gap={2}>
                    <Box w={2} h={2} borderRadius="full" bg="red.400" />
                    <Text fontSize="sm" fontFamily="mono" color="gray.700">
                      {varName}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            <Box bg="blue.50" borderRadius="xl" p={4}>
              <Text fontSize="sm" fontWeight="semibold" color="blue.800" mb={2}>
                Quick Setup
              </Text>
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm" color="blue.700">
                  <Text as="span" fontWeight="semibold">1.</Text> Copy the example environment file:
                </Text>
                <Box bg="blue.100" borderRadius="lg" px={3} py={2}>
                  <Text fontSize="xs" fontFamily="mono" color="blue.900">
                    cp .env.local.example .env.local
                  </Text>
                </Box>
                <Text fontSize="sm" color="blue.700">
                  <Text as="span" fontWeight="semibold">2.</Text> Edit <Text as="span" fontFamily="mono">.env.local</Text> with your DoorFlow OAuth credentials
                </Text>
                <Text fontSize="sm" color="blue.700">
                  <Text as="span" fontWeight="semibold">3.</Text> Restart the dev server
                </Text>
              </VStack>
            </Box>

            <Box bg="purple.50" borderRadius="xl" p={4}>
              <Text fontSize="sm" fontWeight="semibold" color="purple.800" mb={3}>
                Where to Get Credentials
              </Text>
              <Button
                as="a"
                href="https://developer.doorflow.com/applications"
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                bg="purple.600"
                color="white"
                borderRadius="full"
                fontWeight="semibold"
                _hover={{ bg: 'purple.700' }}
              >
                Create Application on DoorFlow
              </Button>
              <Text fontSize="sm" color="purple.700" mt={3}>
                Set the redirect URI to:
              </Text>
              <Box bg="purple.100" borderRadius="lg" px={3} py={2} mt={2}>
                <Text fontSize="xs" fontFamily="mono" color="purple.900">
                  http://localhost:3000/api/auth/callback
                </Text>
              </Box>
              <Text fontSize="sm" color="purple.700" mt={2}>
                Then copy the <Text as="span" fontWeight="semibold">Client ID</Text> and <Text as="span" fontWeight="semibold">Client Secret</Text> into your <Text as="span" fontFamily="mono">.env.local</Text> file.
              </Text>
            </Box>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (isConnected) {
    const now = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = expiresAt ? expiresAt - now : 0;
    const minutesUntilExpiry = Math.floor(secondsUntilExpiry / 60);

    return (
      <Box
        bg="linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)"
        borderRadius="2xl"
        p={1}
        boxShadow="0 4px 20px rgba(150, 230, 161, 0.3)"
      >
        <Box bg="white" borderRadius="xl" p={6}>
          <VStack align="stretch" gap={5}>
            <Flex justify="space-between" align="center">
              <HStack gap={3}>
                <Box
                  bg="green.500"
                  borderRadius="full"
                  w={3}
                  h={3}
                  boxShadow="0 0 10px rgba(72, 187, 120, 0.5)"
                />
                <Box>
                  <Text fontWeight="bold" fontSize="lg" color="gray.800">
                    Connected to DoorFlow
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Your integration is active
                  </Text>
                </Box>
              </HStack>
              <Button
                colorPalette="red"
                variant="outline"
                size="sm"
                borderRadius="full"
                onClick={disconnect}
                _hover={{ bg: 'red.50' }}
              >
                Disconnect to DoorFlow
              </Button>
            </Flex>

            <DevNote title="Token Lifecycle" variant="code">
              <Flex gap={6} align="center" mb={4}>
                <Box flex={1}>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                    Token Expires
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {minutesUntilExpiry > 0
                      ? `${minutesUntilExpiry} min`
                      : '< 1 min'}
                  </Text>
                </Box>
                {scope && (
                  <Box flex={2}>
                    <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                      Scopes
                    </Text>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" fontFamily="mono">
                      {scope}
                    </Text>
                  </Box>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="full"
                  onClick={handleRefreshToken}
                  loading={isRefreshing}
                >
                  Refresh Token
                </Button>
              </Flex>
              The SDK handles token management automatically. Just provide a storage adapter
              (like <code>FileTokenStorage</code>) and the SDK refreshes expired tokens whenever
              you make an API call. <strong>Disconnect</strong> revokes tokens server-side and clears
              storage — users must reauthorize. <strong>Refresh Token</strong> is just a demo button;
              in production, you never need to call it manually.
            </DevNote>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      borderRadius="2xl"
      p={8}
      boxShadow="0 8px 30px rgba(102, 126, 234, 0.3)"
      color="white"
    >
      <VStack align="stretch" gap={6}>
        <Box>
          <HStack gap={2} mb={2}>
            <Box
              bg="whiteAlpha.300"
              borderRadius="full"
              w={3}
              h={3}
            />
            <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.900">
              Not Connected
            </Text>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">
            Connect to DoorFlow
          </Text>
          <Text fontSize="md" color="whiteAlpha.800" mt={2}>
            Link your DoorFlow account to start syncing members and managing access credentials.
          </Text>
        </Box>

        <Button
          size="lg"
          bg="white"
          color="purple.600"
          fontWeight="bold"
          borderRadius="xl"
          onClick={connect}
          _hover={{
            bg: 'whiteAlpha.900',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          }}
          transition="all 0.2s ease"
        >
          Connect to DoorFlow
        </Button>

        <DevNote title="Why OAuth?" variant="tip">
          OAuth lets you connect to DoorFlow accounts securely — no sharing API keys. Access is authorized per-account, credentials stay protected. Scalable and secure.
        </DevNote>
      </VStack>
    </Box>
  );
}
