'use client'

import React, { useRef, useState, useCallback } from 'react'
import Box from '@mui/material/Box'

interface Props {
  left: React.ReactNode
  right: React.ReactNode
  defaultLeftWidth?: number // percent, e.g. 40
}

export default function SplitPane({ left, right, defaultLeftWidth = 40 }: Props) {
  const [leftPct, setLeftPct] = useState(defaultLeftWidth)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = useCallback(() => {
    dragging.current = true

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(80, Math.max(20, pct)))
    }

    const onMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        userSelect: dragging.current ? 'none' : 'auto',
      }}
    >
      <Box
        sx={{
          width: `${leftPct}%`,
          flexShrink: 0,
          overflow: 'auto',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        {left}
      </Box>
      {/* Drag handle */}
      <Box
        onMouseDown={onMouseDown}
        sx={{
          width: 6,
          cursor: 'col-resize',
          background: 'transparent',
          flexShrink: 0,
          '&:hover': { background: 'action.hover' },
        }}
      />
      <Box sx={{ flex: 1, overflow: 'auto' }}>{right}</Box>
    </Box>
  )
}
