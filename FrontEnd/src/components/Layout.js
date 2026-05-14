import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Drawer, List, ListItemButton,
    ListItemIcon, ListItemText, Box, IconButton, Avatar, Tooltip, Divider
} from '@mui/material';
import {
    Dashboard, CurrencyExchange, SwapHoriz,
    Logout, Star, AccountBalance, ManageAccounts, Diamond
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 240;
const DARK_BG = '#0f0c29';
const DARK_BG2 = '#1a1a2e';

const navItems = [
    { label: 'Dashboard',       icon: <Dashboard />,        path: '/dashboard' },
    { label: 'Exchange',        icon: <CurrencyExchange />, path: '/exchange'  },
    { label: 'Transfer',        icon: <SwapHoriz />,        path: '/transfer'  },
    { label: 'NACHA Payment',   icon: <AccountBalance />,   path: '/nacha'     },
    { label: 'K Star Bullion',  icon: <Diamond />,          path: '/bullion'   },
    { label: 'My Account',      icon: <ManageAccounts />,   path: '/account'   },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Box sx={{ display: 'flex', background: '#07071a', minHeight: '100vh' }}>
            <AppBar position="fixed" elevation={0} sx={{
                zIndex: 1201,
                background: `linear-gradient(90deg, ${DARK_BG} 0%, ${DARK_BG2} 100%)`,
                borderBottom: '1px solid rgba(255,215,0,0.15)',
            }}>
                <Toolbar>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            mr: 1.5, boxShadow: '0 0 14px rgba(255,215,0,0.5)'
                        }}>
                            <Star sx={{ fontSize: 22, color: '#1a1a2e' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFD700', letterSpacing: 1 }}>
                            K Star Fintech
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mr: 2, color: '#888' }}>{user?.username}</Typography>
                    <Avatar sx={{ bgcolor: '#FFD700', color: '#1a1a2e', mr: 1, width: 34, height: 34, fontWeight: 800 }}>
                        {user?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Tooltip title="Logout">
                        <IconButton onClick={logout} sx={{ color: '#888', '&:hover': { color: '#FFD700' } }}>
                            <Logout />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Drawer variant="permanent" sx={{
                width: DRAWER_WIDTH, flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    background: `linear-gradient(180deg, ${DARK_BG} 0%, ${DARK_BG2} 100%)`,
                    borderRight: '1px solid rgba(255,215,0,0.1)',
                    boxSizing: 'border-box',
                    mt: '64px',
                    height: 'calc(100% - 64px)',
                }
            }}>
                {/* User panel */}
                <Box sx={{
                    p: 2, textAlign: 'center',
                    borderBottom: '1px solid rgba(255,215,0,0.1)',
                    background: `linear-gradient(180deg, ${DARK_BG} 0%, ${DARK_BG2} 100%)`,
                }}>
                    <Avatar sx={{
                        bgcolor: '#FFD700', color: '#1a1a2e', width: 52, height: 52,
                        fontSize: '1.3rem', fontWeight: 800, mx: 'auto', mb: 1,
                        boxShadow: '0 0 18px rgba(255,215,0,0.35)'
                    }}>
                        {user?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>{user?.username}</Typography>
                    <Typography variant="caption" sx={{ color: '#666', wordBreak: 'break-all' }}>{user?.email}</Typography>
                </Box>

                <List sx={{ pt: 1, px: 0.5, background: `linear-gradient(180deg, ${DARK_BG} 0%, ${DARK_BG2} 100%)`, flex: 1 }}>
                    {navItems.map((item, idx) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <React.Fragment key={item.path}>
                                {idx === 5 && <Divider sx={{ my: 1, borderColor: 'rgba(255,215,0,0.08)' }} />}
                                <ListItemButton
                                    onClick={() => navigate(item.path)}
                                    selected={isActive}
                                    sx={{
                                        mx: 0.5, mb: 0.5, borderRadius: 2,
                                        position: 'relative', overflow: 'hidden',
                                        '&.Mui-selected': {
                                            background: 'rgba(255,215,0,0.12)',
                                            '&::before': {
                                                content: '""', position: 'absolute',
                                                left: 0, top: '20%', bottom: '20%',
                                                width: 3, borderRadius: '0 3px 3px 0',
                                                background: '#FFD700'
                                            }
                                        },
                                        '&:hover': { background: 'rgba(255,215,0,0.07)' },
                                    }}
                                >
                                    <ListItemIcon sx={{ color: isActive ? '#FFD700' : '#555', minWidth: 40 }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.label} primaryTypographyProps={{
                                        fontSize: '0.88rem',
                                        fontWeight: isActive ? 700 : 400,
                                        color: isActive ? '#FFD700' : '#aaa'
                                    }} />
                                </ListItemButton>
                            </React.Fragment>
                        );
                    })}
                </List>

                <Box sx={{
                    p: 2, borderTop: '1px solid rgba(255,215,0,0.06)',
                    background: DARK_BG2,
                }}>
                    <Typography variant="caption" sx={{ color: '#444', display: 'block', textAlign: 'center' }}>
                        K Star Fintech v1.0 © 2026
                    </Typography>
                </Box>
            </Drawer>

            <Box component="main" sx={{
                flexGrow: 1, p: 3, mt: '64px',
                ml: `${DRAWER_WIDTH}px`,
                minHeight: 'calc(100vh - 64px)',
                background: 'linear-gradient(135deg, #07071a 0%, #0d0d22 100%)',
                color: 'white',
            }}>
                <Outlet />
            </Box>
        </Box>
    );
}
