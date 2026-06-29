import path from 'path'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../../db/index.js'
import type { GeneratedArtifact } from './execute-core-workflow.js'

export interface PackageArtifactsInput {
  runId: string
  artifacts: GeneratedArtifact[]
  outputDir: string
}

export interface PackagedArtifact {
  artifactType: string
  path: string
  checksum: string
}

function canonicalizePath(outputDir: string, artifactType: string): string {
  // FORBID-PATH-TRAVERSAL-001: canonicalize and verify path stays within outputDir
  const safeName = artifactType.replace(/[^a-z0-9-]/g, '')
  const outputPath = path.resolve(outputDir, safeName + '.md')

  // Ensure the resolved path stays strictly under outputDir
  const resolvedDir = path.resolve(outputDir)
  if (!outputPath.startsWith(resolvedDir + path.sep) && outputPath !== resolvedDir) {
    throw new Error(`Path traversal rejected: ${outputPath} is not under ${resolvedDir}`)
  }

  return outputPath
}

function computeChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex')
}

export async function packageArtifacts(
  input: PackageArtifactsInput
): Promise<PackagedArtifact[]> {
  const packaged: PackagedArtifact[] = []

  for (const artifact of input.artifacts) {
    const safePath = canonicalizePath(input.outputDir, artifact.artifactType)
    const checksum = computeChecksum(artifact.content)

    // Idempotent upsert: ON CONFLICT updates existing row
    await query(
      `INSERT INTO artifacts (id, run_id, artifact_type, path, content_ref, checksum, validation_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'valid')
       ON CONFLICT (run_id, artifact_type)
       DO UPDATE SET
         content_ref = EXCLUDED.content_ref,
         checksum = EXCLUDED.checksum,
         validation_status = EXCLUDED.validation_status`,
      [uuidv4(), input.runId, artifact.artifactType, safePath, artifact.content, checksum]
    )

    packaged.push({
      artifactType: artifact.artifactType,
      path: safePath,
      checksum,
    })
  }

  return packaged
}
