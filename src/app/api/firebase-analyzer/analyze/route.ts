import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

interface FirebaseUsageData {
  name: string;
  period?: string;
  firestore: {
    reads: number;
    writes: number;
    deletes: number;
  };
  storage: {
    storedGB: number;
    downloadGB: number;
    uploadGB: number;
  };
  auth: {
    monthlyActiveUsers: number;
  };
  hosting: {
    transferGB: number;
    functionInvocations: number;
    functionComputeGBs: number;
  };
}

interface CostLineItem {
  service: string;
  metric: string;
  usage: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  freeTierUsage?: number;
  billableUsage?: number;
}

function calculateCosts(data: FirebaseUsageData): { items: CostLineItem[]; total: number } {
  const items: CostLineItem[] = [];

  // Firestore reads: $0.036 per 100K, first 50K free
  const fsReadsFree = 50000;
  const fsReadsBillable = Math.max(0, data.firestore.reads - fsReadsFree);
  const fsReadsCost = (fsReadsBillable / 100000) * 0.036;
  items.push({
    service: 'Firestore',
    metric: 'Document Reads',
    usage: data.firestore.reads,
    unit: 'reads',
    unitCost: 0.036,
    totalCost: fsReadsCost,
    freeTierUsage: fsReadsFree,
    billableUsage: fsReadsBillable,
  });

  // Firestore writes: $0.108 per 100K, first 20K free
  const fsWritesFree = 20000;
  const fsWritesBillable = Math.max(0, data.firestore.writes - fsWritesFree);
  const fsWritesCost = (fsWritesBillable / 100000) * 0.108;
  items.push({
    service: 'Firestore',
    metric: 'Document Writes',
    usage: data.firestore.writes,
    unit: 'writes',
    unitCost: 0.108,
    totalCost: fsWritesCost,
    freeTierUsage: fsWritesFree,
    billableUsage: fsWritesBillable,
  });

  // Firestore deletes: $0.018 per 100K, first 20K free
  const fsDeletesFree = 20000;
  const fsDeletesBillable = Math.max(0, data.firestore.deletes - fsDeletesFree);
  const fsDeletesCost = (fsDeletesBillable / 100000) * 0.018;
  items.push({
    service: 'Firestore',
    metric: 'Document Deletes',
    usage: data.firestore.deletes,
    unit: 'deletes',
    unitCost: 0.018,
    totalCost: fsDeletesCost,
    freeTierUsage: fsDeletesFree,
    billableUsage: fsDeletesBillable,
  });

  // Storage: $0.026/GB/month, first 5GB free
  const storageFree = 5;
  const storageBillable = Math.max(0, data.storage.storedGB - storageFree);
  const storageCost = storageBillable * 0.026;
  items.push({
    service: 'Cloud Storage',
    metric: 'Storage',
    usage: data.storage.storedGB,
    unit: 'GB',
    unitCost: 0.026,
    totalCost: storageCost,
    freeTierUsage: storageFree,
    billableUsage: storageBillable,
  });

  // Storage download: $0.12/GB, first 1GB/day free (~30GB/month)
  const downloadFree = 30;
  const downloadBillable = Math.max(0, data.storage.downloadGB - downloadFree);
  const downloadCost = downloadBillable * 0.12;
  items.push({
    service: 'Cloud Storage',
    metric: 'Download',
    usage: data.storage.downloadGB,
    unit: 'GB',
    unitCost: 0.12,
    totalCost: downloadCost,
    freeTierUsage: downloadFree,
    billableUsage: downloadBillable,
  });

  // Storage upload: $0.021/GB
  const uploadCost = data.storage.uploadGB * 0.021;
  items.push({
    service: 'Cloud Storage',
    metric: 'Upload',
    usage: data.storage.uploadGB,
    unit: 'GB',
    unitCost: 0.021,
    totalCost: uploadCost,
  });

  // Auth: $0.055/MAU for Identity Platform
  const authCost = data.auth.monthlyActiveUsers * 0.055;
  items.push({
    service: 'Authentication',
    metric: 'Monthly Active Users',
    usage: data.auth.monthlyActiveUsers,
    unit: 'MAU',
    unitCost: 0.055,
    totalCost: authCost,
  });

  // Hosting transfer: $0.15/GB, first 10GB free
  const hostingTransferFree = 10;
  const hostingTransferBillable = Math.max(0, data.hosting.transferGB - hostingTransferFree);
  const hostingTransferCost = hostingTransferBillable * 0.15;
  items.push({
    service: 'Hosting',
    metric: 'Data Transfer',
    usage: data.hosting.transferGB,
    unit: 'GB',
    unitCost: 0.15,
    totalCost: hostingTransferCost,
    freeTierUsage: hostingTransferFree,
    billableUsage: hostingTransferBillable,
  });

  // Functions: $0.40/million invocations, first 2M free
  const funcInvocationsFree = 2000000;
  const funcInvocationsBillable = Math.max(0, data.hosting.functionInvocations - funcInvocationsFree);
  const funcInvocationsCost = (funcInvocationsBillable / 1000000) * 0.40;
  items.push({
    service: 'Cloud Functions',
    metric: 'Invocations',
    usage: data.hosting.functionInvocations,
    unit: 'invocations',
    unitCost: 0.40,
    totalCost: funcInvocationsCost,
    freeTierUsage: funcInvocationsFree,
    billableUsage: funcInvocationsBillable,
  });

  // Functions compute: $0.0000025/GB-sec
  const funcComputeCost = data.hosting.functionComputeGBs * 0.0000025;
  items.push({
    service: 'Cloud Functions',
    metric: 'Compute Time',
    usage: data.hosting.functionComputeGBs,
    unit: 'GB-sec',
    unitCost: 0.0000025,
    totalCost: funcComputeCost,
  });

  const total = items.reduce((sum, item) => sum + item.totalCost, 0);

  return { items, total };
}

