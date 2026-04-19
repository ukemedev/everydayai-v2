import OpenAI from "openai"

interface ToolDef {
  name: string
  description: string
  parameters: unknown
}

export async function syncToolsToAssistant(
  client: OpenAI,
  assistantId: string,
  tools: ToolDef[]
) {
  const functionTools = tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: (tool.parameters as object) ?? {
        type: "object",
        properties: {},
        required: [],
      },
    },
  }))

  await client.beta.assistants.update(assistantId, {
    tools: [{ type: "file_search" }, ...functionTools],
  })
}
