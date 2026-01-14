'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Banner, Page, Layout, Card, Text } from '@shopify/polaris';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Page title="Something went wrong">
          <Layout>
            <Layout.Section>
              <Card>
                <Banner
                  title="An error occurred"
                  tone="critical"
                  action={{ content: 'Try again', onAction: this.handleRetry }}
                >
                  <Text as="p">
                    We encountered an unexpected error. Please try again or contact support if the
                    problem persists.
                  </Text>
                </Banner>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
