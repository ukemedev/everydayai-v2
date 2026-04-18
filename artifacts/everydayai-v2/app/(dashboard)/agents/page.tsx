"use client"

import { useState, useEffect } from "react"
import axios from "axios"

interface Agent {
  id: number
  name: string
  description: string | null
  model: string
  isPublished: boolean
  widgetToken: string | null
  createdAt: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", systemPrompt: "", model: "gpt-4o-mini" })
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<number | null>(null)

  return <div />
}
