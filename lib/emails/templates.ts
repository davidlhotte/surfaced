/**
 * Email templates for conversion and engagement
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const PLAN_UPGRADE_INFO = {
  FREE: { next: 'Starter', price: '$4.99', stores: '50' },
  BASIC: { next: 'Pro', price: '$9.99', stores: '250' },
  PLUS: { next: 'Business', price: '$24.99', stores: 'unlimited' },
};

/**
 * Email sent when user reaches their store limit
 */
export function getLimitReachedEmail(
  shopName: string,
  currentStores: number,
  maxStores: number,
  currentPlan: string,
  appUrl: string
): EmailTemplate {
  const upgradeInfo = PLAN_UPGRADE_INFO[currentPlan as keyof typeof PLAN_UPGRADE_INFO];

  const subject = `🚫 You've reached your store limit on LocateUs`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📍 LocateUs</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #dc2626; margin-top: 0;">You've reached your store limit</h2>

    <p>Hi there,</p>

    <p>Your store <strong>${shopName}</strong> has reached its limit of <strong>${maxStores} stores</strong> on the ${currentPlan === 'FREE' ? 'Free' : currentPlan} plan.</p>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #991b1b;">
        <strong>Current usage:</strong> ${currentStores}/${maxStores} stores (100%)
      </p>
    </div>

    <p>To add more store locations, upgrade to <strong>${upgradeInfo?.next || 'the next plan'}</strong> for just <strong>${upgradeInfo?.price || '$4.99'}/month</strong> and get up to <strong>${upgradeInfo?.stores || '50'} stores</strong>.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}/admin/settings" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Upgrade Now
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      Questions? Reply to this email and we'll help you out.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>Sent by LocateUs • <a href="${appUrl}" style="color: #9ca3af;">Manage preferences</a></p>
  </div>
</body>
</html>
`;

  const text = `
You've reached your store limit on LocateUs

Hi there,

Your store ${shopName} has reached its limit of ${maxStores} stores on the ${currentPlan === 'FREE' ? 'Free' : currentPlan} plan.

Current usage: ${currentStores}/${maxStores} stores (100%)

To add more store locations, upgrade to ${upgradeInfo?.next || 'the next plan'} for just ${upgradeInfo?.price || '$4.99'}/month and get up to ${upgradeInfo?.stores || '50'} stores.

Upgrade now: ${appUrl}/admin/settings

Questions? Reply to this email and we'll help you out.

---
Sent by LocateUs
`;

  return { subject, html, text };
}

/**
 * Email sent when user is at 80% of their limit
 */
export function getNearLimitEmail(
  shopName: string,
  currentStores: number,
  maxStores: number,
  currentPlan: string,
  appUrl: string
): EmailTemplate {
  const upgradeInfo = PLAN_UPGRADE_INFO[currentPlan as keyof typeof PLAN_UPGRADE_INFO];
  const usagePercent = Math.round((currentStores / maxStores) * 100);

  const subject = `⚠️ Running low on store slots - ${usagePercent}% used`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📍 LocateUs</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #d97706; margin-top: 0;">You're running low on store slots</h2>

    <p>Hi there,</p>

    <p>Your store <strong>${shopName}</strong> is using <strong>${usagePercent}%</strong> of available store slots.</p>

    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;">
        <strong>Current usage:</strong> ${currentStores}/${maxStores} stores
      </p>
      <div style="background: #fde68a; border-radius: 4px; height: 8px; margin-top: 10px;">
        <div style="background: #f59e0b; border-radius: 4px; height: 8px; width: ${usagePercent}%;"></div>
      </div>
    </div>

    <p>Consider upgrading to <strong>${upgradeInfo?.next || 'the next plan'}</strong> for <strong>${upgradeInfo?.price || '$4.99'}/month</strong> to get <strong>${upgradeInfo?.stores || '50'} stores</strong> and never worry about limits.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}/admin/settings" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        View Upgrade Options
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      Have questions? Just reply to this email.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>Sent by LocateUs • <a href="${appUrl}" style="color: #9ca3af;">Manage preferences</a></p>
  </div>
</body>
</html>
`;

  const text = `
You're running low on store slots

Hi there,

Your store ${shopName} is using ${usagePercent}% of available store slots.

Current usage: ${currentStores}/${maxStores} stores

Consider upgrading to ${upgradeInfo?.next || 'the next plan'} for ${upgradeInfo?.price || '$4.99'}/month to get ${upgradeInfo?.stores || '50'} stores and never worry about limits.

View upgrade options: ${appUrl}/admin/settings

Have questions? Just reply to this email.

---
Sent by LocateUs
`;

  return { subject, html, text };
}

/**
 * Welcome email with getting started tips
 */
export function getWelcomeEmail(
  shopName: string,
  appUrl: string
): EmailTemplate {
  const subject = `🎉 Welcome to LocateUs - Let's set up your store locator!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📍 Welcome to LocateUs!</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="margin-top: 0;">Let's get your store locator set up</h2>

    <p>Hi there,</p>

    <p>Thanks for installing LocateUs on <strong>${shopName}</strong>! You're just a few steps away from helping your customers find your stores.</p>

    <h3 style="color: #4f46e5;">Quick Start Guide:</h3>

    <ol style="padding-left: 20px;">
      <li style="margin-bottom: 12px;"><strong>Add your stores</strong> - Enter them manually or import from CSV</li>
      <li style="margin-bottom: 12px;"><strong>Customize the map</strong> - Match your brand colors and style</li>
      <li style="margin-bottom: 12px;"><strong>Add to your theme</strong> - Use the Store Locator block in Theme Editor</li>
    </ol>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}/admin" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Open LocateUs
      </a>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #166534;">
        <strong>🎁 Free plan includes:</strong> Up to 5 stores, OpenStreetMap, CSV import
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      Need help? Reply to this email or check our <a href="${appUrl}/help" style="color: #4f46e5;">documentation</a>.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>Sent by LocateUs • <a href="${appUrl}" style="color: #9ca3af;">Manage preferences</a></p>
  </div>
</body>
</html>
`;

  const text = `
Welcome to LocateUs!

Hi there,

Thanks for installing LocateUs on ${shopName}! You're just a few steps away from helping your customers find your stores.

Quick Start Guide:
1. Add your stores - Enter them manually or import from CSV
2. Customize the map - Match your brand colors and style
3. Add to your theme - Use the Store Locator block in Theme Editor

Open LocateUs: ${appUrl}/admin

Free plan includes: Up to 5 stores, OpenStreetMap, CSV import

Need help? Reply to this email or check our documentation.

---
Sent by LocateUs
`;

  return { subject, html, text };
}
