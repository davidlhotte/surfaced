/**
 * Import Test Products Script
 *
 * This script imports 20 real products from real Shopify brands
 * to test the AI Visibility Audit Engine.
 *
 * Usage: npx ts-node scripts/import-test-products.ts
 */

import { config } from 'dotenv';
config();

const SHOPIFY_STORE = 'locateus-2';
const SHOPIFY_ACCESS_TOKEN = process.env.TEST_SHOPIFY_ACCESS_TOKEN || '';

interface ProductData {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: Array<{
    price: string;
    sku: string;
    inventory_management: string;
    inventory_quantity: number;
  }>;
  images?: Array<{
    src: string;
    alt?: string;
  }>;
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
  seo?: {
    title: string;
    description: string;
  };
}

// ============================================================================
// PRODUCT DATA - 20 Real Products from Real Shopify Brands
// ============================================================================

const TEST_PRODUCTS: ProductData[] = [
  // -------------------------------------------------------------------------
  // CATEGORY 1: FITNESS APPAREL (Gymshark Style) - PERFECT QUALITY
  // -------------------------------------------------------------------------
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
    <p>Whether you're hitting the gym, running, or practicing yoga, these leggings will move with you. The supportive waistband stays in place without digging in, and the four-way stretch fabric allows for unrestricted movement.</p>
    <p><em>Model is 5'7" / 170cm and wears size S</em></p>`,
    vendor: "Gymshark",
    product_type: "Leggings",
    tags: ["womens", "leggings", "seamless", "activewear", "gym", "fitness", "black", "high-waist", "squat-proof", "bestseller"],
    variants: [{
      price: "62.00",
      sku: "GS-APEX-LEG-BLK-001",
      inventory_management: "shopify",
      inventory_quantity: 150
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800", alt: "Apex Seamless Leggings Black - Front View" },
      { src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800", alt: "Apex Seamless Leggings Black - Side View" },
      { src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800", alt: "Apex Seamless Leggings Black - Workout Action" }
    ],
    seo: {
      title: "Apex Seamless Leggings Black | High-Waist Gym Leggings | Gymshark",
      description: "Shop the Apex Seamless Leggings in Black. Squat-proof, moisture-wicking, and designed for maximum performance. Free shipping on orders over $75."
    }
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
    tags: ["mens", "t-shirt", "training", "gym", "fitness", "navy", "cotton", "breathable"],
    variants: [{
      price: "30.00",
      sku: "GS-PWR-TEE-NVY-001",
      inventory_management: "shopify",
      inventory_quantity: 200
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800", alt: "Power T-Shirt Navy Blue - Front" },
      { src: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800", alt: "Power T-Shirt Navy Blue - Model" }
    ],
    seo: {
      title: "Power T-Shirt Navy Blue | Men's Gym Tee | Gymshark",
      description: "The Power T-Shirt in Navy Blue. Breathable, comfortable, and built for performance. Shop now with free returns."
    }
  },

  // -------------------------------------------------------------------------
  // CATEGORY 2: FASHION (Fashion Nova Style) - GOOD QUALITY
  // -------------------------------------------------------------------------
  {
    title: "Classic High Waist Skinny Jeans - Dark Wash",
    body_html: `<p>Our best-selling Classic High Waist Skinny Jeans in a timeless dark wash. These jeans feature a figure-hugging fit that flatters every body type.</p>
    <ul>
      <li>High-rise waist for a sleek silhouette</li>
      <li>Super stretch denim for all-day comfort</li>
      <li>Classic 5-pocket styling</li>
      <li>Zip fly with button closure</li>
    </ul>
    <p>98% Cotton, 2% Spandex. Machine wash cold.</p>`,
    vendor: "Fashion Nova",
    product_type: "Jeans",
    tags: ["womens", "jeans", "skinny", "high-waist", "denim", "dark-wash", "stretch"],
    variants: [{
      price: "24.99",
      sku: "FN-HW-SKN-DRK-001",
      inventory_management: "shopify",
      inventory_quantity: 300
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800", alt: "High Waist Skinny Jeans Dark Wash" }
    ],
    seo: {
      title: "Classic High Waist Skinny Jeans | Fashion Nova",
      description: "Shop the Classic High Waist Skinny Jeans. Super stretch denim for the perfect fit."
    }
  },

  // -------------------------------------------------------------------------
  // CATEGORY 3: SOCKS (Bombas) - PERFECT QUALITY
  // -------------------------------------------------------------------------
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
    <p>For every pair purchased, we donate a pair to someone in need. Over 100 million items donated to date.</p>
    <p>Material: 51% Merino Wool, 45% Polyester, 3% Spandex, 1% Nylon</p>`,
    vendor: "Bombas",
    product_type: "Socks",
    tags: ["mens", "socks", "merino-wool", "ankle", "premium", "gift", "sustainable", "give-back", "charcoal"],
    variants: [{
      price: "17.00",
      sku: "BMB-MRN-ANK-CHR-001",
      inventory_management: "shopify",
      inventory_quantity: 500
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800", alt: "Bombas Merino Wool Ankle Socks Charcoal - Pair" },
      { src: "https://images.unsplash.com/photo-1556306535-38febf6782e7?w=800", alt: "Bombas Merino Wool Socks - Detail" },
      { src: "https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800", alt: "Bombas Socks on feet" }
    ],
    seo: {
      title: "Men's Merino Wool Ankle Socks | Bombas - Buy One, Give One",
      description: "Premium Merino Wool ankle socks with Honeycomb arch support. Temperature regulating, moisture-wicking, odor resistant. For every pair you buy, we donate a pair."
    },
    metafields: [
      { namespace: "custom", key: "material_composition", value: "51% Merino Wool, 45% Polyester, 3% Spandex, 1% Nylon", type: "single_line_text_field" },
      { namespace: "custom", key: "sustainability", value: "1 pair donated for every pair purchased", type: "single_line_text_field" }
    ]
  },

  // -------------------------------------------------------------------------
  // CATEGORY 4: FOOTWEAR (Allbirds) - PERFECT QUALITY
  // -------------------------------------------------------------------------
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
    <p>Weight: 292g (10.3 oz) per shoe. Available in 17 colors.</p>
    <p><em>"The perfect blend of activity and lifestyle" — ideal for runs up to 10K, gym sessions, and everyday wear.</em></p>`,
    vendor: "Allbirds",
    product_type: "Running Shoes",
    tags: ["unisex", "running", "shoes", "sustainable", "tree-fiber", "carbon-neutral", "eco-friendly", "performance", "black"],
    variants: [{
      price: "135.00",
      sku: "AB-TDASH2-BLK-001",
      inventory_management: "shopify",
      inventory_quantity: 75
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", alt: "Allbirds Tree Dasher 2 Running Shoes Black - Side View" },
      { src: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800", alt: "Allbirds Tree Dasher 2 - Top View" },
      { src: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800", alt: "Allbirds Tree Dasher 2 - Running Action" }
    ],
    seo: {
      title: "Tree Dasher 2 Running Shoes | Sustainable Performance Footwear | Allbirds",
      description: "The Tree Dasher 2 — certified carbon neutral running shoes made from eucalyptus tree fiber. 7mm drop, SweetFoam cushioning, and machine washable. Free shipping & returns."
    },
    metafields: [
      { namespace: "custom", key: "carbon_footprint", value: "10.7 kg CO2e (100% offset)", type: "single_line_text_field" },
      { namespace: "custom", key: "heel_drop", value: "7mm", type: "single_line_text_field" },
      { namespace: "custom", key: "weight", value: "292g per shoe", type: "single_line_text_field" }
    ]
  },
  {
    title: "Wool Runner Mizzle - Natural Grey",
    body_html: `<p>The Wool Runner Mizzle takes our classic Wool Runner and adds water-repellent protection for unpredictable weather. ZQ Merino wool upper with a bio-based water-repellent shield keeps your feet dry and comfortable.</p>
    <h3>Features:</h3>
    <ul>
      <li><strong>Water-Repellent:</strong> Bio-based shield protects against light rain</li>
      <li><strong>ZQ Merino Wool:</strong> Ethically sourced, temperature regulating</li>
      <li><strong>SweetFoam™ Sole:</strong> Sugarcane-based comfort</li>
      <li><strong>Machine Washable:</strong> Easy care</li>
    </ul>
    <p>Perfect for commuting, travel, and everyday adventures in any weather.</p>`,
    vendor: "Allbirds",
    product_type: "Casual Shoes",
    tags: ["unisex", "casual", "shoes", "sustainable", "wool", "water-repellent", "grey", "eco-friendly"],
    variants: [{
      price: "115.00",
      sku: "AB-WRMZL-GRY-001",
      inventory_management: "shopify",
      inventory_quantity: 60
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800", alt: "Allbirds Wool Runner Mizzle Grey" },
      { src: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800", alt: "Allbirds Wool Runner Mizzle - Lifestyle" }
    ],
    seo: {
      title: "Wool Runner Mizzle | Water-Repellent Wool Shoes | Allbirds",
      description: "The Wool Runner Mizzle - water-repellent wool shoes for all-weather comfort. Made with ZQ Merino wool and SweetFoam cushioning."
    }
  },

  // -------------------------------------------------------------------------
  // CATEGORY 5: BEAUTY (Kylie Cosmetics) - PERFECT QUALITY
  // -------------------------------------------------------------------------
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
      <li><strong>Highly Pigmented:</strong> Full coverage in one swipe</li>
    </ul>
    <h3>Shade: Dolce K</h3>
    <p>A warm, deep beige nude that flatters all skin tones. One of our most iconic and best-selling shades.</p>
    <p><em>Cruelty-free. Vegan-friendly.</em></p>`,
    vendor: "Kylie Cosmetics",
    product_type: "Lip Kit",
    tags: ["beauty", "makeup", "lips", "matte", "lipstick", "liner", "kylie", "dolce-k", "nude", "bestseller", "vegan", "cruelty-free"],
    variants: [{
      price: "35.00",
      sku: "KC-MLK-DOLCEK-001",
      inventory_management: "shopify",
      inventory_quantity: 250
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800", alt: "Kylie Cosmetics Matte Lip Kit Dolce K" },
      { src: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800", alt: "Matte Lip Kit Application" },
      { src: "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=800", alt: "Lip Kit Swatches" }
    ],
    seo: {
      title: "Matte Lip Kit - Dolce K | Kylie Cosmetics by Kylie Jenner",
      description: "Shop the iconic Matte Lip Kit in Dolce K. Includes matte liquid lipstick & matching lip liner. 8+ hour wear, smudge-proof, transfer-proof. Free shipping on orders $40+."
    },
    metafields: [
      { namespace: "custom", key: "finish", value: "Matte", type: "single_line_text_field" },
      { namespace: "custom", key: "wear_time", value: "8+ hours", type: "single_line_text_field" }
    ]
  },
  {
    title: "Kyliner Gel Pencil - Black",
    body_html: `<p>Define your eyes with the Kyliner Gel Pencil. This ultra-creamy formula glides on smoothly for precise, buildable color that lasts all day.</p>
    <ul>
      <li>Waterproof formula</li>
      <li>Smudge-proof wear</li>
      <li>Built-in sharpener</li>
      <li>Long-lasting 12-hour wear</li>
    </ul>
    <p>Perfect for creating everything from subtle definition to bold, dramatic looks.</p>`,
    vendor: "Kylie Cosmetics",
    product_type: "Eye Liner",
    tags: ["beauty", "makeup", "eyes", "eyeliner", "gel", "black", "waterproof"],
    variants: [{
      price: "19.00",
      sku: "KC-KYL-GEL-BLK-001",
      inventory_management: "shopify",
      inventory_quantity: 180
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1617220379175-68eb0d35c583?w=800", alt: "Kyliner Gel Pencil Black" }
    ],
    seo: {
      title: "Kyliner Gel Pencil Black | Kylie Cosmetics",
      description: "Waterproof gel eyeliner pencil with 12-hour wear. Smudge-proof and buildable."
    }
  },

  // -------------------------------------------------------------------------
  // CATEGORY 6: MEN'S GROOMING (Beardbrand) - PERFECT QUALITY
  // -------------------------------------------------------------------------
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
    <p>A woodsy, outdoorsy fragrance with notes of eucalyptus, pine, and cedar. Like a walk through a Pacific Northwest forest.</p>
    <h3>Benefits:</h3>
    <ul>
      <li>Eliminates beard itch and beardruff</li>
      <li>Softens and conditions beard hair</li>
      <li>Non-comedogenic (won't clog pores)</li>
      <li>Safe for sensitive skin</li>
    </ul>
    <p>Size: 1.7 fl oz / 50ml. Apply 3-5 drops daily to beard and skin.</p>`,
    vendor: "Beardbrand",
    product_type: "Beard Oil",
    tags: ["mens", "grooming", "beard", "oil", "natural", "tree-ranger", "conditioning", "skin-care"],
    variants: [{
      price: "25.00",
      sku: "BB-UTIL-OIL-TR-001",
      inventory_management: "shopify",
      inventory_quantity: 120
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800", alt: "Beardbrand Utility Beard Oil Tree Ranger" },
      { src: "https://images.unsplash.com/photo-1621607505837-6c5d3f1f5c97?w=800", alt: "Beard Oil Application" }
    ],
    seo: {
      title: "Utility Beard Oil - Tree Ranger | Beardbrand",
      description: "Premium beard oil with natural oils to condition, soften, and eliminate beard itch. Tree Ranger scent with eucalyptus and cedar notes."
    }
  },
  {
    title: "Utility Balm - Old Money",
    body_html: `<p>The beard balm that does more. Made with 3X more natural butters than standard balms for superior moisturizing power.</p>
    <h3>Features:</h3>
    <ul>
      <li>Shea, mango, and cocoa butters</li>
      <li>Tames flyaways and adds control</li>
      <li>Conditions and moisturizes</li>
      <li>Light hold, natural finish</li>
    </ul>
    <h3>Scent: Old Money</h3>
    <p>Distinguished notes of leather, sandalwood, and amber for a sophisticated, classic fragrance.</p>
    <p>Size: 4.2 oz</p>`,
    vendor: "Beardbrand",
    product_type: "Beard Balm",
    tags: ["mens", "grooming", "beard", "balm", "natural", "old-money", "styling"],
    variants: [{
      price: "32.00",
      sku: "BB-UTIL-BLM-OM-001",
      inventory_management: "shopify",
      inventory_quantity: 90
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800", alt: "Beardbrand Utility Balm Old Money" }
    ],
    seo: {
      title: "Utility Balm Old Money | Beardbrand",
      description: "Premium beard balm with 3X natural butters. Conditions, tames flyaways, and styles with a sophisticated scent."
    }
  },

  // -------------------------------------------------------------------------
  // CATEGORY 7: HOME (Brooklinen) - PERFECT QUALITY
  // -------------------------------------------------------------------------
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
    <h3>Care:</h3>
    <p>Machine wash cold, tumble dry low. OEKO-TEX certified. Made ethically in Portugal.</p>
    <p><em>100-Night Trial | Free Shipping | Easy Returns</em></p>`,
    vendor: "Brooklinen",
    product_type: "Sheet Set",
    tags: ["home", "bedding", "sheets", "percale", "cotton", "white", "queen", "hotel-quality", "breathable"],
    variants: [{
      price: "149.00",
      sku: "BL-CLS-CORE-WHT-Q-001",
      inventory_management: "shopify",
      inventory_quantity: 80
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800", alt: "Brooklinen Classic Core Sheet Set White" },
      { src: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800", alt: "White Sheets on Bed" },
      { src: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800", alt: "Bedroom with White Bedding" }
    ],
    seo: {
      title: "Classic Core Sheet Set White Queen | 100% Cotton Percale | Brooklinen",
      description: "Hotel-quality percale sheets in 100% long-staple cotton. Crisp, cool, and breathable. 100-night trial, free shipping & returns. OEKO-TEX certified."
    },
    metafields: [
      { namespace: "custom", key: "thread_count", value: "270", type: "single_line_text_field" },
      { namespace: "custom", key: "material", value: "100% Long-Staple Cotton", type: "single_line_text_field" },
      { namespace: "custom", key: "weave", value: "Percale", type: "single_line_text_field" }
    ]
  },
  {
    title: "Luxe Pillowcase Set - Cream",
    body_html: `<p>Upgrade your sleep with our Luxe Pillowcase Set. Silky-smooth sateen weave with a 480 thread count for that 5-star hotel feeling every night.</p>
    <ul>
      <li>Set of 2 Standard Pillowcases</li>
      <li>100% Long-Staple Cotton</li>
      <li>480 Thread Count Sateen</li>
      <li>Envelope closure keeps pillows secure</li>
    </ul>
    <p>OEKO-TEX certified. Machine washable.</p>`,
    vendor: "Brooklinen",
    product_type: "Pillowcases",
    tags: ["home", "bedding", "pillowcase", "sateen", "cotton", "cream", "luxe"],
    variants: [{
      price: "59.00",
      sku: "BL-LUX-PC-CRM-001",
      inventory_management: "shopify",
      inventory_quantity: 100
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800", alt: "Brooklinen Luxe Pillowcases Cream" }
    ],
    seo: {
      title: "Luxe Pillowcase Set Cream | Brooklinen",
      description: "Silky 480 thread count sateen pillowcases. Set of 2, 100% cotton, OEKO-TEX certified."
    }
  },

  // -------------------------------------------------------------------------
  // CATEGORY 8: FOOD & BEVERAGE (Death Wish Coffee) - PERFECT QUALITY
  // -------------------------------------------------------------------------
  {
    title: "Death Wish Coffee Ground - Dark Roast 1lb",
    body_html: `<p><strong>THE WORLD'S STRONGEST COFFEE</strong></p>
    <p>Wake up and conquer your day with Death Wish Coffee — the bold, smooth coffee that packs twice the caffeine of average coffee. Perfect for those who need an extra kick to start their morning or power through late nights.</p>
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
      <li>No Synthetic Fertilizers or Pesticides</li>
    </ul>
    <h3>Brewing:</h3>
    <p>For best results, use 2.5 tablespoons per 6 oz of water. Works with drip, pour-over, French press, and cold brew.</p>
    <p>Size: 1 lb (16 oz) bag. Makes approximately 72 cups.</p>
    <p><em>Warning: Not for the faint of heart. This is serious coffee for serious coffee lovers.</em></p>`,
    vendor: "Death Wish Coffee",
    product_type: "Coffee",
    tags: ["food", "coffee", "ground", "dark-roast", "organic", "fair-trade", "high-caffeine", "strong"],
    variants: [{
      price: "19.99",
      sku: "DWC-GRD-DRK-1LB-001",
      inventory_management: "shopify",
      inventory_quantity: 200
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800", alt: "Death Wish Coffee Ground Dark Roast Bag" },
      { src: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800", alt: "Coffee Being Poured" },
      { src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", alt: "Coffee Cup with Steam" }
    ],
    seo: {
      title: "Death Wish Coffee Ground Dark Roast 1lb | World's Strongest Coffee | Organic & Fair Trade",
      description: "The world's strongest coffee with 2X the caffeine. USDA Organic & Fair Trade certified. Smooth, bold, and never bitter. Free shipping on orders $35+."
    },
    metafields: [
      { namespace: "custom", key: "caffeine_level", value: "2X Average Coffee", type: "single_line_text_field" },
      { namespace: "custom", key: "certifications", value: "USDA Organic, Fair Trade", type: "single_line_text_field" },
      { namespace: "custom", key: "servings", value: "~72 cups per bag", type: "single_line_text_field" }
    ]
  },
  {
    title: "Death Cups K-Pods - 10 Count",
    body_html: `<p>The world's strongest coffee, now in convenient single-serve pods. Compatible with Keurig and most single-serve brewers.</p>
    <ul>
      <li>10 pods per box</li>
      <li>Same bold flavor as our ground coffee</li>
      <li>USDA Organic & Fair Trade</li>
      <li>Recyclable pods</li>
    </ul>
    <p>Perfect for the office or when you need a quick, powerful cup.</p>`,
    vendor: "Death Wish Coffee",
    product_type: "Coffee Pods",
    tags: ["food", "coffee", "k-cups", "pods", "organic", "fair-trade", "convenient"],
    variants: [{
      price: "16.99",
      sku: "DWC-KCUP-10-001",
      inventory_management: "shopify",
      inventory_quantity: 150
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800", alt: "Death Wish Coffee K-Cups" }
    ],
    seo: {
      title: "Death Cups K-Pods 10 Count | Death Wish Coffee",
      description: "World's strongest coffee in convenient K-Cup pods. Organic, Fair Trade, and Keurig compatible."
    }
  },

  // -------------------------------------------------------------------------
  // CATEGORY 9: ACCESSORIES (MVMT, Pura Vida) - MIXED QUALITY
  // -------------------------------------------------------------------------
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
    <h3>Features:</h3>
    <ul>
      <li>Unibody case construction</li>
      <li>Sapphire-coated crystal (scratch resistant)</li>
      <li>Interchangeable straps</li>
    </ul>
    <p><em>2-Year Warranty | Free Shipping over $75 | Easy Returns</em></p>`,
    vendor: "MVMT",
    product_type: "Watch",
    tags: ["accessories", "watch", "mens", "minimalist", "leather", "gunmetal", "classic", "affordable-luxury"],
    variants: [{
      price: "158.00",
      sku: "MVMT-CLS2-GMS-001",
      inventory_management: "shopify",
      inventory_quantity: 45
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800", alt: "MVMT Classic II Watch Gunmetal Sandstone" },
      { src: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800", alt: "MVMT Watch on Wrist" },
      { src: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800", alt: "Watch Detail Shot" }
    ],
    seo: {
      title: "Classic II Watch Gunmetal/Sandstone | MVMT Watches",
      description: "The MVMT Classic II watch with 42mm gunmetal case and Italian leather strap. Minimalist design, Japanese movement, 2-year warranty. Free shipping over $75."
    },
    metafields: [
      { namespace: "custom", key: "case_size", value: "42mm", type: "single_line_text_field" },
      { namespace: "custom", key: "movement", value: "Japanese Miyota Quartz", type: "single_line_text_field" },
      { namespace: "custom", key: "water_resistance", value: "3 ATM", type: "single_line_text_field" }
    ]
  },
  {
    title: "Original Bracelet - Pacific Blue",
    body_html: `<p>The original Pura Vida bracelet that started it all. Hand-crafted by artisans in Costa Rica, each bracelet is unique and supports local communities.</p>
    <ul>
      <li>100% waterproof wax-coated thread</li>
      <li>Adjustable from 2-5 inches</li>
      <li>Iron-coated copper charm</li>
    </ul>
    <p>Stack them, share them, live the Pura Vida lifestyle.</p>`,
    vendor: "Pura Vida",
    product_type: "Bracelet",
    tags: ["accessories", "bracelet", "handmade", "artisan", "blue", "waterproof", "stackable"],
    variants: [{
      price: "6.00",
      sku: "PV-ORIG-PACBLU-001",
      inventory_management: "shopify",
      inventory_quantity: 500
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800", alt: "Pura Vida Original Bracelet Pacific Blue" }
    ]
  },

  // -------------------------------------------------------------------------
  // CATEGORY 10: POOR QUALITY PRODUCTS (For Testing Low Scores)
  // -------------------------------------------------------------------------
  {
    title: "Basic Cotton T-Shirt White",
    body_html: "<p>White t-shirt. Cotton. Unisex.</p>",
    vendor: "Generic",
    product_type: "T-Shirt",
    tags: ["basics"],
    variants: [{
      price: "9.99",
      sku: "GEN-TEE-WHT-001",
      inventory_management: "shopify",
      inventory_quantity: 1000
    }]
  },
  {
    title: "Phone Case Clear",
    body_html: "Clear phone case",
    vendor: "",
    product_type: "",
    tags: [],
    variants: [{
      price: "7.99",
      sku: "GEN-CASE-CLR-001",
      inventory_management: "shopify",
      inventory_quantity: 500
    }]
  },

  // -------------------------------------------------------------------------
  // CATEGORY 11: DIGITAL PRODUCTS
  // -------------------------------------------------------------------------
  {
    title: "Complete Fitness Masterclass - 12 Week Program",
    body_html: `<p>Transform your body and mind with our comprehensive 12-week fitness program. Whether you're a beginner or advanced athlete, this program adapts to your level.</p>
    <h3>What You Get:</h3>
    <ul>
      <li><strong>48 Video Workouts:</strong> 4 sessions per week, 30-45 minutes each</li>
      <li><strong>Nutrition Guide:</strong> Meal plans and macro calculations</li>
      <li><strong>Progress Tracker:</strong> Log workouts and track improvements</li>
      <li><strong>Private Community:</strong> Access to our members-only Facebook group</li>
      <li><strong>Weekly Check-ins:</strong> Q&A sessions with certified trainers</li>
    </ul>
    <h3>Program Structure:</h3>
    <ul>
      <li>Weeks 1-4: Foundation Building</li>
      <li>Weeks 5-8: Strength Development</li>
      <li>Weeks 9-12: Peak Performance</li>
    </ul>
    <p><strong>Instant Access:</strong> Start today! All content delivered digitally.</p>
    <p><em>No equipment? No problem. Home and gym versions included.</em></p>`,
    vendor: "FitLife Digital",
    product_type: "Digital Course",
    tags: ["digital", "fitness", "course", "online", "workout", "training", "12-week", "video"],
    variants: [{
      price: "97.00",
      sku: "FLD-FIT-12WK-001",
      inventory_management: "shopify",
      inventory_quantity: 999
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800", alt: "Fitness Training Program" },
      { src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800", alt: "Workout Session" }
    ],
    seo: {
      title: "Complete Fitness Masterclass - 12 Week Transformation Program",
      description: "48 video workouts, nutrition guide, progress tracker, and private community. Transform your body in 12 weeks. Instant digital access."
    }
  },
  {
    title: "Business Strategy Consultation - 60 Minutes",
    body_html: `<p>One-on-one strategic consultation with an experienced business advisor. Get personalized guidance for your business challenges.</p>
    <h3>What's Covered:</h3>
    <ul>
      <li>Business model analysis</li>
      <li>Growth strategy development</li>
      <li>Market positioning advice</li>
      <li>Action plan creation</li>
    </ul>
    <h3>How It Works:</h3>
    <ol>
      <li>Book your session</li>
      <li>Complete intake questionnaire</li>
      <li>60-minute video call</li>
      <li>Receive summary notes & action items</li>
    </ol>
    <p>Sessions conducted via Zoom. Recording provided.</p>`,
    vendor: "Strategic Advisors",
    product_type: "Consulting",
    tags: ["service", "consulting", "business", "strategy", "1-on-1", "professional"],
    variants: [{
      price: "150.00",
      sku: "SA-CONS-60-001",
      inventory_management: "shopify",
      inventory_quantity: 999
    }],
    images: [
      { src: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800", alt: "Business Consultation Session" }
    ],
    seo: {
      title: "Business Strategy Consultation - 60 Minute Session",
      description: "Personalized business strategy session with an experienced advisor. Get actionable insights and a clear growth plan."
    }
  }
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function createProduct(product: ProductData): Promise<{ success: boolean; id?: string; error?: string }> {
  const url = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-10/products.json`;

  const productPayload: Record<string, unknown> = {
    product: {
      title: product.title,
      body_html: product.body_html,
      vendor: product.vendor,
      product_type: product.product_type,
      tags: product.tags.join(', '),
      variants: product.variants,
      images: product.images?.map(img => ({
        src: img.src,
        alt: img.alt || ''
      })),
      metafields_global_title_tag: product.seo?.title,
      metafields_global_description_tag: product.seo?.description,
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify(productPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, id: data.product.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('SURFACED - Test Product Import Script');
  console.log('='.repeat(60));
  console.log(`Store: ${SHOPIFY_STORE}.myshopify.com`);
  console.log(`Products to import: ${TEST_PRODUCTS.length}`);
  console.log('='.repeat(60));

  if (!SHOPIFY_ACCESS_TOKEN) {
    console.error('\n[ERROR] No access token found!');
    console.log('\nTo run this script, you need a Shopify access token.');
    console.log('Add TEST_SHOPIFY_ACCESS_TOKEN to your .env file or');
    console.log('run: export TEST_SHOPIFY_ACCESS_TOKEN=your_token_here\n');
    process.exit(1);
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < TEST_PRODUCTS.length; i++) {
    const product = TEST_PRODUCTS[i];
    console.log(`\n[${i + 1}/${TEST_PRODUCTS.length}] Creating: ${product.title}`);

    const result = await createProduct(product);

    if (result.success) {
      console.log(`   ✅ Success! Product ID: ${result.id}`);
      results.success++;
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      results.failed++;
      results.errors.push(`${product.title}: ${result.error}`);
    }

    // Rate limiting - wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('\n📊 Next step: Go to Surfaced dashboard and click "Run Audit"');
  console.log(`   https://admin.shopify.com/store/${SHOPIFY_STORE}/apps/surfaced/admin\n`);
}

// Run the script
main().catch(console.error);
