import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Surfaced',
  description: 'Terms of Service for Surfaced AI Visibility Optimization App',
  robots: 'index, follow',
};

export default function TermsOfService() {
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
        Terms of Service
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Last updated: January 23, 2025
      </p>

      <section style={{ marginBottom: '30px' }}>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By installing, accessing, or using Surfaced (&quot;the App&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;),
          you agree to be bound by these Terms of Service. If you do not agree to these terms,
          please do not use the App.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>2. Description of Service</h2>
        <p>
          Surfaced is a Shopify application that helps merchants optimize their product catalog
          for AI visibility (AEO - AI Engine Optimization). The App provides:
        </p>
        <ul>
          <li>AI readiness analysis and scoring for products</li>
          <li>Visibility checks across AI platforms (ChatGPT, Claude, Perplexity, etc.)</li>
          <li>llms.txt and JSON-LD structured data generation</li>
          <li>Product optimization recommendations</li>
          <li>Competitor visibility tracking</li>
          <li>Exportable reports in multiple formats</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>3. Eligibility</h2>
        <p>
          To use Surfaced, you must:
        </p>
        <ul>
          <li>Have an active Shopify store</li>
          <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
          <li>Have the authority to enter into this agreement on behalf of your business</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>4. Account and Security</h2>
        <p>
          The App uses Shopify&apos;s authentication system. You are responsible for:
        </p>
        <ul>
          <li>Maintaining the security of your Shopify account</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>5. Subscription Plans and Billing</h2>

        <h3>5.1 Free Plan</h3>
        <p>
          The Free plan allows limited use of the App at no cost. Features and limitations
          are as described on our pricing page.
        </p>

        <h3>5.2 Paid Plans</h3>
        <p>
          Paid subscriptions are billed monthly through Shopify&apos;s billing system. By subscribing
          to a paid plan, you authorize Shopify to charge the applicable fees to your payment method.
        </p>

        <h3>5.3 Free Trials</h3>
        <p>
          Paid plans may include a free trial period. You will not be charged until the trial
          period ends. You may cancel at any time during the trial to avoid charges.
        </p>

        <h3>5.4 Cancellation</h3>
        <p>
          You may cancel your subscription at any time. Upon cancellation:
        </p>
        <ul>
          <li>Your subscription will remain active until the end of the current billing period</li>
          <li>You will retain access to paid features until the period ends</li>
          <li>No refunds are provided for partial months</li>
        </ul>

        <h3>5.5 Price Changes</h3>
        <p>
          We reserve the right to modify pricing at any time. Price changes will be communicated
          at least 30 days in advance and will apply to subsequent billing periods.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>6. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the App for any illegal purpose</li>
          <li>Upload false, misleading, or fraudulent store information</li>
          <li>Attempt to gain unauthorized access to the App or its systems</li>
          <li>Interfere with or disrupt the App&apos;s operation</li>
          <li>Reverse engineer, decompile, or disassemble the App</li>
          <li>Use the App to collect data for purposes other than displaying your store locations</li>
          <li>Resell or redistribute the App without authorization</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>7. Data and Content</h2>

        <h3>7.1 Your Content</h3>
        <p>
          You retain ownership of all store location data and content you submit to the App.
          By using the App, you grant us a license to store, process, and display this content
          as necessary to provide the service.
        </p>

        <h3>7.2 Data Accuracy</h3>
        <p>
          You are responsible for ensuring the accuracy of all store information you provide.
          We are not liable for any issues arising from inaccurate data.
        </p>

        <h3>7.3 Public Display</h3>
        <p>
          Store location information you provide will be publicly displayed on your storefront.
          Do not include sensitive or confidential information in store listings.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>8. Third-Party Services</h2>
        <p>
          The App integrates with third-party services including:
        </p>
        <ul>
          <li><strong>Shopify:</strong> For authentication, billing, and product data access</li>
          <li><strong>AI Platforms (OpenAI, Anthropic, Google, Perplexity):</strong> For visibility checks</li>
          <li><strong>OpenRouter:</strong> As an API gateway for AI model requests</li>
          <li><strong>Vercel:</strong> For hosting and infrastructure</li>
        </ul>
        <p>
          Your use of these services is subject to their respective terms of service.
          We are not responsible for the availability or accuracy of third-party services.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>9. Intellectual Property</h2>
        <p>
          The App, including its design, code, features, and documentation, is owned by us
          and protected by intellectual property laws. You may not copy, modify, or create
          derivative works based on the App.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>10. Disclaimer of Warranties</h2>
        <p>
          THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
          EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
        </p>
        <ul>
          <li>MERCHANTABILITY</li>
          <li>FITNESS FOR A PARTICULAR PURPOSE</li>
          <li>NON-INFRINGEMENT</li>
          <li>ACCURACY OR RELIABILITY OF GEOCODING</li>
          <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>11. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
        </p>
        <ul>
          <li>Any indirect, incidental, special, consequential, or punitive damages</li>
          <li>Any loss of profits, revenue, data, or business opportunities</li>
          <li>Any damages arising from your use or inability to use the App</li>
          <li>Any damages exceeding the amount paid by you for the App in the 12 months preceding the claim</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>12. Indemnification</h2>
        <p>
          You agree to indemnify and hold us harmless from any claims, damages, losses,
          or expenses arising from:
        </p>
        <ul>
          <li>Your use of the App</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any third-party rights</li>
          <li>Content you submit to the App</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>13. Termination</h2>
        <p>
          We may suspend or terminate your access to the App at any time for:
        </p>
        <ul>
          <li>Violation of these Terms</li>
          <li>Fraudulent or illegal activity</li>
          <li>Non-payment of fees</li>
          <li>Any other reason at our sole discretion</li>
        </ul>
        <p>
          Upon termination, your right to use the App ceases immediately and all your
          data will be deleted in accordance with our Privacy Policy.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>14. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of
          significant changes via email or through the App. Continued use of the App
          after changes constitutes acceptance of the modified Terms.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>15. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of
          the jurisdiction in which we operate, without regard to conflict of law principles.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>16. Dispute Resolution</h2>
        <p>
          Any disputes arising from these Terms or your use of the App shall first be
          attempted to be resolved through good-faith negotiation. If negotiation fails,
          disputes shall be resolved through binding arbitration.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>17. Severability</h2>
        <p>
          If any provision of these Terms is found to be unenforceable, the remaining
          provisions shall continue in full force and effect.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>18. Entire Agreement</h2>
        <p>
          These Terms, together with our Privacy Policy, constitute the entire agreement
          between you and us regarding the App and supersede all prior agreements.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>19. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us:
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
          By using Surfaced, you acknowledge that you have read, understood, and agree
          to be bound by these Terms of Service.
        </p>
        <p style={{ marginTop: '10px' }}>
          This application is built in compliance with the{' '}
          <a
            href="https://www.shopify.com/partners/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0EA5E9' }}
          >
            Shopify Partner Program Agreement
          </a>.
        </p>
      </section>
    </div>
  );
}
