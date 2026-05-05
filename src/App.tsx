import { useEffect, useMemo, useState } from 'react';
import { BalanceTable } from './components/BalanceTable';
import { DataControls } from './components/DataControls';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ParticipantManager } from './components/ParticipantManager';
import { SettlementList } from './components/SettlementList';
import type { Balance, Expense, Participant, Settlement } from './types';

const PARTICIPANTS_KEY = 'fairshare:participants';
const EXPENSES_KEY = 'fairshare:expenses';

type FairShareData = {
  participants: Participant[];
  expenses: Expense[];
};

function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function createId(): string {
  return crypto.randomUUID();
}

function isParticipant(value: unknown): value is Participant {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Participant).id === 'string' &&
    typeof (value as Participant).name === 'string'
  );
}

function isExpense(value: unknown): value is Expense {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Expense).id === 'string' &&
    typeof (value as Expense).description === 'string' &&
    typeof (value as Expense).amount === 'number' &&
    Number.isFinite((value as Expense).amount) &&
    typeof (value as Expense).paidBy === 'string' &&
    Array.isArray((value as Expense).sharedWith) &&
    (value as Expense).sharedWith.every((id) => typeof id === 'string') &&
    typeof (value as Expense).createdAt === 'string'
  );
}

function isFairShareData(value: unknown): value is FairShareData {
  if (
    typeof value !== 'object' ||
    value === null ||
    !Array.isArray((value as FairShareData).participants) ||
    !Array.isArray((value as FairShareData).expenses) ||
    !(value as FairShareData).participants.every(isParticipant) ||
    !(value as FairShareData).expenses.every(isExpense)
  ) {
    return false;
  }

  const participantIds = new Set((value as FairShareData).participants.map((participant) => participant.id));

  return (value as FairShareData).expenses.every(
    (expense) =>
      participantIds.has(expense.paidBy) &&
      expense.sharedWith.length > 0 &&
      expense.sharedWith.every((id) => participantIds.has(id)),
  );
}

function sharedWithFor(expense: Expense, participants: Participant[]): string[] {
  const participantIds = participants.map((participant) => participant.id);
  const sharedWith = expense.sharedWith?.filter((id) => participantIds.includes(id));

  return sharedWith && sharedWith.length > 0 ? sharedWith : participantIds;
}

function calculateBalances(participants: Participant[], expenses: Expense[]): Balance[] {
  if (participants.length === 0) {
    return [];
  }

  return participants.map((participant) => {
    const paid = expenses
      .filter((expense) => expense.paidBy === participant.id)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const share = expenses.reduce((sum, expense) => {
      const sharedWith = sharedWithFor(expense, participants);
      return sharedWith.includes(participant.id) ? sum + expense.amount / sharedWith.length : sum;
    }, 0);

    return {
      participantId: participant.id,
      name: participant.name,
      paid,
      share,
      net: paid - share,
    };
  });
}

