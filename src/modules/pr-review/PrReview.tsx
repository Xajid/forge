'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { GlassCard } from '@/components/forge/GlassCard';
import { GlowButton } from '@/components/forge/GlowButton';
import { EmptyState } from '@/components/forge/EmptyState';
import { Shimmer, ShimmerCard } from '@/components/forge/Shimmer';
import { ForgeBadge } from '@/components/forge/ForgeBadge';
import { AnimatedInput } from '@/components/forge/AnimatedInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import {
  Send,
  FileCode,
  GitPullRequest,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  History,
  Sparkles,
  X,
  Clock,
  Github,
  AlignLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowDownToLine,
} from 'lucide-react';

// --- Types ---
interface ReviewRecord {
  id: string;
  title: string | null;
  score: number | null;
  createdAt: string;
}

interface FullReview extends ReviewRecord {
  diff: string;
  review: string | null;
  model: string | null;
}

// --- Sample Diff ---
const SAMPLE_DIFF = `diff --git a/src/api/users.ts b/src/api/users.ts
index 1234567..abcdefg 100644
--- a/src/api/users.ts
+++ b/src/api/users.ts
@@ -1,15 +1,22 @@
 import { db } from '../db';
 
-export async function getUser(id: string) {
-  const user = await db.user.findUnique({ where: { id } });
-  return user;
+export async function getUser(id: string, includeDeleted: boolean = false) {
+  if (!id) return null;
+  
+  const user = await db.user.findUnique({ 
+    where: { id },
+    include: {
+      posts: true,
+      profile: true
+    }
+  });
+  
+  if (!user && includeDeleted) {
+    return db.deletedUser.findFirst({ where: { originalId: id } });
+  }
+  return user;
 }
 
-export async function updateUser(id: string, data: any) {
-  await db.user.update({ where: { id }, data });
+export async function updateUser(id: string, data: Partial<User>) {
+  if (!id) throw new Error('User ID is required');
+  const user = await db.user.update({ where: { id }, data });
+  return user;
 }
 
-export async function deleteUser(id: string) {
-  await db.user.delete({ where: { id } });
+export async function deleteUser(id: string, hardDelete: boolean = false) {
+  if (hardDelete) {
+    await db.user.delete({ where: { id } });
+  } else {
+    await db.user.update({ where: { id }, data: { deletedAt: new Date() } });
+  }
 }`;

// --- Animated Dots ---
function AnimatedDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const iv = setInterval(() => {
      setDots((p) => (p.length >= 3 ? '' : p + '.'));
    }, 500);
    return () => clearInterval(iv);
  }, []);
  return <span>{dots}</span>;
}

// --- Score Ring ---
function ScoreDisplay({ score }: { score: number | null }) {
  if (score === null) return null;

  let color = '#f87171';
  let bg = 'rgba(239, 68, 68, 0.08)';
  let border = 'rgba(239, 68, 68, 0.25)';
  let ring = 'rgba(239, 68, 68, 0.6)';
  let label = 'Needs Work';

  if (score >= 8) {
    color = '#4ade80';
    bg = 'rgba(34, 197, 94, 0.08)';
    border = 'rgba(34, 197, 94, 0.25)';
    ring = 'rgba(34, 197, 94, 0.6)';
    label = 'Excellent';
  } else if (score >= 5) {
    color = '#facc15';
    bg = 'rgba(234, 179, 8, 0.08)';
    border = 'rgba(234, 179, 8, 0.25)';
    ring = 'rgba(234, 179, 8, 0.6)';
    label = 'Fair';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 mb-6"
    >
      <div
        className="relative flex items-center justify-center w-20 h-20 rounded-2xl border"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        {/* Glow effect behind the score */}
        <div
          className="absolute inset-0 rounded-2xl blur-xl opacity-30"
          style={{ backgroundColor: ring }}
        />
        <span
          className="relative text-3xl font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
        <span className="absolute bottom-2 right-3 text-[10px] text-[#55556a] font-medium">
          /10
        </span>
      </div>
      <div>
        <div className="text-sm font-semibold" style={{ color }}>
          {label}
        </div>
        <div className="text-xs text-[#55556a] mt-0.5">AI Code Review Score</div>
      </div>
    </motion.div>
  );
}

