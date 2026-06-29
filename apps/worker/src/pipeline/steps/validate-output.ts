import type { ArtifactType } from '@agentforge/domain'
import type { GeneratedArtifact } from './execute-core-workflow.js'

export interface ValidationIssue {
  artifactType: ArtifactType
  issues: string[]
}

export interface ValidateOutputResult {
  valid: boolean
  issues: ValidationIssue[]
}

// Required top-level headings per artifact type
const REQUIRED_SECTIONS: Record<ArtifactType, string[]> = {
  brief: ['# Project Brief', '## Summary', '## Target Users', '## Core Features', '## Success Metrics'],
  requirements: ['# Requirements', '## Functional Requirements', '## Non-Functional Requirements'],
  architecture: ['# Architecture', '## Overview', '## System Components'],
  'api-contract': ['# API Contract', '## Overview', '## Endpoints'],
  'data-model': ['# Data Model', '## Overview', '## Table Definitions'],
  tasks: ['# Task Breakdown', '## Sprint'],
  'test-plan': ['# Test Plan', '## Overview', '## Testing Strategy'],
  readme: ['#'],
  scaffold: ['#'],
}

export function validateOutput(artifacts: GeneratedArtifact[]): ValidateOutputResult {
  const issues: ValidationIssue[] = []

  for (const artifact of artifacts) {
    const artIssues: string[] = []

    if (!artifact.content || artifact.content.trim().length === 0) {
      artIssues.push('Content is empty')
    } else {
      const requiredSections = REQUIRED_SECTIONS[artifact.artifactType] ?? ['#']
      for (const section of requiredSections) {
        if (!artifact.content.includes(section)) {
          artIssues.push(`Missing required section: "${section}"`)
        }
      }

      // Check for literal undefined or [object Object]
      if (artifact.content.includes('undefined')) {
        artIssues.push('Content contains literal "undefined"')
      }
      if (artifact.content.includes('[object Object]')) {
        artIssues.push('Content contains "[object Object]"')
      }
    }

    if (artIssues.length > 0) {
      issues.push({ artifactType: artifact.artifactType, issues: artIssues })
    }
  }

  return { valid: issues.length === 0, issues }
}
