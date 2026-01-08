'use client';

import { useState } from 'react';

export default function ProxyBrowserPage() {
  const [url, setUrl] = useState('https://accounts.google.com');
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const quickLinks = [
    { name: 'Google Accounts', url: 'https://accounts.google.com' },
    { name: 'Google AI Studio', url: 'https://aistudio.google.com/app/apikey' },
    { name: 'Google Cloud Console', url: 'https://console.cloud.google.com' },
    { name: 'Gmail', url: 'https://mail.google.com' },
  ];

  const getProxyUrl = (targetUrl: string) => {
    return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
  };

  const loadUrl = (targetUrl: string) => {
    setLoading(true);
    setUrl(targetUrl);
    setCurrentUrl(getProxyUrl(targetUrl));
    // Loading state will be cleared when iframe loads
    setTimeout(() => setLoading(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUrl(url);
  };

  const openInNewTab = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    } else {
      window.open(getProxyUrl(url), '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">🌐 Proxy Browser</h1>
          <button
            onClick={openInNewTab}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
          >
            Open in New Tab ↗
          </button>
        </div>
        
        {/* Quick Links */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickLinks.map((link) => (
            <button
              key={link.url}
              onClick={() => loadUrl(link.url)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              {link.name}
            </button>
          ))}
        </div>

        {/* URL Bar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL..."
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {loading ? '⏳' : 'Go'}
          </button>
        </form>
      </div>

      {/* Browser Frame */}
      <div className="flex-1 bg-white relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
            <div className="text-white text-xl">Loading through proxy...</div>
          </div>
        )}
        {currentUrl ? (
          <iframe
            src={currentUrl}
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100vh - 200px)' }}
            title="Proxy Browser"
            onLoad={() => setLoading(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center p-8">
              <p className="text-6xl mb-4">🌐</p>
              <p className="text-xl mb-4">Click a quick link or enter a URL</p>
              <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 max-w-md text-left">
                <p className="text-yellow-300 font-semibold mb-2">⚠️ Google Login Limitation</p>
                <p className="text-gray-300 text-sm">
                  Google blocks login in iframes/proxies for security. If login doesn&apos;t work:
                </p>
                <ul className="text-gray-400 text-sm mt-2 list-disc list-inside space-y-1">
                  <li>Click &quot;Open in New Tab&quot; button above</li>
                  <li>Use your phone on mobile data</li>
                  <li>Try from a different network</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 text-center text-xs text-gray-500">
        Current: {currentUrl ? decodeURIComponent(currentUrl.replace('/api/proxy?url=', '')) : 'None'}
      </div>
    </div>
  );
}
