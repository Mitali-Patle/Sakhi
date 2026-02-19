import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MemberForm from '../components/MemberForm';
import { ScoreBadge } from '../components/CreditScoreCard';
import { getMembers } from '../api/client';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const groupId = localStorage.getItem('sakhiGroupId');

  async function load() {
    setLoading(true);
    try {
      const res = await getMembers(groupId);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = members.filter((m) =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.phoneNumber.includes(search)
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Members ({members.length})</h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Member
            </button>
          </div>

          {showForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Member</h2>
              <MemberForm
                groupId={groupId}
                onSuccess={() => { setShowForm(false); load(); }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading members...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No members found. Add your first member above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left p-4 text-gray-500 font-medium">Name</th>
                      <th className="text-left p-4 text-gray-500 font-medium">Phone</th>
                      <th className="text-left p-4 text-gray-500 font-medium">Language</th>
                      <th className="text-left p-4 text-gray-500 font-medium">Credit Score</th>
                      <th className="text-left p-4 text-gray-500 font-medium">Band</th>
                      <th className="text-right p-4 text-gray-500 font-medium">Tenure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/members/${m.id}`)}
                      >
                        <td className="p-4 font-medium text-gray-900">{m.fullName}</td>
                        <td className="p-4 text-gray-600">{m.phoneNumber}</td>
                        <td className="p-4 text-gray-600 text-xs">{m.language}</td>
                        <td className="p-4 font-semibold text-gray-900">{Math.round(m.creditScore)}/100</td>
                        <td className="p-4"><ScoreBadge band={m.scoreBand} /></td>
                        <td className="p-4 text-right text-gray-600">{m.tenureMonths}mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
