import type { InputItem } from '@agentforge/domain'
import { query } from '../../db/index.js'

export interface ValidateInputsContext {
  runId: string
  inputs: InputItem[]
}

export interface ValidateInputsResult {
  valid: boolean
  validInputs: InputItem[]
  invalidInputs: InputItem[]
  errors: string[]
}

export async function validateInputs(ctx: ValidateInputsContext): Promise<ValidateInputsResult> {
  const errors: string[] = []
  const validInputs: InputItem[] = []
  const invalidInputs: InputItem[] = []

  if (ctx.inputs.length === 0) {
    errors.push('No input items found for this run')
    return { valid: false, validInputs, invalidInputs, errors }
  }

  for (const item of ctx.inputs) {
    const itemErrors: string[] = []

    if (!item.content_ref || item.content_ref.trim() === '') {
      itemErrors.push(`Input item "${item.label}" (${item.id}) has no content_ref`)
    }

    if (!item.label || item.label.trim() === '') {
      itemErrors.push(`Input item ${item.id} has no label`)
    }

    if (itemErrors.length > 0) {
      invalidInputs.push(item)
      errors.push(...itemErrors)

      // Mark invalid in DB
      await query(
        `UPDATE input_items
         SET validation_status = 'invalid',
             warnings_json = $1::jsonb
         WHERE id = $2`,
        [
          JSON.stringify(itemErrors.map((msg) => ({ code: 'MISSING_CONTENT', message: msg }))),
          item.id,
        ]
      )
    } else {
      validInputs.push(item)

      // Mark valid in DB
      await query(
        `UPDATE input_items SET validation_status = 'valid' WHERE id = $1`,
        [item.id]
      )
    }
  }

  // Require at least one item with idea content
  const hasIdea = validInputs.some(
    (i) => i.input_type === 'idea' || i.label === 'idea' || i.content_ref.length > 0
  )
  if (!hasIdea) {
    errors.push('No valid idea content found in input items')
  }

  return {
    valid: errors.length === 0,
    validInputs,
    invalidInputs,
    errors,
  }
}
