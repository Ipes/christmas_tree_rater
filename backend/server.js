require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const app = express();

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many uploads from this IP, please try again after 15 minutes' }
});

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL // Will be set during deployment
    : 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Set file size limit to 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      error: 'File upload error',
      details: err.message 
    });
  }
  
  if (err.name === 'OpenAIError') {
    return res.status(503).json({ 
      error: 'AI service temporarily unavailable',
      details: 'Please try again in a few minutes'
    });
  }

  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};


async function analyzeChristmasTree(imageUrl) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional Christmas tree critic. Use the following format for your response:\n\nAesthetics Score: [0-5]\nAesthetics Explanation: [one sentence]\n\nOriginality Score: [0-5]\nOriginality Explanation: [one sentence]\n\nGreat Feature: [one specific feature]\n\nImprovements:\n1. [improvement]\n2. [improvement]\n3. [improvement]"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this Christmas tree. Be honest but constructive in your feedback."
            },
            {
              type: "image_url",
              "image_url": {
                "url": imageUrl,
                "detail": "low"
              }
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content.trim();
    console.log('OpenAI raw response:', response);

    // Parse the formatted response into an object
    try {
      const lines = response.split('\n');
      const result = {
        aesthetics: {
          score: parseFloat(lines.find(l => l.startsWith('Aesthetics Score:'))?.split(':')[1]) || 0,
          explanation: lines.find(l => l.startsWith('Aesthetics Explanation:'))?.split(':')[1]?.trim() || ''
        },
        originality: {
          score: parseFloat(lines.find(l => l.startsWith('Originality Score:'))?.split(':')[1]) || 0,
          explanation: lines.find(l => l.startsWith('Originality Explanation:'))?.split(':')[1]?.trim() || ''
        },
        greatFeatures: lines.find(l => l.startsWith('Great Feature:'))?.split(':')[1]?.trim() || '',
        improvements: lines
          .slice(lines.findIndex(l => l.startsWith('Improvements:')) + 1)
          .filter(l => l.trim().match(/^\d\./))
          .map(l => l.replace(/^\d\.\s*/, '').trim())
      };

      console.log('Parsed response:', result);
      return result;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse OpenAI response');
    }

  } catch (error) {
    console.error('OpenAI Analysis Error:', error);
    throw new Error('Failed to analyze Christmas tree: ' + error.message);
  }
}


// Upload and analyze route with rate limiting
app.post('/api/upload', uploadLimiter, upload.single('image'), async (req, res, next) => {
  try {
    console.log('Upload request received');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File details:', {
      size: req.file.size,
      mimetype: req.file.mimetype,
      originalName: req.file.originalname
    });

    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(413).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `tree-${timestamp}.jpg`;
    console.log('Generated filename:', filename);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('christmas-trees')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Storage error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('Upload successful:', uploadData);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('christmas-trees')
      .getPublicUrl(filename);

    console.log('Public URL generated:', publicUrl);

    // Analyze the image using OpenAI
    console.log('Starting OpenAI analysis...');
    const analysis = await analyzeChristmasTree(publicUrl);
    console.log('Analysis completed:', analysis);

    // Store the rating in Supabase
    const { data: ratingData, error: ratingError } = await supabase
      .from('tree_ratings')
      .insert([
        {
          image_url: publicUrl,
          aesthetics_score: analysis.aesthetics.score,
          originality_score: analysis.originality.score,
          aesthetics_explanation: analysis.aesthetics.explanation,
          originality_explanation: analysis.originality.explanation,
          great_features: analysis.greatFeatures,
          improvements: analysis.improvements
        }
      ])
      .select();

    if (ratingError) {
      console.error('Rating storage error:', ratingError);
      throw new Error('Failed to store rating');
    }

    res.json({ 
      success: true,
      imageUrl: publicUrl,
      rating: analysis
    });

  } catch (error) {
    next(error);
  }
});

// Leaderboard endpoint with error handling
app.get('/api/top-trees', async (req, res) => {
  try {
    console.log('Fetching top trees from database...');
    const { data, error } = await supabase
      .from('tree_ratings')
      .select('*')
      .order('aesthetics_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase error fetching top trees:', error);
      return res.status(500).json({ 
        error: 'Database error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }

    if (!data) {
      console.error('No data returned from Supabase');
      return res.status(500).json({ 
        error: 'Database error',
        message: 'No data received from database'
      });
    }

    console.log(`Successfully fetched ${data.length} trees`);

    const trees = data.map(tree => ({
      id: tree.id,
      user: tree.id,
      image_url: tree.image_url,
      aesthetics_score: tree.aesthetics_score || 0,
      originality_score: tree.originality_score || 0,
      score: (tree.aesthetics_score || 0) + (tree.originality_score || 0),
      created_at: tree.created_at
    }));

    res.json({ trees });
  } catch (error) {
    console.error('Unexpected error in /api/top-trees:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Apply error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
