'use client'

import Chip from '@mui/material/Chip'
import type { RunStatus } from '@agentforge/domain'

interface Props {
  status: RunStatus | string
}

const colorMap: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  ready: 'info',
  running: 'warning',
  needs_input: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
}

export default function StatusBadge({ status }: Props) {
  const color = colorMap[status] ?? 'default'
  return (
    <Chip
      label={status.replace('_', ' ')}
      color={color}
      size="small"
      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
    />
  )
}
