import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { ScoreBadge } from '../components/CreditScoreCard';
import { getGroupLoans, approveLoan, rejectLoan } from '../api/client';

const PURPOSE_ICONS = {
  AGRICULTURE: '🌾', BUSINESS: '🏪', EDUCATION: '📚',
  MEDICAL: '🏥', HOME_REPAIR: '🏠', FAMILY_FUNCTION: '🎉', OTHER: '📋',
};

export default function LoanApprovals() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [actioning, setActioning] = useState(null);
  const groupId = localStorage.getItem('sakhiGroupId');

  async function load() {
    setLoading(true);
    try {
      const res = await getGroupLoans(groupId, filter);
      setLoans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function handleApprove(id) {
    setActioning(id + '_approve');
    await approveLoan(id);
    setActioning(null);
    load();
  }

  async function handleReject(id) {
    setActioning(id + '_reject');
    await rejectLoan(id);
    setActioning(null);
    load();
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Loan Requests</h1>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading loans...</div>
          ) : loans.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              No {filter.toLowerCase()} loan requests.
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className={`bg-white border rounded-xl p-6 ${
                    loan.status === 'PENDING' ? 'border-amber-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{PURPOSE_ICONS[loan.purpose] || '📋'}</div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">₹{loan.amount.toLocaleString()}</div>
                        <div className="text-gray-600 text-sm">{loan.member?.fullName}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          {loan.purpose} · {loan.repaymentMonths} months repayment
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Credit Score: {Math.round(loan.member?.creditScore || 0)}</span>
                          <ScoreBadge band={loan.member?.scoreBand} />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Requested: {new Date(loan.requestedAt).toLocaleDateString('en-IN')}
                          {loan.resolvedAt && <span> · Resolved: {new Date(loan.resolvedAt).toLocaleDateString('en-IN')}</span>}
                        </div>
                      </div>
                    </div>

                    {loan.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(loan.id)}
                          disabled={actioning}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actioning === loan.id + '_approve' ? '...' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(loan.id)}
                          disabled={actioning}
                          className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actioning === loan.id + '_reject' ? '...' : '✕ Reject'}
                        </button>
                      </div>
                    )}

                    {loan.status !== 'PENDING' && (
                      <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                        loan.status === 'APPROVED' || loan.status === 'DISBURSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {loan.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
