export type Participant = {
  id: string;
  name: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  sharedWith: string[];
  createdAt: string;
};

export type Balance = {
  participantId: string;
  name: string;
  paid: number;
  share: number;
  net: number;
};

export type Settlement = {
  fromParticipantId: string;
  fromName: string;
  toParticipantId: string;
  toName: string;
  amount: number;
};
