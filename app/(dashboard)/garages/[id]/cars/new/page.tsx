import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NewCarForm } from './NewCarForm'

type Params = { params: Promise<{ id: string }> }

export const metadata = { title: 'Add Car' }

export default async function NewCarPage({ params }: Params) {
  let session

  try {
    session = await requireAuth()
  } catch {
    redirect('/login')
  }

  const { id: garageId } = await params
  const garage = await prisma.garage.findFirst({
    where: { id: garageId, userId: session.userId },
    select: { id: true, garageName: true },
  })

  if (!garage) notFound()

  return <NewCarForm garageId={garage.id} garageName={garage.garageName} />
}
