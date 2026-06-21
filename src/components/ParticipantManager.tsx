import type { FormEvent } from 'react';
import type { Participant } from '../types';

type ParticipantManagerProps = {
  isEditing: boolean;
  name: string;
  participants: Participant[];
  onCancelEdit: () => void;
  onEditParticipant: (participant: Participant) => void;
  onNameChange: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
  onSaveParticipant: () => void;
};

export function ParticipantManager({
  isEditing,
  name,
  participants,
  onCancelEdit,
  onEditParticipant,
  onNameChange,
  onRemoveParticipant,
  onSaveParticipant,
}: ParticipantManagerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaveParticipant();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <h2 className="text-lg font-semibold">Participants</h2>
      <form className="no-print mt-3 flex gap-2" onSubmit={handleSubmit}>
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
          {isEditing ? 'Save' : 'Add'}
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
      </form>

      <div className="mt-3 space-y-2">
        {participants.length === 0 ? (
          <p className="text-sm text-slate-500">Add participants to begin</p>
        ) : (
          participants.map((participant) => (
            <div
              className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
              key={participant.id}
            >
              <span className="text-sm font-medium">{participant.name}</span>
              <div className="no-print flex gap-3">
                <button
                  className="text-sm font-medium text-slate-500 hover:text-teal-700"
                  onClick={() => onEditParticipant(participant)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="text-sm font-medium text-slate-500 hover:text-red-600"
                  onClick={() => onRemoveParticipant(participant.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
