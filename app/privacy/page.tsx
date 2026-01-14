import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - LocateUs',
  description: 'Privacy Policy for LocateUs Store Locator App',
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
      <h1 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
        Privacy Policy
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Last updated: January 12, 2025
      </p>

      <section style={{ marginBottom: '30px' }}>
        <h2>1. Introduction</h2>
        <p>
          LocateUs (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) is a Shopify application that helps
          merchants display their store locations on an interactive map. This Privacy Policy explains
          how we collect, use, store, and protect information when you use our application.
        </p>
        <p>
          By installing and using LocateUs, you agree to the terms of this Privacy Policy.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>2. Information We Collect</h2>

        <h3>2.1 Merchant Information</h3>
        <p>When you install LocateUs, we collect:</p>
        <ul>
          <li><strong>Shop domain</strong> (e.g., your-store.myshopify.com)</li>
          <li><strong>Access tokens</strong> (encrypted, for API authentication)</li>
          <li><strong>Billing plan</strong> selected</li>
        </ul>

        <h3>2.2 Store Location Data</h3>
        <p>You provide us with store location information including:</p>
        <ul>
          <li>Store name</li>
          <li>Address, city, state/province, country, postal code</li>
          <li>Geographic coordinates (latitude/longitude)</li>
          <li>Contact information (phone, email, website)</li>
          <li>Business hours</li>
        </ul>

        <h3>2.3 What We Do NOT Collect</h3>
        <p>We do not collect or store:</p>
        <ul>
          <li>Customer personal information</li>
          <li>Payment or financial data</li>
          <li>Order information</li>
          <li>Product data</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>3. How We Use Your Information</h2>
        <p>We use collected information solely to:</p>
        <ul>
          <li>Display your store locations on the interactive map widget</li>
          <li>Provide geocoding services (converting addresses to coordinates)</li>
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
            <strong>Map providers:</strong> OpenStreetMap (open source) or Google Maps
            (if enabled) receive geographic coordinates to display maps
          </li>
          <li>
            <strong>Geocoding services:</strong> Address data is sent to geocoding APIs
            to convert addresses to coordinates
          </li>
        </ul>
        <p>
          Your store location data is publicly displayed on your storefront&apos;s map widget
          as intended by the application&apos;s functionality.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>6. Data Retention</h2>
        <p>
          We retain your data only as long as you have the app installed. When you
          uninstall LocateUs:
        </p>
        <ul>
          <li>All store locations are permanently deleted</li>
          <li>All settings are permanently deleted</li>
          <li>All access tokens are permanently deleted</li>
          <li>All cached data is cleared</li>
        </ul>
        <p>
          Data deletion occurs automatically within 24 hours of uninstallation.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>7. Your Rights (GDPR)</h2>
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
          <a href="mailto:david.lhotte@gmail.com">david.lhotte@gmail.com</a>.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>8. GDPR Compliance</h2>
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
        <h2>9. Cookies and Tracking</h2>
        <p>
          The LocateUs admin interface uses sessionStorage (not cookies) to maintain
          your session within the Shopify admin. We do not use tracking cookies or
          third-party analytics on the storefront widget.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>10. Children&apos;s Privacy</h2>
        <p>
          LocateUs is a B2B application designed for Shopify merchants. We do not
          knowingly collect information from children under 16 years of age.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of
          any significant changes by posting a notice in the application or sending
          you an email.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>12. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data practices,
          please contact us:
        </p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:david.lhotte@gmail.com">david.lhotte@gmail.com</a></li>
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
