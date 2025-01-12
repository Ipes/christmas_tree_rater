Christmas Tree Rater - Project Documentation
Project Overview
A web application that allows users to upload photos of Christmas trees and receive AI-powered ratings and feedback. The application analyzes the aesthetics and originality of each tree, providing specific scores, explanations, and improvement suggestions.

Environment Configuration
Required environment variables:

# Backend (.env)
NODE_ENV=development
PORT=3001
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:3001
Database Schema (Supabase)
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
Technical Requirements
Frontend: React, Tailwind CSS, React Router
Backend: Express, OpenAI, @supabase/supabase-js
Database: Supabase
New dependencies to add: react-router-dom
Notes
Maximum file upload size: 5MB
Rate limit: 10 uploads per 15 minutes per IP
Backend port: 3001
Frontend dev server port: 5173
Supabase storage bucket: 'christmas-trees'
How to test this locally
make sure your backend is running cd backend npm install # if you haven't already npm start # should start on port 3001

In a new terminal, start the frontend cd frontend npm install # if you haven't already npm run dev # should start on port 5173
