const axios = require('axios');

const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN;
const MODEL_VERSION = 'ba2d5293be8794a05841a6f6eed81e810340142c3c25fab4838ff2b5d9574420';

// Enhanced prompts for variety - different poses and expressions
const PROMPTS = {
  // Professional - Different poses
  professional_1: "Photorealistic headshot, professional business suit, corporate portrait, studio lighting, 85mm f/1.4 lens, sharp focus on eyes, neutral background, serious expression",
  professional_2: "Photorealistic headshot, professional business suit, friendly smile, studio lighting, natural look, business professional, confident gaze",
  professional_3: "Photorealistic executive headshot, corporate portrait, three-quarter angle, professional studio, modern business attire",
  
  // Casual - Different vibes
  casual_1: "Photorealistic headshot, smart casual attire, modern professional, soft natural lighting, 50mm lens, relaxed confident expression, friendly smile",
  casual_2: "Photorealistic portrait, casual business wear, outdoor natural light, contemporary professional, approachable look",
  casual_3: "Photorealistic headshot, polo shirt, clean background, tech startup professional, modern casual",
  
  // Executive - Different angles
  executive_1: "Executive portrait, luxury business suit, dark charcoal background, dramatic rim lighting, professional CEO headshot, authority",
  executive_2: "Executive portrait, bespoke tailored suit, dramatic lighting, confident expression, corporate leader",
  executive_3: "CEO portrait, premium office background, executive presence, authoritative gaze",
  
  // Creative - Different styles
  creative_1: "Creative professional portrait, stylish fashion-forward clothing, editorial lighting, fashion magazine style",
  creative_2: "Artist portrait, creative studio lighting, artistic expression, fashion-forward look",
  creative_3: "Creative director portrait, bold fashion choice, dramatic makeup, editorial style",
  
  // South Asian
  kurta_gold_1: "Photorealistic Indian portrait, white kurta pajamas with gold embroidery, cultural elegance, professional studio lighting, slight smile",
  kurta_gold_2: "Indian formal portrait, cream kurta with gold work, traditional elegance, professional headshot",
  saree_red_1: "Photorealistic Indian portrait, red silk saree with gold border, traditional Indian elegance, festive professional look",
  saree_red_2: "Indian bride portrait, red lehenga style saree, gold jewelry, traditional elegance",
  sherwani_1: "Photorealistic Indian groom portrait, cream sherwani with gold detailing, wedding elegance, royal look",
  sherwani_2: "Indian groom portrait, ivory sherwani, traditional gold embroidery, wedding portrait",
  indo_western_1: "Photorealistic Indian portrait, modern Indo-Western fusion suit, contemporary professional",
  lehenga_1: "Photorealistic Indian bride portrait, elaborate lehenga with heavy embroidery, bridal grandeur, red gold",
  anarkali_1: "Photorealistic Indian portrait, flowing anarkali suit, classic grace, vintage Bollywood style",
  
  // Middle Eastern
  thobe_1: "Photorealistic Middle Eastern portrait, traditional white thobe, Gulf region business attire, professional",
  thobe_2: "Saudi professional portrait, white thobe, clean background, traditional elegance",
  shemagh_1: "Photorealistic Saudi portrait, white thobe with red and white shemagh headscarf, traditional Arab",
  shemagh_2: "Gulf portrait, white kandura with shemagh, traditional headdress, desert elegance",
  abaya_1: "Photorealistic portrait, elegant black abaya with golden accents, modern professional woman",
  abaya_2: "Arabic woman portrait, stylish abaya, contemporary elegance, professional",
  kandura_1: "Photorealistic Emirati portrait, pristine white kandura, traditional UAE formal wear",
  dishdasha_1: "Photorealistic Gulf portrait, white dishdasha with subtle embroidery, formal wear",
  
  // African
  agbada_1: "Photorealistic West African portrait, elaborate agbada robe with embroidery, Nigerian formal wear, royal",
  agbada_2: "Nigerian professional, detailed agbada, traditional elegance, cultural pride",
  dashiki_1: "Photorealistic African portrait, colorful dashiki shirt with embroidered neckline, African pride",
  dashiki_2: "West African portrait, patterned dashiki, vibrant colors, cultural celebration",
  kente_1: "Photorealistic portrait, kente cloth inspired attire, royal African traditional wear, gold purple",
  kente_2: "African royal portrait, kente cloth, traditional elegance, cultural heritage",
  african_modern_1: "Photorealistic African professional portrait, modern African business attire, corporate",
  african_modern_2: "African executive portrait, contemporary suit, modern professional",
  prints_1: "Photorealistic African portrait, vibrant African print shirt, bold patterns, modern African",
  gele_1: "Photorealistic Nigerian woman portrait, elaborate gele headwrap, matching outfit, elegance",
  
  // Western
  corporate_1: "Photorealistic corporate headshot, navy blue business suit, professional office setting, confident",
  corporate_2: "Corporate portrait, dark suit, studio lighting, business professional, executive look",
  corporate_3: "Professional headshot, tailored suit, clean background, corporate identity",
  smart_casual_1: "Photorealistic professional portrait, smart casual business attire, modern tech professional",
  smart_casual_2: "Startup founder portrait, casual business wear, modern company, approachable",
  executive_luxury_1: "Photorealistic luxury executive portrait, bespoke tailored suit, premium office, confidence",
  executive_luxury_2: "Executive portrait, expensive silk tie, luxury background, CEO style",
  creative_artistic_1: "Photorealistic creative professional, artistic fashion-forward outfit, editorial magazine style",
  creative_artistic_2: "Creative portrait, bold fashion, unique style, artistic expression",
  
  // Special
  graduation_1: "Photorealistic graduation portrait, academic robes, mortarboard cap, university graduate, proud",
  graduation_2: "Graduation portrait, ceremonial robes, achievement, academic success",
  medical_1: "Photorealistic medical professional portrait, clean medical scrubs, healthcare professional, stethoscope",
  medical_2: "Doctor portrait, white coat, hospital setting, medical professional",
  legal_1: "Photorealistic legal professional portrait, formal court attire, lawyer, authoritative",
  legal_2: "Attorney portrait, dark suit, professional setting, legal expert",
  chef_1: "Photorealistic chef portrait, professional chef coat, tall chef hat, culinary expert",
  chef_2: "Chef portrait, kitchen setting, professional cooking attire",
};

