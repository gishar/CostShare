import { useRef } from 'react';
import type { ChangeEvent } from 'react';

type DataControlsProps = {
  onExportData: () => void;
  onImportData: (file: File) => void;
};

export function DataControls({ onExportData, onImportData }: DataControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleImportClick() {
    inputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onImportData(file);
    }

    event.target.value = '';
  }

  return (
    <section className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <button
        className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        onClick={onExportData}
        type="button"
      >
        Export Data
      </button>
      <button
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={handleImportClick}
        type="button"
      >
        Import Data
      </button>
      <input
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />
    </section>
  );
}
