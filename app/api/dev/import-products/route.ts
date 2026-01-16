/**
 * DEV ONLY: Import test products endpoint
 *
 * This endpoint imports 20 test products for E2E testing.
 * Only available in development mode.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShopFromRequest, getShopData } from '@/lib/shopify/get-shop';
import { decryptToken } from '@/lib/security/encryption';
import { logger } from '@/lib/monitoring/logger';

const SHOPIFY_API_VERSION = '2025-01';

/**
 * Create a product via GraphQL API
 */
async function createProductGraphQL(
  shopDomain: string,
  accessToken: string,
  product: typeof TEST_PRODUCTS[0]
): Promise<{ id: string } | null> {
  const mutation = `
    mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
      productCreate(input: $input, media: $media) {
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title: product.title,
      descriptionHtml: product.body_html,
      vendor: product.vendor || undefined,
      productType: product.product_type || undefined,
      tags: product.tags ? product.tags.split(', ') : [],
      status: 'ACTIVE',
      seo: (product.seo_title || product.seo_description) ? {
        title: product.seo_title || undefined,
        description: product.seo_description || undefined,
      } : undefined,
    },
    media: product.image_url ? [{
      originalSource: product.image_url,
      alt: product.image_alt || product.title,
      mediaContentType: 'IMAGE',
    }] : [],
  };

  const response = await fetch(
    `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    }
  );

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  if (json.data?.productCreate?.userErrors?.length > 0) {
    throw new Error(`User errors: ${JSON.stringify(json.data.productCreate.userErrors)}`);
  }

  return json.data?.productCreate?.product || null;
}


