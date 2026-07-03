'use client';

import React, { lazy, Suspense } from 'react';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { FloatingNav } from '@/components/layout/FloatingNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/modules/home/HomePage';
import { ForgeAppShell } from '@/components/layout/ForgeAppShell';

export default function ForgePage() {
  return (
    <ForgeAppShell />
  );
}