function getCostByService(items: CostLineItem[]) {
  const serviceMap: Record<string, number> = {};
  for (const item of items) {
    serviceMap[item.service] = (serviceMap[item.service] || 0) + item.totalCost;
  }
  return Object.entries(serviceMap).map(([name, cost]) => ({ name, cost: Math.round(cost * 100) / 100 }));
}

function getTopCostDriver(items: CostLineItem[]): CostLineItem {
  return items.reduce((max, item) => (item.totalCost > max.totalCost ? item : max), items[0]);
}

export async function POST(request: NextRequest) {
  try {
    const body: FirebaseUsageData = await request.json();

    if (!body.name || !body.firestore || !body.storage || !body.auth || !body.hosting) {
      return NextResponse.json(
        { error: 'Missing required fields: name, firestore, storage, auth, hosting' },
        { status: 400 }
      );
    }

    const { items, total } = calculateCosts(body);
    const costByService = getCostByService(items);
    const topDriver = getTopCostDriver(items);

    const estimatedSavingsLow = total * 0.15;
    const estimatedSavingsHigh = total * 0.35;

    let recommendations = '';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content:
              'You are a Firebase cost optimization expert. Analyze this Firebase usage data and provide specific, actionable recommendations to reduce costs. Be practical and specific with numbers. Format your response in markdown with clear sections, bullet points, and specific dollar savings estimates for each recommendation.',
          },
          {
            role: 'user',
            content: `Analyze this Firebase usage and recommend cost optimizations:\n${JSON.stringify(
              {
                ...body,
                calculatedCosts: { items, total, costByService, topDriver },
              },
              null,
              2
            )}`,
          },
        ],
        thinking: { type: 'disabled' },
      });
      recommendations = completion.choices[0]?.message?.content || '';
    } catch (aiError) {
      console.error('AI recommendation generation failed:', aiError);
      recommendations =
        '## Cost Optimization Recommendations\n\n' +
        '- **Firestore**: Review read patterns and consider adding composite indexes to reduce unnecessary reads. Implement client-side caching with `enableIndexedDbPersistence()`.\n' +
        '- **Cloud Storage**: Implement lifecycle policies to auto-delete old files. Use CDN caching headers to reduce download costs.\n' +
        '- **Cloud Functions**: Optimize function memory allocation. Consider using minimum required memory to reduce GB-sec costs.\n' +
        '- **Authentication**: Review active user metrics and consider session management optimizations.';
    }

    const report = await db.firebaseReport.create({
      data: {
        name: body.name,
        data: JSON.stringify({
          ...body,
          analysis: {
            items,
            total,
            costByService,
            topDriver,
            estimatedSavingsLow,
            estimatedSavingsHigh,
          },
        }),
        recommendations,
      },
    });

    return NextResponse.json({
      id: report.id,
      name: report.name,
      createdAt: report.createdAt,
      analysis: {
        items,
        total: Math.round(total * 100) / 100,
        costByService,
        topDriver: {
          service: topDriver.service,
          metric: topDriver.metric,
          cost: Math.round(topDriver.totalCost * 100) / 100,
        },
        estimatedSavingsLow: Math.round(estimatedSavingsLow * 100) / 100,
        estimatedSavingsHigh: Math.round(estimatedSavingsHigh * 100) / 100,
      },
      recommendations,
    });
  } catch (error) {
    console.error('Firebase analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze Firebase usage' }, { status: 500 });
  }
}