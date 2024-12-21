import React, { useState, useEffect } from 'react';
import config from '../config';
import TreeDetailsModal from './TreeDetailsModal';

function Leaderboard({ onMount }) {
  const IMAGE_SIZE = 100; // thumbnail size in pixels
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTree, setSelectedTree] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.apiUrl}/api/top-trees`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Leaderboard fetch error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }
      const data = await response.json();
      console.log('Leaderboard data received:', data);
      if (!data || !Array.isArray(data.trees)) {
        console.error('Invalid leaderboard data:', data);
        throw new Error('Invalid response format from server');
      }
      const formattedTrees = data.trees
        .slice(0, 5) // Limit to top 5
        .map(tree => ({
          ...tree,
          user: `Tree #${tree.id}`,
          score: tree.aesthetics_score + tree.originality_score,
          imageUrl: tree.image_url
        }));
      setLeaderboard(formattedTrees);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Call onMount with the fetch function so parent can trigger refreshes
  useEffect(() => {
    if (onMount) {
      onMount(fetchLeaderboard);
    }
  }, [onMount]);

  if (loading) {
    return <p>Loading leaderboard...</p>;
  }

  if (error) {
    return <p>Error loading leaderboard: {error}</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-green-800">Best rated trees</h2>
      <div className="grid gap-4">
        {leaderboard.map((entry, index) => (
          <div 
            key={index} 
            className="flex items-center bg-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-green-50 transition-colors"
            onClick={() => setSelectedTree(entry)}
          >
            <div className="flex-shrink-0 w-[100px] h-[100px] mr-6">
              <img 
                src={entry.imageUrl} 
                alt={entry.user} 
                className="w-full h-full object-cover rounded-lg"
                style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
              />
            </div>
            <div className="flex-grow">
              <div className="flex items-center">
                <span className="text-3xl font-bold text-green-600">#{index + 1}</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-semibold text-green-800">Score: {entry.score}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedTree && (
        <TreeDetailsModal
          tree={selectedTree}
          onClose={() => setSelectedTree(null)}
        />
      )}
    </div>
  );
}

export default Leaderboard;
