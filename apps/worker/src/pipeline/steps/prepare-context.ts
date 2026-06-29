import type { InputItem } from '@agentforge/domain'

export interface PrepareContextInput {
  runId: string
  inputs: InputItem[]
}

export interface RunContext {
  runId: string
  idea: string
  additionalContext: Record<string, string>
  inputCount: number
}

export function prepareContext(input: PrepareContextInput): RunContext {
  const ideaItem = input.inputs.find(
    (i) => i.input_type === 'idea' || i.label === 'idea' || i.label === 'product_idea'
  )

  // Fall back to first item with content, then join all content
  const idea =
    ideaItem?.content_ref ??
    input.inputs.find((i) => i.content_ref.trim().length > 0)?.content_ref ??
    input.inputs.map((i) => i.content_ref).join(' ')

  const additionalContext: Record<string, string> = {}
  for (const item of input.inputs) {
    if (item !== ideaItem && item.content_ref.trim().length > 0) {
      additionalContext[item.label] = item.content_ref
    }
  }

  return {
    runId: input.runId,
    idea,
    additionalContext,
    inputCount: input.inputs.length,
  }
}
