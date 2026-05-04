import { Balance, Expense, ExpenseShare, Participant, Settlement } from './types';

const cents = (value: number) => Math.round(value * 100);
const dollars = (value: number) => Math.round(value) / 100;

export function splitWithRounding(total: number, rawShares: { participantId: string; value: number }[]): ExpenseShare[] {
  const totalCents = cents(total);
  const base = rawShares.map((s) => ({ ...s, cents: Math.floor(s.value * 100) }));
  let assigned = base.reduce((a, b) => a + b.cents, 0);
  const remainders = rawShares
    .map((s, idx) => ({ idx, rem: s.value * 100 - Math.floor(s.value * 100) }))
    .sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < totalCents && remainders.length) {
    base[remainders[i % remainders.length].idx].cents += 1;
    assigned += 1;
    i += 1;
  }
  return base.map((b) => ({ participantId: b.participantId, owedAmount: dollars(b.cents) }));
}

export function computeBalances(participants: Participant[], expenses: Expense[]): Balance[] {
  return participants.map((p) => {
    const totalPaid = expenses.filter((e) => e.paidBy === p.id).reduce((sum, e) => sum + e.amount, 0);
    const totalOwed = expenses.flatMap((e) => e.shares).filter((s) => s.participantId === p.id).reduce((sum, s) => sum + s.owedAmount, 0);
    return { participantId: p.id, totalPaid: dollars(cents(totalPaid)), totalOwed: dollars(cents(totalOwed)), netBalance: dollars(cents(totalPaid - totalOwed)) };
  });
}

export function computeSettlements(balances: Balance[], tolerance = 0.01): Settlement[] {
  const creditors = balances.filter((b) => b.netBalance > tolerance).map((b) => ({ ...b }));
  const debtors = balances.filter((b) => b.netBalance < -tolerance).map((b) => ({ ...b }));
  creditors.sort((a, b) => b.netBalance - a.netBalance);
  debtors.sort((a, b) => a.netBalance - b.netBalance);
  const out: Settlement[] = [];
  let i = 0; let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const owe = Math.abs(debtors[i].netBalance);
    const recv = creditors[j].netBalance;
    const transfer = Math.min(owe, recv);
    if (transfer > tolerance) {
      out.push({ fromParticipantId: debtors[i].participantId, toParticipantId: creditors[j].participantId, amount: dollars(cents(transfer)), isPaid: false });
    }
    debtors[i].netBalance = dollars(cents(debtors[i].netBalance + transfer));
    creditors[j].netBalance = dollars(cents(creditors[j].netBalance - transfer));
    if (Math.abs(debtors[i].netBalance) <= tolerance) i += 1;
    if (Math.abs(creditors[j].netBalance) <= tolerance) j += 1;
  }
  return out;
}
