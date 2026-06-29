import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useDarkMode } from '../context/DarkModeContext'

export default function Login() {
  const [dark] = useDarkMode()
  const [creds, setCreds]   = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(creds);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      navigate(res.data.role === 'admin' ? '/admin' : '/');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // return block unchanged, but fix these two inputs to use creds:
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4
                    bg-gradient-to-b from-forest-50 to-bark-100 dark:from-gray-950 dark:to-gray-900">
      <div className="card w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">🌳</span>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
            Admin Login
          </h1>
          <p className="text-gray-500 text-sm mt-1">Campus Tree Map</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800
                          rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300 mb-4">
            {error}
          </div>
        )}

        {/* Keep existing onSubmit handler */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input className="input" value={creds.username}
              onChange={e => setCreds(c => ({ ...c, username: e.target.value }))} required
              style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input className="input" type="password" value={creds.password}
              onChange={e => setCreds(c => ({ ...c, password: e.target.value }))} required
              style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 mt-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}