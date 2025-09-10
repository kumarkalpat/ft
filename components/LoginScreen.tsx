import React, { useState } from 'react';

interface LoginScreenProps {
  onSetSheetUrl: (url: string) => void;
  initialUrl: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSetSheetUrl, initialUrl }) => {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // A simple transformation to ensure it's a CSV export link
    const csvUrl = url.replace('/edit?usp=sharing', '/export?format=csv');
    onSetSheetUrl(csvUrl);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-slate-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Family Tree Viewer</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Enter the URL of your Google Sheet to visualize your family tree.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="sheet-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Google Sheet URL
            </label>
            <input
              id="sheet-url"
              name="sheet-url"
              type="url"
              required
              className="w-full px-3 py-2 mt-1 text-slate-900 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
             <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Make sure your sheet is public. The URL should end with <code>/edit?usp=sharing</code>.
            </p>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Load Tree
          </button>
        </form>
         <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            <p>Or use the default demo data.</p>
            <button
                onClick={() => onSetSheetUrl('')}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
                Load Demo
            </button>
        </div>
      </div>
    </div>
  );
};
