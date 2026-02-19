const prisma = require('../../db/prisma');
const { getMessages } = require('../languages');

/**
 * Handles member verification confirmations for leader-entered transactions.
 * State: AWAIT_VERIFICATION
 */
async function handleVerificationFlow(member, body) {
  const msgs = getMessages(member.language);
  const ctx = member.conversationContext || {};

  if (body.trim() === '1') {
    // Confirmed — mark transaction as verified
    if (ctx.transactionId) {
      await prisma.transaction.update({
        where: { id: ctx.transactionId },
        data: { verifiedByMember: true },
      });
    }
    await prisma.member.update({
      where: { id: member.id },
      data: { conversationState: 'IDLE', conversationContext: {} },
    });
    return { reply: msgs.SAVED_SUCCESS };
  } else if (body.trim() === '2') {
    // Flagged as incorrect
    if (ctx.transactionId) {
      await prisma.transaction.update({
        where: { id: ctx.transactionId },
        data: { notes: 'FLAGGED_BY_MEMBER' },
      });
    }
    await prisma.member.update({
      where: { id: member.id },
      data: { conversationState: 'IDLE', conversationContext: {} },
    });
    return {
      reply: `Your concern has been flagged. Your group leader will review this record. 🌸`,
    };
  } else {
    return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.VERIFICATION_REQUEST(ctx.action || 'a transaction', ctx.amount || 0) };
  }
}

module.exports = { handleVerificationFlow };
