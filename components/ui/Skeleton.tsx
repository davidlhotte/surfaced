'use client';

import {
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText,
  Card,
  BlockStack,
  Box,
  InlineStack,
} from '@shopify/polaris';

/**
 * Skeleton for the main page layout
 * Used while loading initial page data
 */
export function PageSkeleton() {
  return (
    <SkeletonPage primaryAction>
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={3} />
          </BlockStack>
        </Card>
        <Card>
          <BlockStack gap="400">
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={5} />
          </BlockStack>
        </Card>
      </BlockStack>
    </SkeletonPage>
  );
}

/**
 * Skeleton for a card component
 */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <BlockStack gap="400">
        <SkeletonDisplayText size="small" />
        <SkeletonBodyText lines={lines} />
      </BlockStack>
    </Card>
  );
}

/**
 * Skeleton for store list items
 */
export function StoreListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <BlockStack gap="300">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <InlineStack gap="400" align="space-between" blockAlign="center">
            <BlockStack gap="200">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={2} />
            </BlockStack>
            <Box width="80px">
              <SkeletonBodyText lines={1} />
            </Box>
          </InlineStack>
        </Card>
      ))}
    </BlockStack>
  );
}

/**
 * Skeleton for settings form
 */
export function SettingsSkeleton() {
  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={2} />
          <Box paddingBlockStart="200">
            <SkeletonBodyText lines={1} />
          </Box>
        </BlockStack>
      </Card>
      <Card>
        <BlockStack gap="400">
          <SkeletonDisplayText size="small" />
          <InlineStack gap="400">
            <Box width="200px">
              <SkeletonBodyText lines={2} />
            </Box>
            <Box width="200px">
              <SkeletonBodyText lines={2} />
            </Box>
          </InlineStack>
        </BlockStack>
      </Card>
      <Card>
        <BlockStack gap="400">
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={4} />
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

/**
 * Skeleton for stats/dashboard cards
 */
export function StatsSkeleton() {
  return (
    <InlineStack gap="400" wrap={false}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box key={i} minWidth="150px">
          <Card>
            <BlockStack gap="200">
              <SkeletonBodyText lines={1} />
              <SkeletonDisplayText size="medium" />
            </BlockStack>
          </Card>
        </Box>
      ))}
    </InlineStack>
  );
}
