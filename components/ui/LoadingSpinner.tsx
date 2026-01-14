'use client';

import { Spinner, BlockStack, Text } from '@shopify/polaris';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ message = 'Loading...', size = 'large' }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
      }}
    >
      <BlockStack gap="400" align="center">
        <Spinner accessibilityLabel={message} size={size} />
        {message && (
          <Text as="p" tone="subdued">
            {message}
          </Text>
        )}
      </BlockStack>
    </div>
  );
}

export default LoadingSpinner;
