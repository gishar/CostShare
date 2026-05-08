import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import type { Participant } from '../types';

type ExpenseFormProps = {
  amount: string;
  description: string;
  focusKey: number;
  isEditing: boolean;
  paidBy: string;
  participants: Participant[];
  selectedParticipantIds: string[];
  onAmountChange: (amount: string) => void;
  onCancelEdit: () => void;
  onDescriptionChange: (description: string) => void;
  onPaidByChange: (paidBy: string) => void;
  onSaveExpense: () => void;
  onToggleSharedParticipant: (id: string) => void;
};

export function ExpenseForm({
  amount,
  description,
  focusKey,
  isEditing,
  paidBy,
  participants,
  selectedParticipantIds,
  onAmountChange,
  onCancelEdit,
  onDescriptionChange,
  onPaidByChange,
  onSaveExpense,
  onToggleSharedParticipant,
}: ExpenseFormProps) {
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusKey > 0) {
      amountInputRef.current?.focus();
    }
  }, [focusKey]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaveExpense();
  }

  return (
    <div className="no-print rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{isEditing ? 'Edit expense' : 'Add expense'}</h2>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          placeholder="Description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            min="0.01"
            placeholder="Amount"
            ref={amountInputRef}
            step="0.01"
            type="number"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
          />
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            disabled={participants.length === 0}
            value={paidBy}
            onChange={(event) => onPaidByChange(event.target.value)}
          >
            {participants.length === 0 ? (
              <option>Add a participant first</option>
            ) : (
              participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))
            )}
          </select>
        </div>
        {participants.length > 0 && (
          <div className="space-y-2 rounded-md bg-slate-50 p-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Shared with</p>
              <p className="text-xs text-slate-500">Only selected people split this expense.</p>
            </div>
            <div className="space-y-2">
              {participants.map((participant) => (
                <label
                  className="flex items-center gap-2 text-sm text-slate-700"
                  key={participant.id}
                >
                  <input
                    checked={selectedParticipantIds.includes(participant.id)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    onChange={() => onToggleSharedParticipant(participant.id)}
                    type="checkbox"
                  />
                  {participant.name}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={participants.length === 0 || selectedParticipantIds.length === 0}
            type="submit"
          >
            {isEditing ? 'Save expense' : 'Add expense'}
          </button>
          {isEditing && (
            <button
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onCancelEdit}
              type="button"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
