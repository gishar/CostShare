import { useEffect, useMemo, useState } from 'react';
import { BalanceTable } from './components/BalanceTable';
import { DataControls } from './components/DataControls';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ParticipantManager } from './components/ParticipantManager';
import { SettlementList } from './components/SettlementList';
import { StepBadge } from './components/StepBadge';
import type { Balance, Expense, Participant, Settlement } from './types';

const PARTICIPANTS_KEY = 'fairshare:participants';
const EXPENSES_KEY = 'fairshare:expenses';
const EVENT_NAME_KEY = 'costshare:eventName';
const DEFAULT_EVENT_NAME = 'Untitled Event';
const COSTSHARE_URL = 'https://costshare.alestead.com';
const FOOTER_SENTENCES = [
  'Good friendships survive shared expenses.',
  'Math is easier than remembering who paid last time.',
  'Somebody always forgets the parking fee.',
  'Clear costs make better trips.',
  'Less arguing. More traveling.',
  'Every group has one person who pays for everything first.',
  'Shared memories are better when the math works out.',
  'The spreadsheet era is officially over.',
  'Nobody actually enjoys splitting expenses manually.',
  'Good accounting is underrated.',
];
const TRAVEL_SENTENCES = [
  'Clear costs make better trips.',
  'Less arguing. More traveling.',
  'Shared memories are better when the math works out.',
];
const FOOD_SENTENCES = [
  'Good friendships survive shared expenses.',
  'Math is easier than remembering who paid last time.',
  'Every group has one person who pays for everything first.',
  'Nobody actually enjoys splitting expenses manually.',
];

type CostShareData = {
  eventName: string;
  participants: Participant[];
  expenses: Expense[];
};

type ImportedCostShareData = {
  eventName?: string;
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

function normalizeEventName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();

  return trimmed === '' || trimmed === DEFAULT_EVENT_NAME || trimmed === 'Untitled CostShare'
    ? ''
    : trimmed;
}

function createId(): string {
  return crypto.randomUUID();
}

function chooseRandom(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)];
}

function chooseFooterSentence(expenses: Expense[]): string {
  const descriptions = expenses.map((expense) => expense.description.toLowerCase()).join(' ');
  const hasKeyword = (keywords: string[]) =>
    keywords.some((keyword) => descriptions.includes(keyword));

  if (hasKeyword(['parking', 'toll', 'ticket', 'fee'])) {
    return 'Somebody always forgets the parking fee.';
  }

  if (hasKeyword(['hotel', 'cabin', 'airbnb', 'flight', 'gas', 'trip', 'rental'])) {
    return chooseRandom(TRAVEL_SENTENCES);
  }

  if (
    hasKeyword([
      'dinner',
      'lunch',
      'breakfast',
      'restaurant',
      'coffee',
      'pizza',
      'groceries',
      'food',
    ])
  ) {
    return chooseRandom(FOOD_SENTENCES);
  }

  return chooseRandom(FOOTER_SENTENCES);
}

