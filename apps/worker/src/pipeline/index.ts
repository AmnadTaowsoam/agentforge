import path from 'path'
import type { InputItem } from '@agentforge/domain'
import { query } from '../db/index.js'
import { validateInputs } from './steps/validate-inputs.js'
import { prepareContext } from './steps/prepare-context.js'
import { executeCoreWorkflow } from './steps/execute-core-workflow.js'
import { validateOutput } from './steps/validate-output.js'
import { generateFindings } from './steps/generate-findings.js'
import { packageArtifacts } from './steps/package-artifacts.js'
import { notifyReviewers } from './steps/notify-reviewers.js'

export interface PipelineInput {
  runId: string
  projectId: string
  workspaceId: string
}

export interface PipelineResult {
  success: boolean
  artifactCount: number
  findingCount: number
}

const OUTPUT_DIR = path.resolve(process.cwd(), 'output')

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  // Load input items from DB
  const itemsResult = await query<InputItem>(
    `SELECT id, run_id, input_type, label, content_ref, validation_status, warnings_json, created_at
     FROM input_items
     WHERE run_id = $1
     ORDER BY created_at ASC`,
    [input.runId]
  )
  const inputs = itemsResult.rows

  // Step 1: Validate inputs
  const inputValidation = await validateInputs({ runId: input.runId, inputs })

  // Step 2: Prepare context (even if partial input validation failure, attempt generation)
  const _ctx = prepareContext({ runId: input.runId, inputs: inputValidation.validInputs })

  // Step 3: Execute all 7 generators in parallel
  const generatedArtifacts = await executeCoreWorkflow({
    runId: input.runId,
    inputs: inputValidation.validInputs.length > 0 ? inputValidation.validInputs : inputs,
  })

  // Step 4: Validate output
  const outputValidation = validateOutput(generatedArtifacts)

  // Step 5: Generate findings for any validation failures or assumptions
  const assumptions: string[] = []
  if (inputValidation.validInputs.length < inputs.length) {
    assumptions.push(
      `${inputs.length - inputValidation.validInputs.length} input item(s) were invalid; generation proceeded with ${inputValidation.validInputs.length} valid items`
    )
  }
  if (!inputs.some((i) => i.input_type === 'idea' || i.label === 'idea')) {
    assumptions.push('No explicit "idea" input found; used first available content as the idea')
  }

  const findings = await generateFindings({
    runId: input.runId,
    inputValidation,
    outputValidation,
    assumptionsMade: assumptions,
  })

  // Step 6: Package artifacts into DB (idempotent)
  const packaged = await packageArtifacts({
    runId: input.runId,
    artifacts: generatedArtifacts,
    outputDir: OUTPUT_DIR,
  })

  // Step 7: Notify reviewers via audit event
  await notifyReviewers({
    runId: input.runId,
    workspaceId: input.workspaceId,
    artifactCount: packaged.length,
    findingCount: findings.length,
  })

  return {
    success: true,
    artifactCount: packaged.length,
    findingCount: findings.length,
  }
}
