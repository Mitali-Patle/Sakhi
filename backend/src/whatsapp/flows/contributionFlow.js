const prisma = require('../../db/prisma');
const { getMessages } = require('../languages');
const { calculateCreditScore } = require('../../services/creditScore');
const { checkEligibility } = require('../../services/schemeEligibility');

/**
 * Handles contribution flow states.
 * States: AWAIT_CONTRIBUTION → AWAIT_REPAYMENT_CHECK → AWAIT_REPAYMENT_AMOUNT → CONFIRM_CHECKIN → IDLE
 */
async function handleContributionFlow(member, body) {
  const msgs = getMessages(member.language);
  const state = member.conversationState;
  const ctx = member.conversationContext || {};

  if (state === 'AWAIT_CONTRIBUTION') {
    const amount = parseFloat(body.trim());
    if (isNaN(amount) || amount <= 0) {
      return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.ASK_CONTRIBUTION };
    }
    await prisma.member.update({
      where: { id: member.id },
      data: {
        conversationState: 'AWAIT_REPAYMENT_CHECK',
        conversationContext: { contribution: amount },
      },
    });
    return { reply: msgs.ASK_REPAYMENT };
  }

  if (state === 'AWAIT_REPAYMENT_CHECK') {
    if (body.trim() === '1') {
      await prisma.member.update({
        where: { id: member.id },
        data: { conversationState: 'AWAIT_REPAYMENT_AMOUNT' },
      });
      return { reply: msgs.ASK_REPAYMENT_AMOUNT };
    } else if (body.trim() === '2') {
      const contrib = ctx.contribution;
      await prisma.member.update({
        where: { id: member.id },
        data: {
          conversationState: 'CONFIRM_CHECKIN',
          conversationContext: { contribution: contrib, repayment: null },
        },
      });
      return { reply: msgs.CONFIRM_CHECKIN(contrib, null) };
    } else {
      return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.ASK_REPAYMENT };
    }
  }

  if (state === 'AWAIT_REPAYMENT_AMOUNT') {
    const repayAmount = parseFloat(body.trim());
    if (isNaN(repayAmount) || repayAmount <= 0) {
      return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.ASK_REPAYMENT_AMOUNT };
    }
    const contrib = ctx.contribution;
    await prisma.member.update({
      where: { id: member.id },
      data: {
        conversationState: 'CONFIRM_CHECKIN',
        conversationContext: { contribution: contrib, repayment: repayAmount },
      },
    });
    return { reply: msgs.CONFIRM_CHECKIN(contrib, repayAmount) };
  }

  if (state === 'CONFIRM_CHECKIN') {
    if (body.trim() === '1') {
      // Save transactions
      const now = new Date();
      await prisma.transaction.create({
        data: {
          memberId: member.id,
          groupId: member.groupId,
          type: 'CONTRIBUTION',
          amount: ctx.contribution,
          actualDate: now,
          daysLate: 0,
          verifiedByMember: true,
        },
      });

      if (ctx.repayment) {
        await prisma.transaction.create({
          data: {
            memberId: member.id,
            groupId: member.groupId,
            type: 'LOAN_REPAYMENT',
            amount: ctx.repayment,
            actualDate: now,
            daysLate: 0,
            verifiedByMember: true,
          },
        });

        // Update outstanding loan amount
        const newOutstanding = Math.max(0, member.outstandingLoanAmount - ctx.repayment);
        await prisma.member.update({
          where: { id: member.id },
          data: { outstandingLoanAmount: newOutstanding },
        });
      }

      // Update totalContributed and tenureMonths
      await prisma.member.update({
        where: { id: member.id },
        data: {
          totalContributed: { increment: ctx.contribution },
          conversationState: 'IDLE',
          conversationContext: {},
        },
      });

      // Recalculate credit score
      await calculateCreditScore(member.id);
      await checkEligibility(member.id);

      return { reply: msgs.SAVED_SUCCESS };
    } else if (body.trim() === '2') {
      await prisma.member.update({
        where: { id: member.id },
        data: { conversationState: 'AWAIT_CONTRIBUTION', conversationContext: {} },
      });
      return { reply: msgs.ASK_CONTRIBUTION };
    } else {
      return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.CONFIRM_CHECKIN(ctx.contribution, ctx.repayment) };
    }
  }

  return { reply: msgs.INVALID_INPUT };
}

module.exports = { handleContributionFlow };
