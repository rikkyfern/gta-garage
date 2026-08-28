import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ ipAddress: string }> }

const ipActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('block'),
    reason: z.string().trim().min(5).max(500),
  }),
  z.object({
    action: z.literal('unblock'),
  }),
])

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { ipAddress: rawIpAddress } = await params
    const ipAddress = decodeURIComponent(rawIpAddress)
    const body = await req.json()
    const result = ipActionSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const now = new Date()
    const ipControl = await prisma.ipControl.upsert({
      where: { ipAddress },
      create: {
        ipAddress,
        requestCount: 0,
        scanCount: 0,
        blocked: result.data.action === 'block',
        blockReason: result.data.action === 'block' ? result.data.reason : null,
        blockedAt: result.data.action === 'block' ? now : null,
        firstSeenAt: now,
        lastSeenAt: now,
        windowStartedAt: now,
      },
      update:
        result.data.action === 'block'
          ? { blocked: true, blockReason: result.data.reason, blockedAt: now }
          : { blocked: false, blockReason: null, blockedAt: null, scanCount: 0, requestCount: 0 },
    })

    return Response.json({ ipControl })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}
