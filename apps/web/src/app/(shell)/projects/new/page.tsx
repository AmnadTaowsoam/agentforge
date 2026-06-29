'use client'

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { useSession } from '@/lib/auth'
import { createProject, createRun } from '@/lib/api'

const STEPS = ['Project Details', 'Raw Idea', 'Start Run']

function NewProjectForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useSession()

  const [activeStep, setActiveStep] = useState(0)
  const [projectName, setProjectName] = useState('')
  const [domain, setDomain] = useState('')
  const [rawIdea, setRawIdea] = useState(searchParams.get('idea') ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const step1Valid = projectName.trim().length > 0
  const step2Valid = rawIdea.trim().length >= 10
  const canStart = step1Valid && step2Valid

  function handleNext() {
    if (activeStep < STEPS.length - 1) setActiveStep((s) => s + 1)
  }

  function handleBack() {
    if (activeStep > 0) setActiveStep((s) => s - 1)
  }

  async function handleSubmit() {
    if (!token) {
      router.replace('/login')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const project = await createProject({
        name: projectName.trim(),
        domain: domain.trim() || undefined,
        metadata_json: { rawIdea: rawIdea.trim() },
      })
      const run = await createRun(project.id)
      router.push(`/runs/${run.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start run')
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Create New Project
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Step 1: Project Details
            </Typography>
            <TextField
              label="Project Name"
              required
              fullWidth
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Repair-Shop Queue Manager"
            />
            <TextField
              label="Domain (optional)"
              fullWidth
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. field-service, e-commerce"
              helperText="Business domain to guide the AI agent"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!step1Valid}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Step 2: Raw Idea
            </Typography>
            <TextField
              label="Describe your idea"
              required
              fullWidth
              multiline
              rows={8}
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              placeholder="Paste or type your raw idea text here (minimum 10 characters)..."
              helperText={`${rawIdea.length} characters — minimum 10 required`}
              error={rawIdea.length > 0 && rawIdea.length < 10}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!step2Valid}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Step 3: Review & Start
            </Typography>
            <Box sx={{ background: 'action.hover', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Project Name
              </Typography>
              <Typography fontWeight={600}>{projectName}</Typography>
              {domain && (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom mt={1}>
                    Domain
                  </Typography>
                  <Typography>{domain}</Typography>
                </>
              )}
              <Typography variant="body2" color="text.secondary" gutterBottom mt={1}>
                Idea ({rawIdea.length} chars)
              </Typography>
              <Typography
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  fontSize: 14,
                }}
              >
                {rawIdea}
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Button onClick={handleBack} disabled={submitting}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={!canStart || submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {submitting ? 'Starting…' : 'Start Run'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <NewProjectForm />
    </Suspense>
  )
}
