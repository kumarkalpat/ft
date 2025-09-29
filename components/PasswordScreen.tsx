import React, { useState } from 'react';

interface PasswordScreenProps {
  onSuccess: () => void;
  correctId: string;
  correctPassword?: string;
}

export const PasswordScreen: React.FC<PasswordScreenProps> = ({ onSuccess, correctId, correctPassword }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const hasPassword = correctPassword !== undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isIdCorrect = id.trim().toLowerCase() === correctId.toLowerCase();
    const isPasswordCorrect = !hasPassword || password === correctPassword;

    if (isIdCorrect && isPasswordCorrect) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect ID or password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900 px-4">
      <form className="w-full max-w-md" onSubmit={handleSubmit}>
        <div className="flex items-stretch justify-center gap-2">
          <input
            id="id-input"
            name="id"
            type="text"
            required
            className="flex-grow w-full px-4 h-12 text-slate-900 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white"
            placeholder="ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoFocus
          />
          {hasPassword && (
            <input
              id="password-input"
              name="password"
              type="password"
              required
              className="flex-grow w-full px-4 h-12 text-slate-900 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <button
            type="submit"
            aria-label="Enter"
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        {error && <p className="text-sm text-red-500 text-center pt-2">{error}</p>}
      </form>
    </div>
  );
};
