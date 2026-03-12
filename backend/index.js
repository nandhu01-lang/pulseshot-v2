// pulseshot-ai/backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();
const PORT = process.env.PORT || 3001;

// In-memory store for generated images
const generatedImages = {};

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PulseShot AI Backend' });
});

// Generate endpoint - uses Replicate for real AI headshots
app.post('/generate', async (req, res) => {
  const { userId, stylePackage = 'PROFESSIONAL', imageUrls, styles = ['professional'] } = req.body;
  console.log('=== GENERATE ===', userId, 'package:', stylePackage, 'styles:', styles);
  
  // Set timeout to ensure we always respond
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ success: false, error: 'Generation timeout' });
    }
  }, 180000); // 3 min timeout
  
  try {
    const IMAGE_COUNTS = {
      'FREE_PREVIEW': 5,
      'PROFESSIONAL': 10,  // Reduced for faster generation
      'PREMIUM': 20,
    };
    
    let totalCount = IMAGE_COUNTS[stylePackage] || 10;
    
    const { generateWithReplicate } = require('./services/replicate');
    const results = await generateWithReplicate(imageUrls, styles, totalCount);
    
    clearTimeout(timeout);
    
    if (results.length > 0) {
      generatedImages[userId] = results.map((url, i) => ({ id: i+1, url }));
      res.json({ success: true, images: generatedImages[userId] });
    } else {
      throw new Error('No images generated');
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error('Generate error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
    // Fallback to demo images
    const images = [];
    for (let i = 0; i < totalCount; i++) {
      images.push({ id: i+1, url: `https://picsum.photos/400/600?random=${Date.now() + i}` });
    }
    generatedImages[userId] = images;
    res.json({ success: true, images });
  }
});

// Tasks endpoint - returns stored images
app.get('/tasks', async (req, res) => {
  const { userId } = req.query;
  const images = generatedImages[userId] || [];
  
  res.json([{
    id: 'task_' + Date.now(),
    userId: userId || 'demo',
    stylePackage: 'PROFESSIONAL',
    status: 'COMPLETED',
    results: images.length > 0 ? images : [
      { id: 1, url: 'https://picsum.photos/400/600?random=100' },
      { id: 2, url: 'https://picsum.photos/400/600?random=101' },
      { id: 3, url: 'https://picsum.photos/400/600?random=102' },
      { id: 4, url: 'https://picsum.photos/400/600?random=103' },
    ]
  }]);
});

app.listen(PORT, () => {
  console.log(`PulseShot AI Backend running on port ${PORT}`);
});
