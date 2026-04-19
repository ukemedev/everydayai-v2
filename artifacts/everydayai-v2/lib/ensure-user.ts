import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function ensureUser() {
  const { userId } = await auth()
  if (!userId) return null

  let user = await db.user.findUnique({ where: { clerkId: userId } })

  if (!user) {
    const clerkUser = await currentUser()
    const email =
      clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${userId}@unknown.com`

    user = await db.user.create({
      data: {
        clerkId: userId,
        email,
        plan: "free",
      },
    })
  }

  return user
}
