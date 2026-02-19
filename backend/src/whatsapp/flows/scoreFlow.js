const prisma = require('../../db/prisma');
const { getMessages } = require('../languages');

async function handleScoreFlow(member) {
  const msgs = getMessages(member.language);

  // Get total savings
  const contributions = await prisma.transaction.aggregate({
    where: { memberId: member.id, type: 'CONTRIBUTION' },
    _sum: { amount: true },
  });
  const totalSavings = contributions._sum.amount || 0;
  const activeLoans = member.outstandingLoanAmount || 0;

  const scoreRounded = Math.round(member.creditScore);
  const band = member.scoreBand.replace('_', ' ');

  // Reset state
  await prisma.member.update({
    where: { id: member.id },
    data: { conversationState: 'IDLE', conversationContext: {} },
  });

  return { reply: msgs.SCORE_DISPLAY(scoreRounded, band, totalSavings, activeLoans) };
}

async function handleLoanDetailsFlow(member) {
  const msgs = getMessages(member.language);

  const loans = await prisma.loanRequest.findMany({
    where: { memberId: member.id, status: { in: ['PENDING', 'APPROVED', 'DISBURSED'] } },
    orderBy: { requestedAt: 'desc' },
    take: 5,
  });

  await prisma.member.update({
    where: { id: member.id },
    data: { conversationState: 'IDLE', conversationContext: {} },
  });

  return { reply: msgs.LOAN_DETAILS(loans) };
}

async function handleLeaderContactFlow(member) {
  const msgs = getMessages(member.language);
  const group = await prisma.sHGGroup.findUnique({ where: { id: member.groupId } });

  await prisma.member.update({
    where: { id: member.id },
    data: { conversationState: 'IDLE', conversationContext: {} },
  });

  return {
    reply: group
      ? msgs.LEADER_CONTACT(group.leaderName, group.leaderPhone)
      : msgs.INVALID_INPUT,
  };
}

async function handleSchemesFlow(member) {
  const msgs = getMessages(member.language);

  const schemes = await prisma.schemeEligibility.findMany({
    where: { memberId: member.id, isEligible: true },
  });

  await prisma.member.update({
    where: { id: member.id },
    data: { conversationState: 'IDLE', conversationContext: {} },
  });

  return { reply: msgs.SCHEMES_LIST(schemes) };
}

module.exports = {
  handleScoreFlow,
  handleLoanDetailsFlow,
  handleLeaderContactFlow,
  handleSchemesFlow,
};
