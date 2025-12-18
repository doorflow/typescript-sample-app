import type { Metadata } from 'next';
import { Providers } from './providers';
import { Navigation } from '@/components/layout/Navigation';
import { Box } from '@chakra-ui/react';

export const metadata: Metadata = {
  title: 'CoWork HQ - DoorFlow SDK Example',
  description: 'Example application demonstrating DoorFlow TypeScript SDK integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Box minH="100vh" bg="gray.50">
            <Navigation />
            <Box as="main" maxW="container.xl" mx="auto" p={6}>
              {children}
            </Box>
          </Box>
        </Providers>
      </body>
    </html>
  );
}
