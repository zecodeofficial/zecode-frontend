'use client';

import { useState } from 'react';

export default function GoogleAuthPage() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Copy to clipboard
    navigator.clipboard.writeText(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-gray-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          🔐 Google API Key Setup
        </h1>
        
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Step 1: Get API Key</h2>
            <p className="text-gray-300 text-sm mb-3">
              Open Google AI Studio and create/copy your API key:
            </p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Open Google AI Studio →
            </a>
          </div>

          {/* Step 2 */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Step 2: Paste Your Key</h2>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API key here..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Step 3 */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Step 3: Copy & Use</h2>
            <p className="text-gray-300 text-sm mb-3">
              Add this to your <code className="bg-gray-900 px-1 rounded">.env.local</code> file:
            </p>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-green-400 break-all">
              GEMINI_API_KEY={apiKey || 'your_key_here'}
            </div>
            <button
              onClick={handleSave}
              disabled={!apiKey}
              className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {saved ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
            <h3 className="text-purple-300 font-semibold mb-2">💡 For Vercel Deployment</h3>
            <p className="text-gray-300 text-sm">
              Add <code className="bg-gray-900 px-1 rounded">GEMINI_API_KEY</code> to your Vercel project:
            </p>
            <ol className="text-gray-400 text-sm mt-2 space-y-1 list-decimal list-inside">
              <li>Go to Vercel Dashboard → Project Settings</li>
              <li>Click Environment Variables</li>
              <li>Add GEMINI_API_KEY with your key value</li>
              <li>Redeploy your project</li>
            </ol>
          </div>
        </div>

        <p className="text-gray-500 text-xs text-center mt-6">
          This page doesn't store or transmit your API key anywhere.
        </p>
      </div>
    </div>
  );
}
