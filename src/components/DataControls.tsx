import { useRef } from 'react';
import type { ChangeEvent } from 'react';

type DataControlsProps = {
  onExportData: () => void;
  onExportSpreadsheet: () => void;
  onImportData: (file: File) => void;
  onPrintPage: () => void;
  onResetAllData: () => void;
};

export function DataControls({
  onExportData,
  onExportSpreadsheet,
  onImportData,
  onPrintPage,
  onResetAllData,
}: DataControlsProps) {
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
    <section className="no-print space-y-3 rounded-lg border border-t-4 border-slate-200 border-t-sky-600 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-sm text-slate-600">
        Use backup files to save your CostShare or move it to another device.
      </p>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            onClick={handleImportClick}
            type="button"
          >
            Import Backup (JSON)
          </button>
          <button
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-200"
            onClick={onExportData}
            type="button"
          >
            Export Backup (JSON)
          </button>
          <button
            className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100"
            onClick={onResetAllData}
            type="button"
          >
            Reset All Data
          </button>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            onClick={onExportSpreadsheet}
            type="button"
          >
            Export Spreadsheet
          </button>
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            onClick={onPrintPage}
            type="button"
          >
            Print / Save PDF
          </button>
        </div>
      </div>
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
