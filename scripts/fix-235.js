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

async function fix235() {
  const token = await getToken();
  
  // Upload correct T-Shirt model images
  const fileKey = 'Mens_Dark_Casual_Graphic_Print_T-Shirt';
  const poses = ['front_standing', 'three_quarter', 'casual_lifestyle'];
  const modelUrls = [];
  
  for (const pose of poses) {
    const fileName = fileKey + '_' + pose + '.png';
    const filePath = path.join(MODEL_POSES_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      console.log('Uploading ' + pose + '...');
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'zecode/model-poses',
        public_id: fileKey + '_' + pose + '_v2',
        overwrite: true
      });
      modelUrls.push(result.secure_url);
      console.log('  -> ' + result.secure_url);
    }
  }
  
  // Update product 235
  console.log('Updating product 235...');
  await fetch(DIRECTUS_URL + '/items/products/235', {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model_image_1: modelUrls[0],
      model_image_2: modelUrls[1],
      model_image_3: modelUrls[2]
    })
  });
  
  console.log('Done!');
}

async function getToken() {
  const res = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  return (await res.json()).data.access_token;
}

fix235();
