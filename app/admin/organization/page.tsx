'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Box,
  Badge,
  Spinner,
  Banner,
  Divider,
  TextField,
  ResourceList,
  ResourceItem,
  Avatar,
  Modal,
  Select,
  ProgressBar,
} from '@shopify/polaris';
import { PlusCircleIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { ResponsiveGrid } from '@/components/admin/ResponsiveGrid';

type Store = {
  id: string;
  shopDomain: string;
  name: string | null;
  plan: string;
  aiScore: number | null;
  productsCount: number;
  lastAuditAt: string | null;
  criticalIssues: number;
  warningIssues: number;
};

type Member = {
  email: string;
  name: string | null;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  plan: string;
  maxStores: number;
  storesCount: number;
  membersCount: number;
  createdAt: string;
};

type Dashboard = {
  organization: Organization;
  stores: Store[];
  aggregateMetrics: {
    totalProducts: number;
    averageScore: number;
    totalCriticalIssues: number;
    totalWarningIssues: number;
    storesNeedingAttention: number;
  };
  members: Member[];
};

export default function OrganizationPage() {
  const { fetch: authenticatedFetch } = useAuthenticatedFetch();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create org modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/organizations?action=dashboard');
      if (!response.ok) throw new Error('Failed to fetch organization');
      const result = await response.json();
      if (result.success) {
        if (result.data?.organization) {
          setDashboard(result.data);
          setOrganization(result.data.organization);
        } else {
          setOrganization(null);
          setDashboard(null);
        }
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const createOrganization = async () => {
    if (!orgName.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const response = await authenticatedFetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name: orgName }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organization');
      }
      await fetchOrganization();
      setShowCreateModal(false);
      setOrgName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !organization) return;

    try {
      setInviting(true);
      setError(null);
      const response = await authenticatedFetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          organizationId: organization.id,
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invite');
      }
      await fetchOrganization();
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('viewer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (email: string) => {
    if (!organization) return;

    try {
      setError(null);
      const response = await authenticatedFetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove-member',
          organizationId: organization.id,
          memberEmail: email,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }
      await fetchOrganization();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <Badge>Not analyzed</Badge>;
    if (score >= 80) return <Badge tone="success">{String(score)}</Badge>;
    if (score >= 60) return <Badge tone="info">{String(score)}</Badge>;
    if (score >= 40) return <Badge tone="warning">{String(score)}</Badge>;
    return <Badge tone="critical">{String(score)}</Badge>;
  };

  const getRoleBadge = (role: Member['role']) => {
    const tones: Record<string, 'info' | 'success' | 'attention' | 'new'> = {
      owner: 'success',
      admin: 'info',
      editor: 'attention',
      viewer: 'new',
    };
    return <Badge tone={tones[role]}>{role}</Badge>;
  };

  if (loading) {
    return (
      <Page title="Organization" backAction={{ content: 'Dashboard', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <InlineStack align="center" blockAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Loading organization...</Text>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // No organization - show create option
  if (!organization) {
    return (
      <Page title="Multi-Store Dashboard" backAction={{ content: 'Dashboard', url: '/admin' }}>
        <Layout>
          {error && (
            <Layout.Section>
              <Banner tone="critical" title="Error" onDismiss={() => setError(null)}>
                <p>{error}</p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Text as="h2" variant="headingLg">Manage Multiple Stores</Text>
                  <Text as="p" tone="subdued" alignment="center">
                    Create an organization to manage multiple Shopify stores from a single dashboard.
                    Perfect for agencies and multi-brand merchants.
                  </Text>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    Create Organization
                  </Button>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Banner title="Benefits of Multi-Store Management">
              <BlockStack gap="200">
                <Text as="p">
                  <strong>Unified Dashboard</strong> — See all your stores AI scores at a glance
                </Text>
                <Text as="p">
                  <strong>Team Access</strong> — Invite team members with role-based permissions
                </Text>
                <Text as="p">
                  <strong>Aggregate Metrics</strong> — Track performance across all stores
                </Text>
                <Text as="p">
                  <strong>Quick Actions</strong> — Run audits and optimizations across stores
                </Text>
              </BlockStack>
            </Banner>
          </Layout.Section>
        </Layout>

        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Organization"
          primaryAction={{
            content: 'Create',
            onAction: createOrganization,
            loading: creating,
            disabled: !orgName.trim(),
          }}
          secondaryActions={[
            { content: 'Cancel', onAction: () => setShowCreateModal(false) },
          ]}
        >
          <Modal.Section>
            <TextField
              label="Organization Name"
              placeholder="e.g., My Agency or Brand Portfolio"
              value={orgName}
              onChange={setOrgName}
              autoComplete="off"
              helpText="This will be visible to all team members"
            />
          </Modal.Section>
        </Modal>
      </Page>
    );
  }

  // Has organization - show dashboard
  return (
    <Page
      title={organization.name}
      subtitle="Multi-Store Dashboard"
      backAction={{ content: 'Dashboard', url: '/admin' }}
      secondaryActions={[
        {
          content: 'Invite Member',
          icon: PlusCircleIcon,
          onAction: () => setShowInviteModal(true),
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title="Error" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Aggregate Metrics */}
        {dashboard && (
          <Layout.Section>
            <ResponsiveGrid columns={{ xs: 2, sm: 2, md: 4, lg: 5 }} gap="base">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Stores</Text>
                  <Text as="p" variant="headingXl">{dashboard.stores.length}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    of {organization.maxStores} max
                  </Text>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Avg AI Score</Text>
                  <Text as="p" variant="headingXl">{dashboard.aggregateMetrics.averageScore}</Text>
                  <ProgressBar
                    progress={dashboard.aggregateMetrics.averageScore}
                    tone={dashboard.aggregateMetrics.averageScore >= 60 ? 'success' : 'critical'}
                    size="small"
                  />
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Total Products</Text>
                  <Text as="p" variant="headingXl">{dashboard.aggregateMetrics.totalProducts}</Text>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Critical Issues</Text>
                  <Text as="p" variant="headingXl" tone="critical">
                    {dashboard.aggregateMetrics.totalCriticalIssues}
                  </Text>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">Need Attention</Text>
                  <Text as="p" variant="headingXl" tone="caution">
                    {dashboard.aggregateMetrics.storesNeedingAttention}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">stores</Text>
                </BlockStack>
              </Card>
            </ResponsiveGrid>
          </Layout.Section>
        )}

        {/* Stores List */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">Stores</Text>
                <Badge>{`${dashboard?.stores.length || 0} / ${organization.maxStores}`}</Badge>
              </InlineStack>
              <Divider />

              {dashboard?.stores.length === 0 ? (
                <Box padding="600">
                  <BlockStack gap="300" inlineAlign="center">
                    <Text as="p" tone="subdued">No stores in this organization yet.</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Install Surfaced on more stores to add them here.
                    </Text>
                  </BlockStack>
                </Box>
              ) : (
                <ResourceList
                  items={dashboard?.stores || []}
                  renderItem={(store) => (
                    <ResourceItem
                      id={store.id}
                      accessibilityLabel={`View ${store.name || store.shopDomain}`}
                      onClick={() => {}}
                      media={
                        <Avatar
                          customer
                          size="md"
                          name={store.name || store.shopDomain}
                        />
                      }
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text as="p" fontWeight="semibold">
                            {store.name || store.shopDomain}
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {store.shopDomain} • {store.productsCount} products
                          </Text>
                        </BlockStack>
                        <InlineStack gap="200">
                          {getScoreBadge(store.aiScore)}
                          {store.criticalIssues > 0 && (
                            <Badge tone="critical">{`${store.criticalIssues} critical`}</Badge>
                          )}
                        </InlineStack>
                      </InlineStack>
                    </ResourceItem>
                  )}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Team Members */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">Team Members</Text>
                <Button size="slim" onClick={() => setShowInviteModal(true)}>
                  Invite
                </Button>
              </InlineStack>
              <Divider />

              <ResourceList
                items={dashboard?.members || []}
                renderItem={(member) => (
                  <ResourceItem
                    id={member.email}
                    accessibilityLabel={`Member ${member.email}`}
                    onClick={() => {}}
                    shortcutActions={
                      member.role !== 'owner'
                        ? [{ content: 'Remove', onAction: () => removeMember(member.email) }]
                        : undefined
                    }
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">
                          {member.name || member.email}
                        </Text>
                        {member.name && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            {member.email}
                          </Text>
                        )}
                      </BlockStack>
                      {getRoleBadge(member.role)}
                    </InlineStack>
                  </ResourceItem>
                )}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Invite Modal */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        primaryAction={{
          content: 'Send Invite',
          onAction: inviteMember,
          loading: inviting,
          disabled: !inviteEmail.trim(),
        }}
        secondaryActions={[
          { content: 'Cancel', onAction: () => setShowInviteModal(false) },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Email Address"
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={setInviteEmail}
              autoComplete="off"
            />
            <Select
              label="Role"
              options={[
                { label: 'Viewer - Read-only access', value: 'viewer' },
                { label: 'Editor - Can make changes', value: 'editor' },
                { label: 'Admin - Full access', value: 'admin' },
              ]}
              value={inviteRole}
              onChange={setInviteRole}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
