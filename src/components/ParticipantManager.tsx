import type { FormEvent } from 'react';
import type { Participant } from '../types';

type ParticipantManagerProps = {
  name: string;
  participants: Participant[];
  onAddParticipant: () => void;
  onNameChange: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
};

export function ParticipantManager({
  name,
  participants,
  onAddParticipant,
  onNameChange,
  onRemoveParticipant,
}: ParticipantManagerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAddParticipant();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Participants</h2>
      <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
        <input
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          placeholder="Name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <button
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          type="submit"
        >
          Add
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {participants.length === 0 ? (
          <p className="text-sm text-slate-500">No participants yet.</p>
        ) : (
          participants.map((participant) => (
            <div
              className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
              key={participant.id}
            >
              <span className="text-sm font-medium">{participant.name}</span>
              <button
                className="text-sm font-medium text-slate-500 hover:text-red-600"
                onClick={() => onRemoveParticipant(participant.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