function calculateSettlements(balances: Balance[]): Settlement[] {
  const debtors = balances
    .filter((balance) => balance.net < -0.01)
    .map((balance) => ({ ...balance, amount: Math.abs(balance.net) }));
  const creditors = balances
    .filter((balance) => balance.net > 0.01)
    .map((balance) => ({ ...balance, amount: balance.net }));
  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      fromParticipantId: debtor.participantId,
      fromName: debtor.name,
      toParticipantId: creditor.participantId,
      toName: creditor.name,
      amount,
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) {
      debtorIndex += 1;
    }

    if (creditor.amount < 0.01) {
      creditorIndex += 1;
    }
  }

  return settlements;
}

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>(() =>
    loadStoredData(PARTICIPANTS_KEY, []),
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStoredData(EXPENSES_KEY, []));
  const [participantName, setParticipantName] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (!paidBy && participants.length > 0) {
      setPaidBy(participants[0].id);
    }

    if (paidBy && !participants.some((participant) => participant.id === paidBy)) {
      setPaidBy(participants[0]?.id ?? '');
    }
  }, [paidBy, participants]);

  useEffect(() => {
    setSelectedParticipantIds((current) => {
      const participantIds = participants.map((participant) => participant.id);
      const kept = current.filter((id) => participantIds.includes(id));
      const added = participantIds.filter((id) => !current.includes(id));
      return [...kept, ...added];
    });
  }, [participants]);

  const balances = useMemo(
    () => calculateBalances(participants, expenses),
    [participants, expenses],
  );
  const settlements = useMemo(() => calculateSettlements(balances), [balances]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  function addParticipant() {
    const name = participantName.trim();

    if (!name) {
      return;
    }

    setParticipants((current) => [...current, { id: createId(), name }]);
    setParticipantName('');
  }

  function removeParticipant(id: string) {
    setParticipants((current) => current.filter((participant) => participant.id !== id));
    setExpenses((current) =>
      current
        .filter((expense) => expense.paidBy !== id)
        .map((expense) => ({
          ...expense,
          sharedWith: sharedWithFor(expense, participants).filter((participantId) => participantId !== id),
        }))
        .filter((expense) => expense.sharedWith.length > 0),
    );
  }

  function addExpense() {
    const amount = Number(expenseAmount);
    const description = expenseDescription.trim() || 'Expense';

    if (!paidBy || selectedParticipantIds.length === 0 || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setExpenses((current) => [
      ...current,
      {
        id: createId(),
        description,
        amount,
        paidBy,
        sharedWith: [...selectedParticipantIds],
        createdAt: new Date().toISOString(),
      },
    ]);
    setExpenseDescription('');
    setExpenseAmount('');
    setSelectedParticipantIds(participants.map((participant) => participant.id));
  }

  function removeExpense(id: string) {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
  }

  function participantNameFor(id: string): string {
    return participants.find((participant) => participant.id === id)?.name ?? 'Unknown';
  }

  function toggleSharedParticipant(id: string) {
    setSelectedParticipantIds((current) =>
      current.includes(id)
        ? current.filter((participantId) => participantId !== id)
        : [...current, id],
    );
  }

  function sharedNamesFor(expense: Expense): string {
    return sharedWithFor(expense, participants).map(participantNameFor).join(', ');
  }

  function exportData() {
    const data: FairShareData = { participants, expenses };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'fairshare-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;

      if (!isFairShareData(data)) {
        window.alert('Import failed. Please choose a valid FairShare JSON file.');
        return;
      }

      const confirmed = window.confirm('Importing will overwrite your current FairShare data.');

      if (!confirmed) {
        return;
      }

      setParticipants(data.participants);
      setExpenses(data.expenses);
      setParticipantName('');
      setExpenseDescription('');
      setExpenseAmount('');
      setPaidBy(data.participants[0]?.id ?? '');
      setSelectedParticipantIds(data.participants.map((participant) => participant.id));
    } catch {
      window.alert('Import failed. Please choose a valid JSON file.');
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">FairShare</p>
          <h1 className="text-3xl font-semibold">Split group expenses equally</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Add participants, record expenses, and see who is ahead or behind.
          </p>
        </header>

        <DataControls onExportData={exportData} onImportData={importData} />

        <section className="grid gap-4 md:grid-cols-2">
          <ParticipantManager
            name={participantName}
            onAddParticipant={addParticipant}
            onNameChange={setParticipantName}
            onRemoveParticipant={removeParticipant}
            participants={participants}
          />

          <ExpenseForm
            amount={expenseAmount}
            description={expenseDescription}
            onAddExpense={addExpense}
            onAmountChange={setExpenseAmount}
            onDescriptionChange={setExpenseDescription}
            onPaidByChange={setPaidBy}
            onToggleSharedParticipant={toggleSharedParticipant}
            paidBy={paidBy}
            participants={participants}
            selectedParticipantIds={selectedParticipantIds}
          />
        </section>

        <ExpenseList
          expenses={expenses}
          onRemoveExpense={removeExpense}
          participantNameFor={participantNameFor}
          sharedNamesFor={sharedNamesFor}
          totalSpent={totalSpent}
        />

        <BalanceTable balances={balances} />

        <SettlementList settlements={settlements} />
      </div>
    </main>
  );
}
