import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleCatch(request, params)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleCatch(request, params)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleCatch(request, params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleCatch(request, params)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleCatch(request, params)
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleCatch(request, params)
}

async function handleCatch(
  request: NextRequest,
  params: Promise<{ slug: string }>
) {
  const startTime = Date.now()
  const { slug } = await params

  // Find the endpoint
  const endpoint = await db.requestEndpoint.findUnique({
    where: { slug },
  })

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Endpoint not found' },
      { status: 404 }
    )
  }

  if (!endpoint.isActive) {
    return NextResponse.json(
      { error: 'Endpoint is inactive' },
      { status: 410 }
    )
  }

  const method = request.method
  const path = request.nextUrl.pathname

  // Collect headers (exclude certain headers for cleanliness)
  const headersToExclude = new Set([
    'host',
    'connection',
    'content-length',
    'accept-encoding',
  ])
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    if (!headersToExclude.has(key.toLowerCase())) {
      headers[key] = value
    }
  })

  // Get query parameters
  const query: Record<string, string> = {}
  request.nextUrl.searchParams.forEach((value, key) => {
    query[key] = value
  })

  // Get body (for methods that support it)
  let body: string | null = null
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = request.headers.get('content-type') || ''
    if (
      contentType.includes('application/json') ||
      contentType.includes('text/') ||
      contentType.includes('application/xml') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      try {
        const raw = await request.text()
        body = raw || null
      } catch {
        body = null
      }
    } else {
      body = `[Binary data: ${contentType}]`
    }
  }

  // Get IP address
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const responseTime = Date.now() - startTime

  // Store the recorded request
  await db.recordedRequest.create({
    data: {
      endpointId: endpoint.id,
      method,
      path,
      headers: JSON.stringify(headers),
      query: Object.keys(query).length > 0 ? JSON.stringify(query) : null,
      body,
      statusCode: 200,
      responseTime,
      ipAddress,
    },
  })

  return NextResponse.json({
    ok: true,
    slug,
    method,
    timestamp: new Date().toISOString(),
    message: 'Request recorded successfully',
  })
}