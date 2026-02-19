module.exports = {
  WELCOME_MENU: `Welcome to Sakhi 🌸\n\nWhat would you like to do?\n\n1. Record this month's contribution\n2. Request a loan\n3. View my credit score\n4. View loan details\n5. Contact my group leader\n6. View government schemes`,

  ASK_CONTRIBUTION: `How much are you contributing this month? (Reply with ₹ amount)`,

  ASK_REPAYMENT: `Do you have a loan repayment this month?\n1. Yes\n2. No`,

  ASK_REPAYMENT_AMOUNT: `How much are you repaying? (Reply with ₹ amount)`,

  CONFIRM_CHECKIN: (contrib, repay) =>
    `Please confirm:\n✅ Contribution: ₹${contrib}\n💳 Repayment: ${repay ? '₹' + repay : 'None'}\n\n1. Confirm\n2. Re-enter`,

  SAVED_SUCCESS: `Thank you! Your record has been updated ✅\nThis will be reflected in your credit score. 🌸`,

  ASK_LOAN_AMOUNT: `How much loan are you requesting? (Reply with ₹ amount)`,

  ASK_LOAN_PURPOSE: `What is the reason for the loan?\n1. Agriculture / Livestock\n2. Small Business\n3. Education\n4. Medical Emergency\n5. Home Repair\n6. Family Function\n7. Other`,

  ASK_LOAN_MONTHS: `In how many months will you repay?`,

  ASK_OUTSTANDING: `Do you currently have any outstanding loan?\n1. Yes\n2. No`,

  LOAN_SUBMITTED: (amount) =>
    `Your loan request of ₹${amount} has been sent to your group leader.\nYou will be notified once it is approved. 🌸`,

  SCORE_DISPLAY: (score, band, savings, loans) =>
    `📊 Your Sakhi Summary\n\n⭐ Credit Score: ${score}/100 (${band})\n💰 Total Savings: ₹${savings}\n📋 Active Loan: ₹${loans}\n\nReply 1 for full details`,

  LOAN_DETAILS: (loans) => {
    if (!loans || loans.length === 0) return `You have no active loans. 🌸`;
    const lines = loans.map(
      (l) => `• ₹${l.amount} — ${l.purpose} — Status: ${l.status}`
    );
    return `📋 Your Loan Details:\n\n${lines.join('\n')}`;
  },

  LEADER_CONTACT: (leaderName, leaderPhone) =>
    `Your group leader is ${leaderName}.\nPhone: ${leaderPhone}`,

  SCHEMES_LIST: (schemes) => {
    if (!schemes || schemes.length === 0)
      return `No government schemes found for your profile right now. Keep contributing! 🌸`;
    const lines = schemes.map((s) => `• ${s.schemeName}`);
    return `🏛 Government Schemes you qualify for:\n\n${lines.join('\n')}\n\nContact your leader for more details.`;
  },

  INVALID_INPUT: `Please enter a valid option.`,

  NOT_REGISTERED: `You are not registered in Sakhi. Please contact your SHG leader to register you.`,

  VERIFICATION_REQUEST: (action, amount) =>
    `Your leader has recorded ${action}: ₹${amount}.\n\n1. Confirm\n2. Flag as incorrect`,

  LOAN_APPROVED: (amount) =>
    `🎉 Your loan request of ₹${amount} has been APPROVED!\nYour leader will contact you for disbursement.`,

  LOAN_REJECTED: `We're sorry, your loan request has been rejected. Please contact your group leader for more details.`,

  SCHEME_NOTIFICATION: (schemeName, benefit) =>
    `🏛 Great news! You are eligible for ${schemeName}.\nBenefit: ${benefit}\n\nContact your leader to apply.`,

  ALREADY_IN_FLOW: `You have an ongoing session. Reply with a valid option or type "menu" to restart.`,

  SESSION_RESET: `Session reset. ${module.exports.WELCOME_MENU}`,
};
