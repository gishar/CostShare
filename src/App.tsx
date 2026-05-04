import { useMemo, useState } from 'react';
import { computeBalances, computeSettlements, splitWithRounding } from './calc';
import { Expense, ExpenseCategory, ExpenseShare, Participant } from './types';

const categories: ExpenseCategory[] = ['Food', 'Drinks', 'Lodging', 'Transportation', 'Tickets', 'Groceries', 'Other'];
const genId = () => crypto.randomUUID();
const fmt = (n: number) => `$${n.toFixed(2)}`;
const storageKey = 'fairshare-event-v1';

type SplitMethod = Expense['splitMethod'];

export function App() {
  const [tab, setTab] = useState<'Dashboard'|'People'|'Expenses'|'Balances'|'Settle Up'>('Dashboard');
  const [eventName, setEventName] = useState('Weekend Trip');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [newPerson, setNewPerson] = useState({ name: '', nickname: '', color: '#0ea5e9' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', paidBy: '', date: new Date().toISOString().slice(0, 10), category: 'Food' as ExpenseCategory, notes: '', splitMethod: 'equal' as SplitMethod, selected: [] as string[], weights: {} as Record<string, number>, percentages: {} as Record<string, number>, manual: {} as Record<string, number> });

  useState(() => { const raw = localStorage.getItem(storageKey); if (raw) { const d = JSON.parse(raw); setEventName(d.eventName ?? 'Weekend Trip'); setParticipants(d.participants ?? []); setExpenses(d.expenses ?? []); } });
  const persist = (nextParticipants = participants, nextExpenses = expenses, nextName = eventName) => localStorage.setItem(storageKey, JSON.stringify({ eventName: nextName, participants: nextParticipants, expenses: nextExpenses }));

  const balances = useMemo(() => computeBalances(participants, expenses), [participants, expenses]);
  const settlements = useMemo(() => computeSettlements(balances), [balances]);
  const highestPayer = balances.slice().sort((a, b) => b.totalPaid - a.totalPaid)[0];

  const addParticipant = () => {
    if (!newPerson.name.trim()) return;
    if (participants.length >= 20) return setFormError('Maximum 20 participants allowed.');
    if (participants.some((p) => p.name.toLowerCase() === newPerson.name.trim().toLowerCase())) return setFormError('Participant names must be unique.');
    const next = [...participants, { id: genId(), name: newPerson.name.trim(), nickname: newPerson.nickname.trim() || undefined, color: newPerson.color }];
    setParticipants(next); setNewPerson({ name: '', nickname: '', color: '#0ea5e9' }); setFormError(''); persist(next);
  };

  const computeShares = (): ExpenseShare[] => {
    const selected = expenseForm.selected;
    const amount = Number(expenseForm.amount);
    if (expenseForm.splitMethod === 'equal') return splitWithRounding(amount, selected.map((id) => ({ participantId: id, value: amount / selected.length })));
    if (expenseForm.splitMethod === 'weighted') { const tw = selected.reduce((s, id) => s + (expenseForm.weights[id] || 1), 0); return splitWithRounding(amount, selected.map((id) => ({ participantId: id, value: amount * ((expenseForm.weights[id] || 1) / tw) }))).map((s) => ({ ...s, weight: expenseForm.weights[s.participantId] || 1 })); }
    if (expenseForm.splitMethod === 'percentage') return splitWithRounding(amount, selected.map((id) => ({ participantId: id, value: amount * ((expenseForm.percentages[id] || 0) / 100) }))).map((s) => ({ ...s, percentage: expenseForm.percentages[s.participantId] || 0 }));
    return selected.map((id) => ({ participantId: id, manualAmount: expenseForm.manual[id] || 0, owedAmount: expenseForm.manual[id] || 0 }));
  };

  const saveExpense = () => {
    const amount = Number(expenseForm.amount);
    if (!(amount > 0)) return setFormError('Amount must be greater than zero.');
    if (!expenseForm.paidBy) return setFormError('Payer must be selected.');
    if (expenseForm.selected.length === 0) return setFormError('At least one participant must share the expense.');
    if (expenseForm.splitMethod === 'percentage') {
      const total = expenseForm.selected.reduce((a, id) => a + (expenseForm.percentages[id] || 0), 0);
      if (Math.abs(total - 100) > 0.001) return setFormError('Percentage split total must equal 100%.');
    }
    if (expenseForm.splitMethod === 'manual') {
      const total = expenseForm.selected.reduce((a, id) => a + (expenseForm.manual[id] || 0), 0);
      if (Math.abs(total - amount) > 0.001) return setFormError('Manual split total must equal expense amount.');
    }
    const next = [...expenses, { id: genId(), description: expenseForm.description || 'Untitled expense', amount, paidBy: expenseForm.paidBy, date: expenseForm.date, category: expenseForm.category, splitMethod: expenseForm.splitMethod, shares: computeShares(), notes: expenseForm.notes || undefined }];
    setExpenses(next); persist(participants, next); setFormError('');
  };

  const selectedExpense = expenses.find((e) => e.id === selectedExpenseId) ?? null;

  return <div className='max-w-6xl mx-auto p-4 space-y-4'>
    <h1 className='text-3xl font-bold text-sky-700'>FairShare</h1>
    <input className='input' value={eventName} onChange={(e)=>{setEventName(e.target.value); persist(participants, expenses, e.target.value);}} />
    <nav className='grid grid-cols-5 gap-2'>{['Dashboard','People','Expenses','Balances','Settle Up'].map((t)=><button key={t} className={`btn ${tab===t?'btn-primary':''}`} onClick={()=>setTab(t as never)}>{t}</button>)}</nav>
    {formError && <div className='card text-red-600'>{formError}</div>}
    {tab==='Dashboard' && <div className='grid md:grid-cols-2 gap-3'>
      <div className='card'>Participants: {participants.length}</div><div className='card'>Total spent: {fmt(expenses.reduce((a,b)=>a+b.amount,0))}</div>
      <div className='card'>Total expenses: {expenses.length}</div><div className='card'>Highest payer: {highestPayer ? participants.find(p=>p.id===highestPayer.participantId)?.name : 'N/A'}</div>
    </div>}
    {tab==='People' && <div className='card space-y-2'><div className='grid md:grid-cols-4 gap-2'>
      <input className='input' placeholder='Name' value={newPerson.name} onChange={e=>setNewPerson({...newPerson,name:e.target.value})}/>
      <input className='input' placeholder='Nickname' value={newPerson.nickname} onChange={e=>setNewPerson({...newPerson,nickname:e.target.value})}/>
      <input className='input' type='color' value={newPerson.color} onChange={e=>setNewPerson({...newPerson,color:e.target.value})}/>
      <button className='btn btn-primary' onClick={addParticipant}>Add Participant</button></div>
      {participants.map((p)=><div key={p.id} className='flex justify-between border-b py-1'><span>{p.name}</span><button className='text-red-500' onClick={()=>{if(expenses.some(e=>e.paidBy===p.id||e.shares.some(s=>s.participantId===p.id))&&!confirm('Delete participant and related expenses?'))return; const nextP=participants.filter(x=>x.id!==p.id); const nextE=expenses.filter(e=>e.paidBy!==p.id&&!e.shares.some(s=>s.participantId===p.id)); setParticipants(nextP); setExpenses(nextE); persist(nextP,nextE);}}>Delete</button></div>)}
    </div>}
    {tab==='Expenses' && <div className='space-y-3'>
      <div className='card grid md:grid-cols-3 gap-2'>
        <input className='input' placeholder='Description' value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm,description:e.target.value})}/>
        <input className='input' placeholder='Amount' type='number' value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})}/>
        <select className='input' value={expenseForm.paidBy} onChange={e=>setExpenseForm({...expenseForm,paidBy:e.target.value})}><option value=''>Paid by</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input className='input' type='date' value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm,date:e.target.value})}/>
        <select className='input' value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm,category:e.target.value as ExpenseCategory})}>{categories.map(c=><option key={c}>{c}</option>)}</select>
        <select className='input' value={expenseForm.splitMethod} onChange={e=>setExpenseForm({...expenseForm,splitMethod:e.target.value as SplitMethod})}><option value='equal'>Equal</option><option value='weighted'>Weighted</option><option value='percentage'>Percentage</option><option value='manual'>Manual</option></select>
      </div>
      <div className='card'><div className='flex gap-2 mb-2'><button className='btn' onClick={()=>setExpenseForm({...expenseForm,selected:participants.map(p=>p.id)})}>Select All</button><button className='btn' onClick={()=>setExpenseForm({...expenseForm,selected:[]})}>Clear All</button><button className='btn' onClick={()=>setExpenseForm({...expenseForm,selected:participants.filter(p=>p.id!==expenseForm.paidBy).map(p=>p.id)})}>Everyone Except Payer</button></div>
      <div className='grid md:grid-cols-4 gap-2'>{participants.map(p=>{const on=expenseForm.selected.includes(p.id);return <label key={p.id} className='card flex-row items-center gap-2'><input type='checkbox' checked={on} onChange={()=>setExpenseForm({...expenseForm,selected:on?expenseForm.selected.filter(id=>id!==p.id):[...expenseForm.selected,p.id]})}/>{p.name}
      {expenseForm.splitMethod==='weighted'&&on&&<input className='input w-20' type='number' value={expenseForm.weights[p.id]??1} onChange={e=>setExpenseForm({...expenseForm,weights:{...expenseForm.weights,[p.id]:Number(e.target.value)}})}/>}
      {expenseForm.splitMethod==='percentage'&&on&&<input className='input w-24' type='number' value={expenseForm.percentages[p.id]??0} onChange={e=>setExpenseForm({...expenseForm,percentages:{...expenseForm.percentages,[p.id]:Number(e.target.value)}})}/>}
      {expenseForm.splitMethod==='manual'&&on&&<input className='input w-24' type='number' value={expenseForm.manual[p.id]??0} onChange={e=>setExpenseForm({...expenseForm,manual:{...expenseForm.manual,[p.id]:Number(e.target.value)}})}/>}
      </label>;})}</div></div>
      <button className='btn btn-primary' onClick={saveExpense}>Save Expense</button>
      <div className='grid gap-2'>{expenses.map(e=><div key={e.id} className='card flex justify-between'><button onClick={()=>setSelectedExpenseId(e.id)}>{e.description} · {fmt(e.amount)} · {e.splitMethod}</button><button className='text-red-500' onClick={()=>{const next=expenses.filter(x=>x.id!==e.id);setExpenses(next);persist(participants,next);}}>Delete</button></div>)}</div>
      {selectedExpense&&<div className='card'><h3 className='font-semibold'>{selectedExpense.description} - {fmt(selectedExpense.amount)}</h3>{selectedExpense.shares.map(s=><div key={s.participantId}>{participants.find(p=>p.id===s.participantId)?.name}: {fmt(s.owedAmount)}</div>)}</div>}
    </div>}
    {tab==='Balances' && <div className='card'>{balances.map(b=>{const n=participants.find(p=>p.id===b.participantId)?.name;return <div key={b.participantId} className='grid grid-cols-4 border-b py-1'><span>{n}</span><span>{fmt(b.totalPaid)}</span><span>{fmt(b.totalOwed)}</span><span>{b.netBalance>0?`Should receive ${fmt(b.netBalance)}`:b.netBalance<0?`Should pay ${fmt(Math.abs(b.netBalance))}`:'Settled'}</span></div>})}</div>}
    {tab==='Settle Up' && <div className='card space-y-2'>{settlements.map((s,idx)=><div key={idx} className='flex justify-between'><span>{participants.find(p=>p.id===s.fromParticipantId)?.name} pays {participants.find(p=>p.id===s.toParticipantId)?.name} {fmt(s.amount)}</span><button className='btn'>Mark as paid</button></div>)}<button className='btn' onClick={()=>navigator.clipboard.writeText(settlements.map(s=>`${participants.find(p=>p.id===s.fromParticipantId)?.name} pays ${participants.find(p=>p.id===s.toParticipantId)?.name} ${fmt(s.amount)}`).join('\n'))}>Copy settlement text</button></div>}
  </div>;
}
