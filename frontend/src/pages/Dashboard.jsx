import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ScoreBadge } from '../components/CreditScoreCard';
import { getDashboard, approveLoan, rejectLoan } from '../api/client';

function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };
  return (
    <div className={`${colors[color]} border rounded-xl p-5`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const groupId = localStorage.getItem('sakhiGroupId');

  async function load() {
    try {
      const res = await getDashboard(groupId);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(loanId) {
    await approveLoan(loanId);
    load();
  }

  async function handleReject(loanId) {
    await rejectLoan(loanId);
    load();
  }

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data?.group?.groupName || 'Dashboard'}</h1>
              <p className="text-gray-500 text-sm mt-1">{data?.group?.village}, {data?.group?.district}</p>
            </div>
            <Link
              to="/reports"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              📄 Generate Bank Report
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon="👥" label="Total Members" value={data?.totalMembers || 0} color="blue" />
            <StatCard icon="💰" label="Group Corpus" value={`₹${((data?.totalCorpus || 0) / 1000).toFixed(1)}k`} color="green" />
            <StatCard icon="⭐" label="Group Credit Score" value={`${data?.groupCreditScore || 0}/100`} color="purple" />
            <StatCard icon="📋" label="Active Loans" value={data?.activeLoanCount || 0} sub={`${data?.pendingLoanRequests || 0} pending`} color="amber" />
          </div>

          {/* Pending Loans */}
          {data?.pendingLoans?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Pending Loan Approvals</h2>
              <div className="space-y-3">
                {data.pendingLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div>
                      <div className="font-semibold text-gray-900">{loan.member?.fullName}</div>
                      <div className="text-sm text-gray-600">₹{loan.amount.toLocaleString()} — {loan.purpose} — {loan.repaymentMonths} months</div>
                      <div className="text-xs text-gray-400 mt-1">Score: {Math.round(loan.member?.creditScore || 0)} <ScoreBadge band={loan.member?.scoreBand} /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(loan.id)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Approve</button>
                      <button onClick={() => handleReject(loan.id)} className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-1.5 rounded-lg transition-colors">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Members</h2>
              <Link to="/members" className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Credit Score</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Band</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Active Loans</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.memberSummaries || []).slice(0, 8).map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/members/${m.id}`)}>
                      <td className="py-3 font-medium text-gray-900">{m.name}</td>
                      <td className="py-3 text-gray-700">{m.creditScore}/100</td>
                      <td className="py-3"><ScoreBadge band={m.scoreBand} /></td>
                      <td className="py-3 text-right text-gray-600">{m.activeLoans}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
