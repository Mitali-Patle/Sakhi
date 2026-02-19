const express = require('express');
const router = express.Router();
const prisma = require('../../db/prisma');

// Notifications are now optional — Telegram bot handles its own notifications
// WhatsApp notification is a no-op if client not connected
async function tryNotify(phoneNumber, message) {
  try {
    const { sendWhatsAppMessage } = require('../../services/notifications');
    await sendWhatsAppMessage(phoneNumber, message);
  } catch (e) {
    // Silently ignore — Telegram bot will handle member notification separately
  }
}

// GET all loans for a group (optionally filtered by status)
router.get('/group/:groupId', async (req, res) => {
  try {
    const { status } = req.query;
    const loans = await prisma.loanRequest.findMany({
      where: {
        groupId: req.params.groupId,
        ...(status ? { status } : {}),
      },
      include: {
        member: { select: { fullName: true, creditScore: true, scoreBand: true, language: true, phoneNumber: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET loans for a specific member (used by Telegram bot)
router.get('/member/:memberId', async (req, res) => {
  try {
    const loans = await prisma.loanRequest.findMany({
      where: { memberId: req.params.memberId },
      orderBy: { requestedAt: 'desc' },
    });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH approve loan
router.patch('/:id/approve', async (req, res) => {
  try {
    const loan = await prisma.loanRequest.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', resolvedAt: new Date() },
      include: { member: true },
    });

    await prisma.transaction.create({
      data: {
        memberId: loan.memberId,
        groupId: loan.groupId,
        type: 'LOAN_DISBURSEMENT',
        amount: loan.amount,
        actualDate: new Date(),
        daysLate: 0,
      },
    });

    await prisma.member.update({
      where: { id: loan.memberId },
      data: { outstandingLoanAmount: { increment: loan.amount } },
    });

    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH reject loan
router.patch('/:id/reject', async (req, res) => {
  try {
    const loan = await prisma.loanRequest.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', resolvedAt: new Date() },
      include: { member: true },
    });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create loan request
router.post('/', async (req, res) => {
  try {
    const loan = await prisma.loanRequest.create({ data: req.body });
    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
