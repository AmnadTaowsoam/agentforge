'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import { useSession } from '@/lib/auth'

export const DRAWER_WIDTH = 220

const navItems = [
  { label: 'Command Center', href: '/', icon: <DashboardIcon /> },
  { label: 'New Project', href: '/projects/new', icon: <AddCircleOutlineIcon /> },
  { label: 'Sample Gallery', href: '/samples', icon: <CollectionsBookmarkIcon /> },
  { label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
]

interface Props {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function AppNav({ mobileOpen = false, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, isAuthenticated } = useSession()

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={700} color="primary">
          AgentForge
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                selected={active}
                onClick={() => {
                  router.push(item.href)
                  onClose?.()
                }}
                sx={{ borderRadius: 1, mx: 1, my: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Divider />
      {isAuthenticated && (
        <Box sx={{ p: 1 }}>
          <ListItemButton
            onClick={logout}
            sx={{ borderRadius: 1, color: 'text.secondary' }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign out" />
          </ListItemButton>
        </Box>
      )}
    </Box>
  )

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  )
}