// Get all prompt keys
const ALL_PROMPTS = Object.keys(PROMPTS);

// Negative prompt
const NEGATIVE_PROMPT = "blurry, low quality, distorted face, deformed, ugly, bad anatomy, extra fingers, watermark, text, logo, cartoon, painting, illustration, 3d render, cgi, plastic skin, over-smoothed, ASA, bad eyes, asymmetrical, halos, double face, same pose, duplicate";

async function generateWithReplicate(imageUrls, styleKeys, totalCount) {
  if (!REPLICATE_TOKEN) throw new Error('REPLICATE_TOKEN not configured');

  const faceImage = imageUrls[0];
  const results = [];
  
  console.log(`🎨 Generating ${totalCount} unique images with different styles...`);
  console.log(`📸 Face: ${faceImage}`);
  
  // Generate each image with a different prompt for variety
  for (let i = 0; i < totalCount; i++) {
    // Cycle through styles and add variations
    const baseStyle = styleKeys[i % styleKeys.length];
    const variation = (i % 3) + 1; // 1, 2, or 3
    
    // Try to find a matching prompt with variation
    let promptKey = `${baseStyle}_${variation}`;
    if (!PROMPTS[promptKey]) {
      // Fallback to base style or random prompt
      promptKey = ALL_PROMPTS[i % ALL_PROMPTS.length];
    }
    
    const prompt = PROMPTS[promptKey];
    
    console.log(`🎬 ${i+1}/${totalCount}: ${promptKey}`);
    
    try {
      // Start prediction with random seed for variety
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
          seed: Math.floor(Math.random() * 1000000),  // Random seed for variety
        }
      }, {
        headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` }
      });

      const predictionId = response.data.id;
      
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

  console.log(`✨ Total generated: ${results.length} unique images`);
  return results.slice(0, totalCount);
}

module.exports = { generateWithReplicate };
