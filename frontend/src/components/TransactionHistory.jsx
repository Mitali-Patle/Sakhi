const TYPE_CONFIG = {
  CONTRIBUTION: { icon: '💚', label: 'Contribution', color: 'text-green-700' },
  LOAN_REPAYMENT: { icon: '💳', label: 'Loan Repayment', color: 'text-blue-700' },
  LOAN_DISBURSEMENT: { icon: '💸', label: 'Loan Disbursement', color: 'text-orange-700' },
};

export default function TransactionHistory({ transactions = [] }) {
  if (transactions.length === 0) {
    return <p className="text-gray-400 text-sm py-4 text-center">No transactions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const cfg = TYPE_CONFIG[tx.type] || { icon: '📋', label: tx.type, color: 'text-gray-700' };
        return (
          <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">{cfg.icon}</span>
              <div>
                <div className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</div>
                <div className="text-xs text-gray-400">
                  {new Date(tx.actualDate).toLocaleDateString('en-IN')}
                  {tx.daysLate > 0 && <span className="text-red-500 ml-2">{tx.daysLate}d late</span>}
                  {tx.daysLate <= 0 && tx.type === 'LOAN_REPAYMENT' && <span className="text-green-500 ml-2">On time</span>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">₹{tx.amount.toLocaleString()}</div>
              {tx.verifiedByMember && <div className="text-xs text-green-500">✓ Verified</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
