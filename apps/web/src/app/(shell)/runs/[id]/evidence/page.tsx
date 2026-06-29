'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { useSession } from '@/lib/auth'
import { getFindings } from '@/lib/api'
import type { Finding, FindingSeverity } from '@agentforge/domain'

const severityColor: Record<
  FindingSeverity,
  'default' | 'info' | 'warning' | 'error' | 'success'
> = {
  info: 'info',
  low: 'default',
  medium: 'warning',
  high: 'error',
  critical: 'error',
}

export default function EvidencePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token, logout } = useSession()

  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      router.replace('/login')
      return
    }
    getFindings(id)
      .then((data) => setFindings(data))
      .catch((err) => {
        if (err instanceof Error && err.message === 'Unauthorized') {
          logout()
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load findings')
      })
      .finally(() => setLoading(false))
  }, [id, token, logout, router])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/runs/${id}`)}
        >
          Workbench
        </Button>
        <Typography variant="h5" fontWeight={700}>
          Evidence Panel
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && findings.length === 0 && (
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: 'text.secondary',
          }}
        >
          <SearchOffIcon sx={{ fontSize: 64, opacity: 0.3 }} />
          <Typography variant="h6">No findings</Typography>
          <Typography>This run has no recorded findings.</Typography>
        </Box>
      )}

      {!loading && !error && findings.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {findings.map((f) => (
                <TableRow key={f.id} hover>
                  <TableCell>
                    <Chip
                      label={f.severity}
                      color={severityColor[f.severity]}
                      size="small"
                      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{f.category}</TableCell>
                  <TableCell>{f.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={f.status}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
