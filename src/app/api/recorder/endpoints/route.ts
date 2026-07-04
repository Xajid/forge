import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function generateSlug(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function isValidSlug(slug: string): boolean {
  // Must be 1-64 chars, lowercase letters, numbers, hyphens; no leading/trailing hyphens
  return /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/.test(slug) && slug.length <= 64
}

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = body.name?.trim() || null

    let slug: string

    if (body.slug?.trim()) {
      // User provided a custom slug — sanitize and validate
      const sanitized = sanitizeSlug(body.slug.trim())
      if (!sanitized) {
        return NextResponse.json(
          { error: 'Invalid path: must contain at least one letter or number' },
          { status: 400 }
        )
      }
      if (!isValidSlug(sanitized)) {
        return NextResponse.json(
          { error: 'Invalid path: use lowercase letters, numbers, and hyphens only (no leading/trailing hyphens)' },
          { status: 400 }
        )
      }
      // Check uniqueness
      const existing = await db.requestEndpoint.findUnique({ where: { slug: sanitized } })
      if (existing) {
        return NextResponse.json(
          { error: `Path "/${sanitized}" is already taken — try a different one` },
          { status: 409 }
        )
      }
      slug = sanitized
    } else {
      // Auto-generate
      slug = generateSlug()
      while (await db.requestEndpoint.findUnique({ where: { slug } })) {
        slug = generateSlug()
      }
    }

    const endpoint = await db.requestEndpoint.create({
      data: {
        name: name || `Endpoint ${slug}`,
        slug,
        isActive: true,
      },
    })

    // Build the full URL for the endpoint
    const baseUrl = new URL(request.url).origin
    const fullUrl = `${baseUrl}/api/recorder/catch/${slug}`

    return NextResponse.json({
      id: endpoint.id,
      name: endpoint.name,
      slug: endpoint.slug,
      url: fullUrl,
      isActive: endpoint.isActive,
      createdAt: endpoint.createdAt,
      requestCount: 0,
    })
  } catch (error) {
    console.error('Failed to create endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to create endpoint' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const endpoints = await db.requestEndpoint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { requests: true },
        },
      },
    })

    const baseUrl = new URL(request.url).origin

    return NextResponse.json(
      endpoints.map((ep) => ({
        id: ep.id,
        name: ep.name,
        slug: ep.slug,
        url: `${baseUrl}/api/recorder/catch/${ep.slug}`,
        isActive: ep.isActive,
        createdAt: ep.createdAt,
        requestCount: ep._count.requests,
      }))
    )
  } catch (error) {
    console.error('Failed to list endpoints:', error)
    return NextResponse.json(
      { error: 'Failed to list endpoints' },
      { status: 500 }
    )
  }
}