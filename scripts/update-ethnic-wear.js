const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function getToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'zecode@siyaram.com',
      password: "S!Y@rAM's"
    });
    const options = {
      hostname: 'zecode-directus.onrender.com',
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.data.access_token);
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function updateProduct(token, id, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'zecode-directus.onrender.com',
      path: '/items/products/' + id,
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json', 
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer ' + token
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const token = await getToken();
  console.log('Updating ethnic wear products to Kurti...\n');
  
  const updates = [
    {
      id: 1,
      name: "Women's Beige Printed Kurti",
      subcategory: 'Kurti',
      slug: 'womens-beige-printed-kurti',
      description: 'Embrace effortless elegance with this stunning beige printed kurti. Featuring beautiful graphic prints on soft, breathable fabric, this ethnic piece combines traditional charm with contemporary style. Perfect for casual outings, festive occasions, or everyday wear, this kurti offers comfort without compromising on fashion. The versatile beige shade pairs beautifully with churidars, palazzos, or jeans for a fusion look. A must-have addition to your ethnic wardrobe.'
    },
    {
      id: 28,
      name: "Women's Cream Embroidered Kurti",
      subcategory: 'Kurti',
      slug: 'womens-cream-embroidered-kurti',
      description: "Exude timeless grace with this beautiful cream embroidered kurti. The intricate bohemian-inspired embroidery work adds a touch of artisanal charm to this elegant ethnic piece. Crafted from premium quality fabric, it ensures all-day comfort while making a sophisticated style statement. Whether you're heading to a casual gathering or a festive celebration, this versatile kurti can be dressed up or down effortlessly. Pair it with ethnic bottoms or jeans for a contemporary fusion look."
    },
    {
      id: 37,
      name: "Women's Hot Pink Floral Kurti Set",
      subcategory: 'Kurti',
      slug: 'womens-hot-pink-floral-kurti-set',
      description: "Make a bold statement with this vibrant hot pink floral kurti set. The stunning floral prints create a refreshing look that's perfect for summer and festive occasions. This coordinated set features a beautifully designed kurti paired with matching trousers for a complete ethnic ensemble. The eye-catching pink hue adds a pop of color to your wardrobe while the comfortable fabric ensures ease of movement. Ideal for brunches, family gatherings, and casual celebrations."
    },
    {
      id: 47,
      name: "Women's Teal Green Tiered Kurti",
      subcategory: 'Kurti',
      slug: 'womens-teal-green-tiered-kurti',
      description: 'Captivate everyone with this gorgeous teal green tiered kurti featuring bohemian-inspired prints. The beautiful tiered silhouette adds a flowing, feminine touch while the rich teal color makes this piece truly stand out. Perfect for those who love ethnic fashion with a modern twist, this kurti combines traditional aesthetics with contemporary design. Whether for office wear or casual outings, this versatile piece transitions seamlessly from day to evening. Pair with leggings or palazzos for a complete look.'
    }
  ];
  
  for (const update of updates) {
    const result = await updateProduct(token, update.id, {
      name: update.name,
      subcategory: update.subcategory,
      slug: update.slug,
      description: update.description
    });
    console.log(`✅ Updated ID ${update.id}: ${update.name}`);
    console.log(`   Slug: ${update.slug}`);
    console.log(`   Subcategory: ${update.subcategory}\n`);
  }
  
  console.log('Done! Updated ' + updates.length + ' products to Kurti category.');
}

main().catch(console.error);
