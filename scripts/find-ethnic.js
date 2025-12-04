const fs = require('fs');
const products = JSON.parse(fs.readFileSync('all-products.json', 'utf8'));

// Keywords that suggest ethnic/fusion wear
const ethnicKeywords = ['tunic', 'embroid', 'tiered', 'floral', 'print', 'bohemian', 'boho', 'kaftan', 'kurta', 'kurti', 'palazzo', 'anarkali', 'ethnic', 'traditional', 'block', 'paisley'];
const westernKeywords = ['mini', 'slip', 'midi', 'maxi', 'bodycon', 'shift', 'wrap', 'a-line', 'hoodie', 'sweatshirt', 'jeans', 'jogger', 'cargo'];

console.log('=== POTENTIAL ETHNIC/FUSION PRODUCTS ===\n');

products.forEach(p => {
  const name = (p.name || '').toLowerCase();
  const imageUrl = (p.image_url || '').toLowerCase();
  const style = (p.style || '').toLowerCase();
  const pattern = (p.pattern || '').toLowerCase();
  const subcat = (p.subcategory || '').toLowerCase();
  
  const combined = name + ' ' + imageUrl + ' ' + style + ' ' + pattern;
  
  // Check for ethnic indicators
  const hasEthnic = ethnicKeywords.some(k => combined.includes(k));
  const hasWestern = westernKeywords.some(k => combined.includes(k));
  
  // Tunics and bohemian style are often ethnic fusion
  if (subcat === 'tunic' || style === 'bohemian' || (hasEthnic && !hasWestern)) {
    console.log('ID:', p.id);
    console.log('Name:', p.name);
    console.log('Category:', p.category, '| Subcat:', p.subcategory);
    console.log('Style:', p.style, '| Pattern:', p.pattern);
    console.log('Image:', p.image_url);
    console.log('---');
  }
});

console.log('\n=== DRESS PRODUCTS FOR REVIEW ===\n');
const dresses = products.filter(p => 
  (p.subcategory || '').toLowerCase().includes('dress') || 
  (p.category || '').toLowerCase() === 'dresses'
);

dresses.forEach(p => {
  console.log('ID:', p.id, '|', p.name);
  console.log('  Image:', p.image_url?.split('/').pop());
  console.log('  Style:', p.style, '| Pattern:', p.pattern);
});
