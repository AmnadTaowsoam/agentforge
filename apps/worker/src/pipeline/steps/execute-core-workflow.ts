import type { ArtifactType, InputItem } from '@agentforge/domain'
import { generateBrief } from '../../generators/brief.js'
import { generateRequirements } from '../../generators/requirements.js'
import { generateArchitecture } from '../../generators/architecture.js'
import { generateApiContract } from '../../generators/api-contract.js'
import { generateDataModel } from '../../generators/data-model.js'
import { generateTasks } from '../../generators/tasks.js'
import { generateTestPlan } from '../../generators/test-plan.js'

export interface WorkflowInput {
  runId: string
  inputs: InputItem[]
}

export interface GeneratedArtifact {
  artifactType: ArtifactType
  content: string
}

export async function executeCoreWorkflow(
  input: WorkflowInput
): Promise<GeneratedArtifact[]> {
  // Run all 7 generators in parallel
  const results = await Promise.all([
    generateBrief({ runId: input.runId, inputs: input.inputs }),
    generateRequirements({ runId: input.runId, inputs: input.inputs }),
    generateArchitecture({ runId: input.runId, inputs: input.inputs }),
    generateApiContract({ runId: input.runId, inputs: input.inputs }),
    generateDataModel({ runId: input.runId, inputs: input.inputs }),
    generateTasks({ runId: input.runId, inputs: input.inputs }),
    generateTestPlan({ runId: input.runId, inputs: input.inputs }),
  ])

  return results.map((r) => ({ artifactType: r.artifactType, content: r.content }))
}
