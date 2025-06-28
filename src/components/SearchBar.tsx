// src/components/searchBar.tsx
'use client';
import { useState } from 'react';
import type { SearchResult } from '@/types';

interface SearchBarProps {
  sheets: string[];
  onSearch: (query: string) => Promise<{
    results: SearchResult[];
  }>;
}

export default function SearchBar({ sheets, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError('');
    
    try {
      const response = await onSearch(query);
      setResults(response.results || []);
    } catch (err) {
      setError('Search failed. Try rephrasing your query.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search with natural language (e.g. 'tasks with duration > 1')"
          className="flex-1 p-2 border border-gray-600 rounded bg-gray-800 text-white"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="text-red-400 mb-2">{error}</div>}

      {results.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">Search Results</h3>
          {results.map((result, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{result.matchingSheet}</span>
                <span className="text-sm text-gray-400">
                  ({result.matchingRows.length} matches)
                </span>
                <span className="text-sm text-yellow-400 ml-auto">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-sm text-gray-300 mb-2">
                {result.explanation}
              </div>
              {result.suggestedQuery && (
                <div className="text-xs text-blue-400">
                  Try: "{result.suggestedQuery}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}