"use client";
import React from "react";

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  isLoading?: boolean;
}

const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose, code, isLoading }) => {
  if (!isOpen) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {

    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white p-4 shadow-lg dark:bg-black dark:text-white">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Generated Code</h2>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
              disabled={isLoading}
            >
              Copy
            </button>
            <button
              onClick={onClose}
              className="rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-auto rounded-md border border-slate-200 p-2 dark:border-slate-700">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-slate-500">Generating code…</div>
          ) : (
            <pre className="whitespace-pre-wrap text-xs md:text-sm">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeModal;
