'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JsonViewerProps {
  data: unknown;
  className?: string;
  maxDepth?: number;
  defaultExpanded?: boolean;
  rootName?: string;
}

function JsonValue({ value, depth, maxDepth = 4, isLast, path, defaultExpanded = false }: {
  value: unknown;
  depth: number;
  maxDepth: number;
  isLast: boolean;
  path: string;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 2 || defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (value === null) {
    return (
      <span className="text-[#55556a]">
        null{isLast ? '' : ','}
      </span>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <span className="text-[#22d3ee]">
        {String(value)}{isLast ? '' : ','}
      </span>
    );
  }

  if (typeof value === 'number') {
    return (
      <span className="text-[#60a5fa]">
        {value}{isLast ? '' : ','}
      </span>
    );
  }

  if (typeof value === 'string') {
    const isLong = value.length > 100;
    return (
      <span>
        <span className="text-[#a78bfa]">&quot;{isLong ? value.slice(0, 100) + '...' : value}&quot;</span>
        {isLast ? '' : ','}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[#55556a]">[]{isLast ? '' : ','}</span>;
    }
    return (
      <span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-0.5 hover:text-[#f0f0f5] text-[#55556a] mr-1"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="text-[#8888a0]">{value.length}</span>
        </button>
        {expanded ? (
          <>
            <span className="text-[#55556a]">[</span>
            <div className="pl-4 border-l border-[rgba(255,255,255,0.06)] ml-1">
              {value.map((item, i) => (
                <div key={i} className="py-0.5">
                  <JsonValue
                    value={item}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    isLast={i === value.length - 1}
                    path={`${path}[${i}]`}
                    defaultExpanded={defaultExpanded}
                  />
                </div>
              ))}
            </div>
            <span className="text-[#55556a]">{isLast ? ']' : '],'}</span>
          </>
        ) : (
          <span className="text-[#55556a]">{isLast ? ']' : '],'}</span>
        )}
      </span>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="text-[#55556a]">{'{}'}{isLast ? '' : ','}</span>;
    }
    return (
      <span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-0.5 hover:text-[#f0f0f5] text-[#55556a] mr-1"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="text-[#8888a0]">{entries.length}</span>
        </button>
        {expanded ? (
          <>
            <span className="text-[#55556a]">{'{'}</span>
            <div className="pl-4 border-l border-[rgba(255,255,255,0.06)] ml-1">
              {entries.map(([key, val], i) => (
                <div key={key} className="py-0.5 group/item">
                  <span className="text-[#f0f0f5]">{key}</span>
                  <span className="text-[#55556a]">: </span>
                  <JsonValue
                    value={val}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    isLast={i === entries.length - 1}
                    path={`${path}.${key}`}
                    defaultExpanded={defaultExpanded}
                  />
                </div>
              ))}
            </div>
            <span className="text-[#55556a]">{isLast ? '}' : '},'}</span>
          </>
        ) : (
          <span className="text-[#55556a]">{isLast ? '}' : '},'}</span>
        )}
      </span>
    );
  }

  return <span className="text-[#55556a]">{String(value)}</span>;
}

export function JsonViewer({
  data,
  className,
  maxDepth = 4,
  defaultExpanded = false,
  rootName,
}: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn('relative group', className)}>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#55556a] hover:text-[#f0f0f5] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <div className="forge-code text-sm overflow-auto max-h-96 p-3">
        {rootName && (
          <span className="text-[#f0f0f5]">{rootName}</span>
        )}
        <JsonValue
          value={data}
          depth={0}
          maxDepth={maxDepth}
          isLast
          path=""
          defaultExpanded={defaultExpanded}
        />
      </div>
    </div>
  );
}