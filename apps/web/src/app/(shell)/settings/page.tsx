'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import { useSession } from '@/lib/auth'

export default function SettingsPage() {
  const { userId } = useSession()

  const [displayName, setDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    if (!currentPassword) {
      setPasswordError('Current password is required.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    setPasswordSaved(true)
    setCurrentPassword('')
    setNewPassword('')
    setTimeout(() => setPasswordSaved(false), 3000)
  }

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Settings
      </Typography>

      {/* Profile section */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Profile
        </Typography>
        <Box
          component="form"
          onSubmit={handleProfileSave}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Display Name"
            fullWidth
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
          <TextField
            label="Email"
            fullWidth
            value=""
            disabled
            helperText={`User ID: ${userId ?? '—'}`}
            InputProps={{ readOnly: true }}
          />
          {profileSaved && (
            <Alert severity="success">Profile updated.</Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained">
              Save Profile
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Password section */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Change Password
        </Typography>
        <Box
          component="form"
          onSubmit={handlePasswordSave}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Divider />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            helperText="Minimum 8 characters"
          />
          {passwordError && (
            <Alert severity="error">{passwordError}</Alert>
          )}
          {passwordSaved && (
            <Alert severity="success">Password changed.</Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained">
              Update Password
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}
