const express = require('express');
const router = express.Router();
const prisma = require('../../db/prisma');

// GET dashboard analytics for a group
router.get('/:groupId', async (req, res) => {
  try {
    const group = await prisma.sHGGroup.findUnique({ where: { id: req.params.groupId } });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const members = await prisma.member.findMany({
      where: { groupId: req.params.groupId },
      orderBy: { creditScore: 'desc' },
    });

    const recentTransactions = await prisma.transaction.findMany({
      where: { groupId: req.params.groupId },
      include: { member: { select: { fullName: true } } },
      orderBy: { actualDate: 'desc' },
      take: 10,
    });

    const pendingLoans = await prisma.loanRequest.findMany({
      where: { groupId: req.params.groupId, status: 'PENDING' },
      include: { member: { select: { fullName: true, creditScore: true, scoreBand: true } } },
    });

    const allLoans = await prisma.loanRequest.findMany({
      where: { groupId: req.params.groupId },
    });

    const activeLoans = allLoans.filter((l) => l.status === 'APPROVED' || l.status === 'DISBURSED');

    // Calculate group credit score as weighted average
    const groupCreditScore =
      members.length > 0
        ? Math.round(members.reduce((s, m) => s + m.creditScore, 0) / members.length * 10) / 10
        : 0;

    // Meeting attendance rate
    const attendances = await prisma.meetingAttendance.findMany({
      where: { member: { groupId: req.params.groupId } },
    });
    const attended = attendances.filter((a) => a.attended).length;
    const meetingAttendanceRate =
      attendances.length > 0 ? Math.round((attended / attendances.length) * 1000) / 10 : 0;

    const memberSummaries = members.map((m) => ({
      id: m.id,
      name: m.fullName,
      creditScore: Math.round(m.creditScore),
      scoreBand: m.scoreBand,
      activeLoans: activeLoans.filter((l) => l.memberId === m.id).length,
      outstandingLoanAmount: m.outstandingLoanAmount,
    }));

    res.json({
      group,
      groupCreditScore,
      totalMembers: members.length,
      totalCorpus: group.corpusAmount,
      activeLoanCount: activeLoans.length,
      totalLoansGiven: allLoans.filter((l) => l.status !== 'PENDING' && l.status !== 'REJECTED').length,
      pendingLoanRequests: pendingLoans.length,
      pendingLoans,
      memberSummaries,
      recentTransactions,
      meetingAttendanceRate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
