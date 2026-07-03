import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const endpoint = await db.requestEndpoint.findUnique({
      where: { id },
      include: {
        requests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      )
    }

    const baseUrl = new URL(request.url).origin

    return NextResponse.json({
      id: endpoint.id,
      name: endpoint.name,
      slug: endpoint.slug,
      url: `${baseUrl}/api/recorder/catch/${endpoint.slug}`,
      isActive: endpoint.isActive,
      createdAt: endpoint.createdAt,
      requests: endpoint.requests.map((r) => ({
        id: r.id,
        method: r.method,
        path: r.path,
        headers: r.headers,
        query: r.query,
        body: r.body,
        statusCode: r.statusCode,
        responseTime: r.responseTime,
        ipAddress: r.ipAddress,
        createdAt: r.createdAt,
      })),
    })
  } catch (error) {
    console.error('Failed to get endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to get endpoint' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const endpoint = await db.requestEndpoint.findUnique({ where: { id } })
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      )
    }

    await db.recordedRequest.deleteMany({ where: { endpointId: id } })
    await db.requestEndpoint.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to delete endpoint' },
      { status: 500 }
    )
  }
}