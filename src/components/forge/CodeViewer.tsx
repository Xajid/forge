'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  filename?: string;
}

export function CodeViewer({
  code,
  language = 'text',
  className,
  showLineNumbers = true,
  filename,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => code.split('\n'), [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn('relative group rounded-xl overflow-hidden', className)}>
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
          <span className="text-xs text-[#55556a] font-mono">
            {filename || language}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded text-[#55556a] hover:text-[#f0f0f5] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      {!filename && !language && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#55556a] hover:text-[#f0f0f5] opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
      <div className="forge-code text-sm overflow-auto max-h-96 p-4">
        <pre className="text-[#c0c0d0]">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              {showLineNumbers && (
                <span className="select-none text-[#333348] w-8 shrink-0 text-right pr-4">
                  {i + 1}
                </span>
              )}
              <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}