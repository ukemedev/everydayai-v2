import { NextResponse } from "next/server"
import { ensureUser } from "@/lib/ensure-user"
import OpenAI from "openai"

export async function POST() {
  const user = await ensureUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  if (!user.openaiApiKey) {
    return NextResponse.json({ error: "No API key configured." }, { status: 400 })
  }

  try {
    const client = new OpenAI({ apiKey: user.openaiApiKey })
    await client.models.list()
    return NextResponse.json({ success: true })
  } catch (e: any) {
    const msg = e?.message || "Invalid API key."
    const clean = msg.includes("Incorrect API key")
      ? "Incorrect API key — check your key at platform.openai.com."
      : msg.includes("quota")
      ? "Your API key has exceeded its quota."
      : msg
    return NextResponse.json({ error: clean }, { status: 400 })
  }
}
