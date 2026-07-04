'use client';

import React, { Suspense, lazy } from 'react';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { FloatingNav } from '@/components/layout/FloatingNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/modules/home/HomePage';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';

// Lazy load tool modules
const ApiRecorderModule = lazy(() => import('@/modules/api-recorder/ApiRecorder'));
const OpenApiMockModule = lazy(() => import('@/modules/openapi-mock/OpenApiMock'));
const PromptManagerModule = lazy(() => import('@/modules/prompt-manager/PromptManager'));
const FirebaseAnalyzerModule = lazy(() => import('@/modules/firebase-analyzer/FirebaseAnalyzer'));
const PrReviewModule = lazy(() => import('@/modules/pr-review/PrReview'));

const toolComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'api-recorder': ApiRecorderModule,
  'openapi-mock': OpenApiMockModule,
  'prompt-manager': PromptManagerModule,
  'firebase-analyzer': FirebaseAnalyzerModule,
  'pr-review': PrReviewModule,
};

function ToolLoader() {
  return (
    <WorkspaceLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[rgba(139,92,246,0.3)] border-t-[#8b5cf6] rounded-full animate-spin" />
          <span className="text-sm text-[#55556a]">Loading workspace...</span>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

export function ForgeAppShell() {
  const { currentView } = useNavigationStore();
  const ToolComponent = toolComponents[currentView];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 forge-mesh" />
        <div className="absolute inset-0 forge-noise" />
      </div>

      {/* Navigation */}
      <FloatingNav />
      <CommandPalette />

      {/* Main content */}
      <main className="relative z-10 flex-1">
        <Suspense fallback={<ToolLoader />}>
          {currentView === 'home' ? <HomePage /> : null}
          {ToolComponent && <ToolComponent />}
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}