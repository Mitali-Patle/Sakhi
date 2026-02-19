const prisma = require('../db/prisma');
const { sendWhatsAppMessage } = require('./notifications');

const SCHEMES = [
  {
    name: 'PM_JAN_DHAN',
    displayName: 'PM Jan Dhan Yojana',
    benefit: 'Free bank account with RuPay debit card and ₹10,000 overdraft facility',
    check: (member, group) => !member.hasBankAccount,
  },
  {
    name: 'PMJJBY',
    displayName: 'PM Jeevan Jyoti Bima Yojana',
    benefit: '₹2 lakh life insurance at just ₹436/year',
    check: (member, group) => member.hasBankAccount,
  },
  {
    name: 'PMSBY',
    displayName: 'PM Suraksha Bima Yojana',
    benefit: '₹2 lakh accident insurance at just ₹20/year',
    check: (member, group) => member.hasBankAccount,
  },
  {
    name: 'PM_MUDRA_SHISHU',
    displayName: 'PM Mudra Yojana (Shishu)',
    benefit: 'Loans up to ₹50,000 for small businesses',
    check: (member, group, loanRequests) =>
      member.creditScore >= 70 &&
      loanRequests.some((l) => l.purpose === 'BUSINESS' || l.purpose === 'AGRICULTURE'),
  },
  {
    name: 'PM_SVANIDHI',
    displayName: 'PM SVANidhi',
    benefit: 'Collateral-free working capital loan up to ₹50,000',
    check: (member, group, loanRequests) =>
      member.creditScore >= 60 &&
      loanRequests.some((l) => l.purpose === 'BUSINESS'),
  },
  {
    name: 'NABARD_LINKAGE',
    displayName: 'NABARD SHG-Bank Linkage Programme',
    benefit: 'Group credit linkage with formal banks for larger loans',
    check: (member, group, loanRequests, groupTransactions) => {
      if (!group) return false;
      const monthsActive = groupTransactions.length > 0
        ? Math.ceil(
            (Date.now() - new Date(groupTransactions[0].createdAt).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        : 0;
      return monthsActive >= 6 && group.corpusAmount > 0;
    },
  },
];

async function checkEligibility(memberId) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      loanRequests: true,
      group: true,
      schemeEligibilities: true,
    },
  });

  if (!member) return;

  const groupTransactions = await prisma.transaction.findMany({
    where: { groupId: member.groupId },
    orderBy: { createdAt: 'asc' },
    take: 1,
  });

  for (const scheme of SCHEMES) {
    const isEligible = scheme.check(member, member.group, member.loanRequests, groupTransactions);

    const existing = member.schemeEligibilities.find((s) => s.schemeName === scheme.name);

    if (!existing) {
      await prisma.schemeEligibility.create({
        data: {
          memberId,
          schemeName: scheme.name,
          isEligible,
          notified: false,
        },
      });
    } else {
      const wasNotEligible = !existing.isEligible;
      const nowEligible = isEligible;

      await prisma.schemeEligibility.update({
        where: { id: existing.id },
        data: { isEligible },
      });

      // Notify if newly eligible
      if (wasNotEligible && nowEligible && !existing.notified) {
        const lang = require('../whatsapp/languages');
        const msgs = lang.getMessages(member.language);
        const message = msgs.SCHEME_NOTIFICATION(scheme.displayName, scheme.benefit);
        await sendWhatsAppMessage(member.phoneNumber, message);

        await prisma.schemeEligibility.update({
          where: { id: existing.id },
          data: { notified: true, notifiedAt: new Date() },
        });
      }
    }
  }
}

module.exports = { checkEligibility };
