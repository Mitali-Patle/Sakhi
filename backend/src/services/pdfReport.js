// PDF report generation — returns HTML (use browser print-to-PDF)
const prisma = require('../db/prisma');

function scoreColor(band) {
  switch (band) {
    case 'EXCELLENT': return '#16a34a';
    case 'GOOD': return '#2563eb';
    case 'FAIR': return '#d97706';
    case 'NEEDS_IMPROVEMENT': return '#dc2626';
    default: return '#6b7280';
  }
}

function monthlyContributions(transactions, months = 6) {
  const now = new Date();
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    const total = transactions
      .filter((t) => {
        const d = new Date(t.actualDate);
        return t.type === 'CONTRIBUTION' && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);
    result.push({ label, total });
  }
  return result;
}

function buildGroupHTML(group, members, allTransactions, reportDate) {
  const totalCorpus = group.corpusAmount;
  const avgScore = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.creditScore, 0) / members.length)
    : 0;

  const monthlySums = monthlyContributions(allTransactions);
  const maxBar = Math.max(...monthlySums.map((m) => m.total), 1);

  const barChart = monthlySums.map((m) => {
    const height = Math.round((m.total / maxBar) * 120);
    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <span style="font-size:10px;color:#374151;">₹${(m.total / 1000).toFixed(1)}k</span>
        <div style="width:32px;height:${height}px;background:#3b82f6;border-radius:4px 4px 0 0;min-height:4px;"></div>
        <span style="font-size:9px;color:#6b7280;">${m.label}</span>
      </div>`;
  }).join('');

  const memberRows = members.map((m) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${m.fullName}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${m.tenureMonths} mo</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">
        <span style="font-weight:bold;color:${scoreColor(m.scoreBand)};">${Math.round(m.creditScore)}</span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
        <span style="padding:2px 8px;border-radius:12px;font-size:11px;background:${scoreColor(m.scoreBand)}22;color:${scoreColor(m.scoreBand)};">
          ${m.scoreBand.replace('_', ' ')}
        </span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${m.totalContributed.toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${m.outstandingLoanAmount.toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${m.scoreConfidence}</td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans', Arial, sans-serif; color: #1f2937; padding: 40px; font-size: 13px; }
  h1 { font-size: 22px; color: #1e3a5f; }
  h2 { font-size: 16px; color: #1e3a5f; margin: 24px 0 12px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .stamp { background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 8px 16px; font-weight: bold; color: #16a34a; font-size: 12px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .stat-card .value { font-size: 22px; font-weight: bold; color: #1e3a5f; }
  .stat-card .label { font-size: 11px; color: #6b7280; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e3a5f; color: white; padding: 10px 8px; text-align: left; font-size: 12px; }
  .bar-chart { display: flex; align-items: flex-end; gap: 16px; height: 150px; padding: 16px; background: #f8fafc; border-radius: 8px; justify-content: space-around; }
  .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #6b7280; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>🌸 Sakhi Credit Report</h1>
      <p style="color:#6b7280;margin-top:4px;">${group.groupName} | Reg: ${group.registrationNumber || 'N/A'}</p>
      <p style="color:#6b7280;">${group.village}, ${group.district}, ${group.state}</p>
      <p style="color:#6b7280;">Bank: ${group.bankName} | Meeting: ${group.meetingFrequency}</p>
    </div>
    <div>
      <div class="stamp">✓ Sakhi Verified</div>
      <p style="font-size:11px;color:#6b7280;margin-top:8px;">Report Date: ${reportDate}</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="value">₹${(totalCorpus / 1000).toFixed(1)}k</div>
      <div class="label">Group Corpus</div>
    </div>
    <div class="stat-card">
      <div class="value" style="color:${scoreColor(avgScore >= 80 ? 'EXCELLENT' : avgScore >= 60 ? 'GOOD' : avgScore >= 40 ? 'FAIR' : 'NEEDS_IMPROVEMENT')}">${avgScore}</div>
      <div class="label">Avg Credit Score</div>
    </div>
    <div class="stat-card">
      <div class="value">${members.length}</div>
      <div class="label">Total Members</div>
    </div>
    <div class="stat-card">
      <div class="value">${group.loanCyclesCompleted}</div>
      <div class="label">Loan Cycles Done</div>
    </div>
  </div>

  <h2>6-Month Savings Chart</h2>
  <div class="bar-chart">
    ${barChart}
  </div>

  <h2>Member Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th><th>Tenure</th><th style="text-align:center;">Score</th><th>Band</th><th style="text-align:right;">Total Saved</th><th style="text-align:right;">Active Loan</th><th>Confidence</th>
      </tr>
    </thead>
    <tbody>${memberRows}</tbody>
  </table>

  <div class="footer">
    <p>Data collected via Sakhi digital platform. Attested by SHG leader <strong>${group.leaderName}</strong> on ${reportDate}.</p>
    <p style="margin-top:4px;">This report is generated digitally and is valid for bank loan applications under NABARD SHG-Bank Linkage Programme.</p>
  </div>
</body>
</html>`;
}

async function generateGroupReport(groupId) {
  const group = await prisma.sHGGroup.findUnique({
    where: { id: groupId },
    include: {
      members: true,
    },
  });
  if (!group) throw new Error('Group not found');

  const memberIds = group.members.map((m) => m.id);
  const allTransactions = await prisma.transaction.findMany({
    where: { memberId: { in: memberIds }, actualDate: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } },
    orderBy: { actualDate: 'asc' },
  });

  const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const html = buildGroupHTML(group, group.members, allTransactions, reportDate);
  return html;
}

