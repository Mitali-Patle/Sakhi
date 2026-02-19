# telegram_bot/api_client.py
# All HTTP calls to the Node.js backend go through this module.
# Every function logs errors so failures are visible in the terminal.

import logging
import os
import httpx

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")
API_KEY = os.getenv("API_KEY", "sakhi_secret_key_change_this")

HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}


def _client():
    return httpx.AsyncClient(base_url=BACKEND_URL, headers=HEADERS, timeout=15.0)


# ── Member ─────────────────────────────────────────────────────────────────────

async def get_member_by_telegram_id(telegram_id: int):
    """Look up a member by their Telegram user ID (stored in phoneNumber field)."""
    try:
        async with _client() as c:
            r = await c.get(f"/api/members/by-telegram/{telegram_id}")
            if r.status_code == 200:
                return r.json()
            if r.status_code == 404:
                logger.info(f"Member not found for Telegram ID {telegram_id}")
                return None
            logger.warning(f"get_member_by_telegram_id({telegram_id}) → {r.status_code}: {r.text}")
            return None
    except Exception as e:
        logger.error(f"get_member_by_telegram_id({telegram_id}) failed: {e}", exc_info=True)
        return None


async def get_member(member_id: str):
    try:
        async with _client() as c:
            r = await c.get(f"/api/members/{member_id}")
            if r.status_code == 200:
                return r.json()
            logger.warning(f"get_member({member_id}) → {r.status_code}: {r.text}")
            return None
    except Exception as e:
        logger.error(f"get_member({member_id}) failed: {e}", exc_info=True)
        return None


async def update_member_state(member_id: str, state: str, context: dict):
    try:
        async with _client() as c:
            r = await c.patch(f"/api/members/{member_id}", json={
                "conversationState": state,
                "conversationContext": context,
            })
            if r.status_code != 200:
                logger.error(f"update_member_state({member_id}, {state}) → {r.status_code}: {r.text}")
    except Exception as e:
        logger.error(f"update_member_state({member_id}, {state}) failed: {e}", exc_info=True)


# ── Transactions ───────────────────────────────────────────────────────────────

async def save_contribution(member_id: str, group_id: str, amount: float):
    try:
        async with _client() as c:
            r = await c.post("/api/transactions", json={
                "memberId": member_id,
                "groupId": group_id,
                "type": "CONTRIBUTION",
                "amount": amount,
                "daysLate": 0,
                "verifiedByMember": True,
            })
            if r.status_code not in (200, 201):
                logger.error(f"save_contribution({member_id}, {amount}) → {r.status_code}: {r.text}")
            else:
                logger.info(f"Saved contribution: member={member_id}, amount=₹{amount}")
    except Exception as e:
        logger.error(f"save_contribution({member_id}, {amount}) failed: {e}", exc_info=True)


async def save_repayment(member_id: str, group_id: str, amount: float, outstanding: float):
    try:
        async with _client() as c:
            # Save repayment transaction
            r = await c.post("/api/transactions", json={
                "memberId": member_id,
                "groupId": group_id,
                "type": "LOAN_REPAYMENT",
                "amount": amount,
                "daysLate": 0,
                "verifiedByMember": True,
            })
            if r.status_code not in (200, 201):
                logger.error(f"save_repayment({member_id}, {amount}) → {r.status_code}: {r.text}")
                return
            logger.info(f"Saved repayment: member={member_id}, amount=₹{amount}")

            # Update outstanding loan amount
            new_outstanding = max(0, outstanding - amount)
            r2 = await c.patch(f"/api/members/{member_id}", json={
                "outstandingLoanAmount": new_outstanding,
            })
            if r2.status_code != 200:
                logger.error(f"update outstanding({member_id}) → {r2.status_code}: {r2.text}")
    except Exception as e:
        logger.error(f"save_repayment({member_id}, {amount}) failed: {e}", exc_info=True)


