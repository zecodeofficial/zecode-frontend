const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const MODEL_POSES_DIR = path.join(__dirname, 'generated-model-poses');

cloudinary.config({
  cloud_name: 'ds8llatku',
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

async function uploadToCloudinary(filePath, publicId) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'zecode/model-poses',
    public_id: publicId,
    overwrite: true
  });
  return result.secure_url;
}

async function getToken() {
  const res = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  return (await res.json()).data.access_token;
}

async function updateProduct(token, productId, modelImages) {
  const body = {};
  if (modelImages[0]) body.model_image_1 = modelImages[0];
  if (modelImages[1]) body.model_image_2 = modelImages[1];
  if (modelImages[2]) body.model_image_3 = modelImages[2];
  
  await fetch(DIRECTUS_URL + '/items/products/' + productId, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

async function main() {
  const brokenProducts = JSON.parse(fs.readFileSync('broken-products.json', 'utf8'));
  const token = await getToken();
  
  console.log('Fixing ' + brokenProducts.length + ' products with broken paths...\n');
  
  const uploadedKeys = {};
  let fixed = 0;
  let errors = 0;
  
  for (const product of brokenProducts) {
    console.log(product.id + ': ' + product.name);
    
    try {
      // Extract the product key from the local path
      // e.g., /products/model-poses-generated/Mens_Dark_Casual_Graphic_Print_T-Shirt_front_standing.png
      const match = product.model_image_1.match(/model-poses-generated\/(.+?)_(front_standing|three_quarter|casual_lifestyle)/);
      if (!match) {
        console.log('  Could not parse path, skipping');
        continue;
      }
      
      const fileKey = match[1];
      console.log('  File key: ' + fileKey);
      
      let modelUrls;
      
      if (uploadedKeys[fileKey]) {
        modelUrls = uploadedKeys[fileKey];
        console.log('  Using cached URLs');
      } else {
        modelUrls = [];
        const poses = ['front_standing', 'three_quarter', 'casual_lifestyle'];
        
        for (const pose of poses) {
          const fileName = fileKey + '_' + pose + '.png';
          const filePath = path.join(MODEL_POSES_DIR, fileName);
          
          if (fs.existsSync(filePath)) {
            console.log('  Uploading ' + pose + '...');
            const publicId = fileKey + '_' + pose;
            const url = await uploadToCloudinary(filePath, publicId);
            modelUrls.push(url);
          }
        }
        
        uploadedKeys[fileKey] = modelUrls;
      }
      
      if (modelUrls.length > 0) {
        console.log('  Updating Directus...');
        await updateProduct(token, product.id, modelUrls);
        console.log('  Done!\n');
        fixed++;
      }
      
    } catch (err) {
      console.log('  Error: ' + err.message + '\n');
      errors++;
    }
  }
  
  console.log('\n=== COMPLETE ===');
  console.log('Fixed: ' + fixed);
  console.log('Errors: ' + errors);
}

main();
