# FairShare

FairShare is a responsive React + TypeScript + Tailwind app for group expense sharing (up to 20 participants), with subset expense assignment and settlement optimization.

## Install

```bash
npm install
npm run dev
```

## Features

- Dashboard with event summary cards
- Participant add/remove with uniqueness + max-20 validation
- Expense creation with categories, date, notes, payer, and participant subset selection
- Split methods: equal, weighted, percentage, manual
- Split validation + rounding correction so share sums always match the expense total
- Expense list + detail view
- Balances page (paid / owed / net)
- Settle-up payment recommendation list (greedy creditor/debtor matching)
- Local storage persistence
- Copy settlement text

## Calculation logic

- Equal: divide total by selected participants and distribute rounding pennies by largest remainder.
- Weighted: split proportional to participant weights.
- Percentage: split by percentages (must total 100).
- Manual: explicit amounts (must total expense amount).
- Balance: `net = totalPaid - totalOwed`.
- Settlement: match largest debtors to largest creditors until all balances are near zero (`$0.01` tolerance).

## Local data controls

Data is stored in `localStorage` under key `fairshare-event-v1`.

## Demo Data

Add participants A/B/C and enter:
- Dinner $90 paid by A, shared by A/B/C (equal)
- Beer $100 paid by A, shared by A/B/C (subset)
