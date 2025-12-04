/**
 * Reclassify Ethnic Fusion Products
 */

const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

// Products identified as ethnic/fusion based on image filenames and metadata
const ethnicProducts = [
  { id: 59, name: "Girl's Pink Ethnic Kurta Set", subcategory: "Kurta", description: "Dress your little one in elegance with this beautiful pink ethnic kurta set. Perfect for festive occasions, family gatherings, and cultural celebrations, this traditional outfit combines comfort with authentic Indian craftsmanship. The soft fabric ensures all-day comfort while the vibrant pink hue adds a cheerful touch. The intricate design reflects traditional aesthetics, making it ideal for weddings, pujas, and special events. A must-have addition to your child's ethnic wardrobe that celebrates Indian heritage with style." },
  { id: 60, name: "Girl's Pink Ethnic Palazzo Pants", subcategory: "Palazzo", description: "Complete the ethnic look with these comfortable pink palazzo pants designed for young girls. These flowy bottoms pair perfectly with kurtas and tunics for a complete traditional ensemble. The soft, breathable fabric ensures comfort during long celebrations and festive events. The elegant silhouette adds grace to every movement while the vibrant color brings joy to any occasion. Perfect for festivals, family functions, and cultural celebrations where style meets comfort." },
  { id: 28, name: "Women's Cream Bohemian Embroidered Tunic", subcategory: "Ethnic Tunic", description: "Embrace bohemian elegance with this stunning cream embroidered tunic that bridges ethnic tradition with contemporary style. The intricate embroidery work showcases artisanal craftsmanship while the relaxed silhouette offers effortless comfort. Perfect for casual outings, beach days, or as a versatile layering piece. The neutral cream tone pairs beautifully with jeans, leggings, or palazzo pants. A fusion piece that celebrates global influences while maintaining timeless appeal for the modern woman." },
  { id: 37, name: "Women's Hot Pink Floral Tunic Set", subcategory: "Tunic Set", description: "Make a vibrant statement with this stunning hot pink floral tunic and trouser set. This fusion ensemble combines traditional Indian aesthetics with contemporary styling for a look that is both festive and fashionable. The bold floral print adds a cheerful touch while the comfortable fit ensures all-day wearability. Perfect for mehendi ceremonies, family gatherings, casual festivities, or when you want to stand out with ethnic flair. Complete the look with juttis and statement jewelry." },
  { id: 47, name: "Women's Teal Bohemian Tiered Midi Dress", subcategory: "Ethnic Dress", description: "Channel bohemian spirit with this gorgeous teal tiered midi dress that blends ethnic charm with modern sensibility. The flowing tiers create beautiful movement while the rich teal color makes a sophisticated statement. Perfect for resort wear, cultural events, or as an elevated everyday piece. The relaxed fit flatters every figure while the bohemian details add artistic flair. A versatile fusion piece that transitions seamlessly from brunch to evening gatherings with effortless elegance." },
  { id: 1, name: "Women's Beige Ethnic Print Tunic", subcategory: "Ethnic Tunic", description: "Elevate your ethnic wardrobe with this elegant beige tunic featuring beautiful graphic prints. The relaxed silhouette offers comfort while the sophisticated design adds polish to any occasion. Perfect for pairing with leggings, churidars, or palazzo pants for a complete fusion look. The neutral beige tone makes it versatile for both casual outings and semi-formal gatherings. A timeless piece that celebrates Indian aesthetics with contemporary styling for the modern woman who appreciates tradition." }
];

async function updateEthnicProducts() {
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  const token = (await authRes.json()).data.access_token;

  for (const product of ethnicProducts) {
    const slug = product.name.toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    console.log('Updating product', product.id, 'to Ethnic Fusion:', product.name);

    const res = await fetch(`${DIRECTUS_URL}/items/products/${product.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: product.name,
        slug: slug,
        category: 'Ethnic Fusion',
        subcategory: product.subcategory,
        description: product.description
      })
    });

    if (res.ok) {
      console.log('  ✓ Updated successfully');
    } else {
      console.error('  ✗ Failed:', await res.text());
    }
  }

  console.log('\nDone! Updated', ethnicProducts.length, 'products to Ethnic Fusion category');
}

updateEthnicProducts().catch(console.error);
