import type { Balance } from '../types';
import { formatCurrency } from '../utils';
import { StepBadge } from './StepBadge';

type BalanceTableProps = {
  balances: Balance[];
};

export function BalanceTable({ balances }: BalanceTableProps) {
  const sortedBalances = [...balances].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  return (
    <section className="rounded-lg border border-t-4 border-slate-200 border-t-teal-600 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <StepBadge>5</StepBadge>
        <h2 className="text-base font-semibold text-slate-900">Balances</h2>
      </div>
      <div className="mt-3 space-y-2">
        {balances.length === 0 ? (
          <p className="text-sm text-slate-500">Add participants to see balances.</p>
        ) : (
          sortedBalances.map((balance) => {
            const isPositive = balance.net >= 0;

            return (
              <div
                className={
                  isPositive
                    ? 'grid gap-1 rounded-md bg-emerald-50 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center'
                    : 'grid gap-1 rounded-md bg-red-50 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center'
                }
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
                    isPositive
                      ? 'text-sm font-semibold text-emerald-700'
                      : 'text-sm font-semibold text-red-700'
                  }
                >
                  {isPositive ? 'Owed ' : 'Owes '}
                  {formatCurrency(Math.abs(balance.net))}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
