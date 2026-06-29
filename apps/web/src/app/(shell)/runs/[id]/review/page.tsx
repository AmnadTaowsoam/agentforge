'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StatusBadge from '@/components/StatusBadge'
import { useSession } from '@/lib/auth'
import { getRun, submitReview } from '@/lib/api'
import type { Run, ReviewDecision } from '@agentforge/domain'

const DECISIONS: Array<{ value: ReviewDecision; label: string }> = [
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'needs_revision', label: 'Needs Revision' },
]

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token, logout } = useSession()

  const [run, setRun] = useState<Run | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [decision, setDecision] = useState<ReviewDecision>('approved')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token) {
      router.replace('/login')
      return
    }
    getRun(id)
      .then((data) => setRun(data))
      .catch((err) => {
        if (err instanceof Error && err.message === 'Unauthorized') {
          logout()
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load run')
      })
      .finally(() => setLoading(false))
  }, [id, token, logout, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await submitReview(id, { decision, notes: notes.trim() || undefined })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const isCompleted = run?.status === 'completed'

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/runs/${id}`)}
        >
          Workbench
        </Button>
        <Typography variant="h5" fontWeight={700}>
          Review Panel
        </Typography>
        {run && <StatusBadge status={run.status} />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {submitted && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Review submitted successfully.
        </Alert>
      )}

      {!isCompleted && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Review is only available once the run has completed (current status:{' '}
          <strong>{run?.status ?? 'unknown'}</strong>).
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <FormControl disabled={!isCompleted || submitted}>
            <FormLabel>Decision</FormLabel>
            <RadioGroup
              value={decision}
              onChange={(e) => setDecision(e.target.value as ReviewDecision)}
            >
              {DECISIONS.map((d) => (
                <FormControlLabel
                  key={d.value}
                  value={d.value}
                  control={<Radio />}
                  label={d.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <TextField
            label="Notes (optional)"
            multiline
            rows={4}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!isCompleted || submitted}
            placeholder="Add any reviewer notes here…"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={!isCompleted || submitting || submitted}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
