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

// Fixes needed
const fixes = [
  { id: 77, name: "Men's Black Casual Graphic Print T-Shirt", correctKey: 'Mens_Black_Casual_Graphic_Print_T-Shirt' },
  { id: 190, name: "Men's White Casual Graphic Print T-Shirt", correctKey: 'Mens_White_Casual_Graphic_Print_T-Shirt' },
  { id: 215, name: "Women's White Casual T-Shirt", correctKey: 'Womens_White_Casual_T-Shirt' },
  { id: 225, name: "Men's White Casual Graphic Print T-Shirt", correctKey: 'Mens_White_Casual_Graphic_Print_T-Shirt' }
];

async function fixMismatches() {
  const token = await getToken();
  
  for (const fix of fixes) {
    console.log('Fixing ID ' + fix.id + ': ' + fix.name);
    
    const poses = ['front_standing', 'three_quarter', 'casual_lifestyle'];
    const modelUrls = [];
    
    for (const pose of poses) {
      const fileName = fix.correctKey + '_' + pose + '.png';
      const filePath = path.join(MODEL_POSES_DIR, fileName);
      
      if (fs.existsSync(filePath)) {
        console.log('  Uploading ' + pose + '...');
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'zecode/model-poses',
          public_id: fix.correctKey + '_' + pose + '_fix',
          overwrite: true
        });
        modelUrls.push(result.secure_url);
      } else {
        console.log('  Missing: ' + fileName);
      }
    }
    
    if (modelUrls.length > 0) {
      console.log('  Updating Directus...');
      await fetch(DIRECTUS_URL + '/items/products/' + fix.id, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_image_1: modelUrls[0] || null,
          model_image_2: modelUrls[1] || null,
          model_image_3: modelUrls[2] || null
        })
      });
      console.log('  Done!');
    }
    console.log('');
  }
}

async function getToken() {
  const res = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  return (await res.json()).data.access_token;
}

fixMismatches();
