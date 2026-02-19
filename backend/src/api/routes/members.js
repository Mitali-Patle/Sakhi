const express = require('express');
const router = express.Router();
const prisma = require('../../db/prisma');
const { calculateCreditScore } = require('../../services/creditScore');
const { checkEligibility } = require('../../services/schemeEligibility');

// GET all members for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      where: { groupId: req.params.groupId },
      include: { _count: { select: { transactions: true, loanRequests: true } } },
      orderBy: { creditScore: 'desc' },
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── TELEGRAM: look up member by Telegram user ID ───────────────────────────
// The member's Telegram ID is stored in the phoneNumber field prefixed with "TG_"
// e.g. phoneNumber = "TG_123456789"
router.get('/by-telegram/:telegramId', async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { phoneNumber: `TG_${req.params.telegramId}` },
      include: { group: true },
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single member with full details
router.get('/:id', async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        transactions: { orderBy: { actualDate: 'desc' }, take: 20 },
        loanRequests: { orderBy: { requestedAt: 'desc' } },
        meetingAttendances: { include: { meeting: true }, orderBy: { meeting: { meetingDate: 'desc' } }, take: 12 },
        schemeEligibilities: true,
        group: true,
      },
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET eligible schemes for a member
router.get('/:id/schemes', async (req, res) => {
  try {
    const schemes = await prisma.schemeEligibility.findMany({
      where: { memberId: req.params.id },
    });
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST trigger credit score recalculation
router.post('/:id/recalculate-score', async (req, res) => {
  try {
    const result = await calculateCreditScore(req.params.id);
    await checkEligibility(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create member
router.post('/', async (req, res) => {
  try {
    const {
      groupId, fullName, phoneNumber, language, dateJoined,
      tenureMonths, loansCompleted, totalContributed, repaymentOnTime,
      outstandingLoanAmount, hasBankAccount,
    } = req.body;

    const member = await prisma.member.create({
      data: {
        groupId,
        fullName,
        phoneNumber,
        language: language || 'TAMIL',
        dateJoined: dateJoined ? new Date(dateJoined) : new Date(),
        tenureMonths: tenureMonths || 0,
        loansCompleted: loansCompleted || 0,
        totalContributed: totalContributed || 0,
        repaymentOnTime: repaymentOnTime !== undefined ? repaymentOnTime : true,
        outstandingLoanAmount: outstandingLoanAmount || 0,
        hasBankAccount: hasBankAccount || false,
      },
    });

    await calculateCreditScore(member.id);
    const updated = await prisma.member.findUnique({ where: { id: member.id } });
    res.status(201).json(updated);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A member with this phone number already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH update member (also used by Telegram bot to update conversationState/context)
router.patch('/:id', async (req, res) => {
  try {
    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE member
router.delete('/:id', async (req, res) => {
  try {
    await prisma.member.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
