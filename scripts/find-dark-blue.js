process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const DIRECTUS = process.env.DIRECTUS_URL || 'https://zecode-directus.onrender.com';

async function main(){
  try{
    const res = await axios.get(`${DIRECTUS}/items/products`, { params: { limit: -1 } });
    const products = res.data?.data || [];
    console.log('Total products fetched:', products.length);
    const matches = products.filter(p=>{
      const name = (p.name||'').toLowerCase();
      const slug = (p.slug||'').toLowerCase();
      return slug.includes('dark-blue') || name.includes('dark blue') || name.includes("darkblue") || slug.includes('darkblue');
    });
    if(matches.length===0){
      console.log('No products matching dark-blue found');
      return;
    }
    for(const p of matches){
      console.log(`${p.id}\t${p.name}\t${p.slug}`);
    }
    console.log('MATCH COUNT:', matches.length);
  }catch(e){
    console.error('Error fetching products:', e.response?.data || e.message);
  }
}

main();
