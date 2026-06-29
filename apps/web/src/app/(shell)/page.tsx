'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Link from '@mui/material/Link'
import CircularProgress from '@mui/material/CircularProgress'
import InboxIcon from '@mui/icons-material/Inbox'
import AddIcon from '@mui/icons-material/Add'
import StatusBadge from '@/components/StatusBadge'
import { useSession } from '@/lib/auth'
import { registerLogout } from '@/lib/api'
import type { Run } from '@agentforge/domain'

// Lightweight combined shape returned by the audit event list or runs list
interface RunRow {
  id: string
  projectName: string
  status: Run['status']
  created_at: string
}

export default function CommandCenterPage() {
  const router = useRouter()
  const { logout, isAuthenticated, token } = useSession()
  const [rows, setRows] = useState<RunRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Register logout so api.ts can call it on 401
  useEffect(() => {
    registerLogout(logout)
  }, [logout])

  // Redirect if not authenticated
  useEffect(() => {
    if (!token && !loading) {
      router.replace('/login')
    }
  }, [token, loading, router])

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    async function load() {
      try {
        // Use the audit event feed to show recent activity
        const res = await fetch('/api/v1/audit-events?page=1&limit=20', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) {
          logout()
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        // Map audit events that reference runs
        const runEvents: RunRow[] = (data.data ?? [])
          .filter((e: { target_type: string }) => e.target_type === 'run')
          .map((e: { target_id: string; metadata_json: Record<string, unknown>; created_at: string }) => ({
            id: e.target_id,
            projectName: (e.metadata_json?.projectName as string) ?? 'Project',
            status: (e.metadata_json?.status as Run['status']) ?? 'ready',
            created_at: e.created_at,
          }))
        setRows(runEvents)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [isAuthenticated, token, logout])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>
          Command Center
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/projects/new')}
        >
          New Project
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && rows.length === 0 && (
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
          <InboxIcon sx={{ fontSize: 64, opacity: 0.3 }} />
          <Typography variant="h6">No runs yet</Typography>
          <Typography>
            Create your first project to get started.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => router.push('/projects/new')}
          >
            New Project
          </Button>
        </Box>
      )}

      {!loading && !error && rows.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.projectName}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(row.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Link
                      href={`/runs/${row.id}`}
                      underline="hover"
                      sx={{ fontWeight: 600 }}
                    >
                      Open
                    </Link>
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
