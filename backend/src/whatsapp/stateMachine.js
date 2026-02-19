const prisma = require('../db/prisma');
const { getMessages } = require('./languages');
const { sendMenu, handleMenuChoice } = require('./flows/menuFlow');
const { handleContributionFlow } = require('./flows/contributionFlow');
const { handleLoanFlow } = require('./flows/loanFlow');
const {
  handleScoreFlow,
  handleLoanDetailsFlow,
  handleLeaderContactFlow,
  handleSchemesFlow,
} = require('./flows/scoreFlow');
const { handleVerificationFlow } = require('./flows/verificationFlow');
const { client } = require('./client');

/**
 * Strip @c.us suffix from WhatsApp phone number.
 */
function cleanPhone(from) {
  return from.replace('@c.us', '').replace('@s.whatsapp.net', '');
}

/**
 * Send a WhatsApp message via the client.
 */
async function sendReply(to, message) {
  try {
    await client.sendMessage(to, message);
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err.message);
  }
}

/**
 * Main incoming message handler — state machine entry point.
 */
async function handleIncoming(msg) {
  try {
    // Ignore group messages, only handle direct messages
    if (msg.from.includes('@g.us')) return;
    if (msg.isStatus) return;

    const phone = cleanPhone(msg.from);
    const body = (msg.body || '').trim();

    // Look up the member
    const member = await prisma.member.findUnique({
      where: { phoneNumber: phone },
    });

    if (!member) {
      await sendReply(msg.from, getMessages('ENGLISH').NOT_REGISTERED);
      return;
    }

    const msgs = getMessages(member.language);

    // Allow "menu" keyword at any state to reset
    if (body.toLowerCase() === 'menu' || body === '0') {
      await prisma.member.update({
        where: { id: member.id },
        data: { conversationState: 'IDLE', conversationContext: {} },
      });
      await sendReply(msg.from, msgs.WELCOME_MENU);
      return;
    }

    const state = member.conversationState || 'IDLE';
    let result = null;

    // Route based on state
    if (state === 'IDLE') {
      // First message — show menu, subsequent message from idle — handle menu choice
      if (!body || body === '') {
        const menuText = await sendMenu(member);
        await sendReply(msg.from, menuText);
        await prisma.member.update({
          where: { id: member.id },
          data: { conversationState: 'AWAIT_MENU_CHOICE' },
        });
        return;
      }
      // If they send something from IDLE, treat as menu choice
      result = await handleMenuChoice(member, body);
    } else if (state === 'AWAIT_MENU_CHOICE') {
      result = await handleMenuChoice(member, body);
    } else if (
      ['AWAIT_CONTRIBUTION', 'AWAIT_REPAYMENT_CHECK', 'AWAIT_REPAYMENT_AMOUNT', 'CONFIRM_CHECKIN'].includes(state)
    ) {
      result = await handleContributionFlow(member, body);
    } else if (
      ['AWAIT_LOAN_AMOUNT', 'AWAIT_LOAN_PURPOSE', 'AWAIT_LOAN_MONTHS', 'AWAIT_OUTSTANDING_CHECK'].includes(state)
    ) {
      result = await handleLoanFlow(member, body);
    } else if (state === 'AWAIT_VERIFICATION') {
      result = await handleVerificationFlow(member, body);
    } else {
      // Unknown state — reset
      await prisma.member.update({
        where: { id: member.id },
        data: { conversationState: 'AWAIT_MENU_CHOICE', conversationContext: {} },
      });
      await sendReply(msg.from, msgs.WELCOME_MENU);
      return;
    }

    if (!result) return;

    // Handle special flow redirects
    if (result.reply === '__SCORE_FLOW__') {
      result = await handleScoreFlow(member);
    } else if (result.reply === '__LOAN_DETAILS_FLOW__') {
      result = await handleLoanDetailsFlow(member);
    } else if (result.reply === '__LEADER_CONTACT_FLOW__') {
      result = await handleLeaderContactFlow(member);
    } else if (result.reply === '__SCHEMES_FLOW__') {
      result = await handleSchemesFlow(member);
    }

    if (result && result.reply) {
      await sendReply(msg.from, result.reply);
    }

    // After any IDLE state return — show menu again
    const updatedMember = await prisma.member.findUnique({ where: { id: member.id } });
    if (updatedMember && updatedMember.conversationState === 'IDLE') {
      // Don't auto-send menu after every action — let them initiate
    }
  } catch (err) {
    console.error('Error in handleIncoming:', err);
  }
}

module.exports = { handleIncoming, sendReply, cleanPhone };
