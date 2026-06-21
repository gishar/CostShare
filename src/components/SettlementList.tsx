import type { Settlement } from '../types';
import { formatCurrency } from '../utils';
import { StepBadge } from './StepBadge';

type SettlementListProps = {
  settlements: Settlement[];
};

export function SettlementList({ settlements }: SettlementListProps) {
  return (
    <section className="rounded-lg border border-t-4 border-slate-200 border-t-teal-600 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <StepBadge>6</StepBadge>
        <h2 className="text-base font-semibold text-slate-900">Settlements</h2>
      </div>
      <div className="mt-3 space-y-2">
        {settlements.length === 0 ? (
          <p className="text-sm text-slate-500">No settlements needed</p>
        ) : (
          settlements.map((settlement) => (
            <div
              className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
              key={`${settlement.fromParticipantId}-${settlement.toParticipantId}`}
            >
              {settlement.fromName} pays {settlement.toName} {formatCurrency(settlement.amount)}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