// Simplified product data for import
const TEST_PRODUCTS = [
  // PERFECT QUALITY PRODUCTS (Score 90-100)
  {
    title: "Apex Seamless Leggings - Black",
    body_html: `<p>Engineered for performance, the Apex Seamless Leggings are designed to support you through your most intense workouts. Made from a blend of 68% Polyester, 22% Nylon, and 10% Elastane, these leggings offer the perfect balance of stretch, compression, and breathability.</p>
    <h3>Key Features:</h3>
    <ul>
      <li><strong>Seamless Construction:</strong> Reduces chafing and provides a smooth, flattering fit</li>
      <li><strong>High-Waisted Design:</strong> Offers support and coverage during all movements</li>
      <li><strong>Squat-Proof:</strong> Tested to ensure complete opacity during deep squats</li>
      <li><strong>Moisture-Wicking:</strong> Keeps you dry and comfortable throughout your workout</li>
      <li><strong>Contour Lines:</strong> Strategically placed to enhance your natural shape</li>
    </ul>
    <p>Whether you're hitting the gym, running, or practicing yoga, these leggings will move with you. The supportive waistband stays in place without digging in, and the four-way stretch fabric allows for unrestricted movement.</p>`,
    vendor: "Gymshark",
    product_type: "Leggings",
    tags: "womens, leggings, seamless, activewear, gym, fitness, black, high-waist, squat-proof, bestseller",
    price: "62.00",
    image_url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800",
    image_alt: "Apex Seamless Leggings Black",
    seo_title: "Apex Seamless Leggings Black | High-Waist Gym Leggings | Gymshark",
    seo_description: "Shop the Apex Seamless Leggings in Black. Squat-proof, moisture-wicking, and designed for maximum performance."
  },
  {
    title: "Power T-Shirt - Navy Blue",
    body_html: `<p>The Power T-Shirt is your essential training companion. Crafted from soft, breathable cotton-blend fabric, this tee offers the perfect combination of comfort and functionality for any workout.</p>
    <h3>Features:</h3>
    <ul>
      <li><strong>Relaxed Fit:</strong> Comfortable and non-restrictive for all activities</li>
      <li><strong>Breathable Fabric:</strong> 60% Cotton, 40% Polyester blend</li>
      <li><strong>Sweat-Wicking:</strong> Engineered to keep you dry</li>
      <li><strong>Reinforced Seams:</strong> Built to last through intense training</li>
    </ul>
    <p>Perfect for lifting, cardio, or casual wear. The classic fit works great layered or on its own.</p>`,
    vendor: "Gymshark",
    product_type: "T-Shirt",
    tags: "mens, t-shirt, training, gym, fitness, navy, cotton, breathable",
    price: "30.00",
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    image_alt: "Power T-Shirt Navy Blue",
    seo_title: "Power T-Shirt Navy Blue | Men's Gym Tee | Gymshark",
    seo_description: "The Power T-Shirt in Navy Blue. Breathable, comfortable, and built for performance."
  },
  {
    title: "Men's Merino Wool Blend Ankle Socks - Charcoal",
    body_html: `<p>Experience the natural wonder of Merino Wool with our best-selling ankle socks. Designed for year-round comfort, these socks keep your feet warm in winter and cool in summer.</p>
    <h3>Why Merino Wool?</h3>
    <ul>
      <li><strong>Temperature Regulating:</strong> Naturally keeps feet comfortable in any weather</li>
      <li><strong>Moisture-Wicking:</strong> Merino fibers absorb moisture away from skin</li>
      <li><strong>Odor Resistant:</strong> Natural antimicrobial properties</li>
      <li><strong>Ultra-Soft:</strong> No itch, just comfort</li>
    </ul>
    <h3>Bombas Signature Features:</h3>
    <ul>
      <li><strong>Honeycomb Arch Support:</strong> Hugs your midfoot for all-day comfort</li>
      <li><strong>Seamless Toe:</strong> No irritating seams</li>
      <li><strong>Stay-Up Technology:</strong> Never slips down</li>
      <li><strong>Cushioned Footbed:</strong> Extra padding where you need it</li>
    </ul>
    <p>For every pair purchased, we donate a pair to someone in need. Over 100 million items donated.</p>`,
    vendor: "Bombas",
    product_type: "Socks",
    tags: "mens, socks, merino-wool, ankle, premium, gift, sustainable, give-back, charcoal",
    price: "17.00",
    image_url: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800",
    image_alt: "Bombas Merino Wool Ankle Socks Charcoal",
    seo_title: "Men's Merino Wool Ankle Socks | Bombas - Buy One Give One",
    seo_description: "Premium Merino Wool ankle socks with Honeycomb arch support. For every pair you buy, we donate a pair."
  },
  {
    title: "Tree Dasher 2 Running Shoes - Natural Black",
    body_html: `<p>Meet the Tree Dasher 2 — our certified climate neutral running shoe engineered for both performance and sustainability. Made from eucalyptus tree fiber, this shoe proves that you don't have to choose between comfort and caring for the planet.</p>
    <h3>Performance Features:</h3>
    <ul>
      <li><strong>7mm Heel Drop:</strong> Optimal for natural running form</li>
      <li><strong>SweetFoam™ Midsole:</strong> Made from sugarcane for responsive cushioning</li>
      <li><strong>Bio-based Rubber Outsole:</strong> Superior grip and durability</li>
      <li><strong>Breathable Upper:</strong> Eucalyptus tree fiber keeps feet cool</li>
      <li><strong>Reflective Details:</strong> For low-light visibility</li>
    </ul>
    <h3>Sustainability Commitment:</h3>
    <ul>
      <li>Carbon footprint: 10.7 kg CO2e (we offset 100%)</li>
      <li>Made in Vietnam with renewable energy</li>
      <li>FSC-certified eucalyptus fiber</li>
      <li>Machine washable for extended life</li>
    </ul>
    <p>Weight: 292g (10.3 oz) per shoe.</p>`,
    vendor: "Allbirds",
    product_type: "Running Shoes",
    tags: "unisex, running, shoes, sustainable, tree-fiber, carbon-neutral, eco-friendly, performance, black",
    price: "135.00",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    image_alt: "Allbirds Tree Dasher 2 Running Shoes Black",
    seo_title: "Tree Dasher 2 Running Shoes | Sustainable Performance Footwear | Allbirds",
    seo_description: "Certified carbon neutral running shoes made from eucalyptus tree fiber. 7mm drop, SweetFoam cushioning."
  },
  {
    title: "Matte Lip Kit - Dolce K",
    body_html: `<p>The iconic Matte Lip Kit that started it all. This all-in-one lip duo features a highly pigmented Matte Liquid Lipstick paired with a perfectly matching Lip Liner for the ultimate long-lasting lip look.</p>
    <h3>What's Included:</h3>
    <ul>
      <li><strong>Matte Liquid Lipstick (0.10 oz):</strong> Full coverage, velvety matte finish</li>
      <li><strong>Pencil Lip Liner (0.03 oz):</strong> Ultra-creamy, precise application</li>
    </ul>
    <h3>Key Benefits:</h3>
    <ul>
      <li><strong>8+ Hour Wear:</strong> Stays put through meals and activities</li>
      <li><strong>Smudge-Proof:</strong> No feathering or bleeding</li>
      <li><strong>Transfer-Proof:</strong> Kiss-proof formula</li>
      <li><strong>Comfortable:</strong> Lightweight, non-drying formula</li>
    </ul>
    <p>Shade: Dolce K - A warm, deep beige nude that flatters all skin tones.</p>
    <p><em>Cruelty-free. Vegan-friendly.</em></p>`,
    vendor: "Kylie Cosmetics",
    product_type: "Lip Kit",
    tags: "beauty, makeup, lips, matte, lipstick, liner, kylie, dolce-k, nude, bestseller, vegan, cruelty-free",
    price: "35.00",
    image_url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
    image_alt: "Kylie Cosmetics Matte Lip Kit Dolce K",
    seo_title: "Matte Lip Kit - Dolce K | Kylie Cosmetics by Kylie Jenner",
    seo_description: "Shop the iconic Matte Lip Kit in Dolce K. Includes matte liquid lipstick & matching lip liner. 8+ hour wear."
  },
  {
    title: "Utility Beard Oil - Tree Ranger",
    body_html: `<p>Transform your beard care routine with our signature Utility Beard Oil. Formulated with premium natural oils to condition your beard, soothe skin, and eliminate beard itch and dandruff.</p>
    <h3>Key Ingredients:</h3>
    <ul>
      <li><strong>Abyssinian Oil:</strong> Lightweight, fast-absorbing hydration</li>
      <li><strong>Jojoba Oil:</strong> Mimics natural skin oils</li>
      <li><strong>Castor Oil:</strong> Promotes healthy beard growth</li>
      <li><strong>Babassu Oil:</strong> Deep conditioning without greasiness</li>
    </ul>
    <h3>Scent: Tree Ranger</h3>
    <p>A woodsy, outdoorsy fragrance with notes of eucalyptus, pine, and cedar.</p>
    <h3>Benefits:</h3>
    <ul>
      <li>Eliminates beard itch and beardruff</li>
      <li>Softens and conditions beard hair</li>
      <li>Non-comedogenic (won't clog pores)</li>
    </ul>
    <p>Size: 1.7 fl oz / 50ml.</p>`,
    vendor: "Beardbrand",
    product_type: "Beard Oil",
    tags: "mens, grooming, beard, oil, natural, tree-ranger, conditioning, skin-care",
    price: "25.00",
    image_url: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800",
    image_alt: "Beardbrand Utility Beard Oil Tree Ranger",
    seo_title: "Utility Beard Oil - Tree Ranger | Beardbrand",
    seo_description: "Premium beard oil with natural oils to condition, soften, and eliminate beard itch."
  },
  {
    title: "Classic Core Sheet Set - White (Queen)",
    body_html: `<p>Our best-selling Classic Core Sheet Set delivers hotel-quality comfort at home. Crafted from 100% long-staple cotton in a crisp percale weave, these sheets get softer with every wash.</p>
    <h3>What's Included:</h3>
    <ul>
      <li>1 Fitted Sheet (Queen: 60" x 80" x 15" pocket)</li>
      <li>1 Flat Sheet (Queen: 96" x 106")</li>
      <li>2 Standard Pillowcases (20" x 30")</li>
    </ul>
    <h3>Why Percale?</h3>
    <ul>
      <li><strong>Breathable:</strong> Ideal for hot sleepers</li>
      <li><strong>Crisp Feel:</strong> Cool and fresh against skin</li>
      <li><strong>Durable:</strong> Gets better with time</li>
      <li><strong>270 Thread Count:</strong> The sweet spot for quality percale</li>
    </ul>
    <p>OEKO-TEX certified. Made ethically in Portugal.</p>`,
    vendor: "Brooklinen",
    product_type: "Sheet Set",
    tags: "home, bedding, sheets, percale, cotton, white, queen, hotel-quality, breathable",
    price: "149.00",
    image_url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    image_alt: "Brooklinen Classic Core Sheet Set White",
    seo_title: "Classic Core Sheet Set White Queen | 100% Cotton Percale | Brooklinen",
    seo_description: "Hotel-quality percale sheets in 100% long-staple cotton. Crisp, cool, and breathable."
  },
  {
    title: "Death Wish Coffee Ground - Dark Roast 1lb",
    body_html: `<p><strong>THE WORLD'S STRONGEST COFFEE</strong></p>
    <p>Wake up and conquer your day with Death Wish Coffee — the bold, smooth coffee that packs twice the caffeine of average coffee.</p>
    <h3>What Makes Us Different:</h3>
    <ul>
      <li><strong>2X the Caffeine:</strong> Carefully selected high-caffeine beans</li>
      <li><strong>Smooth, Never Bitter:</strong> Our unique roasting process eliminates bitterness</li>
      <li><strong>Bold Flavor:</strong> Notes of cherry and chocolate with a hint of almond</li>
    </ul>
    <h3>Certifications:</h3>
    <ul>
      <li>USDA Certified Organic</li>
      <li>Fair Trade Certified</li>
    </ul>
    <p>Size: 1 lb (16 oz) bag. Makes approximately 72 cups.</p>`,
    vendor: "Death Wish Coffee",
    product_type: "Coffee",
    tags: "food, coffee, ground, dark-roast, organic, fair-trade, high-caffeine, strong",
    price: "19.99",
    image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800",
    image_alt: "Death Wish Coffee Ground Dark Roast",
    seo_title: "Death Wish Coffee Ground Dark Roast 1lb | World's Strongest Coffee",
    seo_description: "The world's strongest coffee with 2X the caffeine. USDA Organic & Fair Trade certified."
  },
  {
    title: "Classic II Watch - Gunmetal/Sandstone",
    body_html: `<p>The watch that started it all, reimagined for a new decade. The Classic II embodies our founding principle: premium design shouldn't break the bank.</p>
    <h3>Design Details:</h3>
    <ul>
      <li><strong>Case:</strong> 42mm brushed gunmetal stainless steel</li>
      <li><strong>Dial:</strong> Sandstone with applied indices</li>
      <li><strong>Hands:</strong> Skeleton hands with luminous fill</li>
      <li><strong>Strap:</strong> Italian leather, quick-release</li>
      <li><strong>Movement:</strong> Japanese Miyota quartz</li>
      <li><strong>Water Resistance:</strong> 3 ATM</li>
    </ul>
    <p><em>2-Year Warranty | Free Shipping over $75</em></p>`,
    vendor: "MVMT",
    product_type: "Watch",
    tags: "accessories, watch, mens, minimalist, leather, gunmetal, classic, affordable-luxury",
    price: "158.00",
    image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800",
    image_alt: "MVMT Classic II Watch Gunmetal Sandstone",
    seo_title: "Classic II Watch Gunmetal/Sandstone | MVMT Watches",
    seo_description: "The MVMT Classic II watch with 42mm gunmetal case and Italian leather strap."
  },

  // GOOD QUALITY PRODUCTS (Score 60-80)
  {
    title: "Classic High Waist Skinny Jeans - Dark Wash",
    body_html: `<p>Our best-selling Classic High Waist Skinny Jeans in a timeless dark wash. These jeans feature a figure-hugging fit that flatters every body type.</p>
    <ul>
      <li>High-rise waist for a sleek silhouette</li>
      <li>Super stretch denim for all-day comfort</li>
      <li>Classic 5-pocket styling</li>
    </ul>
    <p>98% Cotton, 2% Spandex. Machine wash cold.</p>`,
    vendor: "Fashion Nova",
    product_type: "Jeans",
    tags: "womens, jeans, skinny, high-waist, denim, dark-wash, stretch",
    price: "24.99",
    image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
    image_alt: "High Waist Skinny Jeans Dark Wash"
  },
  {
    title: "Wool Runner Mizzle - Natural Grey",
    body_html: `<p>The Wool Runner Mizzle takes our classic Wool Runner and adds water-repellent protection for unpredictable weather.</p>
    <ul>
      <li>Water-Repellent bio-based shield</li>
      <li>ZQ Merino Wool upper</li>
      <li>SweetFoam™ Sole</li>
      <li>Machine Washable</li>
    </ul>`,
    vendor: "Allbirds",
    product_type: "Casual Shoes",
    tags: "unisex, casual, shoes, sustainable, wool, water-repellent, grey",
    price: "115.00",
    image_url: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800",
    image_alt: "Allbirds Wool Runner Mizzle Grey"
  },
  {
    title: "Kyliner Gel Pencil - Black",
    body_html: `<p>Define your eyes with the Kyliner Gel Pencil. This ultra-creamy formula glides on smoothly for precise, buildable color.</p>
    <ul>
      <li>Waterproof formula</li>
      <li>Smudge-proof wear</li>
      <li>12-hour wear</li>
    </ul>`,
    vendor: "Kylie Cosmetics",
    product_type: "Eye Liner",
    tags: "beauty, makeup, eyes, eyeliner, gel, black, waterproof",
    price: "19.00",
    image_url: "https://images.unsplash.com/photo-1617220379175-68eb0d35c583?w=800",
    image_alt: "Kyliner Gel Pencil Black"
  },
  {
    title: "Utility Balm - Old Money",
    body_html: `<p>The beard balm that does more. Made with 3X more natural butters than standard balms.</p>
    <ul>
      <li>Shea, mango, and cocoa butters</li>
      <li>Tames flyaways</li>
      <li>Light hold, natural finish</li>
    </ul>
    <p>Scent: Old Money - leather, sandalwood, and amber.</p>`,
    vendor: "Beardbrand",
    product_type: "Beard Balm",
    tags: "mens, grooming, beard, balm, natural, old-money",
    price: "32.00",
    image_url: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800",
    image_alt: "Beardbrand Utility Balm Old Money"
  },
  {
    title: "Luxe Pillowcase Set - Cream",
    body_html: `<p>Upgrade your sleep with our Luxe Pillowcase Set. Silky-smooth sateen weave with a 480 thread count.</p>
    <ul>
      <li>Set of 2 Standard Pillowcases</li>
      <li>100% Long-Staple Cotton</li>
      <li>480 Thread Count Sateen</li>
    </ul>`,
    vendor: "Brooklinen",
    product_type: "Pillowcases",
    tags: "home, bedding, pillowcase, sateen, cotton, cream",
    price: "59.00",
    image_url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800",
    image_alt: "Brooklinen Luxe Pillowcases Cream"
  },
  {
    title: "Death Cups K-Pods - 10 Count",
    body_html: `<p>The world's strongest coffee in convenient single-serve pods.</p>
    <ul>
      <li>10 pods per box</li>
      <li>USDA Organic & Fair Trade</li>
      <li>Keurig compatible</li>
    </ul>`,
    vendor: "Death Wish Coffee",
    product_type: "Coffee Pods",
    tags: "food, coffee, k-cups, pods, organic",
    price: "16.99",
    image_url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800",
    image_alt: "Death Wish Coffee K-Cups"
  },

  // MEDIUM QUALITY (Score 40-60)
  {
    title: "Original Bracelet - Pacific Blue",
    body_html: `<p>Hand-crafted by artisans in Costa Rica. 100% waterproof wax-coated thread, adjustable from 2-5 inches.</p>`,
    vendor: "Pura Vida",
    product_type: "Bracelet",
    tags: "accessories, bracelet, handmade, blue",
    price: "6.00",
    image_url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800",
    image_alt: "Pura Vida Bracelet Blue"
  },

  // POOR QUALITY (Score <40)
  {
    title: "Basic Cotton T-Shirt White",
    body_html: "<p>White t-shirt. Cotton. Unisex.</p>",
    vendor: "Generic",
    product_type: "T-Shirt",
    tags: "basics",
    price: "9.99"
  },
  {
    title: "Phone Case Clear",
    body_html: "Clear phone case",
    vendor: "",
    product_type: "",
    tags: "",
    price: "7.99"
  },

  // DIGITAL PRODUCTS
  {
    title: "Complete Fitness Masterclass - 12 Week Program",
    body_html: `<p>Transform your body with our comprehensive 12-week fitness program.</p>
    <h3>What You Get:</h3>
    <ul>
      <li>48 Video Workouts</li>
      <li>Nutrition Guide</li>
      <li>Progress Tracker</li>
      <li>Private Community Access</li>
    </ul>
    <p><strong>Instant Digital Access</strong></p>`,
    vendor: "FitLife Digital",
    product_type: "Digital Course",
    tags: "digital, fitness, course, online, workout",
    price: "97.00",
    image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    image_alt: "Fitness Training Program",
    seo_title: "Complete Fitness Masterclass - 12 Week Program",
    seo_description: "48 video workouts, nutrition guide, and private community. Transform your body in 12 weeks."
  }
];

