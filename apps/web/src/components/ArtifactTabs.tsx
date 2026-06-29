'use client'

import React, { useState } from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Artifact } from '@agentforge/domain'

interface Props {
  artifacts: Artifact[]
}

export default function ArtifactTabs({ artifacts }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  if (artifacts.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">No artifacts generated yet.</Typography>
      </Box>
    )
  }

  const current = artifacts[activeTab]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={(_, v: number) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        {artifacts.map((a, i) => (
          <Tab key={a.id} label={a.artifact_type} id={`artifact-tab-${i}`} />
        ))}
      </Tabs>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {current && (
          <>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              {current.path}
            </Typography>
            <Box
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: 13,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: 'action.hover',
                p: 2,
                borderRadius: 1,
                m: 0,
              }}
            >
              {current.content_ref}
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
