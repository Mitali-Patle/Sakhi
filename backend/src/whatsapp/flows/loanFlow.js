const prisma = require('../../db/prisma');
const { getMessages } = require('../languages');
const { sendWhatsAppMessage } = require('../../services/notifications');

const PURPOSE_MAP = {
  '1': 'AGRICULTURE',
  '2': 'BUSINESS',
  '3': 'EDUCATION',
  '4': 'MEDICAL',
  '5': 'HOME_REPAIR',
  '6': 'FAMILY_FUNCTION',
  '7': 'OTHER',
};

async function handleLoanFlow(member, body) {
  const msgs = getMessages(member.language);
  const state = member.conversationState;
  const ctx = member.conversationContext || {};

  if (state === 'AWAIT_LOAN_AMOUNT') {
    const amount = parseFloat(body.trim());
    if (isNaN(amount) || amount <= 0) {
      return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.ASK_LOAN_AMOUNT };
    }
    await prisma.member.update({
      where: { id: member.id },
      data: {
        conversationState: 'AWAIT_LOAN_PURPOSE',
        conversationContext: { loanAmount: amount },
      },
    });
    return { reply: msgs.ASK_LOAN_PURPOSE };
  }

  if (state === 'AWAIT_LOAN_PURPOSE') {
    const purpose = PURPOSE_MAP[body.trim()];
    if (!purpose) {
      return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.ASK_LOAN_PURPOSE };
    }
    await prisma.member.update({
      where: { id: member.id },
      data: {
        conversationState: 'AWAIT_LOAN_MONTHS',
        conversationContext: { ...ctx, loanPurpose: purpose },
      },
    });
    return { reply: msgs.ASK_LOAN_MONTHS };
  }

  if (state === 'AWAIT_LOAN_MONTHS') {
    const months = parseInt(body.trim(), 10);
    if (isNaN(months) || months <= 0 || months > 60) {
      return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.ASK_LOAN_MONTHS };
    }
    await prisma.member.update({
      where: { id: member.id },
      data: {
        conversationState: 'AWAIT_OUTSTANDING_CHECK',
        conversationContext: { ...ctx, repaymentMonths: months },
      },
    });
    return { reply: msgs.ASK_OUTSTANDING };
  }

  if (state === 'AWAIT_OUTSTANDING_CHECK') {
    if (body.trim() !== '1' && body.trim() !== '2') {
      return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.ASK_OUTSTANDING };
    }
    // Create the loan request
    const loanRequest = await prisma.loanRequest.create({
      data: {
        memberId: member.id,
        groupId: member.groupId,
        amount: ctx.loanAmount,
        purpose: ctx.loanPurpose,
        repaymentMonths: ctx.repaymentMonths,
        status: 'PENDING',
      },
    });

    await prisma.member.update({
      where: { id: member.id },
      data: { conversationState: 'IDLE', conversationContext: {} },
    });

    // Notify leader
    const group = await prisma.sHGGroup.findUnique({ where: { id: member.groupId } });
    if (group) {
      const leaderMsg = `📋 New Loan Request from ${member.fullName}\nAmount: ₹${ctx.loanAmount}\nPurpose: ${ctx.loanPurpose}\nRepayment: ${ctx.repaymentMonths} months\nCredit Score: ${member.creditScore}/100\n\nApprove or reject from the Sakhi dashboard.`;
      await sendWhatsAppMessage(group.leaderPhone, leaderMsg);
    }

    return { reply: msgs.LOAN_SUBMITTED(ctx.loanAmount) };
  }

  return { reply: msgs.INVALID_INPUT };
}

module.exports = { handleLoanFlow };