async def update_total_contributed(member_id: str, increment: float):
    try:
        async with _client() as c:
            # Get current value then increment
            r = await c.get(f"/api/members/{member_id}")
            if r.status_code == 200:
                current = r.json().get("totalContributed", 0)
                r2 = await c.patch(f"/api/members/{member_id}", json={
                    "totalContributed": current + increment,
                })
                if r2.status_code != 200:
                    logger.error(f"update_total_contributed({member_id}) PATCH → {r2.status_code}: {r2.text}")
                else:
                    logger.info(f"Updated totalContributed: member={member_id}, new total=₹{current + increment}")
            else:
                logger.error(f"update_total_contributed({member_id}) GET → {r.status_code}: {r.text}")
    except Exception as e:
        logger.error(f"update_total_contributed({member_id}) failed: {e}", exc_info=True)


# ── Credit Score ───────────────────────────────────────────────────────────────

async def recalculate_score(member_id: str):
    try:
        async with _client() as c:
            r = await c.post(f"/api/members/{member_id}/recalculate-score")
            if r.status_code == 200:
                data = r.json()
                logger.info(f"Recalculated score: member={member_id}, score={data.get('score')}, band={data.get('band')}")
            else:
                logger.error(f"recalculate_score({member_id}) → {r.status_code}: {r.text}")
    except Exception as e:
        logger.error(f"recalculate_score({member_id}) failed: {e}", exc_info=True)


# ── Loans ──────────────────────────────────────────────────────────────────────

async def create_loan_request(member_id: str, group_id: str, amount: float,
                               purpose: str, repayment_months: int):
    try:
        async with _client() as c:
            r = await c.post("/api/loans", json={
                "memberId": member_id,
                "groupId": group_id,
                "amount": amount,
                "purpose": purpose,
                "repaymentMonths": repayment_months,
                "status": "PENDING",
            })
            if r.status_code in (200, 201):
                logger.info(f"Created loan request: member={member_id}, amount=₹{amount}")
                return r.json()
            logger.error(f"create_loan_request({member_id}) → {r.status_code}: {r.text}")
            return None
    except Exception as e:
        logger.error(f"create_loan_request({member_id}) failed: {e}", exc_info=True)
        return None


async def get_active_loans(member_id: str):
    try:
        async with _client() as c:
            r = await c.get(f"/api/loans/member/{member_id}")
            if r.status_code == 200:
                return r.json()
            logger.warning(f"get_active_loans({member_id}) → {r.status_code}: {r.text}")
            return []
    except Exception as e:
        logger.error(f"get_active_loans({member_id}) failed: {e}", exc_info=True)
        return []


# ── Group ──────────────────────────────────────────────────────────────────────

async def get_group(group_id: str):
    try:
        async with _client() as c:
            r = await c.get(f"/api/groups/{group_id}")
            if r.status_code == 200:
                return r.json()
            logger.warning(f"get_group({group_id}) → {r.status_code}: {r.text}")
            return None
    except Exception as e:
        logger.error(f"get_group({group_id}) failed: {e}", exc_info=True)
        return None


# ── Schemes ────────────────────────────────────────────────────────────────────

async def get_eligible_schemes(member_id: str):
    try:
        async with _client() as c:
            r = await c.get(f"/api/members/{member_id}/schemes")
            if r.status_code == 200:
                return r.json()
            logger.warning(f"get_eligible_schemes({member_id}) → {r.status_code}: {r.text}")
            return []
    except Exception as e:
        logger.error(f"get_eligible_schemes({member_id}) failed: {e}", exc_info=True)
        return []


# ── Aggregate stats ────────────────────────────────────────────────────────────

async def get_total_savings(member_id: str) -> float:
    try:
        async with _client() as c:
            r = await c.get(f"/api/transactions/member/{member_id}")
            if r.status_code == 200:
                txns = r.json()
                return sum(t["amount"] for t in txns if t["type"] == "CONTRIBUTION")
            logger.warning(f"get_total_savings({member_id}) → {r.status_code}: {r.text}")
            return 0.0
    except Exception as e:
        logger.error(f"get_total_savings({member_id}) failed: {e}", exc_info=True)
        return 0.0