// --- Markdown Renderer ---
function ReviewMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-invert max-w-none text-sm text-[#c0c0d0] [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-[#f0f0f5] [&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-[rgba(255,255,255,0.06)] [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-[#c0c0d0] [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_li]:text-sm [&_li]:leading-relaxed [&_p]:leading-relaxed [&_p]:mb-2 [&_strong]:text-[#f0f0f5] [&_strong]:font-medium [&_code]:text-[#a78bfa] [&_code:not(pre_*)]:bg-[rgba(255,255,255,0.06)] [&_code:not(pre_*)]:px-1.5 [&_code:not(pre_*)]:py-0.5 [&_code:not(pre_*)]:rounded [&_code:not(pre_*)]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-[#8b5cf6]/40 [&_blockquote]:pl-4 [&_blockquote]:text-[#8888a0] [&_blockquote]:italic [&_hr]:border-[rgba(255,255,255,0.06)] [&_hr]:my-5">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeStr = String(children).replace(/\n$/, '');
            if (match) {
              return (
                <div className="rounded-lg overflow-hidden my-3 border border-[rgba(255,255,255,0.06)]">
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: 'rgba(0,0,0,0.3)',
                      fontSize: '0.8rem',
                    }}
                  >
                    {codeStr}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// --- History Item ---
function HistoryItem({
  item,
  isSelected,
  onClick,
  onDelete,
}: {
  item: ReviewRecord;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const scoreColor =
    item.score === null
      ? '#55556a'
      : item.score >= 8
        ? '#4ade80'
        : item.score >= 5
          ? '#facc15'
          : '#f87171';

  const date = new Date(item.createdAt);
  const timeStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]'
          : 'hover:bg-[rgba(255,255,255,0.03)] border border-transparent'
      }`}
      onClick={onClick}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border border-[rgba(255,255,255,0.04)]"
        style={{
          backgroundColor:
            item.score !== null ? `${scoreColor}15` : 'rgba(255,255,255,0.04)',
          color: scoreColor,
        }}
      >
        {item.score !== null ? item.score : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#f0f0f5] truncate">
          {item.title || 'Untitled Review'}
        </div>
        <div className="text-xs text-[#55556a] flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {timeStr}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-1.5 rounded-md text-[#55556a] hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// --- Loading State ---
function ReviewLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles className="w-8 h-8 text-[#8b5cf6]" />
      </motion.div>
      <div className="text-sm text-[#8888a0]">
        Analyzing your code<AnimatedDots />
      </div>
      <div className="text-xs text-[#55556a] text-center">
        Reviewing for bugs, security issues, and best practices
      </div>
      <div className="w-full max-w-sm mt-4 space-y-3 px-4">
        <Shimmer lines={3} />
        <ShimmerCard />
        <Shimmer lines={4} />
      </div>
    </div>
  );
}

// --- Resize Handle ---
function ResizeHandle() {
  return (
    <PanelResizeHandle className="w-px bg-[rgba(255,255,255,0.06)] hover:bg-[#8b5cf6]/30 active:bg-[#8b5cf6]/50 transition-colors duration-200 relative group/data">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-[#8b5cf6]/40 opacity-0 group-hover/data:opacity-100 transition-opacity" />
    </PanelResizeHandle>
  );
}

// =====================
// MAIN COMPONENT
// =====================
export default function PrReview() {
  const { toast } = useToast();
  const [diff, setDiff] = useState('');
  const [title, setTitle] = useState('');
  const [currentReview, setCurrentReview] = useState<FullReview | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedReview, setCopiedReview] = useState(false);
  const [copiedGithub, setCopiedGithub] = useState(false);

  const lineCount = diff ? diff.split('\n').length : 0;
  const charCount = diff.length;
  const hasReview = currentReview !== null && !isReviewing;

  // Fetch history
  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/pr-review/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Submit review
  const handleSubmit = useCallback(async () => {
    if (!diff.trim() || isReviewing) return;

    setIsReviewing(true);
    setCurrentReview(null);

    try {
      const res = await fetch('/api/pr-review/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff, title: title.trim() || undefined }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Failed to generate review');
      }

      const saved = await res.json();
      setCurrentReview(saved);
      toast({
        title: 'Review complete',
        description: `Score: ${saved.score ?? 'N/A'}/10`,
      });
      fetchReviews();
    } catch (err: unknown) {
      toast({
        title: 'Review failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsReviewing(false);
    }
  }, [diff, title, isReviewing, toast, fetchReviews]);

  // Load example
  const handleLoadExample = useCallback(() => {
    setDiff(SAMPLE_DIFF);
    setTitle('Refactor user API with soft delete and type safety');
  }, []);

  // Clear
  const handleClear = useCallback(() => {
    setDiff('');
    setTitle('');
  }, []);

  // Copy review
  const handleCopyReview = useCallback(async () => {
    if (!currentReview?.review) return;
    await navigator.clipboard.writeText(currentReview.review);
    setCopiedReview(true);
    setTimeout(() => setCopiedReview(false), 2000);
    toast({ title: 'Copied to clipboard' });
  }, [currentReview, toast]);

  // Copy as GitHub comment
  const handleCopyGithub = useCallback(async () => {
    if (!currentReview?.review) return;
    const formatted = currentReview.review
      .replace(/^## Score:.+$/m, '')
      .replace(/^## /gm, '### ')
      .trim();

    const gh = `## PR Review Bot\n\n${currentReview.score !== null ? `**Score: ${currentReview.score}/10**\n\n` : ''}${formatted}`;
    await navigator.clipboard.writeText(gh);
    setCopiedGithub(true);
    setTimeout(() => setCopiedGithub(false), 2000);
    toast({ title: 'GitHub comment copied' });
  }, [currentReview, toast]);

  // Regenerate
  const handleRegenerate = useCallback(() => {
    if (!diff.trim()) return;
    handleSubmit();
  }, [diff, handleSubmit]);

  // Load history item
  const handleLoadHistory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/pr-review/reviews/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentReview(data);
        setDiff(data.diff);
        setTitle(data.title || '');
        setShowHistory(false);
      }
    } catch {
      // silent
    }
  }, []);

  // Delete review
  const handleDeleteReview = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
        const res = await fetch(`/api/pr-review/reviews/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setReviews((prev) => prev.filter((r) => r.id !== id));
          if (currentReview?.id === id) {
            setCurrentReview(null);
          }
          toast({ title: 'Review deleted' });
        }
      } catch {
        // silent
      }
    },
    [currentReview, toast]
  );

  return (
    <WorkspaceLayout
      actions={
        <div className="flex items-center gap-1.5">
          <GlowButton
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowHistory((p) => !p)}
          >
            {showHistory ? (
              <PanelLeftClose className="w-4 h-4 text-[#8888a0]" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-[#8888a0]" />
            )}
          </GlowButton>
          {hasReview && (
            <>
              <GlowButton variant="ghost" size="sm" onClick={handleCopyReview}>
                {copiedReview ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copy
              </GlowButton>
              <GlowButton variant="ghost" size="sm" onClick={handleCopyGithub}>
                {copiedGithub ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Github className="w-3.5 h-3.5" />
                )}
                GitHub
              </GlowButton>
              <GlowButton variant="ghost" size="sm" onClick={handleRegenerate}>
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </GlowButton>
            </>
          )}
        </div>
      }
    >
      <div className="flex gap-4 h-[calc(100vh-10rem)]">
        {/* ====== HISTORY SIDEBAR ====== */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 overflow-hidden"
            >
              <GlassCard className="h-full flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#8b5cf6]" />
                    <span className="text-sm font-medium text-[#f0f0f5]">
                      History
                    </span>
                    {reviews.length > 0 && (
                      <ForgeBadge variant="default">{reviews.length}</ForgeBadge>
                    )}
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {reviews.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <GitPullRequest className="w-8 h-8 text-[#333348] mx-auto mb-2" />
                      <p className="text-xs text-[#55556a]">
                        No reviews yet
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {reviews.map((item) => (
                        <HistoryItem
                          key={item.id}
                          item={item}
                          isSelected={currentReview?.id === item.id}
                          onClick={() => handleLoadHistory(item.id)}
                          onDelete={(e) => handleDeleteReview(e, item.id)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== MAIN SPLIT VIEW ====== */}
        <div className="flex-1 min-w-0">
          <PanelGroup direction="horizontal" className="h-full">
            {/* --- LEFT: Input Panel --- */}
            <Panel defaultSize={50} minSize={30} order={1}>
              <GlassCard className="h-full flex flex-col overflow-hidden" glow="purple">
                {/* Header */}
                <div className="px-5 pt-4 pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center">
                        <FileCode className="w-3.5 h-3.5 text-[#a78bfa]" />
                      </div>
                      <span className="text-sm font-medium text-[#f0f0f5]">
                        Diff Input
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GlowButton variant="ghost" size="sm" onClick={handleLoadExample}>
                        <AlignLeft className="w-3.5 h-3.5" />
                        Example
                      </GlowButton>
                      {diff && (
                        <GlowButton variant="ghost" size="sm" onClick={handleClear}>
                          <X className="w-3.5 h-3.5" />
                        </GlowButton>
                      )}
                    </div>
                  </div>

                  {/* Title input */}
                  <AnimatedInput
                    placeholder="PR title (optional)..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    size="sm"
                    icon={<GitPullRequest className="w-3.5 h-3.5" />}
                    className="mb-3"
                  />
                </div>

                {/* Textarea */}
                <div className="flex-1 px-5 pb-3 min-h-0">
                  <textarea
                    value={diff}
                    onChange={(e) => setDiff(e.target.value)}
                    placeholder={`Paste your git diff here...\n\nYou can use:\n  git diff\n  git diff main...feature\n  git diff --staged\n\nThen paste the output above.`}
                    className="w-full h-full rounded-lg bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.06)] text-[#c0c0d0] placeholder:text-[#333348] forge-code text-[13px] leading-relaxed p-4 focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/20 transition-all duration-200 resize-none"
                    spellCheck={false}
                  />
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[#55556a]">
                    <span className="flex items-center gap-1">
                      <ArrowDownToLine className="w-3 h-3" />
                      {lineCount} lines
                    </span>
                    <span>{charCount.toLocaleString()} chars</span>
                  </div>
                  <GlowButton
                    variant="primary"
                    size="md"
                    onClick={handleSubmit}
                    disabled={!diff.trim() || isReviewing}
                    glow
                  >
                    {isReviewing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </motion.div>
                        Reviewing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Review Code
                      </>
                    )}
                  </GlowButton>
                </div>
              </GlassCard>
            </Panel>

            <ResizeHandle />

            {/* --- RIGHT: Review Panel --- */}
            <Panel defaultSize={50} minSize={30} order={2}>
              <GlassCard className="h-full flex flex-col overflow-hidden" glow="purple">
                {/* Review header */}
                <div className="px-5 pt-4 pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-[#60a5fa]" />
                    </div>
                    <span className="text-sm font-medium text-[#f0f0f5]">
                      AI Review
                    </span>
                    {hasReview && currentReview.score !== null && (
                      <ForgeBadge
                        variant={
                          currentReview.score >= 8
                            ? 'success'
                            : currentReview.score >= 5
                              ? 'warning'
                              : 'destructive'
                        }
                      >
                        {currentReview.score}/10
                      </ForgeBadge>
                    )}
                  </div>
                  {hasReview && (
                    <div className="flex items-center gap-1">
                      <GlowButton
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyReview}
                        className="h-7"
                      >
                        {copiedReview ? (
                          <Check className="w-3 h-3 text-[#4ade80]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </GlowButton>
                      <GlowButton
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyGithub}
                        className="h-7"
                      >
                        {copiedGithub ? (
                          <Check className="w-3 h-3 text-[#4ade80]" />
                        ) : (
                          <Github className="w-3 h-3" />
                        )}
                      </GlowButton>
                    </div>
                  )}
                </div>

                {/* Review content */}
                <div className="flex-1 min-h-0 mt-3">
                  <AnimatePresence mode="wait">
                    {isReviewing ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full"
                      >
                        <ReviewLoadingState />
                      </motion.div>
                    ) : currentReview ? (
                      <motion.div
                        key={currentReview.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full"
                      >
                        <ScrollArea className="h-full">
                          <div className="px-6 pb-6">
                            <ScoreDisplay score={currentReview.score} />
                            <Separator className="mb-5 bg-[rgba(255,255,255,0.06)]" />
                            <ReviewMarkdown content={currentReview.review || ''} />
                          </div>
                        </ScrollArea>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full"
                      >
                        <EmptyState
                          icon={<Sparkles className="w-12 h-12" />}
                          title="No Review Yet"
                          description="Paste a Git diff on the left and click 'Review Code' to get an AI-powered code review with bug detection, security analysis, and best practice suggestions."
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </WorkspaceLayout>
  );
}