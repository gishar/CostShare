import { formatCurrency } from '../utils';

type SummaryStripProps = {
  copyMessage: string;
  expenseCount: number;
  onCopyFullSummary: () => void;
  onCopySettlementSummary: () => void;
  participantCount: number;
  settlementCount: number;
  totalSpent: number;
};

export function SummaryStrip({
  copyMessage,
  expenseCount,
  onCopyFullSummary,
  onCopySettlementSummary,
  participantCount,
  settlementCount,
  totalSpent,
}: SummaryStripProps) {
  const settlementStatus =
    settlementCount === 0
      ? 'Settled'
      : `${settlementCount} payment${settlementCount === 1 ? '' : 's'}`;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="grid gap-2 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Participants</p>
          <p className="font-semibold text-slate-900">{participantCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Expenses</p>
          <p className="font-semibold text-slate-900">{expenseCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Total</p>
          <p className="font-semibold text-slate-900">{formatCurrency(totalSpent)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Status</p>
          <p className="font-semibold text-slate-900">{settlementStatus}</p>
        </div>
      </div>

      <div className="no-print mt-3 flex flex-wrap items-center gap-2">
        <button
          className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-200"
          onClick={onCopySettlementSummary}
          type="button"
        >
          Copy settlement summary
        </button>
        <button
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          onClick={onCopyFullSummary}
          type="button"
        >
          Copy full event summary
        </button>
        {copyMessage && <p className="text-xs font-medium text-teal-700">{copyMessage}</p>}
      </div>
    </section>
  );
}
