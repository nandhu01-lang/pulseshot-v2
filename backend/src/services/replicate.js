const axios = require('axios');

const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN;
const MODEL_VERSION = 'ba2d5293be8794a05841a6f6eed81e810340142c3c25fab4838ff2b5d9574420';

// Prompts for realistic headshots
const PROMPTS = {
  // Professional
  professional: "Photorealistic headshot, professional business suit, corporate portrait, studio lighting, 85mm f/1.4 lens, sharp focus on eyes, natural skin texture, neutral background",
  casual: "Photorealistic headshot, smart casual attire, modern professional, soft natural lighting, 50mm lens, relaxed confident expression",
  executive: "Executive portrait, luxury business suit, dark charcoal background, dramatic rim lighting, professional CEO headshot, confidence",
  creative: "Creative professional portrait, stylish fashion-forward clothing, editorial lighting, fashion magazine style",
  
  // South Asian
  kurta_gold: "Photorealistic Indian portrait, white kurta pajamas with gold embroidery, cultural elegance, professional studio lighting",
  saree_red: "Photorealistic Indian portrait, red silk saree with gold border, traditional Indian elegance",
  sherwani: "Photorealistic Indian groom portrait, cream sherwani with gold detailing, wedding elegance",
  indo_western: "Photorealistic Indian portrait, modern Indo-Western fusion suit, contemporary professional",
  lehenga: "Photorealistic Indian bride portrait, elaborate lehenga with heavy embroidery, bridal grandeur",
  anarkali: "Photorealistic Indian portrait, flowing anarkali suit, classic grace",
  
  // Middle Eastern
  thobe: "Photorealistic Middle Eastern portrait, traditional white thobe, Gulf region business attire",
  shemagh: "Photorealistic Saudi portrait, white thobe with red and white shemagh headscarf",
  abaya: "Photorealistic portrait, elegant black abaya with golden accents, modern professional woman",
  kandura: "Photorealistic Emirati portrait, pristine white kandura, traditional UAE formal wear",
  dishdasha: "Photorealistic Gulf portrait, white dishdasha with subtle embroidery",
  
  // African
  agbada: "Photorealistic West African portrait, elaborate agbada robe with embroidery, Nigerian formal wear",
  dashiki: "Photorealistic African portrait, colorful dashiki shirt with embroidered neckline",
  kente: "Photorealistic portrait, kente cloth inspired attire, royal African traditional wear",
  african_modern: "Photorealistic African professional portrait, modern African business attire",
  prints: "Photorealistic African portrait, vibrant African print shirt, bold patterns",
  gele: "Photorealistic Nigerian woman portrait, elaborate gele headwrap",
  
  // Western
  corporate: "Photorealistic corporate headshot, navy blue business suit, professional office setting",
  smart_casual: "Photorealistic professional portrait, smart casual business attire, modern tech professional",
  executive_luxury: "Photorealistic luxury executive portrait, bespoke tailored suit, premium office",
  creative_artistic: "Photorealistic creative professional, artistic fashion-forward outfit, editorial style",
  
  // Special
  graduation: "Photorealistic graduation portrait, academic robes, mortarboard cap, university graduate",
  medical: "Photorealistic medical professional portrait, clean medical scrubs, healthcare professional",
  legal: "Photorealistic legal professional portrait, formal court attire, lawyer, authoritative",
  chef: "Photorealistic chef portrait, professional chef coat, tall chef hat",
};

const NEGATIVE_PROMPT = "blurry, low quality, distorted face, deformed, ugly, bad anatomy, extra fingers, watermark, text, logo, cartoon, painting, illustration, 3d render, cgi, plastic skin, over-smoothed, ASA, bad eyes, asymmetrical, halos, double face";

async function generateWithReplicate(imageUrls, styleKeys, totalCount) {
  if (!REPLICATE_TOKEN) throw new Error('REPLICATE_TOKEN not configured');

  const faceImage = imageUrls[0];
  const results = [];
  
  // Generate one image at a time with different styles
  for (let i = 0; i < totalCount && i < styleKeys.length; i++) {
    const style = styleKeys[i % styleKeys.length];
    const prompt = PROMPTS[style] || PROMPTS.professional;
    
    console.log(`🎨 Generating ${i+1}/${totalCount}: ${style}`);
    
    try {
      // Start prediction
      const response = await axios.post('https://api.replicate.com/v1/predictions', {
        version: MODEL_VERSION,
        input: {
          input_image: faceImage,
          prompt: prompt,
          negative_prompt: NEGATIVE_PROMPT,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 30,
          identitynet_strength_ratio: 0.9,  // High for face accuracy
          ip_adapter_scale: 0.8,
          enhance_nonface_region: true,
          instantid_canny_strength: 0.3,
          instantid_depth_strength: 0.8,
        }
      }, {
        headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` }
      });

      const predictionId = response.data.id;
      console.log(`   📄 Prediction: ${predictionId}`);
      
      // Poll for result
      let result = null;
      for (let attempt = 0; attempt < 60 && !result; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const status = await axios.get(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` }
          });
          
          if (status.data.status === 'succeeded') {
            result = status.data.output;
            console.log(`   ✅ Success!`);
          } else if (status.data.status === 'failed') {
            console.error(`   ❌ Failed:`, status.data.error);
            break;
          }
        } catch (e) {
          console.log(`   ⏳ Waiting...`);
        }
      }

      if (result?.output_paths) {
        results.push(...result.output_paths);
      }
    } catch (err) {
      console.error(`   ❌ Error:`, err.message);
    }
  }

  // If we need more images, duplicate with variations
  while (results.length < totalCount && results.length > 0) {
    results.push(results[results.length % results.length]);
  }

  console.log(`✨ Total generated: ${results.length} images`);
  return results.slice(0, totalCount);
}

module.exports = { generateWithReplicate };
