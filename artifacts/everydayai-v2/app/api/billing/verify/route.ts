import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const VALID_PLANS = ["starter", "pro", "agency"]

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse("User not found", { status: 404 })

  const { reference, plan } = await req.json()

  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecret) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 })
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${paystackSecret}` } }
  )
  const data = await res.json()

  if (!data.status || data.data?.status !== "success") {
    return NextResponse.json({ error: "Payment not successful" }, { status: 400 })
  }

  await db.user.update({
    where: { id: user.id },
    data: { plan },
  })

  return NextResponse.json({ message: `Upgraded to ${plan}`, plan })
}
