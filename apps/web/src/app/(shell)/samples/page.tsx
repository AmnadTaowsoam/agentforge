'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import BuildIcon from '@mui/icons-material/Build'
import InventoryIcon from '@mui/icons-material/Inventory'
import EventIcon from '@mui/icons-material/Event'

const SAMPLES = [
  {
    title: 'Repair-Shop Queue Management',
    description:
      'A system to manage customer intake, technician assignment, and repair status tracking for an automotive or electronics repair shop. Includes queue prioritization and SMS notifications.',
    idea:
      'Build a repair-shop queue management system. Customers drop off items and get a ticket. Staff assign jobs to technicians, track progress through states (received → diagnosing → repairing → ready → collected), and customers get SMS updates. Admin dashboard shows queue depth, average turnaround time, and technician utilization.',
    icon: <BuildIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Inventory Tracker',
    description:
      'Real-time inventory management with stock-level alerts, supplier purchase orders, and barcode scanning support for small-to-medium warehouses.',
    idea:
      'Create an inventory tracking system for a small warehouse. Users can scan or manually enter barcodes, view current stock levels, set reorder thresholds, and automatically generate purchase orders when stock falls below minimum. Include a dashboard with low-stock alerts, recent movements, and supplier contacts.',
    icon: <InventoryIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Event Booking System',
    description:
      'Online booking platform for venues and events, with seat selection, payment integration hooks, and automated confirmation emails.',
    idea:
      'Build an event booking platform. Organizers create events with capacity limits, seating maps, and ticket tiers. Attendees browse events, select seats, and complete checkout. After payment the system sends confirmation emails and QR-code tickets. Organizers see a real-time dashboard of bookings, revenue, and check-in status.',
    icon: <EventIcon sx={{ fontSize: 40 }} />,
  },
]

export default function SamplesPage() {
  const router = useRouter()

  function useIdea(idea: string) {
    const encoded = encodeURIComponent(idea)
    router.push(`/projects/new?idea=${encoded}`)
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1}>
        Sample Gallery
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Pick a sample to pre-populate the Create Flow with a starter idea.
      </Typography>

      <Grid container spacing={3}>
        {SAMPLES.map((sample) => (
          <Grid item xs={12} sm={6} md={4} key={sample.title}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ color: 'primary.main', mb: 1 }}>{sample.icon}</Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {sample.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sample.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => useIdea(sample.idea)}
                >
                  Use this idea
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