async function generateMemberReport(memberId) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      group: true,
      transactions: { orderBy: { actualDate: 'desc' }, take: 12 },
      loanRequests: { orderBy: { requestedAt: 'desc' }, take: 5 },
      schemeEligibilities: { where: { isEligible: true } },
    },
  });
  if (!member) throw new Error('Member not found');

  const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const monthlySums = monthlyContributions(member.transactions);
  const maxBar = Math.max(...monthlySums.map((m) => m.total), 1);
  const barChart = monthlySums.map((m) => {
    const height = Math.round((m.total / maxBar) * 100);
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;"><span style="font-size:10px;">₹${m.total}</span><div style="width:28px;height:${height}px;background:#3b82f6;border-radius:4px 4px 0 0;min-height:2px;"></div><span style="font-size:9px;color:#6b7280;">${m.label}</span></div>`;
  }).join('');

  const txRows = member.transactions.slice(0, 10).map((t) => `
    <tr>
      <td style="padding:6px;border-bottom:1px solid #e5e7eb;">${new Date(t.actualDate).toLocaleDateString('en-IN')}</td>
      <td style="padding:6px;border-bottom:1px solid #e5e7eb;">${t.type}</td>
      <td style="padding:6px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${t.amount}</td>
      <td style="padding:6px;border-bottom:1px solid #e5e7eb;">${t.daysLate > 0 ? `${t.daysLate}d late` : 'On time'}</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans', Arial, sans-serif; color: #1f2937; padding: 40px; font-size: 13px; }
  h1 { font-size: 20px; color: #1e3a5f; } h2 { font-size: 15px; color: #1e3a5f; margin: 20px 0 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; } th { background: #1e3a5f; color: white; padding: 8px; font-size: 12px; text-align: left; }
  .score { font-size: 48px; font-weight: bold; color: ${scoreColor(member.scoreBand)}; }
  .bar-chart { display:flex;align-items:flex-end;gap:12px;height:120px;padding:12px;background:#f8fafc;border-radius:8px;justify-content:space-around; }
</style>
</head>
<body>
  <h1>🌸 Sakhi Member Credit Report</h1>
  <p style="color:#6b7280;margin-top:4px;">${member.fullName} | ${member.group.groupName}</p>
  <p style="color:#6b7280;">Phone: ${member.phoneNumber} | Joined: ${new Date(member.dateJoined).toLocaleDateString('en-IN')}</p>
  <p style="color:#6b7280;margin-top:4px;">Report Date: ${reportDate}</p>

  <h2>Credit Score</h2>
  <div style="display:flex;align-items:center;gap:24px;padding:16px;background:#f8fafc;border-radius:8px;">
    <div class="score">${Math.round(member.creditScore)}/100</div>
    <div>
      <p style="font-size:16px;font-weight:bold;color:${scoreColor(member.scoreBand)};">${member.scoreBand.replace('_', ' ')}</p>
      <p style="color:#6b7280;font-size:12px;">Confidence: ${member.scoreConfidence}</p>
      <p style="color:#6b7280;font-size:12px;">Tenure: ${member.tenureMonths} months</p>
      <p style="color:#6b7280;font-size:12px;">Total Contributed: ₹${member.totalContributed.toLocaleString()}</p>
    </div>
  </div>

  <h2>6-Month Savings</h2>
  <div class="bar-chart">${barChart}</div>

  <h2>Recent Transactions</h2>
  <table><thead><tr><th>Date</th><th>Type</th><th style="text-align:right;">Amount</th><th>Status</th></tr></thead><tbody>${txRows}</tbody></table>

  <h2>Eligible Government Schemes</h2>
  <ul style="padding-left:16px;">
    ${member.schemeEligibilities.map((s) => `<li>${s.schemeName}</li>`).join('') || '<li>None at this time</li>'}
  </ul>

  <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px;font-size:11px;color:#6b7280;">
    Data collected via Sakhi digital platform. Attested by SHG leader <strong>${member.group.leaderName}</strong> on ${reportDate}.
  </div>
</body>
</html>`;

  return html;
}

module.exports = { generateGroupReport, generateMemberReport };