export async function POST(request: NextRequest) {
  // Allow with secret key for testing in production
  const authKey = request.headers.get('x-import-key');
  const expectedKey = process.env.DEV_IMPORT_KEY || 'surfaced-test-import-2025';

  if (authKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized - invalid import key' }, { status: 403 });
  }

  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    const shopData = await getShopData(shopDomain);
    const accessToken = decryptToken(shopData.accessToken);

    logger.info({ shopDomain, productCount: TEST_PRODUCTS.length }, 'Starting test product import');

    const results = {
      success: 0,
      failed: 0,
      products: [] as Array<{ title: string; success: boolean; id?: string; error?: string }>
    };

    for (const product of TEST_PRODUCTS) {
      try {
        // Create product via GraphQL
        const createdProduct = await createProductGraphQL(shopDomain, accessToken, product);

        if (createdProduct) {
          results.success++;
          results.products.push({
            title: product.title,
            success: true,
            id: createdProduct.id
          });
          logger.info({ title: product.title, id: createdProduct.id }, 'Product created via GraphQL');
        } else {
          results.failed++;
          results.products.push({
            title: product.title,
            success: false,
            error: 'No product returned from GraphQL'
          });
        }
      } catch (error) {
        results.failed++;
        results.products.push({
          title: product.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        logger.error({ title: product.title, error: error instanceof Error ? error.message : 'Unknown' }, 'Product creation failed');
      }

      // Rate limiting - wait 300ms between requests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    logger.info({
      shopDomain,
      success: results.success,
      failed: results.failed
    }, 'Test product import completed');

    return NextResponse.json({
      success: true,
      message: `Imported ${results.success} products (${results.failed} failed)`,
      results
    });

  } catch (error) {
    logger.error({ error }, 'Test product import error');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
