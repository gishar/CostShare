import type { Expense } from '../types';
import { formatCurrency } from '../utils';

type ExpenseListProps = {
  expenses: Expense[];
  totalSpent: number;
  participantNameFor: (id: string) => string;
  sharedNamesFor: (expense: Expense) => string;
  onRemoveExpense: (id: string) => void;
};

export function ExpenseList({
  expenses,
  totalSpent,
  participantNameFor,
  sharedNamesFor,
  onRemoveExpense,
}: ExpenseListProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Expenses</h2>
        <span className="text-sm font-medium text-slate-600">
          Total: {formatCurrency(totalSpent)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {expenses.length === 0 ? (
          <p className="text-sm text-slate-500">No expenses yet.</p>
        ) : (
          expenses.map((expense) => (
            <div
              className="grid gap-2 rounded-md bg-slate-50 px-3 py-2 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              key={expense.id}
            >
              <div>
                <p className="text-sm font-medium">{expense.description}</p>
                <p className="text-xs text-slate-500">
                  Paid by {participantNameFor(expense.paidBy)} / Shared with{' '}
                  {sharedNamesFor(expense)}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(expense.amount)}</p>
              <button
                className="justify-self-start text-sm font-medium text-slate-500 hover:text-red-600 sm:justify-self-end"
                onClick={() => onRemoveExpense(expense.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
