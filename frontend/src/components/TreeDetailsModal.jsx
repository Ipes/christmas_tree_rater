import React from 'react';

function TreeDetailsModal({ tree, onClose }) {
  if (!tree) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-green-800">Tree #{tree.id}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <img 
              src={tree.image_url} 
              alt={`Tree #${tree.id}`} 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="font-semibold text-green-800">Aesthetics Score</span>
              <span className="text-xl font-bold text-green-600">{tree.aesthetics_score}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="font-semibold text-green-800">Originality Score</span>
              <span className="text-xl font-bold text-green-600">{tree.originality_score}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="font-semibold text-green-800">Total Score</span>
              <span className="text-xl font-bold text-green-600">
                {tree.aesthetics_score + tree.originality_score}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TreeDetailsModal;
