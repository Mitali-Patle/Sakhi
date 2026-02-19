import { useState } from 'react';
import { createGroup } from '../api/client';
import { useNavigate } from 'react-router-dom';

const FREQUENCIES = ['WEEKLY', 'FORTNIGHTLY', 'MONTHLY'];

export default function GroupForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    groupName: '', registrationNumber: '', village: '', district: '', state: '',
    bankName: '', meetingFrequency: 'MONTHLY', dateFormed: '', leaderPhone: '', leaderName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await createGroup(form);
      localStorage.setItem('sakhiGroupId', res.data.id);
      localStorage.setItem('sakhiGroupName', res.data.groupName);
      localStorage.setItem('sakhiLeaderName', res.data.leaderName);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register group');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌸</div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your SHG Group</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details to create your Sakhi account</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {[
            { label: 'Group Name *', field: 'groupName', required: true, placeholder: 'e.g. Mahalir Mandram' },
            { label: 'Registration Number', field: 'registrationNumber', placeholder: 'Optional' },
            { label: 'Village *', field: 'village', required: true, placeholder: 'Village name' },
            { label: 'District *', field: 'district', required: true, placeholder: 'District name' },
            { label: 'State *', field: 'state', required: true, placeholder: 'State name' },
            { label: 'Bank Name *', field: 'bankName', required: true, placeholder: 'e.g. Indian Bank' },
            { label: 'Leader Name *', field: 'leaderName', required: true, placeholder: 'Full name' },
            { label: 'Leader Phone Number *', field: 'leaderPhone', required: true, placeholder: '919876543210' },
          ].map(({ label, field, required, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text" required={required} value={form[field]}
                onChange={(e) => set(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Frequency *</label>
            <select
              value={form.meetingFrequency}
              onChange={(e) => set('meetingFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Formed *</label>
            <input
              type="date" required value={form.dateFormed}
              onChange={(e) => set('dateFormed', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {error && <div className="col-span-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

          <div className="col-span-2">
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Group & Enter Dashboard →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
