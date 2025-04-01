import { AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem, useMediaQuery, useTheme, ListItemIcon, Divider } from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle as AccountCircleIcon,
    Dashboard as DashboardIcon,
    Search as SearchIcon,
    Upload as UploadIcon,
    Settings as SettingsIcon,
    People as PeopleIcon,
    Person as PersonAddIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { authService } from '../../services/authService';

interface HeaderProps {
    open: boolean;
    toggleDrawer: () => void;
}

// Usando os mesmos itens de menu do Sidebar para consistência
const menuItems = [
    {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/',
        allowedRoles: ['administrador', 'consultor', 'cadastrador']
    },
    {
        text: 'Upload',
        icon: <UploadIcon />,
        path: '/upload',
        allowedRoles: ['administrador'] // Apenas administrador
    },
    {
        text: 'Cadastro de Indivíduo',
        icon: <PersonAddIcon />,
        path: '/individual-registration',
        allowedRoles: ['administrador', 'cadastrador'] // Administrador e cadastrador
    },
    {
        text: 'Busca',
        icon: <SearchIcon />,
        path: '/search',
        allowedRoles: ['administrador', 'consultor', 'cadastrador'] // Todos os perfis
    },
    {
        text: 'Usuários',
        icon: <PeopleIcon />,
        path: '/users',
        allowedRoles: ['administrador'] // Apenas administrador
    },
    {
        text: 'Configurações',
        icon: <SettingsIcon />,
        path: '/settings',
        allowedRoles: ['administrador'] // Apenas administrador
    },
];

const Header = ({ open, toggleDrawer }: HeaderProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const user = authService.getCurrentUser();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMobileMenuAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMobileMenuClose = () => {
        setMobileMenuAnchorEl(null);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        handleMobileMenuClose();
    };

    // Filtra os itens de menu com base nas permissões do usuário
    const filteredMenuItems = menuItems.filter(
        item => user && item.allowedRoles.includes(user.tipo_usuario)
    );

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
                {/* Botão de menu para desktop (abre/fecha sidebar) */}
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={isMobile ? handleMobileMenuOpen : toggleDrawer}
                    edge="start"
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Menu móvel para navegação */}
                <Menu
                    id="mobile-menu"
                    anchorEl={mobileMenuAnchorEl}
                    keepMounted
                    open={Boolean(mobileMenuAnchorEl)}
                    onClose={handleMobileMenuClose}
                    PaperProps={{
                        sx: {
                            maxHeight: '70vh',
                            width: '250px',
                            backgroundColor: '#000000',
                            color: '#FFFFFF',
                        }
                    }}
                >
                    {filteredMenuItems.map((item) => (
                        <MenuItem
                            key={item.text}
                            onClick={() => handleNavigate(item.path)}
                            selected={location.pathname === item.path}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: 'rgba(212, 175, 55, 0.4)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(212, 175, 55, 0.5)',
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: '#FFFFFF', minWidth: '40px' }}>
                                {item.icon}
                            </ListItemIcon>
                            <Typography variant="body1">{item.text}</Typography>
                        </MenuItem>
                    ))}
                    <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
                    <MenuItem onClick={() => handleNavigate('/my-account')}>
                        <ListItemIcon sx={{ color: '#FFFFFF', minWidth: '40px' }}>
                            <AccountCircleIcon />
                        </ListItemIcon>
                        <Typography variant="body1">Minha Conta</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                        <Typography variant="body1" sx={{ ml: '40px' }}>Sair</Typography>
                    </MenuItem>
                </Menu>

                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
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
                        {isMobile ? 'SIF' : 'Sistema de Identificação Facial'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, color: 'white', display: { xs: 'none', sm: 'block' } }}>
                        Olá, {user?.nome_completo?.split(' ')[0]}
                    </Typography>
                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircleIcon />
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
                        <MenuItem onClick={() => {
                            handleClose();
                            navigate('/my-account');
                        }}>Minha Conta</MenuItem>
                        <MenuItem onClick={() => {
                            handleClose();
                            handleLogout();
                        }}>Sair</MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
