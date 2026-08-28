import { prisma } from './prisma'

export async function getVisibleActivityForUser(activityId: string, userId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, userId: true },
  })

  if (!activity) return null
  if (activity.userId === userId) return activity

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: activity.userId },
        { userAId: activity.userId, userBId: userId },
      ],
    },
    select: { id: true },
  })

  return friendship ? activity : null
}

export async function canViewUserContent(ownerId: string, viewerId: string) {
  if (ownerId === viewerId) return true

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: viewerId, userBId: ownerId },
        { userAId: ownerId, userBId: viewerId },
      ],
    },
    select: { id: true },
  })

  return Boolean(friendship)
}
