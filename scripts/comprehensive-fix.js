/**
 * COMPREHENSIVE PRODUCT DATA FIX
 * 
 * This script fixes ALL product data by parsing the actual image filenames
 * which contain the true product information.
 * 
 * Image filename format: [model]_[gender]_[color]_[type]_[pattern]_[camera_info].png
 * Example: model3_male_dark_green_button_up_shirt_graphic__DSC3800_Large_9.png
 *        = Male, Dark Green, Button Up Shirt, Graphic pattern
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

// Color words that can appear in filenames
const COLORS = [
  'black', 'white', 'beige', 'cream', 'brown', 'caramel', 'tan', 'khaki', 'olive',
  'grey', 'gray', 'charcoal', 'navy', 'blue', 'light blue', 'dark blue', 'teal', 'aqua',
  'green', 'dark green', 'light green', 'sage', 'mint', 'lime', 'olive green',
  'red', 'maroon', 'burgundy', 'wine', 'coral', 'pink', 'hot pink', 'dusty rose',
  'orange', 'peach', 'yellow', 'gold', 'mustard', 'purple', 'lavender', 'violet',
  'off-white', 'off white', 'ivory', 'taupe', 'washed'
];

// Product types
const PRODUCT_TYPES = {
  't_shirt': 'T-Shirt', 't-shirt': 'T-Shirt', 'tshirt': 'T-Shirt',
  'shirt': 'Shirt', 'button_up_shirt': 'Button-Up Shirt', 'button-up': 'Button-Up Shirt',
  'polo_shirt': 'Polo Shirt', 'polo': 'Polo Shirt',
  'short_sleeve_shirt': 'Short Sleeve Shirt', 'short_sleeved_shirt': 'Short Sleeve Shirt',
  'dress': 'Dress', 'midi_dress': 'Midi Dress', 'mini_dress': 'Mini Dress', 'maxi_dress': 'Maxi Dress',
  'slip_dress': 'Slip Dress',
  'hoodie': 'Hoodie', 'sweatshirt': 'Sweatshirt', 'sweater': 'Sweater',
  'jacket': 'Jacket', 'varsity_jacket': 'Varsity Jacket', 'denim_jacket': 'Denim Jacket',
  'jeans': 'Jeans', 'pants': 'Pants', 'trousers': 'Trousers', 'cargo_pants': 'Cargo Pants',
  'shorts': 'Shorts', 'sweatpants': 'Sweatpants',
  'skirt': 'Skirt', 'midi_skirt': 'Midi Skirt', 'mini_skirt': 'Mini Skirt',
  'blouse': 'Blouse', 'top': 'Top', 'tank': 'Tank Top', 'tank_top': 'Tank Top',
  'tunic': 'Tunic', 'kurta': 'Kurta',
  'jumpsuit': 'Jumpsuit', 'jumpsuits': 'Jumpsuit',
  'tracksuit': 'Tracksuit', 'track': 'Track Pants',
  'flats': 'Flats', 'heels': 'Heels', 'mules': 'Mules', 'sneakers': 'Sneakers',
  'backpack': 'Backpack', 'bag': 'Bag', 'visor': 'Visor',
  'vest': 'Vest', 'outerwear': 'Outerwear'
};

// Patterns
const PATTERNS = {
  'graphic': 'Graphic Print', 'graphic_print': 'Graphic Print',
  'striped': 'Striped', 'stripes': 'Striped',
  'floral': 'Floral Print', 'floral_print': 'Floral Print',
  'speckled': 'Speckled',
  'embroidered': 'Embroidered',
  'textured': 'Textured',
  'ribbed': 'Ribbed',
  'tie-dye': 'Tie-Dye', 'tie_dye': 'Tie-Dye'
};

// Styles
const STYLES = {
  'casual': 'Casual', 'streetwear': 'Streetwear', 'athleisure': 'Athleisure',
  'bohemian': 'Bohemian', 'boho': 'Bohemian', 'vintage': 'Vintage',
  'minimalist': 'Minimalist', 'elegant': 'Elegant'
};

function parseImageFilename(filename) {
  if (!filename) return null;
  
  // Remove path and extension
  const name = filename.split('/').pop().replace(/\.(png|jpg|jpeg)$/i, '');
  
  // Remove model prefix and camera info
  let cleaned = name
    .replace(/^model\d*_/, '')  // Remove model1_, model2_, etc.
    .replace(/_+/g, '_')         // Normalize underscores
    .replace(/_\d+$/, '')        // Remove trailing numbers
    .replace(/_Large$/, '')      // Remove _Large
    .replace(/__.*$/, '')        // Remove camera info after __
    .replace(/_DSC\d+.*$/, '')   // Remove DSC camera codes
    .replace(/_SONY.*$/i, '')    // Remove SONY camera info
    .replace(/_file_.*$/i, '')   // Remove file_ suffix
    .toLowerCase();
  
  const parts = cleaned.split('_');
  
  // Detect gender
  let gender = 'Unisex';
  let genderCategory = 'Women';
  if (parts.includes('male')) {
    gender = 'Male';
    genderCategory = 'Men';
  } else if (parts.includes('female')) {
    gender = 'Female';
    genderCategory = 'Women';
  } else if (parts.includes('boy')) {
    gender = 'Boy';
    genderCategory = 'Kids';
  } else if (parts.includes('girl')) {
    gender = 'Girl';
    genderCategory = 'Kids';
  }
  
  // Remove gender from parts for further parsing
  const nonGenderParts = parts.filter(p => !['male', 'female', 'boy', 'girl'].includes(p));
  const joined = nonGenderParts.join('_');
  const joinedSpace = nonGenderParts.join(' ');
  
  // Detect color (can be multi-word like "dark green")
  let color = '';
  for (const c of COLORS.sort((a, b) => b.length - a.length)) { // Longest first
    const cUnderscore = c.replace(/ /g, '_');
    if (joined.includes(cUnderscore) || joined.includes(c.replace(/ /g, ''))) {
      color = c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }
  
  // Detect product type
  let productType = '';
  let subcategory = '';
  for (const [key, value] of Object.entries(PRODUCT_TYPES).sort((a, b) => b[0].length - a[0].length)) {
    if (joined.includes(key)) {
      productType = value;
      subcategory = value;
      break;
    }
  }
  
  // Detect pattern
  let pattern = '';
  for (const [key, value] of Object.entries(PATTERNS)) {
    if (joined.includes(key)) {
      pattern = value;
      break;
    }
  }
  
  // Detect style
  let style = 'Casual'; // Default
  for (const [key, value] of Object.entries(STYLES)) {
    if (joined.includes(key)) {
      style = value;
      break;
    }
  }
  
  return {
    gender,
    genderCategory,
    color: color || 'Classic',
    productType: productType || 'Apparel',
    subcategory: subcategory || 'Apparel',
    pattern,
    style,
    rawParts: nonGenderParts
  };
}

function generateProductName(parsed, genderCategory) {
  const genderPrefix = genderCategory === 'Kids' 
    ? (parsed.gender === 'Girl' ? "Girl's" : "Boy's")
    : (parsed.gender === 'Female' ? "Women's" : "Men's");
  
  let name = `${genderPrefix} ${parsed.color}`;
  
  if (parsed.pattern && !parsed.pattern.includes(parsed.style)) {
    name += ` ${parsed.pattern}`;
  }
  
  name += ` ${parsed.productType}`;
  
  return name.replace(/\s+/g, ' ').trim();
}

function generateSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateDescription(parsed, name) {
  const templates = {
    'T-Shirt': `Upgrade your casual wardrobe with this stylish ${parsed.color.toLowerCase()} t-shirt. Crafted from premium quality fabric, this ${parsed.pattern ? parsed.pattern.toLowerCase() + ' ' : ''}tee offers exceptional comfort and a modern fit. The versatile design makes it perfect for everyday wear, whether you're running errands, meeting friends, or relaxing at home. The durable construction ensures this piece will maintain its shape and color through countless washes. Pair with jeans for a classic look or dress it up with chinos.`,
    
    'Shirt': `Elevate your style with this sophisticated ${parsed.color.toLowerCase()} shirt featuring ${parsed.pattern ? parsed.pattern.toLowerCase() + ' detailing' : 'a clean, refined design'}. Perfect for both casual and semi-formal occasions, this versatile piece combines comfort with contemporary fashion. The quality fabric ensures breathability while maintaining a crisp appearance throughout the day. Whether heading to the office or a weekend brunch, this shirt delivers effortless elegance. Complete your look by pairing with trousers or jeans.`,
    
    'Button-Up Shirt': `Make a refined statement with this ${parsed.color.toLowerCase()} button-up shirt${parsed.pattern ? ' featuring ' + parsed.pattern.toLowerCase() + ' design' : ''}. Tailored for a modern fit, this shirt transitions seamlessly from professional settings to casual outings. The premium fabric offers comfort and durability, while thoughtful details add a touch of sophistication. Perfect for layering under blazers or wearing solo with rolled sleeves. A versatile wardrobe essential for the style-conscious individual.`,
    
    'Short Sleeve Shirt': `Stay cool and stylish with this ${parsed.color.toLowerCase()} short sleeve shirt${parsed.pattern ? ' showcasing ' + parsed.pattern.toLowerCase() + ' pattern' : ''}. Designed for warm weather comfort, this shirt offers a relaxed yet polished look. The breathable fabric keeps you comfortable while the contemporary cut ensures a flattering fit. Ideal for beach days, vacation wear, or casual summer gatherings. Pair with shorts for a laid-back vibe or chinos for elevated casual style.`,
    
    'Polo Shirt': `Classic meets contemporary in this ${parsed.color.toLowerCase()} polo shirt${parsed.pattern ? ' with ' + parsed.pattern.toLowerCase() + ' accents' : ''}. The timeless polo design gets a modern update with quality fabric and refined tailoring. Perfect for golf, casual Fridays, or weekend activities, this versatile piece offers comfort without compromising style. The breathable construction keeps you cool while the structured collar maintains a polished appearance.`,
    
    'Dress': `Make an impression in this beautiful ${parsed.color.toLowerCase()} dress${parsed.pattern ? ' featuring ' + parsed.pattern.toLowerCase() + ' design' : ''}. The flattering silhouette and quality fabric combine to create a piece that moves gracefully with you. Perfect for special occasions, date nights, or elevated everyday wear. The thoughtful construction ensures comfort while the elegant design makes a sophisticated statement. Style with heels for evening events or flats for daytime charm.`,
    
    'Hoodie': `Embrace comfort and style with this cozy ${parsed.color.toLowerCase()} hoodie${parsed.pattern ? ' featuring ' + parsed.pattern.toLowerCase() + ' design' : ''}. Crafted from soft, premium fabric, this hoodie offers the perfect blend of warmth and casual fashion. The relaxed fit makes it ideal for lounging, casual outings, or layering on cooler days. Quality construction ensures lasting comfort through countless wears. A versatile staple that pairs effortlessly with jeans, joggers, or shorts.`,
    
    'Jeans': `Find your perfect fit with these ${parsed.color.toLowerCase()} jeans${parsed.pattern ? ' with ' + parsed.pattern.toLowerCase() + ' details' : ''}. Crafted from premium denim, these jeans offer the ideal combination of style, comfort, and durability. The classic cut flatters every body type while providing freedom of movement. Versatile enough to dress up or down, these jeans transition seamlessly from casual days to evening outings. A wardrobe essential that pairs perfectly with any top.`,
    
    'Pants': `Elevate your everyday style with these versatile ${parsed.color.toLowerCase()} pants${parsed.pattern ? ' featuring ' + parsed.pattern.toLowerCase() + ' design' : ''}. The comfortable fit and quality fabric make these pants perfect for all-day wear. Whether you're at the office, running errands, or enjoying leisure time, these pants deliver both style and functionality. The tailored cut offers a polished look while maintaining comfort. Pair with shirts, t-shirts, or sweaters for endless outfit possibilities.`,
    
    'Jacket': `Complete your look with this stylish ${parsed.color.toLowerCase()} jacket${parsed.pattern ? ' showcasing ' + parsed.pattern.toLowerCase() + ' pattern' : ''}. Designed for both style and functionality, this jacket offers protection from the elements while making a fashion statement. The quality construction ensures durability while the modern cut provides a flattering silhouette. Layer over t-shirts, hoodies, or shirts for versatile styling options throughout the seasons.`,
    
    'default': `Discover this stylish ${parsed.color.toLowerCase()} ${parsed.productType.toLowerCase()}${parsed.pattern ? ' featuring ' + parsed.pattern.toLowerCase() + ' design' : ''}. Crafted with attention to quality and contemporary fashion, this piece offers the perfect blend of style and comfort. The versatile design makes it suitable for various occasions, from casual outings to more polished settings. Quality materials ensure lasting wear while the thoughtful construction provides a comfortable fit. A great addition to any wardrobe.`
  };
  
  let desc = templates[parsed.productType] || templates['default'];
  
  // Ensure around 500 characters
  if (desc.length < 450) {
    desc += ` Shop now to add this ${parsed.productType.toLowerCase()} to your collection.`;
  }
  if (desc.length > 550) {
    desc = desc.substring(0, 547) + '...';
  }
  
  return desc;
}

async function fixAllProducts() {
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  const token = (await authRes.json()).data.access_token;
  
  const res = await fetch(DIRECTUS_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const products = (await res.json()).data;
  
  console.log(`Processing ${products.length} products...\n`);
  
  const fixes = [];
  const errors = [];
  
  for (const p of products) {
    const parsed = parseImageFilename(p.image_url);
    
    if (!parsed || !parsed.productType) {
      errors.push({ id: p.id, image: p.image_url, reason: 'Could not parse' });
      continue;
    }
    
    const newName = generateProductName(parsed, parsed.genderCategory);
    const newSlug = generateSlug(newName);
    const newDesc = generateDescription(parsed, newName);
    
    // Determine category
    let category = p.category;
    if (['T-Shirt', 'Shirt', 'Button-Up Shirt', 'Short Sleeve Shirt', 'Polo Shirt', 'Blouse', 'Top', 'Tank Top', 'Tunic', 'Hoodie', 'Sweatshirt', 'Sweater'].includes(parsed.productType)) {
      category = 'Tops';
    } else if (['Dress', 'Midi Dress', 'Mini Dress', 'Maxi Dress', 'Slip Dress'].includes(parsed.productType)) {
      category = 'Dresses';
    } else if (['Jeans', 'Pants', 'Trousers', 'Shorts', 'Skirt', 'Sweatpants', 'Track Pants', 'Cargo Pants'].includes(parsed.productType)) {
      category = 'Bottoms';
    } else if (['Jacket', 'Vest', 'Outerwear', 'Varsity Jacket'].includes(parsed.productType)) {
      category = 'Outerwear';
    } else if (['Flats', 'Heels', 'Mules', 'Sneakers'].includes(parsed.productType)) {
      category = 'Footwear';
    } else if (['Backpack', 'Bag', 'Visor'].includes(parsed.productType)) {
      category = 'Accessories';
    } else if (['Kurta'].includes(parsed.productType)) {
      category = 'Ethnic Fusion';
    }
    
    // Keep Kids category for kids
    if (parsed.genderCategory === 'Kids') {
      category = 'Kids';
    }
    
    fixes.push({
      id: p.id,
      old: { name: p.name, slug: p.slug, color: p.color, subcategory: p.subcategory },
      new: {
        name: newName,
        slug: newSlug,
        description: newDesc,
        color: parsed.color,
        pattern: parsed.pattern?.split(' ')[0].toLowerCase() || '',
        style: parsed.style.toLowerCase(),
        subcategory: parsed.subcategory,
        category: category,
        gender: parsed.gender,
        gender_category: parsed.genderCategory
      },
      parsed
    });
  }
  
  // Save fixes for review
  fs.writeFileSync('comprehensive-fixes.json', JSON.stringify(fixes, null, 2));
  console.log(`Generated fixes for ${fixes.length} products`);
  console.log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nProducts that could not be parsed:');
    errors.forEach(e => console.log(`  ID ${e.id}: ${e.image}`));
  }
  
  // Show samples
  console.log('\n=== SAMPLE FIXES ===\n');
  fixes.slice(0, 10).forEach(f => {
    console.log(`ID ${f.id}:`);
    console.log(`  OLD: ${f.old.name}`);
    console.log(`  NEW: ${f.new.name}`);
    console.log(`  Color: ${f.old.color} -> ${f.new.color}`);
    console.log(`  Parsed from: ${f.parsed.rawParts.join('_')}`);
    console.log('');
  });
  
  return fixes;
}

fixAllProducts().catch(console.error);
