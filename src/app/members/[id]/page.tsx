/**
 * Member Detail Page
 *
 * Shows detailed information about a CRM member and their DoorFlow integration.
 * Beautiful, modern design with clear sections for each feature.
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Spinner,
  Flex,
  SimpleGrid,
  Image,
} from '@chakra-ui/react';
import { Frown, PlugZap, Users, CreditCard } from 'lucide-react';
import { DevNote } from '@/components/DevNote';

function getAvatarUrl(firstName: string, lastName: string): string {
  return `/photos/${firstName.toLowerCase()}_${lastName.toLowerCase()}.png`;
}
import Link from 'next/link';
import { useMember, useMembers } from '@/hooks/useMembers';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { SyncStatusBadge } from '@/components/members/SyncStatusBadge';
import { CredentialList } from '@/components/credentials/CredentialList';
import { AddCredentialForm } from '@/components/credentials/AddCredentialForm';
import { TeamSelect } from '@/components/teams/TeamSelect';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { member, isLoading, error, refresh } = useMember(id);
  const { updateMember, deleteMember } = useMembers();
  const { isConnected } = useConnectionStatus();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddCredential, setShowAddCredential] = useState(false);

  const isPremium = member?.membershipType === 'premium';
  const [avatarError, setAvatarError] = useState(false);

  const startEditing = () => {
    if (member) {
      setEditForm({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone || '',
      });
      setIsEditing(true);
    }
  };

  const saveChanges = async () => {
    if (!member) return;

    setIsSaving(true);
    try {
      await updateMember(member.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone || undefined,
      });
      setIsEditing(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTeams = async (teamIds: string[]) => {
    if (!member) return;

    await updateMember(member.id, { teamIds });
    refresh();
  };

  const handleDelete = async () => {
    if (!member) return;
    if (!confirm(`Are you sure you want to delete ${member.firstName} ${member.lastName}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMember(member.id);
      router.push('/members');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete member');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Box bg="gray.50" minH="calc(100vh - 72px)">
        <Container maxW="container.lg" py={10}>
          <Box textAlign="center" py={20}>
            <Spinner size="xl" color="purple.500" />
            <Text mt={4} color="gray.600" fontWeight="medium">
              Loading member...
            </Text>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !member) {
    return (
      <Box bg="gray.50" minH="calc(100vh - 72px)">
        <Container maxW="container.lg" py={10}>
          <Box
            bg="white"
            borderRadius="2xl"
            p={10}
            textAlign="center"
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
          >
            <Box display="flex" justifyContent="center" mb={4}>
              <Frown size={64} color="#805AD5" />
            </Box>
            <Heading size="lg" color="gray.800" mb={2}>
              Member Not Found
            </Heading>
            <Text color="gray.600" mb={6}>
              {error?.message || 'The requested member could not be found.'}
            </Text>
            <Link href="/members">
              <Button
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                color="white"
                borderRadius="full"
                fontWeight="bold"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.35)',
                }}
              >
                Back to Members
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="calc(100vh - 72px)">
      <Container maxW="container.lg" py={10}>
        <VStack align="stretch" gap={6}>
          {/* Back Link */}
          <Link href="/members">
            <HStack
              gap={2}
              color="gray.500"
              fontSize="sm"
              fontWeight="medium"
              _hover={{ color: 'purple.500' }}
              transition="color 0.2s"
            >
              <Text>←</Text>
              <Text>Back to Members</Text>
            </HStack>
          </Link>

          {/* Profile Header Card */}
          <Box
            bg="white"
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
          >
            {/* Gradient Header */}
            <Box
              bg={isPremium
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #3a3a3a 0%, #5a5a5a 100%)'
              }
              h="100px"
              position="relative"
            />

            {/* Profile Content */}
            <Box px={8} pb={8} pt={0} position="relative">
              {/* Avatar */}
              <Box
                position="absolute"
                top="-50px"
                left={8}
                w={24}
                h={24}
                borderRadius="2xl"
                bg="white"
                boxShadow="0 4px 15px rgba(0,0,0,0.15)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="4px solid white"
                overflow="hidden"
              >
                {!avatarError ? (
                  <Image
                    src={getAvatarUrl(member.firstName, member.lastName)}
                    alt={`${member.firstName} ${member.lastName}`}
                    w="full"
                    h="full"
                    objectFit="cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color={isPremium ? 'purple.500' : 'gray.600'}
                  >
                    {member.firstName[0]}{member.lastName[0]}
                  </Text>
                )}
              </Box>

              {/* Edit Button */}
              <Flex justify="flex-end" pt={4}>
                {isEditing ? (
                  <HStack gap={2}>
                    <Button
                      size="sm"
                      variant="ghost"
                      borderRadius="full"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      color="white"
                      borderRadius="full"
                      onClick={saveChanges}
                      loading={isSaving}
                    >
                      Save Changes
                    </Button>
                  </HStack>
                ) : (
                  <HStack gap={2}>
                    <Button
                      size="sm"
                      variant="outline"
                      borderRadius="full"
                      onClick={startEditing}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="red"
                      borderRadius="full"
                      onClick={handleDelete}
                      loading={isDeleting}
                    >
                      Delete
                    </Button>
                  </HStack>
                )}
              </Flex>

              {/* Name & Status */}
              <Box mt={6}>
                {isEditing ? (
                  <HStack gap={3} mb={4}>
                    <Input
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                      placeholder="First name"
                      size="lg"
                      fontWeight="bold"
                      borderRadius="xl"
                    />
                    <Input
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                      placeholder="Last name"
                      size="lg"
                      fontWeight="bold"
                      borderRadius="xl"
                    />
                  </HStack>
                ) : (
                  <Heading size="xl" color="gray.800" mb={2}>
                    {member.firstName} {member.lastName}
                  </Heading>
                )}
                <HStack gap={3}>
                  <SyncStatusBadge doorflowPersonId={member.doorflowPersonId} />
                  <Box
                    px={3}
                    py={1}
                    borderRadius="full"
                    bg={isPremium ? 'purple.100' : 'gray.100'}
                    color={isPremium ? 'purple.700' : 'gray.600'}
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                  >
                    {member.membershipType}
                  </Box>
                </HStack>
              </Box>

              {/* Info Grid */}
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={6}>
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="xl"
                >
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={1}>
                    Email
                  </Text>
                  {isEditing ? (
                    <Input
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      type="email"
                      size="sm"
                      borderRadius="lg"
                      bg="white"
                    />
                  ) : (
                    <Text fontWeight="medium" color="gray.800">
                      {member.email}
                    </Text>
                  )}
                </Box>
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="xl"
                >
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={1}>
                    Phone
                  </Text>
                  {isEditing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      placeholder="Not provided"
                      size="sm"
                      borderRadius="lg"
                      bg="white"
                    />
                  ) : (
                    <Text fontWeight="medium" color={member.phone ? 'gray.800' : 'gray.400'}>
                      {member.phone || 'Not provided'}
                    </Text>
                  )}
                </Box>
              </SimpleGrid>
            </Box>
          </Box>

          {/* Connection Warning */}
          {!isConnected && (
            <Box
              bg="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
              borderRadius="2xl"
              p={1}
            >
              <Box bg="white" borderRadius="xl" p={6}>
                <Flex align="center" gap={4}>
                  <Box
                    bg="orange.100"
                    borderRadius="xl"
                    p={3}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <PlugZap size={28} color="#C05621" />
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="bold" color="gray.800">
                      DoorFlow Not Connected
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Connect to DoorFlow to manage credentials.
                    </Text>
                  </Box>
                  <Link href="/">
                    <Button
                      colorPalette="orange"
                      borderRadius="full"
                      fontWeight="semibold"
                    >
                      Connect
                    </Button>
                  </Link>
                </Flex>
              </Box>
            </Box>
          )}

          {/* CRM Teams Section - Always visible */}
          <Box
            bg="white"
            borderRadius="2xl"
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
            overflow="hidden"
          >
            <Box
              bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              px={6}
              py={4}
            >
              <HStack gap={3}>
                <Users size={20} color="white" />
                <Text fontWeight="bold" color="white">
                  Team Memberships
                </Text>
              </HStack>
            </Box>
            <Box p={6}>
              <TeamSelect
                currentTeamIds={member.teamIds || []}
                onUpdateTeams={updateTeams}
              />
            </Box>
          </Box>

          {/* Credentials Section - Only when connected and linked */}
          {isConnected && member.doorflowPersonId && (
            <Box
              bg="white"
              borderRadius="2xl"
              boxShadow="0 4px 20px rgba(0,0,0,0.08)"
              overflow="hidden"
            >
              <Box
                bg="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                px={6}
                py={4}
              >
                <Flex justify="space-between" align="center">
                  <HStack gap={3}>
                    <CreditCard size={20} color="white" />
                    <Text fontWeight="bold" color="white">
                      Credentials
                    </Text>
                  </HStack>
                  <Button
                    size="sm"
                    bg="whiteAlpha.200"
                    color="white"
                    borderRadius="full"
                    _hover={{ bg: 'whiteAlpha.300' }}
                    onClick={() => setShowAddCredential(!showAddCredential)}
                  >
                    {showAddCredential ? 'Cancel' : '+ Add'}
                  </Button>
                </Flex>
              </Box>
              <Box p={6}>
                {showAddCredential && (
                  <Box mb={4} p={4} bg="gray.50" borderRadius="xl">
                    <AddCredentialForm
                      personId={member.doorflowPersonId}
                      onSuccess={() => setShowAddCredential(false)}
                    />
                  </Box>
                )}
                <CredentialList personId={member.doorflowPersonId} />
              </Box>
            </Box>
          )}

          {/* Developer Note */}
          <DevNote
            title="Access Control"
            variant="code"
            sdkMethod="doorflow.people.updatePerson({ id, personInput: { groupIds } })"
          >
            Group assignments are managed through teams. When you assign a member to a team
            that&apos;s mapped to a DoorFlow group (in Settings), their <code>groupIds</code> are
            updated via the SDK during sync. This controls which doors they can access.
          </DevNote>

        </VStack>
      </Container>
    </Box>
  );
}
