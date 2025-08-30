import React, { useState } from 'react';
import API from '../utils/api';

function AIMarketingPanel() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await API.get('/ai/marketing-suggestions');
      setSuggestions(res.data.suggestions.split('\n'));
    } catch (err) {
      setSuggestions(['Failed to fetch suggestions.']);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto border rounded shadow">
      <h2 className="text-xl font-bold mb-2">AI Marketing Suggestions</h2>
      <p className="text-gray-600 mb-4">
        Click the button below to generate AI-powered marketing suggestions.
      </p>
      <button 
        onClick={fetchSuggestions} 
        className="bg-green-600 text-white p-2 rounded hover:bg-green-700 mb-2"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Suggestions'}
      </button>
      
      {loading && <p className="text-gray-500">Loading...</p>}
      
      {suggestions.length > 0 && (
        <ul className="list-disc pl-5 mt-4">
          {suggestions.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AIMarketingPanel;