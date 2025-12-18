/**
 * Member List Component
 *
 * Displays a list of CRM members with filtering options and polished UI.
 */

'use client';

import { Box, Heading, Text, VStack, HStack, Button, Spinner, Input, SimpleGrid } from '@chakra-ui/react';
import { Link, LockOpen, Users } from 'lucide-react';
import { useState } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { MemberCard } from './MemberCard';

type FilterOption = 'all' | 'linked' | 'unlinked';

export function MemberList() {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const filterOptions =
    filter === 'all'
      ? undefined
      : { linked: filter === 'linked' };

  const { members, isLoading, error, refresh, createMember } = useMembers(filterOptions);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.firstName.trim() || !newMember.lastName.trim() || !newMember.email.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await createMember({
        firstName: newMember.firstName.trim(),
        lastName: newMember.lastName.trim(),
        email: newMember.email.trim(),
        phone: newMember.phone.trim() || undefined,
        membershipType: 'standard',
        teamIds: [],
      });
      setNewMember({ firstName: '', lastName: '', email: '', phone: '' });
      setShowCreateForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create member');
    } finally {
      setIsCreating(false);
    }
  };

  if (error) {
    return (
      <Box
        p={6}
        borderRadius="xl"
        bg="red.50"
        border="1px solid"
        borderColor="red.200"
      >
        <Text color="red.600" fontWeight="medium">
          Error loading members: {error.message}
        </Text>
        <Button
          mt={3}
          size="sm"
          colorPalette="red"
          variant="outline"
          onClick={() => refresh()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={6}>
      {/* Filter and Create Buttons */}
      <Box
        bg="white"
        p={4}
        borderRadius="xl"
        boxShadow="0 2px 8px rgba(0,0,0,0.04)"
        border="1px solid"
        borderColor="gray.100"
      >
        <HStack gap={3} flexWrap="wrap" justify="space-between">
          <HStack gap={3} flexWrap="wrap">
            <Text fontWeight="semibold" fontSize="sm" color="gray.600">
              Filter:
            </Text>
            <HStack gap={2}>
              <Button
                size="sm"
                borderRadius="full"
                variant={filter === 'all' ? 'solid' : 'outline'}
                colorPalette={filter === 'all' ? 'purple' : 'gray'}
                onClick={() => setFilter('all')}
              >
                All Members
              </Button>
              <Button
                size="sm"
                borderRadius="full"
                variant={filter === 'linked' ? 'solid' : 'outline'}
                colorPalette={filter === 'linked' ? 'green' : 'gray'}
                onClick={() => setFilter('linked')}
              >
                Linked to DoorFlow
              </Button>
              <Button
                size="sm"
                borderRadius="full"
                variant={filter === 'unlinked' ? 'solid' : 'outline'}
                colorPalette={filter === 'unlinked' ? 'gray' : 'gray'}
                onClick={() => setFilter('unlinked')}
              >
                Not Linked to DoorFlow
              </Button>
            </HStack>
          </HStack>
          <Button
            size="sm"
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            color="white"
            borderRadius="full"
            fontWeight="bold"
            onClick={() => setShowCreateForm(!showCreateForm)}
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.35)',
            }}
          >
            {showCreateForm ? 'Cancel' : '+ New Member'}
          </Button>
        </HStack>
      </Box>

      {/* Create Member Form */}
      {showCreateForm && (
        <Box
          as="form"
          onSubmit={handleCreateMember}
          bg="white"
          borderRadius="2xl"
          p={6}
          boxShadow="0 4px 20px rgba(0,0,0,0.08)"
          border="2px solid"
          borderColor="purple.200"
        >
          <Text fontWeight="bold" color="gray.800" mb={4}>
            Create New Member
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Input
              value={newMember.firstName}
              onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
              placeholder="First name *"
              borderRadius="xl"
            />
            <Input
              value={newMember.lastName}
              onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
              placeholder="Last name *"
              borderRadius="xl"
            />
            <Input
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              placeholder="Email *"
              type="email"
              borderRadius="xl"
            />
            <Input
              value={newMember.phone}
              onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              placeholder="Phone (optional)"
              borderRadius="xl"
            />
          </SimpleGrid>
          <HStack justify="flex-end" mt={4}>
            <Button
              type="submit"
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              color="white"
              borderRadius="xl"
              fontWeight="bold"
              loading={isCreating}
              disabled={!newMember.firstName.trim() || !newMember.lastName.trim() || !newMember.email.trim()}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.35)',
              }}
            >
              Create Member
            </Button>
          </HStack>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box textAlign="center" py={12}>
          <Spinner size="xl" color="purple.500" />
          <Text mt={4} color="gray.600" fontWeight="medium">
            Loading members...
          </Text>
        </Box>
      )}

      {/* Member Count */}
      {!isLoading && (
        <Text fontSize="sm" color="gray.500" fontWeight="medium">
          Showing {members.length} member{members.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Member Cards */}
      {!isLoading && members.length > 0 && (
        <VStack align="stretch" gap={3}>
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </VStack>
      )}

      {/* Empty State */}
      {!isLoading && members.length === 0 && (
        <Box
          textAlign="center"
          py={16}
          bg="white"
          borderRadius="2xl"
          border="1px solid"
          borderColor="gray.100"
        >
          <Box display="flex" justifyContent="center" mb={4}>
            {filter === 'linked' ? <Link size={48} color="#805AD5" /> : filter === 'unlinked' ? <LockOpen size={48} color="#718096" /> : <Users size={48} color="#805AD5" />}
          </Box>
          <Heading size="md" color="gray.700" mb={2}>
            No Members Found
          </Heading>
          <Text color="gray.500">
            {filter === 'all'
              ? 'No members in the CRM yet.'
              : filter === 'linked'
              ? 'No members are linked to DoorFlow yet.'
              : 'All members are already linked to DoorFlow!'}
          </Text>
        </Box>
      )}
    </VStack>
  );
}
