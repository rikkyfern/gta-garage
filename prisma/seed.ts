import { PrismaClient, ActivityType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean up existing data
  await prisma.activityComment.deleteMany()
  await prisma.activityLike.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.carPhoto.deleteMany()
  await prisma.car.deleteMany()
  await prisma.garage.deleteMany()
  await prisma.friendship.deleteMany()
  await prisma.friendRequest.deleteMany()
  await prisma.adminWarning.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.emailVerificationToken.deleteMany()
  await prisma.user.deleteMany()

  const password = await bcrypt.hash('password123', 12)

  // Create users
  const [franklin, trevor, michael] = await Promise.all([
    prisma.user.create({
      data: {
        username: 'franklin_clinton',
        email: 'franklin@gtagarage.dev',
        password,
        role: 'ADMIN',
        emailVerified: true,
        bio: 'Hustler from Strawberry. If it rolls, I can drive it.',
        avatar: 'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/sample.jpg',
      },
    }),
    prisma.user.create({
      data: {
        username: 'trevor_philips',
        email: 'trevor@gtagarage.dev',
        password,
        emailVerified: true,
        bio: 'Trevor Philips Industries. Sandy Shores finest.',
        avatar: null,
      },
    }),
    prisma.user.create({
      data: {
        username: 'michael_de_santa',
        email: 'michael@gtagarage.dev',
        password,
        emailVerified: true,
        bio: 'Retired. Living the dream in Rockford Hills.',
        avatar: null,
      },
    }),
  ])

  // Friendships
  await prisma.friendRequest.create({
    data: { senderId: franklin.id, receiverId: michael.id, status: 'ACCEPTED' },
  })
  await prisma.friendship.create({
    data: { userAId: franklin.id, userBId: michael.id },
  })
  await prisma.friendRequest.create({
    data: { senderId: franklin.id, receiverId: trevor.id, status: 'ACCEPTED' },
  })
  await prisma.friendship.create({
    data: { userAId: franklin.id, userBId: trevor.id },
  })
  await prisma.friendRequest.create({
    data: { senderId: michael.id, receiverId: trevor.id, status: 'ACCEPTED' },
  })
  await prisma.friendship.create({
    data: { userAId: michael.id, userBId: trevor.id },
  })

  // Garages
  const franklinGarage = await prisma.garage.create({
    data: {
      userId: franklin.id,
      garageName: 'Strawberry Speed Shop',
      location: 'Strawberry, LS',
      description: 'My main garage. Started from the bottom.',
    },
  })

  const michaelGarage = await prisma.garage.create({
    data: {
      userId: michael.id,
      garageName: 'Rockford Hills Collection',
      location: 'Rockford Hills, LS',
      description: 'High-end vehicles only. No rust allowed.',
    },
  })

  const trevorGarage = await prisma.garage.create({
    data: {
      userId: trevor.id,
      garageName: "Trevor's Junkyard Rides",
      location: 'Sandy Shores',
      description: 'Runs. Most of the time.',
    },
  })

  // Cars
  const franklinCar1 = await prisma.car.create({
    data: {
      garageId: franklinGarage.id,
      userId: franklin.id,
      carName: 'Bravado Buffalo S',
      carModel: 'Buffalo S',
      description: 'Fully upgraded. Fastest car in Strawberry.',
      location: 'Strawberry, LS',
    },
  })

  const franklinCar2 = await prisma.car.create({
    data: {
      garageId: franklinGarage.id,
      userId: franklin.id,
      carName: 'Übermacht Sentinel',
      carModel: 'Sentinel XS',
      description: 'Clean coupe. Never raced.',
      location: 'Strawberry, LS',
    },
  })

  const michaelCar = await prisma.car.create({
    data: {
      garageId: michaelGarage.id,
      userId: michael.id,
      carName: 'Enus Cognoscenti',
      carModel: 'Cognoscenti 55',
      description: 'The family car. Amanda still parks it too close to the wall.',
      location: 'Rockford Hills, LS',
    },
  })

  const trevorCar = await prisma.car.create({
    data: {
      garageId: trevorGarage.id,
      userId: trevor.id,
      carName: 'Canis Bodhi',
      carModel: 'Bodhi',
      description: "Gets the job done. Don't ask what the stains are.",
      location: 'Sandy Shores',
    },
  })

  // Activities
  const [act1, act2, act3, act4] = await Promise.all([
    prisma.activity.create({
      data: {
        userId: franklin.id,
        activityType: ActivityType.GARAGE_CREATED,
        garageId: franklinGarage.id,
      },
    }),
    prisma.activity.create({
      data: {
        userId: franklin.id,
        activityType: ActivityType.CAR_ADDED,
        carId: franklinCar1.id,
        garageId: franklinGarage.id,
      },
    }),
    prisma.activity.create({
      data: {
        userId: michael.id,
        activityType: ActivityType.CAR_ADDED,
        carId: michaelCar.id,
        garageId: michaelGarage.id,
      },
    }),
    prisma.activity.create({
      data: {
        userId: trevor.id,
        activityType: ActivityType.GARAGE_CREATED,
        garageId: trevorGarage.id,
      },
    }),
  ])

  // Likes
  await Promise.all([
    prisma.activityLike.create({ data: { activityId: act1.id, userId: michael.id } }),
    prisma.activityLike.create({ data: { activityId: act1.id, userId: trevor.id } }),
    prisma.activityLike.create({ data: { activityId: act2.id, userId: michael.id } }),
    prisma.activityLike.create({ data: { activityId: act3.id, userId: franklin.id } }),
    prisma.activityLike.create({ data: { activityId: act4.id, userId: franklin.id } }),
  ])

  // Comments
  await Promise.all([
    prisma.activityComment.create({
      data: { activityId: act1.id, userId: michael.id, commentText: 'Nice setup, Frank!' },
    }),
    prisma.activityComment.create({
      data: { activityId: act2.id, userId: trevor.id, commentText: 'That Buffalo is a beast. I want a race.' },
    }),
    prisma.activityComment.create({
      data: { activityId: act3.id, userId: franklin.id, commentText: 'Yo that Cognoscenti is clean Mike.' },
    }),
  ])

  console.log('✅ Seed complete!')
  console.log('Demo accounts (password: password123):')
  console.log('  franklin@gtagarage.dev (admin)')
  console.log('  michael@gtagarage.dev')
  console.log('  trevor@gtagarage.dev')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
