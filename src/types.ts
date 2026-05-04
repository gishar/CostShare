export type ExpenseCategory =
  | 'Food'
  | 'Drinks'
  | 'Lodging'
  | 'Transportation'
  | 'Tickets'
  | 'Groceries'
  | 'Other';

export type Participant = {
  id: string;
  name: string;
  nickname?: string;
  color?: string;
};

export type ExpenseShare = {
  participantId: string;
  weight?: number;
  percentage?: number;
  manualAmount?: number;
  owedAmount: number;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  category: ExpenseCategory;
  splitMethod: 'equal' | 'weighted' | 'percentage' | 'manual';
  shares: ExpenseShare[];
  notes?: string;
};

export type Balance = {
  participantId: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
};

export type Settlement = {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  isPaid: boolean;
};
