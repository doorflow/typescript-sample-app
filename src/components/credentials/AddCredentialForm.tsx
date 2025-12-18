/**
 * Add Credential Form Component
 *
 * Clean form to create a new credential with clear visual feedback.
 *
 * Credential types have different value requirements:
 * - Card/Fob: value = card number (required)
 * - PIN: value = PIN code, or "******" for auto-generate
 * - Mobile (HID, PassFlow, Apple/Google Wallet): value is ignored (invitation-based)
 */

'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Spinner,
  SimpleGrid,
} from '@chakra-ui/react';
import { Hash, Smartphone, CreditCard, Dices, PenLine, Mail } from 'lucide-react';
import { useState } from 'react';
import { useCredentials, useCredentialTypes } from '@/hooks/useCredentials';
import { DevNote } from '@/components/DevNote';

interface AddCredentialFormProps {
  personId: number | null;
  onSuccess?: () => void;
}

// Helper to determine credential type category from label/slug
function getCredentialCategory(label: string, slug: string): 'pin' | 'mobile' | 'card' {
  const lowerLabel = label.toLowerCase();
  const lowerSlug = slug.toLowerCase();

  // PIN types
  if (lowerLabel.includes('pin') || lowerSlug.includes('pin')) {
    return 'pin';
  }

  // Mobile types - these don't use values (invitation-based)
  const mobileKeywords = ['mobile', 'hid mobile', 'passflow', 'apple', 'google', 'wallet'];
  if (mobileKeywords.some(kw => lowerLabel.includes(kw) || lowerSlug.includes(kw))) {
    return 'mobile';
  }

  // Default to card (requires value)
  return 'card';
}

// Get icon for credential type
function getCredentialIcon(category: 'pin' | 'mobile' | 'card'): React.ReactNode {
  switch (category) {
    case 'pin': return <Hash size={24} />;
    case 'mobile': return <Smartphone size={24} />;
    case 'card': return <CreditCard size={24} />;
  }
}

