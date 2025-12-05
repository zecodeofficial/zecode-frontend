process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');

const DIRECTUS = process.env.DIRECTUS_URL || 'https://zecode-directus.onrender.com';

async function main(){
  try{
    const res = await axios.get(`${DIRECTUS}/items/products`,{
      params: {
        'filter[gender_category][_eq]':'men',
        'filter[subcategory][_contains]':'Jean',
        limit: -1
      }
    });
    const products = res.data?.data || [];
    if(products.length===0){
      console.log('No men jeans found with subcategory containing "Jean"');
      return;
    }
    for(const p of products){
      console.log(`${p.id}\t${p.name}\t${p.slug}`);
    }
    console.log('COUNT:', products.length);
  }catch(e){
    console.error('Error:', e.response?.data || e.message);
    process.exitCode = 1;
  }
}

main();
