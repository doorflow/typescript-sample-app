/**
 * Credential List Component
 *
 * Displays a person's credentials with a clean, modern design.
 *
 * Credential types have different response fields:
 * - Card/PIN: value field contains the credential data
 * - HID Mobile: status field shows deployment state (invited, active, etc.)
 * - PassFlow: url field contains invitation link, wallet_type shows wallet provider
 */

'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { Hash, CreditCard, Smartphone, Link2, ExternalLink } from 'lucide-react';
import { useCredentials } from '@/hooks/useCredentials';
import { useState } from 'react';

interface CredentialListProps {
  personId: number | null;
}

export function CredentialList({ personId }: CredentialListProps) {
  const { credentials, isLoading, error, deleteCredential } = useCredentials(personId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (credentialId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;

    setDeletingId(credentialId);
    try {
      await deleteCredential(credentialId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete credential');
    } finally {
      setDeletingId(null);
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
        <Box display="flex" justifyContent="center" mb={2} color="gray.400">
          <Link2 size={32} />
        </Box>
        <Text color="gray.500" fontWeight="medium">
          Link this member to DoorFlow to manage credentials.
        </Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="md" color="green.500" />
        <Text mt={3} fontSize="sm" color="gray.500">
          Loading credentials...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} borderRadius="xl" bg="red.50">
        <Text color="red.600" fontSize="sm" fontWeight="medium">
          Error loading credentials: {error.message}
        </Text>
      </Box>
    );
  }

  if (credentials.length === 0) {
    return (
      <Box
        p={8}
        textAlign="center"
        bg="gray.50"
        borderRadius="xl"
      >
        <Box display="flex" justifyContent="center" mb={2} color="gray.400">
          <CreditCard size={32} />
        </Box>
        <Text color="gray.500" fontWeight="medium">
          No credentials assigned yet.
        </Text>
        <Text color="gray.400" fontSize="sm">
          Add a card or PIN to enable access.
        </Text>
      </Box>
    );
  }

  // Helper to determine credential category from label
  const getCredentialCategory = (label: string): 'pin' | 'mobile' | 'card' => {
    const lower = label.toLowerCase();
    if (lower.includes('pin')) return 'pin';
    if (lower.includes('mobile') || lower.includes('passflow') || lower.includes('wallet') || lower.includes('hid')) return 'mobile';
    return 'card';
  };

  // Get icon for credential type
  const getCredentialIcon = (label: string) => {
    const category = getCredentialCategory(label);
    switch (category) {
      case 'pin': return <Hash size={20} />;
      case 'mobile': return <Smartphone size={20} />;
      default: return <CreditCard size={20} />;
    }
  };

  // Get the display value/info for a credential
  const getCredentialInfo = (credential: typeof credentials[0]) => {
    // PassFlow credentials have a URL
    if (credential.url) {
      return {
        primary: credential.walletType
          ? `Added to ${credential.walletType === 'apple' ? 'Apple' : 'Google'} Wallet`
          : 'Invitation sent',
        secondary: credential.url,
        isUrl: true,
      };
    }

    // HID Mobile credentials have a status but no value
    if (credential.status && !credential.value) {
      const statusLabels: Record<string, string> = {
        invited: 'Invitation sent',
        active: 'Active on device',
        revoking: 'Being revoked',
        revoked: 'Revoked',
      };
      return {
        primary: statusLabels[credential.status] || credential.status,
        secondary: null,
        isUrl: false,
      };
    }

    // Card/PIN credentials have a value
    if (credential.value) {
      // Mask the value unless it's already masked
      const masked = credential.value.includes('*')
        ? credential.value
        : `****${credential.value.slice(-4)}`;
      return {
        primary: masked,
        secondary: null,
        isUrl: false,
      };
    }

    return { primary: 'No value', secondary: null, isUrl: false };
  };

  return (
    <VStack align="stretch" gap={3}>
      {credentials.map((credential) => {
        const info = getCredentialInfo(credential);
        const category = getCredentialCategory(credential.label || '');

        return (
          <Box
            key={credential.id}
            p={4}
            bg="gray.50"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.100"
          >
            <Flex justify="space-between" align="start">
              <HStack gap={3}>
                <Box
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={category === 'mobile' ? 'blue.100' : 'green.100'}
                  color={category === 'mobile' ? 'blue.600' : 'green.600'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {getCredentialIcon(credential.label || '')}
                </Box>
                <Box>
                  <HStack gap={2}>
                    <Text fontWeight="semibold" color="gray.800">
                      {credential.label || `Type ${credential.credentialTypeId}`}
                    </Text>
                    {credential.status && (
                      <Box
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        bg={credential.status === 'active' ? 'green.100' : 'yellow.100'}
                        color={credential.status === 'active' ? 'green.700' : 'yellow.700'}
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {credential.status}
                      </Box>
                    )}
                    {credential.walletType && (
                      <Box
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        bg="blue.100"
                        color="blue.700"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {credential.walletType === 'apple' ? 'Apple Wallet' : 'Google Wallet'}
                      </Box>
                    )}
                  </HStack>
                  {info.isUrl && info.secondary ? (
                    <HStack gap={1} mt={1}>
                      <ExternalLink size={12} color="#718096" />
                      <a
                        href={info.secondary}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.875rem',
                          color: '#3182ce',
                          fontFamily: 'monospace',
                          textDecoration: 'none',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {info.primary}
                      </a>
                    </HStack>
                  ) : (
                    <Text fontSize="sm" color="gray.500" fontFamily="mono">
                      {info.primary}
                    </Text>
                  )}
                </Box>
              </HStack>
              <Button
                size="xs"
                colorPalette="red"
                variant="ghost"
                borderRadius="full"
                onClick={() => handleDelete(credential.id)}
                loading={deletingId === credential.id}
              >
                Remove
              </Button>
            </Flex>
          </Box>
        );
      })}
    </VStack>
  );
}
