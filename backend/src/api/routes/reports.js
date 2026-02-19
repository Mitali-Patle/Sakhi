const express = require('express');
const router = express.Router();
const { generateGroupReport, generateMemberReport } = require('../../services/pdfReport');

// GET group credit report as HTML (use browser print for PDF)
router.get('/group/:groupId', async (req, res) => {
  try {
    const html = await generateGroupReport(req.params.groupId);
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET individual member report as HTML (use browser print for PDF)
router.get('/member/:memberId', async (req, res) => {
  try {
    const html = await generateMemberReport(req.params.memberId);
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
