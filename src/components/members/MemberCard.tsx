/**
 * Member Card Component
 *
 * Displays a CRM member's information in a compact row format.
 */

'use client';

import { useState } from 'react';
import { Box, Text, HStack, Image } from '@chakra-ui/react';
import Link from 'next/link';
import type { CrmMember } from '@/lib/types';
import { SyncStatusBadge } from './SyncStatusBadge';

function getAvatarUrl(firstName: string, lastName: string): string {
  return `/photos/${firstName.toLowerCase()}_${lastName.toLowerCase()}.png`;
}

interface MemberCardProps {
  member: CrmMember;
}

export function MemberCard({ member }: MemberCardProps) {
  const isPremium = member.membershipType === 'premium';
  const [imageError, setImageError] = useState(false);
  const avatarUrl = getAvatarUrl(member.firstName, member.lastName);

  return (
    <Link href={`/members/${member.id}`} style={{ display: 'block' }}>
      <Box
        bg="white"
        px={4}
        py={3}
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.100"
        _hover={{
          bg: 'gray.50',
          borderColor: 'purple.200',
        }}
        transition="all 0.15s ease"
        cursor="pointer"
      >
        <HStack gap={4}>
          {/* Avatar */}
          {!imageError ? (
            <Image
              src={avatarUrl}
              alt={`${member.firstName} ${member.lastName}`}
              w={9}
              h={9}
              borderRadius="full"
              objectFit="cover"
              flexShrink={0}
              onError={() => setImageError(true)}
            />
          ) : (
            <Box
              w={9}
              h={9}
              borderRadius="full"
              bg={isPremium ? 'purple.100' : 'gray.100'}
              color={isPremium ? 'purple.600' : 'gray.600'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="bold"
              fontSize="xs"
              flexShrink={0}
            >
              {member.firstName[0]}{member.lastName[0]}
            </Box>
          )}

          {/* Name & Email */}
          <Box minW="200px" flex={1}>
            <Text fontWeight="semibold" fontSize="sm" color="gray.800">
              {member.firstName} {member.lastName}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {member.email}
            </Text>
          </Box>

          {/* Membership Type */}
          <Box
            px={2}
            py={0.5}
            borderRadius="full"
            bg={isPremium ? 'purple.50' : 'gray.100'}
            color={isPremium ? 'purple.600' : 'gray.500'}
            fontSize="xs"
            fontWeight="medium"
            textTransform="capitalize"
            flexShrink={0}
          >
            {member.membershipType}
          </Box>

          {/* Phone */}
          <Text fontSize="xs" color="gray.500" minW="100px" flexShrink={0}>
            {member.phone || '—'}
          </Text>

          {/* Sync Status */}
          <Box flexShrink={0}>
            <SyncStatusBadge doorflowPersonId={member.doorflowPersonId} />
          </Box>
        </HStack>
      </Box>
    </Link>
  );
}
