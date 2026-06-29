import { v4 as uuidv4 } from 'uuid'
import type { FindingSeverity } from '@agentforge/domain'
import { query } from '../../db/index.js'
import type { ValidateInputsResult } from './validate-inputs.js'
import type { ValidateOutputResult } from './validate-output.js'

export interface GenerateFindingsInput {
  runId: string
  inputValidation: ValidateInputsResult
  outputValidation: ValidateOutputResult
  assumptionsMade: string[]
}

export interface GeneratedFinding {
  id: string
  severity: FindingSeverity
  category: string
  title: string
  body: string
}

export async function generateFindings(
  input: GenerateFindingsInput
): Promise<GeneratedFinding[]> {
  const findings: GeneratedFinding[] = []

  // Findings from input validation failures
  for (const error of input.inputValidation.errors) {
    findings.push({
      id: uuidv4(),
      severity: 'medium',
      category: 'input-validation',
      title: 'Input Validation Issue',
      body: error,
    })
  }

  // Findings from output validation failures
  for (const issue of input.outputValidation.issues) {
    for (const detail of issue.issues) {
      findings.push({
        id: uuidv4(),
        severity: 'high',
        category: 'output-validation',
        title: `Artifact Quality Issue: ${issue.artifactType}`,
        body: detail,
      })
    }
  }

  // Findings from assumptions made during generation
  for (const assumption of input.assumptionsMade) {
    findings.push({
      id: uuidv4(),
      severity: 'info',
      category: 'assumption',
      title: 'Assumption Made During Generation',
      body: assumption,
    })
  }

  // Persist findings to DB
  for (const finding of findings) {
    await query(
      `INSERT INTO findings (id, run_id, severity, category, title, body, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open')
       ON CONFLICT DO NOTHING`,
      [finding.id, input.runId, finding.severity, finding.category, finding.title, finding.body]
    )
  }

  return findings
}
