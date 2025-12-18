'use client';

/**
 * Navigation Component
 *
 * Provides the main navigation for the app with a modern, polished design.
 */

import { Box, Flex, HStack, Text, Container } from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: '/' },
  { href: '/members', label: 'Members', icon: '/members' },
  { href: '/teams', label: 'Teams', icon: '/teams' },
  { href: '/settings', label: 'Settings', icon: '/settings' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      zIndex={100}
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      boxShadow="0 4px 20px rgba(102, 126, 234, 0.25)"
    >
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between" py={4}>
          {/* Logo / Brand */}
          <Link href="/">
            <HStack gap={3} cursor="pointer">
              <Box
                bg="white"
                borderRadius="lg"
                p={2}
                boxShadow="0 2px 10px rgba(0,0,0,0.1)"
              >
                <Text fontSize="lg" fontWeight="black" color="purple.600">
                  CW
                </Text>
              </Box>
              <Box>
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="white"
                  letterSpacing="tight"
                >
                  CoWork HQ
                </Text>
                <Text fontSize="xs" color="whiteAlpha.800" fontWeight="medium">
                  DoorFlow SDK Example
                </Text>
              </Box>
            </HStack>
          </Link>

          {/* Navigation Items */}
          <HStack gap={2}>
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link key={item.href} href={item.href}>
                  <Box
                    px={5}
                    py={2.5}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="semibold"
                    bg={isActive ? 'white' : 'whiteAlpha.200'}
                    color={isActive ? 'purple.600' : 'white'}
                    boxShadow={isActive ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'}
                    _hover={{
                      bg: isActive ? 'white' : 'whiteAlpha.300',
                      transform: 'translateY(-1px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    {item.label}
                  </Box>
                </Link>
              );
            })}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
