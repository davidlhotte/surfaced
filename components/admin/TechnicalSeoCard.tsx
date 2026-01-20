'use client';

import {
  Box,
  InlineStack,
  BlockStack,
  Text,
  Badge,
  Button,
  Icon,
} from '@shopify/polaris';
import { SettingsIcon, ChevronRightIcon } from '@shopify/polaris-icons';

interface TechnicalSeoCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onConfigure: () => void;
  lastUpdated?: string | null;
  locale?: string;
}

export function TechnicalSeoCard({
  title,
  description,
  enabled,
  onConfigure,
  lastUpdated,
  locale = 'en',
}: TechnicalSeoCardProps) {
  return (
    <Box
      padding="400"
      background="bg-surface-secondary"
      borderRadius="200"
    >
      <InlineStack align="space-between" blockAlign="center" gap="400">
        <InlineStack gap="400" blockAlign="center">
          <Box
            padding="200"
            background="bg-fill"
            borderRadius="200"
          >
            <Icon source={SettingsIcon} tone="base" />
          </Box>
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                {title}
              </Text>
              <Badge tone={enabled ? 'success' : 'attention'} size="small">
                {enabled
                  ? locale === 'fr' ? 'Actif' : 'Active'
                  : locale === 'fr' ? 'Inactif' : 'Inactive'}
              </Badge>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              {description}
            </Text>
            {lastUpdated && (
              <Text as="p" variant="bodySm" tone="subdued">
                {locale === 'fr' ? 'Mis à jour: ' : 'Updated: '}
                {new Date(lastUpdated).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
              </Text>
            )}
          </BlockStack>
        </InlineStack>
        <Button
          icon={ChevronRightIcon}
          accessibilityLabel={`Configure ${title}`}
          onClick={onConfigure}
        >
          {locale === 'fr' ? 'Configurer' : 'Configure'}
        </Button>
      </InlineStack>
    </Box>
  );
}