export function AddCredentialForm({ personId, onSuccess }: AddCredentialFormProps) {
  const { credentialTypes, isLoading: typesLoading } = useCredentialTypes();
  const { credentials, createCredential } = useCredentials(personId);

  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [isAutoGenerate, setIsAutoGenerate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!personId) {
    return null;
  }

  if (typesLoading) {
    return (
      <Box textAlign="center" py={6}>
        <Spinner size="sm" color="green.500" />
        <Text mt={2} fontSize="sm" color="gray.500">
          Loading credential types...
        </Text>
      </Box>
    );
  }

  // Track which credential types the person already has
  const existingTypeIds = new Set(credentials.map(c => c.credentialTypeId));

  // Get the selected type's category
  const selectedTypeData = credentialTypes.find((t) => t.id === selectedType);
  const selectedCategory = selectedTypeData
    ? getCredentialCategory(selectedTypeData.label, selectedTypeData.slug)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedType || !selectedCategory) {
      setError('Please select a credential type');
      return;
    }

    // Validate based on category
    if (selectedCategory === 'card' && !value.trim()) {
      setError('Please enter a card number');
      return;
    }

    if (selectedCategory === 'pin' && !isAutoGenerate && !value.trim()) {
      setError('Please enter a PIN or select auto-generate');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the value based on category
      let credentialValue: string | undefined;
      if (selectedCategory === 'card') {
        credentialValue = value;
      } else if (selectedCategory === 'pin') {
        credentialValue = isAutoGenerate ? '******' : value;
      }
      // Mobile credentials: don't send a value (it's ignored anyway)

      await createCredential({
        credentialTypeId: selectedType,
        value: credentialValue || '',
      });
      setValue('');
      setSelectedType(null);
      setIsAutoGenerate(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack align="stretch" gap={5}>
        {/* Credential Type Selection */}
        <Box>
          <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={3}>
            Credential Type
          </Text>
          <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
            {credentialTypes.map((type) => {
              const isSelected = selectedType === type.id;
              const isAssigned = existingTypeIds.has(type.id);
              const category = getCredentialCategory(type.label, type.slug);
              return (
                <Box
                  key={type.id}
                  p={4}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={isAssigned ? 'gray.200' : isSelected ? 'green.400' : 'gray.200'}
                  bg={isAssigned ? 'gray.100' : isSelected ? 'green.50' : 'white'}
                  cursor={isAssigned ? 'not-allowed' : 'pointer'}
                  opacity={isAssigned ? 0.6 : 1}
                  onClick={() => {
                    if (isAssigned) return;
                    setSelectedType(type.id);
                    setValue('');
                    // Default to auto-generate for PIN types
                    setIsAutoGenerate(category === 'pin');
                  }}
                  _hover={isAssigned ? {} : {
                    borderColor: isSelected ? 'green.500' : 'gray.300',
                  }}
                  transition="all 0.2s"
                  textAlign="center"
                >
                  <Box display="flex" justifyContent="center" mb={2} color={isAssigned ? 'gray.400' : isSelected ? 'green.600' : 'gray.500'}>
                    {getCredentialIcon(category)}
                  </Box>
                  <Text
                    fontWeight="semibold"
                    color={isAssigned ? 'gray.400' : isSelected ? 'green.700' : 'gray.700'}
                    fontSize="sm"
                  >
                    {type.label}
                  </Text>
                  {isAssigned && (
                    <Text fontSize="xs" color="gray.400" mt={1}>
                      Already assigned
                    </Text>
                  )}
                </Box>
              );
            })}
          </SimpleGrid>
        </Box>

        {/* Value Input - varies by credential category */}
        {selectedType && selectedCategory === 'card' && (
          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={3}>
              Card Number
            </Text>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter card number"
              fontFamily="mono"
              size="lg"
              borderRadius="xl"
            />
          </Box>
        )}

        {selectedType && selectedCategory === 'pin' && (
          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={3}>
              PIN Code
            </Text>
            <HStack gap={3} mb={3}>
              <Box
                flex={1}
                p={3}
                borderRadius="xl"
                border="2px solid"
                borderColor={isAutoGenerate ? 'green.400' : 'gray.200'}
                bg={isAutoGenerate ? 'green.50' : 'white'}
                cursor="pointer"
                onClick={() => {
                  setIsAutoGenerate(true);
                  setValue('');
                }}
                textAlign="center"
              >
                <Box display="flex" justifyContent="center" mb={1} color={isAutoGenerate ? 'green.600' : 'gray.500'}>
                  <Dices size={20} />
                </Box>
                <Text fontSize="sm" fontWeight="medium" color={isAutoGenerate ? 'green.700' : 'gray.600'}>
                  Auto-Generate
                </Text>
              </Box>
              <Box
                flex={1}
                p={3}
                borderRadius="xl"
                border="2px solid"
                borderColor={!isAutoGenerate ? 'green.400' : 'gray.200'}
                bg={!isAutoGenerate ? 'green.50' : 'white'}
                cursor="pointer"
                onClick={() => setIsAutoGenerate(false)}
                textAlign="center"
              >
                <Box display="flex" justifyContent="center" mb={1} color={!isAutoGenerate ? 'green.600' : 'gray.500'}>
                  <PenLine size={20} />
                </Box>
                <Text fontSize="sm" fontWeight="medium" color={!isAutoGenerate ? 'green.700' : 'gray.600'}>
                  Enter Manually
                </Text>
              </Box>
            </HStack>

            {isAutoGenerate ? (
              <Box p={4} bg="green.50" borderRadius="xl" textAlign="center">
                <Text fontSize="sm" color="green.700" fontWeight="medium">
                  A PIN will be auto-generated by DoorFlow
                </Text>
              </Box>
            ) : (
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter PIN (digits only)"
                fontFamily="mono"
                size="lg"
                borderRadius="xl"
              />
            )}
          </Box>
        )}

        {selectedType && selectedCategory === 'mobile' && (
          <Box p={4} bg="blue.50" borderRadius="xl">
            <HStack gap={3} align="start">
              <Mail size={20} color="#2B6CB0" />
              <Box>
                <Text fontWeight="semibold" color="blue.800" fontSize="sm">
                  Invitation-Based Credential
                </Text>
                <Text color="blue.700" fontSize="sm">
                  An invitation will be sent to the person. No value is needed for mobile credentials.
                </Text>
              </Box>
            </HStack>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Box p={3} bg="red.50" borderRadius="xl">
            <Text color="red.600" fontSize="sm" fontWeight="medium">
              {error}
            </Text>
          </Box>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          bg="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
          color="white"
          size="lg"
          borderRadius="xl"
          fontWeight="bold"
          disabled={!selectedType}
          loading={isSubmitting}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(56, 239, 125, 0.35)',
          }}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
            transform: 'none',
          }}
          transition="all 0.2s"
        >
          Add Credential
        </Button>

        {/* Developer Note */}
        <DevNote
          title="Credential Types"
          variant="code"
          sdkMethod="doorflow.credentialTypes.listCredentialTypes()"
        >
          Available credential types come from your DoorFlow account via the SDK. Each type
          has a <code>label</code> (display name) and <code>slug</code> (API identifier).
          A person can only have one credential of each type.
        </DevNote>
      </VStack>
    </Box>
  );
}
