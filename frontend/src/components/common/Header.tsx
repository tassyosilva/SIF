import { AppBar, Toolbar, Typography, IconButton, Box, Badge, Menu, MenuItem } from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import logoImage from '../../assets/logo.png'; // Importando a logo

interface HeaderProps {
    open: boolean;
    toggleDrawer: () => void;
}

const Header = ({ open, toggleDrawer }: HeaderProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                transition: (theme) => theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={toggleDrawer}
                    edge="start"
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    {/* Logo da Polícia Civil */}
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                        <img
                            src={logoImage}
                            alt="Logo Polícia Civil"
                            style={{
                                height: '40px',
                                marginRight: '12px'
                            }}
                        />
                    </Box>

                    <Typography variant="h6" noWrap component="div">
                        Sistema de Identificação Facial
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex' }}>
                    <IconButton color="inherit">
                        <Badge badgeContent={4} color="error">
                            <NotificationsIcon sx={{ color: '#D4AF37' }} />
                        </Badge>
                    </IconButton>

                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircleIcon sx={{ color: '#D4AF37' }} />
                    </IconButton>

                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose}>Perfil</MenuItem>
                        <MenuItem onClick={handleClose}>Minha Conta</MenuItem>
                        <MenuItem onClick={handleClose}>Sair</MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;