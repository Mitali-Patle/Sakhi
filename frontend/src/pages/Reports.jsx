import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { downloadGroupReport, downloadMemberReport, getMembers } from '../api/client';
import { useEffect } from 'react';

export default function Reports() {
  const [generating, setGenerating] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const groupId = localStorage.getItem('sakhiGroupId');
  const groupName = localStorage.getItem('sakhiGroupName');

  useEffect(() => {
    getMembers(groupId).then((res) => setMembers(res.data)).catch(() => {});
  }, []);

  async function handleGroupReport() {
    setGenerating(true);
    try {
      const res = await downloadGroupReport(groupId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sakhi-group-report-${groupName?.replace(/\s+/g, '-')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate report. Make sure Puppeteer is set up correctly.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleMemberReport() {
    if (!selectedMember) return alert('Please select a member');
    setGenerating(true);
    try {
      const res = await downloadMemberReport(selectedMember);
      const member = members.find((m) => m.id === selectedMember);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sakhi-${member?.fullName?.replace(/\s+/g, '-')}-report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate member report.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-500 text-sm mb-8">Generate bank-ready PDF credit reports for your SHG group or individual members.</p>

          {/* Group Report */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏦</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Group Credit Report</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Generates a complete A4 PDF with group overview, 6-month savings chart, repayment timeline,
                  all members' credit scores, and scheme eligibility. Suitable for NABARD bank linkage applications.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">Group summary stats</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">6-month savings chart</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">All members table</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Scheme eligibility</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Leader attestation</span>
                </div>
                <button
                  onClick={handleGroupReport}
                  disabled={generating}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  {generating ? 'Generating PDF...' : '📄 Download Group Report'}
                </button>
              </div>
            </div>
          </div>

          {/* Member Report */}
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">👤</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Individual Member Report</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Generates a member-specific PDF with credit score breakdown, transaction history,
                  loan history, and scheme eligibility. Suitable for PM Mudra Yojana applications.
                </p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Member</label>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">-- Choose a member --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName} (Score: {Math.round(m.creditScore)})</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleMemberReport}
                  disabled={generating || !selectedMember}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  {generating ? 'Generating PDF...' : '📄 Download Member Report'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>⚠️ Note:</strong> PDF generation requires Puppeteer/Chromium to be properly installed.
            In Docker, this is handled automatically. For manual setup, run <code className="bg-amber-100 px-1 rounded">npm install</code> in the backend directory.
          </div>
        </div>
      </main>
    </div>
  );
}
