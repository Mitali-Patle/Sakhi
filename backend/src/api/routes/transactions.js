const express = require('express');
const router = express.Router();
const prisma = require('../../db/prisma');
const { calculateCreditScore } = require('../../services/creditScore');

// GET transactions for a member
router.get('/member/:memberId', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { memberId: req.params.memberId },
      orderBy: { actualDate: 'desc' },
      take: 50,
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET transactions for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { groupId: req.params.groupId },
      include: { member: { select: { fullName: true } } },
      orderBy: { actualDate: 'desc' },
      take: 100,
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create transaction (leader-entered or bot-entered)
router.post('/', async (req, res) => {
  try {
    const tx = await prisma.transaction.create({ data: req.body });
    // Recalculate credit score — non-fatal, transaction is the critical operation
    try {
      await calculateCreditScore(tx.memberId);
    } catch (scoreErr) {
      console.error(`Credit score recalculation failed for member ${tx.memberId}:`, scoreErr.message);
    }
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
