import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAiBh2COZNKNfRRnp6zKqlQg4sszVqPC3Q';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'generate-product-details':
        return await generateProductDetails(data);
      case 'generate-model-poses':
        return await generateModelPosePrompts(data);
      case 'analyze-image':
        return await analyzeOutfitImage(data);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function generateProductDetails(data: {
  gender: string;
  colors: string;
  outfitType: string;
  graphicText?: string;
  designElements?: string;
  imageDescription?: string;
}) {
  const { gender, colors, outfitType, graphicText, designElements, imageDescription } = data;

  const prompt = `Generate product details for an Indian fashion e-commerce website.

Input Details:
- Gender: ${gender}
- Outfit Type: ${outfitType}
- Colors: ${colors}
- Graphic/Print Text: ${graphicText || 'None'}
- Design Elements: ${designElements || 'None'}
- Image Description: ${imageDescription || 'Not provided'}

Generate the following in JSON format:
1. "productName": A catchy product name (maximum 100 characters) that includes gender hint, colors, outfit type, and key design elements. Make it SEO-friendly and appealing to Indian college students.
2. "productSlug": URL-friendly slug derived from the product name (lowercase, hyphens instead of spaces, no special characters).
3. "productDescription": Detailed description (exactly 500 characters) expanding on the product name, highlighting fabric quality, styling suggestions, occasions to wear, and appeal to young Indian fashion-conscious customers.
4. "category": Main category (Men/Women/Unisex)
5. "subcategory": Specific subcategory (e.g., T-Shirts, Shirts, Dresses, Tops, etc.)
6. "tags": Array of 5-8 relevant tags for search

Respond ONLY with valid JSON, no markdown or explanation.`;

  const response = await fetch(`${GEMINI_API_URL}/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error.message);
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Parse JSON from response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const productDetails = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ success: true, data: productDetails });
    }
  } catch (e) {
    console.error('JSON parse error:', e);
  }

  return NextResponse.json({ success: false, error: 'Failed to parse response', raw: text });
}

async function generateModelPosePrompts(data: {
  gender: string;
  outfitDescription: string;
  colors: string;
}) {
  const { gender, outfitDescription, colors } = data;
  const genderText = gender.toLowerCase() === 'men' ? 'male' : 'female';

  const poses = [
    {
      pose: 'standing',
      prompt: `Professional fashion photography of a young Indian college student ${genderText} model, standing pose with confident posture, wearing ${colors} ${outfitDescription}, full body shot, studio lighting, white background, high fashion editorial style, showcasing the outfit clearly, natural expression, modern urban Indian fashion aesthetic, 4K quality, professional product photography`
    },
    {
      pose: 'sitting',
      prompt: `Professional fashion photography of a young Indian college student ${genderText} model, casual sitting pose on a modern stool, wearing ${colors} ${outfitDescription}, three-quarter body shot, soft studio lighting, minimal background, lifestyle fashion photography, relaxed confident expression, contemporary Indian youth fashion, high quality product photography, 4K resolution`
    },
    {
      pose: 'walking',
      prompt: `Professional fashion photography of a young Indian college student ${genderText} model, dynamic walking pose mid-stride, wearing ${colors} ${outfitDescription}, full body in motion, studio lighting with subtle shadows, clean background, capturing movement and flow of fabric, energetic confident expression, modern Indian street style aesthetic, commercial fashion photography, 4K quality`
    }
  ];

  return NextResponse.json({ success: true, data: poses });
}

async function analyzeOutfitImage(data: { imageBase64: string; mimeType: string }) {
  const { imageBase64, mimeType } = data;

  const prompt = `Analyze this fashion outfit image and provide details in JSON format:

1. "gender": Likely target gender (Men/Women/Unisex)
2. "outfitType": Type of clothing (T-Shirt, Shirt, Dress, Top, Jeans, etc.)
3. "colors": List of colors visible in the outfit
4. "graphicText": Any text or graphics printed on the clothing (or "None")
5. "designElements": Notable design features (patterns, cuts, embroidery, etc.)
6. "fabricGuess": Likely fabric type
7. "styleCategory": Style category (Casual, Formal, Streetwear, Ethnic, etc.)
8. "description": Brief description of what you see

Respond ONLY with valid JSON.`;

  const response = await fetch(`${GEMINI_API_URL}/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    }),
  });

  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error.message);
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ success: true, data: analysis });
    }
  } catch (e) {
    console.error('JSON parse error:', e);
  }

  return NextResponse.json({ success: false, error: 'Failed to parse response', raw: text });
}
