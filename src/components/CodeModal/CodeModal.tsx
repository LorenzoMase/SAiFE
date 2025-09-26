"use client";
import React, { useMemo } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/hooks/useTheme';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  isLoading?: boolean;
}

const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose, code, isLoading }) => {
  const themeHook = useTheme();

  const detectLanguage = (code: string): string => {
    const cleanCode = code.trim().toLowerCase();
    
    if (cleanCode.includes('import java') || cleanCode.includes('public class') || cleanCode.includes('public static void main')) {
      return 'java';
    }
    if (cleanCode.includes('def ') || cleanCode.includes('import ') && cleanCode.includes('python') || cleanCode.includes('print(')) {
      return 'python';
    }
    if (cleanCode.includes('function ') || cleanCode.includes('const ') || cleanCode.includes('let ') || cleanCode.includes('var ')) {
      return 'javascript';
    }
    if (cleanCode.includes('interface ') || cleanCode.includes(': string') || cleanCode.includes(': number')) {
      return 'typescript';
    }
    if (cleanCode.includes('#include') || cleanCode.includes('int main') || cleanCode.includes('printf')) {
      return 'c';
    }
    if (cleanCode.includes('using namespace') || cleanCode.includes('std::') || cleanCode.includes('cout')) {
      return 'cpp';
    }
    if (cleanCode.includes('using System') || cleanCode.includes('namespace ') || cleanCode.includes('Console.WriteLine')) {
      return 'csharp';
    }
    if (cleanCode.includes('<?php') || cleanCode.includes('echo ') || cleanCode.includes('$_')) {
      return 'php';
    }
    if (cleanCode.includes('SELECT ') || cleanCode.includes('FROM ') || cleanCode.includes('WHERE ')) {
      return 'sql';
    }
    if (cleanCode.includes('<html') || cleanCode.includes('<div') || cleanCode.includes('<p>')) {
      return 'html';
    }
    if (cleanCode.includes('body {') || cleanCode.includes('.class') || cleanCode.includes('#id')) {
      return 'css';
    }
    if (cleanCode.includes('{') && cleanCode.includes('}') && (cleanCode.includes('"') || cleanCode.includes("'"))) {
      return 'json';
    }
    
    return 'text';
  };

  const language = useMemo(() => detectLanguage(code), [code]);
  
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
        <div className="max-h-[70vh] overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-slate-500">Generating code…</div>
          ) : (
            <SyntaxHighlighter
              language={language}
              style={themeHook.theme === 'dark' ? oneDark : oneLight}
              customStyle={{
                margin: 0,
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.5',
                borderRadius: '6px',
              }}
              showLineNumbers={true}
              wrapLines={true}
              wrapLongLines={true}
            >
              {code}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeModal;
