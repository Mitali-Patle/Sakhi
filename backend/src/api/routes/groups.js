const express = require('express');
const router = express.Router();
const prisma = require('../../db/prisma');

// GET all groups (for admin/dev)
router.get('/', async (req, res) => {
  try {
    const groups = await prisma.sHGGroup.findMany({ include: { _count: { select: { members: true } } } });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET group by leader phone (for login)
router.get('/by-leader/:phone', async (req, res) => {
  try {
    const group = await prisma.sHGGroup.findUnique({
      where: { leaderPhone: req.params.phone },
      include: { _count: { select: { members: true } } },
    });
    if (!group) return res.status(404).json({ error: 'Group not found for this phone number' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single group
router.get('/:id', async (req, res) => {
  try {
    const group = await prisma.sHGGroup.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create group
router.post('/', async (req, res) => {
  try {
    const {
      groupName, registrationNumber, village, district, state,
      bankName, meetingFrequency, dateFormed, leaderPhone, leaderName,
    } = req.body;

    const group = await prisma.sHGGroup.create({
      data: {
        groupName,
        registrationNumber,
        village,
        district,
        state,
        bankName,
        meetingFrequency,
        dateFormed: new Date(dateFormed),
        leaderPhone,
        leaderName,
      },
    });
    res.status(201).json(group);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A group with this leader phone already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH update group
router.patch('/:id', async (req, res) => {
  try {
    const group = await prisma.sHGGroup.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