function formatCsvMoney(amount: number): string {
  return amount.toFixed(2);
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(values: Array<string | number>): string {
  return values.map(csvCell).join(',');
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

function isCostShareData(value: unknown): value is ImportedCostShareData {
  if (
    typeof value !== 'object' ||
    value === null ||
    ('eventName' in value && typeof (value as ImportedCostShareData).eventName !== 'string') ||
    !Array.isArray((value as ImportedCostShareData).participants) ||
    !Array.isArray((value as ImportedCostShareData).expenses) ||
    !(value as ImportedCostShareData).participants.every(isParticipant) ||
    !(value as ImportedCostShareData).expenses.every(isExpense)
  ) {
    return false;
  }

  const participantIds = new Set((value as ImportedCostShareData).participants.map((participant) => participant.id));

  return (value as ImportedCostShareData).expenses.every(
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
  const [eventName, setEventName] = useState(() => {
    const storedEventName = loadStoredData<string | null>(EVENT_NAME_KEY, null);
    return normalizeEventName(storedEventName);
  });
  const [participants, setParticipants] = useState<Participant[]>(() =>
    loadStoredData(PARTICIPANTS_KEY, []),
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStoredData(EXPENSES_KEY, []));
  const [participantName, setParticipantName] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [expenseFocusKey, setExpenseFocusKey] = useState(0);
  const [footerSentence, setFooterSentence] = useState(() =>
    chooseFooterSentence(loadStoredData(EXPENSES_KEY, [])),
  );
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    const trimmedEventName = eventName.trim();

    if (trimmedEventName) {
      localStorage.setItem(EVENT_NAME_KEY, JSON.stringify(trimmedEventName));
    } else {
      localStorage.removeItem(EVENT_NAME_KEY);
    }
  }, [eventName]);

  useEffect(() => {
    if (participants.length > 0) {
      localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
    } else {
      localStorage.removeItem(PARTICIPANTS_KEY);
    }
  }, [participants]);

  useEffect(() => {
    if (expenses.length > 0) {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    } else {
      localStorage.removeItem(EXPENSES_KEY);
    }
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

  useEffect(() => {
    if (editingExpenseId && !expenses.some((expense) => expense.id === editingExpenseId)) {
      clearExpenseForm();
    }
  }, [editingExpenseId, expenses]);

  useEffect(() => {
    if (
      editingParticipantId &&
      !participants.some((participant) => participant.id === editingParticipantId)
    ) {
      clearParticipantForm();
    }
  }, [editingParticipantId, participants]);

  const balances = useMemo(
    () => calculateBalances(participants, expenses),
    [participants, expenses],
  );
  const settlements = useMemo(() => calculateSettlements(balances), [balances]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  function clearParticipantForm() {
    setEditingParticipantId(null);
    setParticipantName('');
  }

  function saveParticipant() {
    const name = participantName.trim();

    if (!name) {
      return;
    }

    if (editingParticipantId) {
      setParticipants((current) =>
        current.map((participant) =>
          participant.id === editingParticipantId ? { ...participant, name } : participant,
        ),
      );
    } else {
      setParticipants((current) => [...current, { id: createId(), name }]);
    }

    clearParticipantForm();
  }

  function editParticipant(participant: Participant) {
    setEditingParticipantId(participant.id);
    setParticipantName(participant.name);
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

    if (editingParticipantId === id) {
      clearParticipantForm();
    }
  }

  function clearExpenseForm() {
    setEditingExpenseId(null);
    setExpenseDescription('');
    setExpenseAmount('');
    setSelectedParticipantIds(participants.map((participant) => participant.id));
  }

  function clearExpenseFieldsAfterSave() {
    setEditingExpenseId(null);
    setExpenseDescription('');
    setExpenseAmount('');
    setExpenseFocusKey((current) => current + 1);
  }

  function saveExpense() {
    const amount = Number(expenseAmount);
    const description = expenseDescription.trim() || 'Expense';

    if (!paidBy || selectedParticipantIds.length === 0 || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    if (editingExpenseId) {
      setExpenses((current) =>
        current.map((expense) =>
          expense.id === editingExpenseId
            ? {
                ...expense,
                description,
                amount,
                paidBy,
                sharedWith: [...selectedParticipantIds],
              }
            : expense,
        ),
      );
    } else {
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
    }

    clearExpenseFieldsAfterSave();
  }

  function removeExpense(id: string) {
    setExpenses((current) => current.filter((expense) => expense.id !== id));

    if (editingExpenseId === id) {
      clearExpenseForm();
    }
  }

  function editExpense(expense: Expense) {
    setEditingExpenseId(expense.id);
    setExpenseDescription(expense.description);
    setExpenseAmount(String(expense.amount));
    setPaidBy(expense.paidBy);
    setSelectedParticipantIds(sharedWithFor(expense, participants));
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
    const data: CostShareData = {
      eventName: eventName.trim(),
      participants,
      expenses,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'costshare-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportSpreadsheet() {
    const currentEventName = eventName.trim() || DEFAULT_EVENT_NAME;
    const sortedBalances = [...balances].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
    const rows = [
      csvRow(['Event Name', currentEventName]),
      '',
      csvRow(['Participants']),
      csvRow(['Name']),
      ...participants.map((participant) => csvRow([participant.name])),
      '',
      csvRow(['Expenses']),
      csvRow(['Description', 'Amount', 'Paid By', 'Shared With']),
      ...expenses.map((expense) =>
        csvRow([
          expense.description,
          formatCsvMoney(expense.amount),
          participantNameFor(expense.paidBy),
          sharedNamesFor(expense),
        ]),
      ),
      '',
      csvRow(['Balances']),
      csvRow(['Name', 'Paid', 'Share', 'Net', 'Status']),
      ...sortedBalances.map((balance) =>
        csvRow([
          balance.name,
          formatCsvMoney(balance.paid),
          formatCsvMoney(balance.share),
          formatCsvMoney(balance.net),
          balance.net >= 0 ? 'Owed' : 'Owes',
        ]),
      ),
      '',
      csvRow(['Settlements']),
      csvRow(['From', 'To', 'Amount']),
      ...settlements.map((settlement) =>
        csvRow([
          settlement.fromName,
          settlement.toName,
          formatCsvMoney(settlement.amount),
        ]),
      ),
    ];
    const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'costshare-spreadsheet.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function printPage() {
    window.print();
  }

  async function shareCostShare() {
    const shareData = {
      title: 'CostShare',
      text: 'Try CostShare for splitting shared expenses.',
      url: COSTSHARE_URL,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(COSTSHARE_URL);
      setShareMessage('Link copied');
      window.setTimeout(() => setShareMessage(''), 2500);
    } catch {
      setShareMessage('');
    }
  }

  async function importData(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;

      if (!isCostShareData(data)) {
        window.alert('Import failed. Please choose a valid CostShare JSON file.');
        return;
      }

      const confirmed = window.confirm('Importing will overwrite your current CostShare data.');

      if (!confirmed) {
        return;
      }

      setEventName(normalizeEventName(data.eventName));
      setParticipants(data.participants);
      setExpenses(data.expenses);
      setFooterSentence(chooseFooterSentence(data.expenses));
      clearParticipantForm();
      setExpenseDescription('');
      setExpenseAmount('');
      setEditingExpenseId(null);
      setPaidBy(data.participants[0]?.id ?? '');
      setSelectedParticipantIds(data.participants.map((participant) => participant.id));
    } catch {
      window.alert('Import failed. Please choose a valid JSON file.');
    }
  }

  function resetAllData() {
    const confirmed = window.confirm('This will permanently delete all CostShare data.');

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(PARTICIPANTS_KEY);
    localStorage.removeItem(EXPENSES_KEY);
    localStorage.removeItem(EVENT_NAME_KEY);
    setEventName('');
    setParticipants([]);
    setExpenses([]);
    setEditingParticipantId(null);
    setParticipantName('');
    setExpenseDescription('');
    setExpenseAmount('');
    setPaidBy('');
    setSelectedParticipantIds([]);
    setEditingExpenseId(null);
    setFooterSentence(chooseFooterSentence([]));
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-900 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex items-start gap-3 sm:gap-4">
          <img
            alt="CostShare app icon"
            className="h-14 w-14 flex-shrink-0 object-contain sm:h-16 sm:w-16"
            src="/app_icon.png"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-sky-600">Cost</span>
              <span className="text-emerald-600">Share</span>
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Split shared costs clearly, even when not everyone shares every expense.
            </p>
          </div>
        </header>

        <section className="rounded-lg border border-t-4 border-slate-200 border-t-teal-600 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <StepBadge>1</StepBadge>
            <label className="block text-base font-semibold text-slate-900" htmlFor="event-name">
              Event name
            </label>
          </div>
          <input
            className="no-print mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            id="event-name"
            onChange={(event) => setEventName(event.target.value)}
            placeholder={DEFAULT_EVENT_NAME}
            value={eventName}
          />
          <p className="print-only mt-1 text-lg font-semibold">
            {eventName.trim() || DEFAULT_EVENT_NAME}
          </p>
        </section>

        <DataControls
          onExportData={exportData}
          onExportSpreadsheet={exportSpreadsheet}
          onImportData={importData}
          onPrintPage={printPage}
          onResetAllData={resetAllData}
        />

        <section className="grid gap-3 md:grid-cols-2">
          <ParticipantManager
            isEditing={editingParticipantId !== null}
            name={participantName}
            onCancelEdit={clearParticipantForm}
            onEditParticipant={editParticipant}
            onNameChange={setParticipantName}
            onRemoveParticipant={removeParticipant}
            onSaveParticipant={saveParticipant}
            participants={participants}
          />

          <ExpenseForm
            amount={expenseAmount}
            description={expenseDescription}
            focusKey={expenseFocusKey}
            onAmountChange={setExpenseAmount}
            onCancelEdit={clearExpenseForm}
            onDescriptionChange={setExpenseDescription}
            onPaidByChange={setPaidBy}
            onSaveExpense={saveExpense}
            onToggleSharedParticipant={toggleSharedParticipant}
            isEditing={editingExpenseId !== null}
            paidBy={paidBy}
            participants={participants}
            selectedParticipantIds={selectedParticipantIds}
          />
        </section>

        <ExpenseList
          expenses={expenses}
          onEditExpense={editExpense}
          onRemoveExpense={removeExpense}
          participantNameFor={participantNameFor}
          sharedNamesFor={sharedNamesFor}
          totalSpent={totalSpent}
        />

        <BalanceTable balances={balances} />

        <SettlementList settlements={settlements} />

        <footer className="no-print mt-2 space-y-2 pb-2 text-center text-xs text-slate-500">
          <p>{footerSentence}</p>
          <div className="mx-auto max-w-3xl space-y-1 text-slate-900">
            <p className="text-xs font-medium">★ Want CostShare app on your phone? ★</p>
            <p className="text-[11px] leading-5 sm:text-xs">
              Open this site in your phone's web browser, tap Share or Menu, then choose Add to
              Home Screen or Install.
            </p>
          </div>
          <p className="flex flex-col items-center justify-center gap-2 border-t border-slate-200 pt-2 sm:flex-row sm:gap-3">
            <span>
              Made by{' '}
              <a
                className="font-medium text-slate-600 underline-offset-4 transition hover:text-teal-700 hover:underline"
                href="https://alestead.com"
                rel="noreferrer"
                target="_blank"
              >
                Caspian Ale
              </a>
            </span>
            <span className="hidden text-slate-300 sm:inline">·</span>
            <span>
              Have an idea?{' '}
              <a
                className="font-medium text-slate-600 underline-offset-4 transition hover:text-teal-700 hover:underline"
                href={`mailto:gishar@gmail.com?subject=${encodeURIComponent(
                  'CostShare Feedback',
                )}&body=${encodeURIComponent(
                  'Hi Caspian,\n\nI tried CostShare and wanted to share this feedback:\n\n',
                )}`}
              >
                Send feedback
              </a>
            </span>
            <span className="hidden text-slate-300 sm:inline">·</span>
            <button
              className="border-0 bg-transparent p-0 font-medium text-slate-600 underline-offset-4 transition hover:text-teal-700 hover:underline"
              onClick={shareCostShare}
              type="button"
            >
              Share this tool
            </button>
          </p>
          {shareMessage && <p className="text-[11px] text-teal-700">{shareMessage}</p>}
        </footer>
      </div>
    </main>
  );
}
