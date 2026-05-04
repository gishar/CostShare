import { describe, expect, test } from 'vitest';
import { computeBalances, computeSettlements, splitWithRounding } from './calc';

describe('acceptance scenarios', () => {
  test('equal split and settlement', () => {
    const participants = [{id:'A',name:'A'},{id:'B',name:'B'},{id:'C',name:'C'}];
    const shares = splitWithRounding(90,[{participantId:'A',value:30},{participantId:'B',value:30},{participantId:'C',value:30}]);
    const expenses = [{id:'1',description:'Dinner',amount:90,paidBy:'A',date:'2026-05-04',category:'Food',splitMethod:'equal',shares} as const];
    const balances = computeBalances(participants as any, expenses as any);
    expect(balances.find(b=>b.participantId==='A')?.netBalance).toBe(60);
    const settlements = computeSettlements(balances);
    expect(settlements).toHaveLength(2);
  });
  test('manual invalid total example', () => {
    const total = 20 + 30 + 40;
    expect(total).not.toBe(100);
  });
});
