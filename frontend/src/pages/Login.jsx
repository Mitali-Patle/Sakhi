import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroupByLeaderPhone } from '../api/client';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await getGroupByLeaderPhone(phone.trim());
      localStorage.setItem('sakhiGroupId', res.data.id);
      localStorage.setItem('sakhiGroupName', res.data.groupName);
      localStorage.setItem('sakhiLeaderName', res.data.leaderName);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Phone number not found. Please register your group first.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌸</div>
          <h1 className="text-3xl font-bold text-gray-900">Sakhi</h1>
          <p className="text-gray-500 mt-2">SHG Financial Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leader's Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 919876543210"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Enter number with country code (no + or spaces)</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Enter Dashboard →'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-3">New group? Register here:</p>
          <a
            href="/login#register"
            className="text-blue-600 hover:underline text-sm font-medium"
            onClick={(e) => { e.preventDefault(); navigate('/register'); }}
          >
            Register SHG Group →
          </a>
        </div>
      </div>
    </div>
  );
}
