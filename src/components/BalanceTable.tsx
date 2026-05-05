import type { Balance } from '../types';
import { formatCurrency } from '../utils';

type BalanceTableProps = {
  balances: Balance[];
};

export function BalanceTable({ balances }: BalanceTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Balances</h2>
      <div className="mt-4 space-y-2">
        {balances.length === 0 ? (
          <p className="text-sm text-slate-500">Add participants to see balances.</p>
        ) : (
          balances.map((balance) => (
            <div
              className="grid gap-1 rounded-md bg-slate-50 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center"
              key={balance.participantId}
            >
              <div>
                <p className="text-sm font-medium">{balance.name}</p>
                <p className="text-xs text-slate-500">
                  Paid {formatCurrency(balance.paid)} / Share {formatCurrency(balance.share)}
                </p>
              </div>
              <p
                className={
                  balance.net >= 0
                    ? 'text-sm font-semibold text-emerald-700'
                    : 'text-sm font-semibold text-red-700'
                }
              >
                {balance.net >= 0 ? 'Is owed ' : 'Owes '}
                {formatCurrency(Math.abs(balance.net))}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
