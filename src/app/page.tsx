'use client';

/**
 * Home Page
 *
 * The main landing page of the Member Access Portal.
 * Shows connection status and feature overview with a modern design.
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Alert,
  Container,
  Spinner,
} from '@chakra-ui/react';
import { Lock, RefreshCw, CreditCard, Users, Shield } from 'lucide-react';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';

function HomeContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (connected === 'true') {
      setMessage({
        type: 'success',
        text: 'Successfully connected to DoorFlow!',
      });
      window.history.replaceState({}, '', '/');
    } else if (error) {
      setMessage({
        type: 'error',
        text: errorDescription
          ? `${error}: ${errorDescription}`
          : `OAuth error: ${error}`,
      });
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  return (
    <Box bg="gray.50" minH="calc(100vh - 72px)">
      <Container maxW="container.xl" py={10}>
        <VStack align="stretch" gap={10}>
          {/* OAuth callback messages */}
          {message && (
            <Alert.Root
              status={message.type === 'success' ? 'success' : 'error'}
              borderRadius="xl"
            >
              <Alert.Indicator />
              <Alert.Title>{message.text}</Alert.Title>
            </Alert.Root>
          )}

          {/* Hero Section */}
          <Box textAlign="center" py={6}>
            <Heading
              size="3xl"
              bgGradient="linear(to-r, purple.600, purple.400)"
              bgClip="text"
              fontWeight="extrabold"
              mb={4}
            >
              CoWork HQ
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
              Connect to DoorFlow and watch your real access control data appear in this app.
              Members, Teams, Credentials — all synced and ready to manage.
            </Text>
          </Box>

          {/* Connection Status */}
          <Box maxW="2xl" mx="auto" w="full">
            <ConnectionStatus />
          </Box>

          {/* Feature Grid */}
          <Box>
            <Heading size="lg" textAlign="center" mb={8} color="gray.800">
              What This App Demonstrates
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              <FeatureCard
                icon={<Lock size={28} />}
                title="OAuth 2.0 Authentication"
                description="Secure authorization flow with automatic token refresh. Your credentials stay safe on the server."
                sdkMethods={['doorflow.getAuthorizationUrl()', 'doorflow.handleCallback()']}
                color="purple"
              />
              <FeatureCard
                icon={<RefreshCw size={28} />}
                title="Member Sync"
                description="Match CRM members to DoorFlow people by email. Create new people for unmatched members."
                sdkMethods={['doorflow.people.listPeople()', 'doorflow.people.createPerson()']}
                color="blue"
              />
              <FeatureCard
                icon={<CreditCard size={28} />}
                title="Credential Management"
                description="Assign access cards and PINs to members. Issue mobile credentials for smartphone access."
                sdkMethods={['doorflow.credentials.createCredential()']}
                color="green"
              />
              <FeatureCard
                icon={<Users size={28} />}
                title="Group Assignment"
                description="Add members to access groups to control which doors they can open."
                sdkMethods={['doorflow.groups.listGroups()', 'doorflow.people.updatePerson()']}
                color="orange"
              />
              <FeatureCard
                icon={<Shield size={28} />}
                title="Secure Architecture"
                description="All DoorFlow API calls happen server-side. Secrets never leave the server."
                sdkMethods={['doorflow.isAuthenticated()', 'doorflow.disconnect()']}
                color="pink"
              />
            </SimpleGrid>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  sdkMethods,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  sdkMethods: string[];
  color: string;
}) {
  return (
    <Box
      bg="white"
      borderRadius="2xl"
      p={6}
      boxShadow="0 4px 20px rgba(0,0,0,0.06)"
      border="1px solid"
      borderColor="gray.100"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
        borderColor: `${color}.200`,
      }}
      transition="all 0.3s ease"
    >
      <VStack align="start" gap={4}>
        <Box
          bg={`${color}.50`}
          color={`${color}.600`}
          borderRadius="xl"
          p={3}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {icon}
        </Box>
        <Box>
          <Heading size="md" color="gray.800" mb={2}>
            {title}
          </Heading>
          <Text fontSize="sm" color="gray.600" lineHeight="tall">
            {description}
          </Text>
        </Box>
        <HStack flexWrap="wrap" gap={2}>
          {sdkMethods.map((method) => (
            <Box
              key={method}
              px={3}
              py={1}
              bg={`${color}.50`}
              color={`${color}.700`}
              borderRadius="full"
              fontSize="xs"
              fontWeight="semibold"
              fontFamily="mono"
            >
              {method}
            </Box>
          ))}
        </HStack>
      </VStack>
    </Box>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Box textAlign="center" py={20}>
          <Spinner size="xl" color="purple.500" />
        </Box>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
