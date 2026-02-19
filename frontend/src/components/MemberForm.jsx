import { useState } from 'react';
import { createMember } from '../api/client';

const LANGUAGES = ['TAMIL', 'HINDI', 'TELUGU', 'ENGLISH'];

export default function MemberForm({ groupId, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    fullName: '', phoneNumber: '', language: 'TAMIL',
    tenureMonths: 0, loansCompleted: 0, totalContributed: 0,
    repaymentOnTime: true, outstandingLoanAmount: 0, hasBankAccount: false,
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
      await createMember({ ...form, groupId });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text" required value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Member's full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            type="tel" required value={form.phoneNumber}
            onChange={(e) => set('phoneNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="TG_123456789"
          />
          <p className="text-xs text-gray-400 mt-1">For Telegram users, enter TG_ followed by their Telegram ID (e.g. TG_123456789)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            value={form.language}
            onChange={(e) => set('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (months)</label>
          <input
            type="number" min="0" value={form.tenureMonths}
            onChange={(e) => set('tenureMonths', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loans Completed</label>
          <input
            type="number" min="0" value={form.loansCompleted}
            onChange={(e) => set('loansCompleted', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Contributed (₹)</label>
          <input
            type="number" min="0" value={form.totalContributed}
            onChange={(e) => set('totalContributed', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding Loan (₹)</label>
          <input
            type="number" min="0" value={form.outstandingLoanAmount}
            onChange={(e) => set('outstandingLoanAmount', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-4 pt-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.repaymentOnTime} onChange={(e) => set('repaymentOnTime', e.target.checked)} className="rounded" />
            Repayment on time (historical)
          </label>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.hasBankAccount} onChange={(e) => set('hasBankAccount', e.target.checked)} className="rounded" />
            Has bank account
          </label>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit" disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? 'Adding...' : 'Add Member'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors text-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
