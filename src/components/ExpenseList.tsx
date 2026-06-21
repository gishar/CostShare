import type { Expense } from '../types';
import { formatCurrency } from '../utils';

type ExpenseListProps = {
  expenses: Expense[];
  totalSpent: number;
  participantNameFor: (id: string) => string;
  sharedNamesFor: (expense: Expense) => string;
  onEditExpense: (expense: Expense) => void;
  onRemoveExpense: (id: string) => void;
};

function iconForExpense(description: string): string | null {
  const text = description.toLowerCase();
  const has = (keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

  if (has(['gas', 'fuel', 'refill', 'gasoline'])) return '⛽';
  if (has(['parking'])) return '🅿️';
  if (has(['toll'])) return '🛣️';
  if (has(['coffee', 'cafe'])) return '☕';
  if (has(['pizza'])) return '🍕';
  if (has(['dinner', 'lunch', 'breakfast', 'restaurant', 'meal'])) return '🍽️';
  if (has(['groceries', 'snacks', 'food', 'supplies'])) return '🛒';
  if (has(['hotel', 'cabin', 'airbnb', 'lodging'])) return '🏨';
  if (has(['flight', 'plane', 'airport'])) return '✈️';
  if (has(['rental car', 'car rental', 'rideshare', 'uber', 'lyft', 'taxi'])) return '🚗';
  if (has(['kayak', 'canoe', 'boat'])) return '🛶';
  if (has(['ticket', 'admission', 'museum', 'park', 'pass'])) return '🎟️';

  return null;
}

export function ExpenseList({
  expenses,
  totalSpent,
  participantNameFor,
  sharedNamesFor,
  onEditExpense,
  onRemoveExpense,
}: ExpenseListProps) {
  return (
    <section className="rounded-lg border border-t-4 border-slate-200 border-t-teal-600 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <h2 className="text-base font-semibold text-slate-900">Expenses</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
          Total: {formatCurrency(totalSpent)}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {expenses.length === 0 ? (
          <p className="text-sm text-slate-500">No expenses yet</p>
        ) : (
          expenses.map((expense) => {
            const icon = iconForExpense(expense.description);

            return (
              <div
                className="grid gap-2 rounded-md bg-slate-50 px-3 py-2 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                key={expense.id}
              >
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {icon && <span className="text-sm leading-none">{icon}</span>}
                    <span>{expense.description}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Paid by {participantNameFor(expense.paidBy)} / Shared with{' '}
                    {sharedNamesFor(expense)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(expense.amount)}</p>
                <div className="no-print flex gap-3 justify-self-start sm:justify-self-end">
                  <button
                    className="text-sm font-medium text-slate-500 hover:text-teal-700"
                    onClick={() => onEditExpense(expense)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="text-sm font-medium text-slate-500 hover:text-red-600"
                    onClick={() => onRemoveExpense(expense.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
