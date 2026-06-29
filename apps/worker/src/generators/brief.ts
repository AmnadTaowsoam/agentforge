import type { ArtifactType, InputItem } from '@agentforge/domain'
import { createMockProvider } from '../providers/mock.js'

export interface GeneratorInput {
  runId: string
  inputs: InputItem[]
}

export interface GeneratorResult {
  content: string
  artifactType: ArtifactType
}

export async function generateBrief(input: GeneratorInput): Promise<GeneratorResult> {
  const provider = createMockProvider()
  const ideaItem = input.inputs.find((i) => i.input_type === 'idea' || i.label === 'idea')
  const idea = ideaItem?.content_ref ?? input.inputs.map((i) => i.content_ref).join('; ')

  const content = await provider.generate(
    { idea, context: { runId: input.runId, inputs: input.inputs } },
    'brief'
  )

  return { content, artifactType: 'brief' }
}
