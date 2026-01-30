import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Surfaced',
  description: 'Privacy Policy for Surfaced AI Visibility Optimization App',
  robots: 'index, follow',
};

export default function PrivacyPolicy() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#333'
    }}>
      <h1 style={{ borderBottom: '2px solid #0EA5E9', paddingBottom: '10px' }}>
        Privacy Policy
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Last updated: January 23, 2025
      </p>

      <section style={{ marginBottom: '30px' }}>
        <h2>1. Introduction</h2>
        <p>
          Surfaced (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) is a Shopify application that helps
          merchants optimize their product catalog for AI visibility (AEO - AI Engine Optimization).
          This Privacy Policy explains how we collect, use, store, and protect information when you use our application.
        </p>
        <p>
          By installing and using Surfaced, you agree to the terms of this Privacy Policy.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>2. Information We Collect</h2>

        <h3>2.1 Merchant Information</h3>
        <p>When you install Surfaced, we collect:</p>
        <ul>
          <li><strong>Shop domain</strong> (e.g., your-store.myshopify.com)</li>
          <li><strong>Shop name and email</strong> for account identification</li>
          <li><strong>Access tokens</strong> (encrypted with AES-256-GCM, for API authentication)</li>
          <li><strong>Billing plan</strong> selected</li>
        </ul>

        <h3>2.2 Product Data</h3>
        <p>To provide AI visibility analysis, we access and store:</p>
        <ul>
          <li>Product titles, descriptions, and handles</li>
          <li>Product images and ALT texts</li>
          <li>Product metafields and tags</li>
          <li>AI readiness scores and audit results</li>
        </ul>

        <h3>2.3 Visibility Check Data</h3>
        <p>When you run visibility checks, we store:</p>
        <ul>
          <li>Search queries tested</li>
          <li>AI platform responses (summarized)</li>
          <li>Mention status and position data</li>
          <li>Competitor mentions detected</li>
        </ul>

        <h3>2.4 What We Do NOT Collect</h3>
        <p>We do not collect or store:</p>
        <ul>
          <li>Customer personal information</li>
          <li>Payment or financial data</li>
          <li>Order information</li>
          <li>Inventory levels</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>3. How We Use Your Information</h2>
        <p>We use collected information solely to:</p>
        <ul>
          <li>Analyze your product catalog for AI readiness</li>
          <li>Generate AI visibility scores and recommendations</li>
          <li>Check your brand visibility on AI platforms (ChatGPT, Claude, Perplexity, etc.)</li>
          <li>Generate llms.txt and JSON-LD structured data</li>
          <li>Process billing through Shopify&apos;s billing system</li>
          <li>Provide customer support</li>
          <li>Improve the application</li>
        </ul>
        <p>
          We do not sell, rent, or share your data with third parties for marketing purposes.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>4. Data Storage and Security</h2>
        <p>
          Your data is stored securely using industry-standard measures:
        </p>
        <ul>
          <li><strong>Database:</strong> Vercel Postgres with encrypted connections</li>
          <li><strong>Access tokens:</strong> AES-256-GCM encryption at rest</li>
          <li><strong>Transmission:</strong> HTTPS/TLS encryption</li>
          <li><strong>Caching:</strong> Vercel KV (Redis) for performance optimization</li>
        </ul>
        <p>
          We maintain properly configured systems and follow security best practices
          to protect against unauthorized access, disclosure, or use of your information.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>5. Data Sharing</h2>
        <p>We only share data with:</p>
        <ul>
          <li>
            <strong>Shopify:</strong> For authentication, billing, and app functionality
            as required by the Shopify platform
          </li>
          <li>
            <strong>AI Platforms (for visibility checks):</strong> When you run visibility checks,
            we send search queries to AI platforms (OpenAI, Anthropic, Google, Perplexity) to test
            if your brand is mentioned. We do not share your product data with these platforms.
          </li>
          <li>
            <strong>OpenRouter:</strong> We use OpenRouter as an API gateway for some AI model requests.
            Only search queries are sent, not your product catalog.
          </li>
        </ul>
        <p>
          Your product data stays within our secure infrastructure and is never shared
          with third-party AI training or marketing services.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>6. Shopify App Store Compliance</h2>
        <p>
          This privacy policy is provided in compliance with{' '}
          <a
            href="https://shopify.dev/docs/apps/launch/privacy-requirements"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0EA5E9' }}
          >
            Shopify&apos;s privacy requirements
          </a>{' '}
          for apps distributed through the Shopify App Store.
        </p>
        <h3>6.1 Data Collected Through Shopify APIs</h3>
        <ul>
          <li>Shop information (domain, name, email) via Admin API</li>
          <li>Product catalog data (titles, descriptions, images, metafields) via Admin API</li>
          <li>Session tokens for authentication via App Bridge</li>
        </ul>
        <h3>6.2 Data Collected Directly From Merchants</h3>
        <ul>
          <li>Custom visibility check queries you configure</li>
          <li>Competitor brand names you add for tracking</li>
          <li>Settings and preferences within the app</li>
        </ul>
        <h3>6.3 Automated Data Generation</h3>
        <ul>
          <li>AI readiness scores calculated for your products</li>
          <li>Visibility check results from AI platforms</li>
          <li>Audit logs for app activity</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>7. Data Retention</h2>
        <p>
          We retain your data only as long as you have the app installed. When you
          uninstall Surfaced:
        </p>
        <ul>
          <li>All product audit data is permanently deleted</li>
          <li>All visibility check history is permanently deleted</li>
          <li>All settings and configurations are permanently deleted</li>
          <li>All access tokens are permanently deleted</li>
          <li>All cached data is cleared</li>
        </ul>
        <p>
          Data deletion occurs automatically within 24 hours of uninstallation.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>8. Your Rights (GDPR)</h2>
        <p>If you are located in the European Economic Area, you have the right to:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of your data</li>
          <li><strong>Rectification:</strong> Correct inaccurate data</li>
          <li><strong>Erasure:</strong> Request deletion of your data</li>
          <li><strong>Portability:</strong> Export your data (CSV export available)</li>
          <li><strong>Object:</strong> Object to data processing</li>
        </ul>
        <p>
          To exercise these rights, contact us at{' '}
          <a href="mailto:support@surfaced.app">support@surfaced.app</a>.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>9. GDPR Compliance</h2>
        <p>
          We comply with GDPR requirements and respond to the following Shopify
          mandatory webhooks:
        </p>
        <ul>
          <li><strong>customers/data_request:</strong> We provide any customer data upon request (note: we do not store customer data)</li>
          <li><strong>customers/redact:</strong> We delete any customer data upon request</li>
          <li><strong>shop/redact:</strong> We delete all shop data when requested</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>10. Cookies and Tracking</h2>
        <p>
          The Surfaced admin interface uses sessionStorage (not cookies) to maintain
          your session within the Shopify admin. We do not use tracking cookies or
          third-party analytics within the app.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>11. Children&apos;s Privacy</h2>
        <p>
          Surfaced is a B2B application designed for Shopify merchants. We do not
          knowingly collect information from children under 16 years of age.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of
          any significant changes by posting a notice in the application or sending
          you an email.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>13. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data practices,
          please contact us:
        </p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:support@surfaced.app">support@surfaced.app</a></li>
        </ul>
      </section>

      <section style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #eee',
        color: '#666',
        fontSize: '14px'
      }}>
        <p>
          This application is built in compliance with the{' '}
          <a
            href="https://www.shopify.com/partners/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff' }}
          >
            Shopify Partner Program Agreement
          </a>{' '}
          and follows Shopify&apos;s data protection requirements.
        </p>
      </section>
    </div>
  );
}
