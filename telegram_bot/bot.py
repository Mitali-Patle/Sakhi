# telegram_bot/bot.py
# Sakhi Telegram Bot — replaces the WhatsApp chatbot entirely.
# Talks to the Node.js backend via HTTP. All DB/credit score logic stays in Node.
#
# Run:  python bot.py

import logging
import os

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

import api_client as api
from languages import get_messages

load_dotenv()

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

PURPOSE_MAP = {
    "1": "AGRICULTURE",
    "2": "BUSINESS",
    "3": "EDUCATION",
    "4": "MEDICAL",
    "5": "HOME_REPAIR",
    "6": "FAMILY_FUNCTION",
    "7": "OTHER",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

async def reply(update: Update, text: str):
    await update.message.reply_text(text)


async def get_member_for_update(update: Update):
    """Look up the member using their Telegram user ID."""
    telegram_id = update.effective_user.id
    return await api.get_member_by_telegram_id(telegram_id)


async def set_state(member_id: str, state: str, context: dict = None):
    await api.update_member_state(member_id, state, context or {})


# ── /start command ─────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"Received /start from user {update.effective_user.id} ({update.effective_user.first_name})")
    try:
        member = await get_member_for_update(update)
        logger.info(f"Member lookup result: {member is not None}")
    except Exception as e:
        logger.error(f"Error looking up member: {e}", exc_info=True)
        await reply(update, "Error connecting to backend. Please try again.")
        return
    if not member:
        await reply(update, (
            "Welcome to Sakhi 🌸\n\n"
            "You are not registered yet.\n"
            "Please contact your SHG leader to register your Telegram ID."
        ))
        # Show them their Telegram ID so the leader can register them
        tid = update.effective_user.id
        await reply(update, f"Your Telegram ID is: {tid}\nShare this with your leader.")
        return

    msgs = get_messages(member["language"])
    await set_state(member["id"], "AWAIT_MENU_CHOICE")
    await reply(update, msgs["WELCOME_MENU"])


# ── /menu command ──────────────────────────────────────────────────────────────

async def cmd_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        member = await get_member_for_update(update)
        if not member:
            await reply(update, "You are not registered. Contact your SHG leader.")
            return
        msgs = get_messages(member["language"])
        await set_state(member["id"], "AWAIT_MENU_CHOICE")
        await reply(update, msgs["WELCOME_MENU"])
    except Exception as e:
        logger.error(f"Error in cmd_menu: {e}", exc_info=True)
        await reply(update, "Something went wrong. Please try again.")


# ── Main message handler ───────────────────────────────────────────────────────

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return

    body = update.message.text.strip()

    try:
        # Look up member
        member = await get_member_for_update(update)
        if not member:
            await reply(update, (
                "You are not registered in Sakhi. 🌸\n"
                "Please contact your SHG leader to register you.\n\n"
                f"Your Telegram ID: {update.effective_user.id}"
            ))
            return

        msgs = get_messages(member["language"])

        # "menu" or "0" resets to main menu from any state
        if body.lower() in ("menu", "0"):
            await set_state(member["id"], "AWAIT_MENU_CHOICE")
            await reply(update, msgs["WELCOME_MENU"])
            return

        state = member.get("conversationState", "IDLE")
        ctx = member.get("conversationContext") or {}

        # ── IDLE → show menu ───────────────────────────────────────────────────
        if state == "IDLE":
            await set_state(member["id"], "AWAIT_MENU_CHOICE")
            await reply(update, msgs["WELCOME_MENU"])
            return

        # ── AWAIT_MENU_CHOICE ──────────────────────────────────────────────────
        if state == "AWAIT_MENU_CHOICE":
            await handle_menu_choice(update, member, msgs, body)
            return

        # ── CONTRIBUTION FLOW ──────────────────────────────────────────────────
        if state == "AWAIT_CONTRIBUTION":
            await handle_await_contribution(update, member, msgs, body)
            return

        if state == "AWAIT_REPAYMENT_CHECK":
            await handle_await_repayment_check(update, member, msgs, body, ctx)
            return

        if state == "AWAIT_REPAYMENT_AMOUNT":
            await handle_await_repayment_amount(update, member, msgs, body, ctx)
            return

        if state == "CONFIRM_CHECKIN":
            await handle_confirm_checkin(update, member, msgs, body, ctx)
            return

        # ── LOAN FLOW ──────────────────────────────────────────────────────────
        if state == "AWAIT_LOAN_AMOUNT":
            await handle_await_loan_amount(update, member, msgs, body)
            return

        if state == "AWAIT_LOAN_PURPOSE":
            await handle_await_loan_purpose(update, member, msgs, body, ctx)
            return

        if state == "AWAIT_LOAN_MONTHS":
            await handle_await_loan_months(update, member, msgs, body, ctx)
            return

        if state == "AWAIT_OUTSTANDING_CHECK":
            await handle_await_outstanding_check(update, member, msgs, body, ctx)
            return

        # ── Unknown state — reset ──────────────────────────────────────────────
        await set_state(member["id"], "AWAIT_MENU_CHOICE")
        await reply(update, msgs["WELCOME_MENU"])

    except Exception as e:
        logger.error(f"Error in handle_message: {e}", exc_info=True)
        await reply(update, "Something went wrong. Please type 'menu' to restart.")


# ── Menu choice ────────────────────────────────────────────────────────────────

async def handle_menu_choice(update, member, msgs, body):
    mid = member["id"]

    if body == "1":
        await set_state(mid, "AWAIT_CONTRIBUTION")
        await reply(update, msgs["ASK_CONTRIBUTION"])

    elif body == "2":
        await set_state(mid, "AWAIT_LOAN_AMOUNT")
        await reply(update, msgs["ASK_LOAN_AMOUNT"])

    elif body == "3":
        # Credit score flow — fetch and display immediately
        total_savings = await api.get_total_savings(mid)
        score = round(member.get("creditScore", 50))
        band = (member.get("scoreBand") or "FAIR").replace("_", " ")
        active_loan = member.get("outstandingLoanAmount", 0)
        await set_state(mid, "IDLE")
        await reply(update, msgs["SCORE_DISPLAY"](score, band, total_savings, active_loan))

    elif body == "4":
        # Loan details flow
        loans = await api.get_active_loans(mid)
        active = [l for l in loans if l.get("status") in ("PENDING", "APPROVED", "DISBURSED")]
        await set_state(mid, "IDLE")
        await reply(update, msgs["LOAN_DETAILS"](active))

    elif body == "5":
        # Leader contact
        group = await api.get_group(member["groupId"])
        await set_state(mid, "IDLE")
        if group:
            await reply(update, msgs["LEADER_CONTACT"](group["leaderName"], group["leaderPhone"]))
        else:
            await reply(update, msgs["INVALID_INPUT"])

    elif body == "6":
        # Government schemes
        schemes = await api.get_eligible_schemes(mid)
        eligible = [s for s in schemes if s.get("isEligible")]
        await set_state(mid, "IDLE")
        await reply(update, msgs["SCHEMES_LIST"](eligible))

    else:
        await reply(update, msgs["INVALID_INPUT"] + "\n\n" + msgs["WELCOME_MENU"])


# ── Contribution flow ──────────────────────────────────────────────────────────

async def handle_await_contribution(update, member, msgs, body):
    try:
        amount = float(body)
        if amount <= 0:
            raise ValueError
    except ValueError:
        await reply(update, msgs["INVALID_INPUT"] + "\n\n" + msgs["ASK_CONTRIBUTION"])
        return

    await set_state(member["id"], "AWAIT_REPAYMENT_CHECK", {"contribution": amount})
    await reply(update, msgs["ASK_REPAYMENT"])


async def handle_await_repayment_check(update, member, msgs, body, ctx):
    if body == "1":
        await set_state(member["id"], "AWAIT_REPAYMENT_AMOUNT", ctx)
        await reply(update, msgs["ASK_REPAYMENT_AMOUNT"])
    elif body == "2":
        new_ctx = {**ctx, "repayment": None}
        await set_state(member["id"], "CONFIRM_CHECKIN", new_ctx)
        await reply(update, msgs["CONFIRM_CHECKIN"](ctx["contribution"], None))
    else:
        await reply(update, msgs["INVALID_INPUT"] + "\n\n" + msgs["ASK_REPAYMENT"])


async def handle_await_repayment_amount(update, member, msgs, body, ctx):
    try:
        amount = float(body)
        if amount <= 0:
            raise ValueError
    except ValueError:
        await reply(update, msgs["INVALID_INPUT"] + "\n\n" + msgs["ASK_REPAYMENT_AMOUNT"])
        return

    new_ctx = {**ctx, "repayment": amount}
    await set_state(member["id"], "CONFIRM_CHECKIN", new_ctx)
    await reply(update, msgs["CONFIRM_CHECKIN"](ctx["contribution"], amount))


async def handle_confirm_checkin(update, member, msgs, body, ctx):
    if body == "1":
        mid = member["id"]
        gid = member["groupId"]
        contrib = ctx.get("contribution", 0)
        repay = ctx.get("repayment")

        # Save contribution
        await api.save_contribution(mid, gid, contrib)

        # Save repayment if applicable
        if repay:
            await api.save_repayment(mid, gid, repay, member.get("outstandingLoanAmount", 0))

        # Update totalContributed
        await api.update_total_contributed(mid, contrib)

        # Reset state
        await set_state(mid, "IDLE")

        # Recalculate credit score (await instead of create_task to avoid silent failures)
        try:
            await api.recalculate_score(mid)
        except Exception as e:
            logger.error(f"Credit score recalculation failed for {mid}: {e}", exc_info=True)

        await reply(update, msgs["SAVED_SUCCESS"])

    elif body == "2":
        await set_state(member["id"], "AWAIT_CONTRIBUTION")
        await reply(update, msgs["ASK_CONTRIBUTION"])
    else:
        await reply(update, msgs["INVALID_INPUT"] + "\n\n" + msgs["CONFIRM_CHECKIN"](ctx.get("contribution"), ctx.get("repayment")))


# ── Loan flow ──────────────────────────────────────────────────────────────────

async def handle_await_loan_amount(update, member, msgs, body):
    try:
        amount = float(body)
        if amount <= 0:
            raise ValueError
    except ValueError:
        await reply(update, msgs["INVALID_INPUT"] + "\n\n" + msgs["ASK_LOAN_AMOUNT"])
        return

    await set_state(member["id"], "AWAIT_LOAN_PURPOSE", {"loanAmount": amount})
    await reply(update, msgs["ASK_LOAN_PURPOSE"])


async def handle_await_loan_purpose(update, member, msgs, body, ctx):
    purpose = PURPOSE_MAP.get(body)
    if not purpose:
        await reply(update, msgs["INVALID_INPUT"] + "\n\n" + msgs["ASK_LOAN_PURPOSE"])
        return

    new_ctx = {**ctx, "loanPurpose": purpose}
    await set_state(member["id"], "AWAIT_LOAN_MONTHS", new_ctx)
    await reply(update, msgs["ASK_LOAN_MONTHS"])


async def handle_await_loan_months(update, member, msgs, body, ctx):
    try:
        months = int(body)
        if months <= 0 or months > 60:
            raise ValueError
    except ValueError:
        await reply(update, msgs["INVALID_INPUT"] + "\n\n" + msgs["ASK_LOAN_MONTHS"])
        return

    new_ctx = {**ctx, "repaymentMonths": months}
    await set_state(member["id"], "AWAIT_OUTSTANDING_CHECK", new_ctx)
    await reply(update, msgs["ASK_OUTSTANDING"])


async def handle_await_outstanding_check(update, member, msgs, body, ctx):
    if body not in ("1", "2"):
        await reply(update, msgs["INVALID_INPUT"] + "\n\n" + msgs["ASK_OUTSTANDING"])
        return

    # Create loan request via backend
    loan = await api.create_loan_request(
        member_id=member["id"],
        group_id=member["groupId"],
        amount=ctx["loanAmount"],
        purpose=ctx["loanPurpose"],
        repayment_months=ctx["repaymentMonths"],
    )

    await set_state(member["id"], "IDLE")
    await reply(update, msgs["LOAN_SUBMITTED"](ctx["loanAmount"]))


# ── Error handler ──────────────────────────────────────────────────────────────

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error(f"Exception while handling update: {context.error}", exc_info=context.error)
    if isinstance(update, Update) and update.message:
        try:
            await update.message.reply_text(
                "Something went wrong on our end. Please type 'menu' to restart."
            )
        except Exception as e:
            logger.error(f"Failed to send error message: {e}")


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN not set in .env")

    app = Application.builder().token(BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("menu", cmd_menu))

    # All text messages
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Errors
    app.add_error_handler(error_handler)

    logger.info("🌸 Sakhi Telegram Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
