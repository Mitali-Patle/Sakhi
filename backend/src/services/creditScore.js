const prisma = require('../db/prisma');

function getBand(score) {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'FAIR';
  return 'NEEDS_IMPROVEMENT';
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

// Linear regression slope — used for Growth factor
function linearSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  const num = values.reduce((sum, y, x) => sum + (x - xMean) * (y - yMean), 0);
  const den = values.reduce((sum, _, x) => sum + Math.pow(x - xMean, 2), 0);
  return den === 0 ? 0 : num / den;
}

async function calculateCreditScore(memberId) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      transactions: { orderBy: { actualDate: 'asc' } },
      meetingAttendances: true,
      loanRequests: true,
      group: {
        include: {
          members: {
            where: { id: { not: memberId } }, // other members only for connections
            select: { creditScore: true },
          },
        },
      },
    },
  });

  if (!member) return null;

  const transactions = member.transactions;
  const contributions = transactions.filter((t) => t.type === 'CONTRIBUTION');
  const repayments = transactions.filter((t) => t.type === 'LOAN_REPAYMENT');

  const monthsWithData = new Set(
    transactions.map((t) => {
      const d = new Date(t.actualDate);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })
  ).size;

  const isFoundingScore = monthsWithData < 1;
  let confidence = 'LOW';
  if (monthsWithData >= 6) confidence = 'HIGH';
  else if (monthsWithData >= 1) confidence = 'MEDIUM';

  let score = 50;

  if (isFoundingScore) {
    // ── FOUNDING SCORE ────────────────────────────────────────
    // Uses 5 onboarding snapshot fields only
    score = 40; // baseline
    score += Math.min(member.tenureMonths / 60, 1) * 20;      // tenure proxy
    score += Math.min(member.loansCompleted * 5, 20);          // repayment proxy
    if (member.repaymentOnTime) score += 10;                   // on-time flag
    if (member.outstandingLoanAmount === 0) score += 10;       // no debt = healthy
  } else {
    // ── FACTOR 1: REPAYMENT ON TIME — 25% ────────────────────
    let repaymentOnTimeScore = 100;
    if (repayments.length > 0) {
      const onTime = repayments.filter((r) => r.daysLate <= 0).length;
      repaymentOnTimeScore = (onTime / repayments.length) * 100;
    }

    // ── FACTOR 2: GROWTH — 15% ───────────────────────────────
    // Positive trend in monthly contribution amounts
    const amounts = contributions.map((c) => c.amount);
    let growthScore = 50; // neutral default
    if (amounts.length >= 3) {
      const slope = linearSlope(amounts);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      // Normalize slope relative to average contribution
      const normalizedSlope = avgAmount > 0 ? slope / avgAmount : 0;
      // Map: +10% growth/period = 100, flat = 50, -10% = 0
      growthScore = Math.max(0, Math.min(100, 50 + normalizedSlope * 500));
    }

    // ── FACTOR 3: SPEED OF REPAYMENT — 15% ───────────────────
    // 30+ days early = 100, on due date = 70, 30+ days late = 0
    let speedScore = 100;
    if (repayments.length > 0) {
      const avgDaysLate = repayments.reduce((s, r) => s + r.daysLate, 0) / repayments.length;
      if (avgDaysLate <= -30) speedScore = 100;
      else if (avgDaysLate <= 0) speedScore = 70 + (Math.abs(avgDaysLate) / 30) * 30;
      else speedScore = Math.max(0, 70 - (avgDaysLate / 30) * 70);
    }

    // ── FACTOR 4: CONTRIBUTION FREQUENCY — 13% ───────────────
    // Months with at least one contribution / total months active
    const totalMonthsActive = Math.max(member.tenureMonths, 1);
    const frequencyScore = Math.min((monthsWithData / totalMonthsActive) * 100, 100);

    // ── FACTOR 5: CONTRIBUTION AMOUNT — 12% ──────────────────
    // Consistency (low CV) + generosity (above group minimum)
    const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const sd = stdDev(amounts);
    const cv = avgAmount > 0 ? sd / avgAmount : 1;
    const consistencyScore = Math.max(0, (1 - cv) * 100);
    // Generosity: compare to a baseline of 100 (can be group minimum in future)
    const generosityScore = Math.min((avgAmount / 100) * 50, 100);
    const amountScore = 0.6 * consistencyScore + 0.4 * generosityScore;

    // ── FACTOR 6: CONNECTIONS — 5% ───────────────────────────
    // Average credit score of other members in the same group
    const otherScores = member.group.members.map((m) => m.creditScore);
    const connectionsScore = otherScores.length > 0
      ? otherScores.reduce((a, b) => a + b, 0) / otherScores.length
      : 50;

    // ── FACTOR 7: ATTENDANCE — 5% ────────────────────────────
    const totalMeetings = member.meetingAttendances.length;
    const attended = member.meetingAttendances.filter((a) => a.attended).length;
    const attendanceScore = totalMeetings > 0 ? (attended / totalMeetings) * 100 : 75;

    // ── FACTOR 8: TENURE — 5% ────────────────────────────────
    // Capped at 60 months (5 years)
    const tenureScore = Math.min(member.tenureMonths / 60, 1) * 100;

    // ── FACTOR 9: REASON FOR LOAN — 5% ───────────────────────
    const purposeScoreMap = {
      AGRICULTURE: 95,
      BUSINESS: 90,
      EDUCATION: 85,
      HOME_REPAIR: 70,
      MEDICAL: 65,
      FAMILY_FUNCTION: 40,
      OTHER: 35,
    };
    const loanPurposeScores = member.loanRequests.map((l) => purposeScoreMap[l.purpose] || 35);
    const loanReasonScore = loanPurposeScores.length > 0
      ? loanPurposeScores.reduce((a, b) => a + b, 0) / loanPurposeScores.length
      : 70; // neutral default if no loans yet

    // ── WEIGHTED SUM ──────────────────────────────────────────
    score =
      repaymentOnTimeScore * 0.25 +  // 25%
      growthScore          * 0.15 +  // 15%
      speedScore           * 0.15 +  // 15%
      frequencyScore       * 0.13 +  // 13%
      amountScore          * 0.12 +  // 12%
      connectionsScore     * 0.05 +  //  5%
      attendanceScore      * 0.05 +  //  5%
      tenureScore          * 0.05 +  //  5%
      loanReasonScore      * 0.05;   //  5%
    //                      ─────
    //                      100%
  }

  score = Math.max(0, Math.min(100, Math.round(score * 10) / 10));
  const band = getBand(score);

  await prisma.member.update({
    where: { id: memberId },
    data: { creditScore: score, scoreBand: band, scoreConfidence: confidence },
  });

  return { score, band, confidence };
}

module.exports = { calculateCreditScore };
