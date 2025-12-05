import React, { useState } from 'react';
import API from '../utils/api';

function AIAdminPanel() {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRunCommand = async () => {
    if (!command) {
      setError('Please enter a command.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/ai/admin-assistant', { command });
      setResult(res.data.result);
      setCommand(''); // Komut gönderildikten sonra metin kutusunu temizle
    } catch (err) {
      setError('AI assistant failed. Please check your command.');
      setResult('');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto border rounded shadow">
      <h2 className="text-xl font-bold mb-2">Admin AI Assistant</h2>
      <p className="text-gray-600 mb-4">
        Enter a command to get a quick response from the AI assistant.
        <br />
        Example Commands: "total users", "top 5 tours"
      </p>
      <textarea
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Enter admin command"
        className="w-full p-2 border rounded mb-2"
        rows={4}
      />
      <button
        onClick={handleRunCommand}
        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Run Command'}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {result && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}

export default AIAdminPanel;
