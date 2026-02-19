const prisma = require('../../db/prisma');
const { getMessages } = require('../languages');

/**
 * Sends the welcome menu to the member.
 */
async function sendMenu(member) {
  const msgs = getMessages(member.language);
  return msgs.WELCOME_MENU;
}

/**
 * Handles the initial IDLE state — routes based on menu choice.
 * Returns { nextState, reply }
 */
async function handleMenuChoice(member, body) {
  const msgs = getMessages(member.language);
  const choice = body.trim();

  switch (choice) {
    case '1':
      await prisma.member.update({
        where: { id: member.id },
        data: { conversationState: 'AWAIT_CONTRIBUTION', conversationContext: {} },
      });
      return { reply: msgs.ASK_CONTRIBUTION };

    case '2':
      await prisma.member.update({
        where: { id: member.id },
        data: { conversationState: 'AWAIT_LOAN_AMOUNT', conversationContext: {} },
      });
      return { reply: msgs.ASK_LOAN_AMOUNT };

    case '3':
      return { reply: '__SCORE_FLOW__' };

    case '4':
      return { reply: '__LOAN_DETAILS_FLOW__' };

    case '5':
      return { reply: '__LEADER_CONTACT_FLOW__' };

    case '6':
      return { reply: '__SCHEMES_FLOW__' };

    default:
      return { reply: msgs.INVALID_INPUT + '\n\n' + msgs.WELCOME_MENU };
  }
}

module.exports = { sendMenu, handleMenuChoice };
