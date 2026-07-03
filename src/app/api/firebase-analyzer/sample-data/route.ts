import { NextResponse } from 'next/server';

const sampleProjects = [
  {
    name: 'E-Commerce Platform',
    period: '2024-06',
    firestore: { reads: 4500000, writes: 850000, deletes: 120000 },
    storage: { storedGB: 128, downloadGB: 340, uploadGB: 85 },
    auth: { monthlyActiveUsers: 85000 },
    hosting: { transferGB: 520, functionInvocations: 1200000, functionComputeGBs: 2400 },
  },
  {
    name: 'Social Media App',
    period: '2024-06',
    firestore: { reads: 12000000, writes: 3200000, deletes: 800000 },
    storage: { storedGB: 450, downloadGB: 2100, uploadGB: 180 },
    auth: { monthlyActiveUsers: 320000 },
    hosting: { transferGB: 800, functionInvocations: 8500000, functionComputeGBs: 12000 },
  },
  {
    name: 'SaaS Dashboard',
    period: '2024-06',
    firestore: { reads: 800000, writes: 150000, deletes: 30000 },
    storage: { storedGB: 25, downloadGB: 60, uploadGB: 12 },
    auth: { monthlyActiveUsers: 15000 },
    hosting: { transferGB: 80, functionInvocations: 350000, functionComputeGBs: 450 },
  },
  {
    name: 'Mobile Game Backend',
    period: '2024-06',
    firestore: { reads: 8500000, writes: 2100000, deletes: 500000 },
    storage: { storedGB: 35, downloadGB: 150, uploadGB: 25 },
    auth: { monthlyActiveUsers: 180000 },
    hosting: { transferGB: 200, functionInvocations: 5200000, functionComputeGBs: 6000 },
  },
];

export async function POST() {
  const randomIndex = Math.floor(Math.random() * sampleProjects.length);
  const sample = sampleProjects[randomIndex];

  return NextResponse.json(sample);
}