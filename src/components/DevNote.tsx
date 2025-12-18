/**
 * Developer Note Component
 *
 * A callout component for developer-facing documentation within the sample app.
 * These notes explain SDK usage, architecture decisions, and implementation details
 * to developers learning from this sample.
 */

'use client';

import { Box, Text, VStack, HStack, Code } from '@chakra-ui/react';
import { Code2, Lightbulb, AlertTriangle, Info } from 'lucide-react';
import { ReactNode } from 'react';

type DevNoteVariant = 'info' | 'tip' | 'warning' | 'code';

interface DevNoteProps {
  children: ReactNode;
  title?: string;
  variant?: DevNoteVariant;
  sdkMethod?: string;
  filePath?: string;
}

const variantConfig = {
  info: {
    icon: Info,
    bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    borderColor: 'indigo.300',
    iconBg: 'indigo.100',
    iconColor: '#4338ca',
    titleColor: 'indigo.800',
    textColor: 'indigo.700',
  },
  tip: {
    icon: Lightbulb,
    bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    borderColor: 'emerald.300',
    iconBg: 'emerald.100',
    iconColor: '#047857',
    titleColor: 'gray.900',
    textColor: 'gray.900',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderColor: 'amber.300',
    iconBg: 'amber.100',
    iconColor: '#b45309',
    titleColor: 'amber.800',
    textColor: 'amber.700',
  },
  code: {
    icon: Code2,
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    borderColor: 'emerald.300',
    iconBg: 'emerald.100',
    iconColor: '#047857',
    titleColor: 'emerald.800',
    textColor: 'emerald.900',
  },
};

export function DevNote({
  children,
  title = 'Developer Note',
  variant = 'info',
  sdkMethod,
  filePath,
}: DevNoteProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Box
      bg={config.bg}
      borderRadius="xl"
      border="1px solid"
      borderColor={config.borderColor}
      overflow="hidden"
    >
      {/* Header */}
      <HStack
        px={4}
        py={2}
        borderBottom="1px solid"
        borderColor={config.borderColor}
        gap={3}
      >
        <Box
          bg={config.iconBg}
          borderRadius="lg"
          p={1.5}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={16} color={config.iconColor} />
        </Box>
        <HStack flex={1} justify="space-between" align="center">
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={config.titleColor}
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Devs: {title}
          </Text>
          {filePath && (
            <Code
              fontSize="xs"
              bg="blackAlpha.100"
              color="gray.600"
              px={2}
              py={0.5}
              borderRadius="md"
            >
              {filePath}
            </Code>
          )}
        </HStack>
      </HStack>

      {/* Content */}
      <VStack align="stretch" gap={3} p={4}>
        {sdkMethod && (
          <Box
            bg="blackAlpha.100"
            borderRadius="lg"
            px={3}
            py={2}
          >
            <Text
              fontSize="sm"
              fontFamily="mono"
              fontWeight="semibold"
              color="purple.600"
            >
              {sdkMethod}
            </Text>
          </Box>
        )}
        <Box
          fontSize="sm"
          color={config.textColor}
          lineHeight="tall"
          css={{
            '& code': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              color: '#7c3aed',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.85em',
              fontFamily: 'mono',
            },
            '& a': {
              color: '#4f46e5',
              textDecoration: 'underline',
            },
          }}
        >
          {children}
        </Box>
      </VStack>
    </Box>
  );
}
