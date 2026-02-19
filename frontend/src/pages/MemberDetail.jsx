import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CreditScoreCard from '../components/CreditScoreCard';
import TransactionHistory from '../components/TransactionHistory';
import { getMember, downloadMemberReport } from '../api/client';

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function MemberDetail() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getMember(id).then((res) => { setMember(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  async function handleDownloadReport() {
    setDownloading(true);
    try {
      const res = await downloadMemberReport(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sakhi-member-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate report: ' + err.message);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 flex items-center justify-center text-gray-400">Loading...</main>
    </div>
  );

  if (!member) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 flex items-center justify-center text-gray-400">Member not found</main>
    </div>
  );

  const eligibleSchemes = (member.schemeEligibilities || []).filter((s) => s.isEligible);
  const activeLoans = (member.loanRequests || []).filter((l) => ['PENDING', 'APPROVED', 'DISBURSED'].includes(l.status));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Link to="/members" className="text-blue-600 hover:underline text-sm">← Back to Members</Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{member.fullName}</h1>
              <p className="text-gray-500 text-sm">{member.phoneNumber} · {member.language} · {member.group?.groupName}</p>
              <p className="text-gray-400 text-xs mt-1">
                Joined: {new Date(member.dateJoined).toLocaleDateString('en-IN')} · Tenure: {member.tenureMonths} months
              </p>
            </div>
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {downloading ? 'Generating...' : '📄 Download PDF Report'}
            </button>
          </div>

          {/* Credit Score */}
          <Section title="Credit Score">
            <CreditScoreCard score={member.creditScore} band={member.scoreBand} confidence={member.scoreConfidence} size="lg" />
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500">Total Contributed</div>
                <div className="font-bold text-gray-900">₹{member.totalContributed?.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500">Outstanding Loan</div>
                <div className="font-bold text-gray-900">₹{member.outstandingLoanAmount?.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500">Loans Completed</div>
                <div className="font-bold text-gray-900">{member.loansCompleted}</div>
              </div>
            </div>
          </Section>

          {/* Active Loans */}
          {activeLoans.length > 0 && (
            <Section title="Active & Pending Loans">
              <div className="space-y-2">
                {activeLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                    <div>
                      <span className="font-semibold">₹{loan.amount.toLocaleString()}</span>
                      <span className="text-gray-500 ml-2">— {loan.purpose} — {loan.repaymentMonths} months</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      loan.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      loan.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{loan.status}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Transactions */}
          <Section title="Transaction History">
            <TransactionHistory transactions={member.transactions || []} />
          </Section>

          {/* Government Schemes */}
          <Section title="Government Scheme Eligibility">
            {eligibleSchemes.length === 0 ? (
              <p className="text-gray-400 text-sm">No eligible schemes yet. Encourage regular contributions!</p>
            ) : (
              <div className="space-y-2">
                {eligibleSchemes.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <div>
                      <div className="font-medium text-green-800">{s.schemeName.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-green-600">{s.notified ? 'Member notified' : 'Not yet notified'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </main>
    </div>
  );
}
