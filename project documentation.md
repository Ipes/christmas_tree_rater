# Christmas Tree Rater - Project Documentation

## Project Overview
A web application that allows users to upload photos of Christmas trees and receive AI-powered ratings and feedback. The application analyzes the aesthetics and originality of each tree, providing specific scores, explanations, and improvement suggestions.

## Current Implementation Status

### Completed Features (As of Last Session)
1. Enhanced Frontend Upload Component:
   - Improved UI/UX with responsive design
   - Working drag-and-drop functionality
   - Visual feedback for file upload states
   - Error handling and user messages
   - Two-column layout for tree preview and ratings
   - Automatic resizing of upload area after selection

2. Backend Integration:
   - Image upload to Supabase storage
   - AI analysis using GPT-4 Vision
   - Database storage of ratings

### Key Files Updated in Last Session

1. `/frontend/src/components/UploadTest.jsx`
   - Complete rewrite with new features
   - Added sub-components: ScoreSection, FeatureSection, ImprovementsList, RatingDisplay, ErrorDisplay
   - Implemented drag-and-drop functionality
   - Added production-ready error handling

2. `/frontend/src/config.js`
```javascript
const config = {
  development: {
    apiUrl: 'http://localhost:3001'
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'https://your-api-url.com'
  }
};

const environment = import.meta.env.MODE || 'development';
export default config[environment];
```

3. `/backend/src/server.js`
   - Enhanced error handling
   - Added rate limiting
   - Improved CORS configuration
   - Added health check endpoint

## File Structure
```
frontend/
  ├── src/
  │   ├── App.jsx
  │   ├── config.js
  │   ├── components/
  │   │   └── UploadTest.jsx
  │   ├── main.jsx
  │   └── index.css
backend/
  ├── src/
  │   └── server.js
  └── .env
```

## Environment Configuration
Required environment variables:
```env
# Backend (.env)
NODE_ENV=development
PORT=3001
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:3001
```

## Database Schema (Supabase)
```sql
create table tree_ratings (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  image_url text not null,
  aesthetics_score numeric not null check (aesthetics_score >= 0 and aesthetics_score <= 5),
  originality_score numeric not null check (originality_score >= 0 and originality_score <= 5),
  aesthetics_explanation text not null,
  originality_explanation text not null,
  great_features text not null,
  improvements text[] not null
);
```

## Strategy for Next Session

### 1. Implement Leaderboard Feature
Files to create/modify:
- `/backend/src/server.js`: Add new endpoint
- `/frontend/src/components/Leaderboard.jsx`: Create new component
- `/frontend/src/App.jsx`: Add routing

Backend endpoint requirements:
```javascript
// GET /api/top-trees
// Should return:
{
  trees: [{
    id: number,
    image_url: string,
    aesthetics_score: number,
    originality_score: number,
    total_score: number,
    created_at: string
  }]
}
```

Leaderboard component should:
- Display top 10 trees by default
- Allow sorting by aesthetics, originality, or combined score
- Show thumbnail, scores, and upload date
- Include pagination
- Implement infinite scroll or "Load More" button

### 2. Add Navigation
Create `/frontend/src/components/Navigation.jsx`:
- Header with logo
- Navigation links (Upload / Leaderboard)
- Consider adding year selection for seasonal views

### 3. Implement Image Validation
Enhance `/backend/src/server.js`:
- Add OpenAI check to verify image contains a Christmas tree
- Implement proper image format validation
- Add size/dimension restrictions

### 4. Production Preparation
Steps needed:
1. Create deployment configurations
2. Set up CI/CD pipeline
3. Configure production environment variables
4. Set up monitoring and error tracking

## Technical Requirements
- Frontend: React, Tailwind CSS, React Router
- Backend: Express, OpenAI, @supabase/supabase-js
- Database: Supabase
- New dependencies to add: react-router-dom

## Notes
- Maximum file upload size: 5MB
- Rate limit: 10 uploads per 15 minutes per IP
- Backend port: 3001
- Frontend dev server port: 5173
- Supabase storage bucket: 'christmas-trees'

## How to test this locally
make sure your backend is running
cd backend
npm install  # if you haven't already
npm start    # should start on port 3001

In a new terminal, start the frontend
cd frontend
npm install  # if you haven't already
npm run dev  # should start on port 5173