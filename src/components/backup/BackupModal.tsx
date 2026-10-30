import React, { useState } from 'react';
import { Download, Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { exportTaskFlowData, importTaskFlowData } from '../../db/backup';

export const BackupModal: React.FC = () => {
  const { isBackupModalOpen, setBackupModalOpen } = useUIStore();
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isBackupModalOpen) return null;

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      await exportTaskFlowData();
      setStatus({ success: true, message: 'JSON backup file successfully exported.' });
    } catch (e) {
      setStatus({ success: false, message: e instanceof Error ? e.message : 'Export failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const res = await importTaskFlowData(file, importMode);
      setStatus(res);
    } catch (e) {
      setStatus({ success: false, message: e instanceof Error ? e.message : 'Import failed' });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#242424] border border-[#383838] rounded-xl shadow-2xl p-5 text-[#f2f2f2]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
          <div>
            <h2 className="text-base font-semibold">Local Data Backup & Restore</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Safeguard your tasks via IndexedDB JSON exports</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBackupModalOpen(false);
              setStatus(null);
            }}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-[#333333]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              status.success ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300' : 'bg-red-950/60 border border-red-700/60 text-red-300'
            }`}
          >
            {status.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}

        {/* Section 1: Export */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-semibold text-neutral-300 block uppercase tracking-wider">
            1. Export Data
          </label>
          <p className="text-xs text-neutral-400">
            Download a single JSON file containing all your tasks, projects, sections, and tags.
          </p>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#333333] hover:bg-[#404040] text-neutral-200 text-xs font-medium rounded-lg border border-[#444444] transition-colors"
          >
            <Download className="w-4 h-4 text-[#dc4c3e]" />
            <span>Download JSON Backup</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#333333] my-5" />

        {/* Section 2: Import */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-300 block uppercase tracking-wider">
            2. Restore / Import
          </label>
          <p className="text-xs text-neutral-400">
            Import a previously exported TaskFlow JSON file.
          </p>

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="accent-[#dc4c3e]"
              />
              <span>Merge with existing</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="accent-[#dc4c3e]"
              />
              <span className="text-red-400">Clean overwrite</span>
            </label>
          </div>

          <label className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#dc4c3e]/10 hover:bg-[#dc4c3e]/20 text-[#dc4c3e] text-xs font-semibold rounded-lg border border-[#dc4c3e]/40 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Select JSON File to Restore</span>
            <input
              type="file"
              accept=".json"
              disabled={isProcessing}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

