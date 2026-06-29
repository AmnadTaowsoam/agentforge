'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import CancelIcon from '@mui/icons-material/Cancel'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import RateReviewIcon from '@mui/icons-material/RateReview'
import StatusBadge from '@/components/StatusBadge'
import SplitPane from '@/components/SplitPane'
import ArtifactTabs from '@/components/ArtifactTabs'
import { useSession } from '@/lib/auth'
import { getRun, getArtifacts, cancelRun } from '@/lib/api'
import type { Run, Artifact } from '@agentforge/domain'

const POLL_INTERVAL_MS = 5000
const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled'])

export default function WorkbenchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token, logout } = useSession()

  const [run, setRun] = useState<Run | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [runData, artifactData] = await Promise.all([
        getRun(id),
        getArtifacts(id),
      ])
      setRun(runData)
      setArtifacts(artifactData)

      if (TERMINAL_STATUSES.has(runData.status)) {
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        logout()
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load run')
    } finally {
      setLoading(false)
    }
  }, [id, logout])

  useEffect(() => {
    if (!token) {
      router.replace('/login')
      return
    }
    void fetchData()
  }, [token, fetchData, router])

  useEffect(() => {
    if (!run) return
    if (TERMINAL_STATUSES.has(run.status)) return
    pollRef.current = setInterval(() => void fetchData(), POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [run?.status, fetchData])

  async function handleCancel() {
    if (!run) return
    setCancelling(true)
    try {
      const updated = await cancelRun(run.id)
      setRun(updated)
    } catch {
      // ignore
    } finally {
      setCancelling(false)
    }
  }

  const rawIdea = (run?.config_json?.rawIdea as string) ?? ''

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !run) {
    return <Alert severity="error">{error ?? 'Run not found'}</Alert>
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" fontWeight={700}>
            Workbench
          </Typography>
          <Chip label={`Run ${run.id.slice(0, 8)}`} size="small" variant="outlined" />
          <StatusBadge status={run.status} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            startIcon={<FactCheckIcon />}
            onClick={() => router.push(`/runs/${run.id}/evidence`)}
          >
            Evidence
          </Button>
          <Button
            size="small"
            startIcon={<RateReviewIcon />}
            onClick={() => router.push(`/runs/${run.id}/review`)}
          >
            Review
          </Button>
          {run.status === 'running' && (
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={cancelling}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Box>

      {run.status === 'running' && (
        <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />
      )}

      {run.failure_message && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {run.failure_message}
        </Alert>
      )}

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <SplitPane
          defaultLeftWidth={38}
          left={
            <Box sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Input
              </Typography>
              <Typography
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  mt: 1,
                }}
              >
                {rawIdea || '(no raw idea recorded)'}
              </Typography>
            </Box>
          }
          right={<ArtifactTabs artifacts={artifacts} />}
        />
      </Box>
    </Box>
  )
}
