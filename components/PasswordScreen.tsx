import React, { useState } from 'react';

interface PasswordScreenProps {
  onSuccess: () => void;
}

export const PasswordScreen: React.FC<PasswordScreenProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const correctPassword = 'KNIFT103';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-slate-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Kalpats Family Tree</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Please enter the password to continue.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password-input" className="sr-only">
              Password
            </label>
            <input
              id="password-input"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 text-slate-900 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};
