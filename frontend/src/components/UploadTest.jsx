import React, { useState, useCallback } from 'react';
import config from '../config';
import Leaderboard from './Leaderboard';

const ScoreSection = ({ score, explanation, title }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      <div className="flex items-center">
        <span className="text-2xl font-bold text-blue-600">{score}</span>
        <span className="text-gray-500 ml-1">/5</span>
      </div>
    </div>
    <p className="text-gray-600">{explanation}</p>
  </div>
);

const FeatureSection = ({ feature }) => (
  <div className="bg-green-50 p-6 rounded-lg shadow">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">Great Feature</h3>
    <p className="text-gray-600">{feature}</p>
  </div>
);

const ImprovementsList = ({ improvements }) => (
  <div className="bg-orange-50 p-6 rounded-lg shadow">
    <h3 className="text-xl font-semibold text-gray-800 mb-4">Suggested Improvements</h3>
    <ul className="space-y-2">
      {improvements.map((improvement, index) => (
        <li key={index} className="flex items-start">
          <span className="text-orange-500 mr-2">•</span>
          <span className="text-gray-600">{improvement}</span>
        </li>
      ))}
    </ul>
  </div>
);

const RatingDisplay = ({ rating }) => {
  if (!rating) return null;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6 text-center">
        <span className="text-blue-600 font-semibold">🎉 Your tree has been rated!</span>
      </div>
      <ScoreSection 
        score={rating.aesthetics.score} 
        explanation={rating.aesthetics.explanation}
        title="Aesthetics"
      />
      <ScoreSection 
        score={rating.originality.score} 
        explanation={rating.originality.explanation}
        title="Originality"
      />
      <FeatureSection feature={rating.greatFeatures} />
      <ImprovementsList improvements={rating.improvements} />
    </div>
  );
};

const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  const errorMessages = {
    'Too many uploads': 'You\'ve reached the upload limit. Please try again later.',
    'AI service temporarily unavailable': 'Our AI is taking a short break. Please try again in a few minutes.',
    'No rating data received from server': 'We couldn\'t analyze your tree. Please try uploading again.',
    'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.'
  };

  const message = errorMessages[error] || error;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const UploadTest = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [rating, setRating] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large. Please select an image under 5MB (your file: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRating(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${config.apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Error uploading image');
      }

      console.log('Received data from server:', data);
      
      if (!data.rating) {
        throw new Error('No rating data received from server');
      }
      
      setRating(data.rating);
      // Refresh leaderboard after successful upload
      if (window.refreshLeaderboard) {
        window.refreshLeaderboard();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setSelectedImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">
          Christmas Tree Rater
        </h1>
        
        {/* Upload Section - shrinks after upload */}
        <div className={`bg-white rounded-xl shadow-lg ${selectedImage ? 'p-4' : 'p-8'} mb-8 transition-all duration-300`}>
          <div 
            className={`flex flex-col items-center justify-center w-full ${selectedImage ? 'h-32' : 'h-64'} transition-all duration-300`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedImage ? (
              <div className="text-center cursor-pointer" onClick={() => document.getElementById('file-upload').click()}>
                <span className="text-2xl mb-2">🎄</span>
                <p className="text-sm text-gray-500">Upload another tree?</p>
              </div>
            ) : (
              <label 
                htmlFor="file-upload" 
                className={`flex flex-col items-center justify-center w-full h-full border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} border-dashed rounded-lg cursor-pointer transition-colors duration-300`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className="text-4xl mb-4">🎄</span>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum file size: 5MB
                  </p>
                </div>
              </label>
            )}
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleImageUpload}
              accept="image/*"
              disabled={loading}
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-blue-600">Analyzing your tree...</span>
            </div>
          )}

          <ErrorDisplay error={error} />
        </div>

        {/* Two-column layout when both image and rating are present */}
        {selectedImage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tree Preview Column */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Your Tree</h2>
              <img 
                src={selectedImage} 
                alt="Uploaded Christmas Tree" 
                className="w-full h-64 rounded-lg shadow-md object-cover"
              />
            </div>

            {/* Rating Column */}
            {rating && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
                <RatingDisplay rating={rating} />
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <Leaderboard 
            onMount={useCallback((refresh) => {
              // Store the refresh function for later use
              window.refreshLeaderboard = refresh;
            }, [])} 
          />
        </div>
      </div>
    </div>
  );
};

export default UploadTest;
