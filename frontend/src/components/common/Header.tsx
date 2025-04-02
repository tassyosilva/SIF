import { AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem, useMediaQuery, useTheme, ListItemIcon, Divider, alpha, Avatar, styled, Button } from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle as AccountCircleIcon,
    Dashboard as DashboardIcon,
    Search as SearchIcon,
    Upload as UploadIcon,
    Settings as SettingsIcon,
    People as PeopleIcon,
    Person as PersonAddIcon,
    ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { authService } from '../../services/authService';

interface HeaderProps {
    open: boolean;
    toggleDrawer: () => void;
}

// Estilização do AppBar
const StyledAppBar = styled(AppBar)(({ theme }) => ({
    background: `linear-gradient(90deg, ${alpha('#000000', 0.95)} 0%, ${alpha('#000000', 0.98)} 100%)`,
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: `0 4px 20px ${alpha('#000', 0.3)}`,
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
}));

// Estilização para o menu mobile
const StyledMobileMenu = styled(Menu)(({ theme }) => ({
    '& .MuiPaper-root': {
        backgroundColor: '#1A1A1A',
        borderRadius: '8px',
        boxShadow: `0 8px 32px ${alpha('#000', 0.4)}`,
        border: `1px solid ${alpha('#FFD700', 0.2)}`,
        '& .MuiMenuItem-root': {
            '&:hover': {
                backgroundColor: alpha('#FFD700', 0.1),
            },
            '&.Mui-selected': {
                backgroundColor: alpha('#FFD700', 0.2),
            }
        },
        '& .MuiListItemIcon-root': {
            color: '#FFFFFF',
        },
        '& .MuiTypography-root': {
            color: '#FFFFFF',
        },
        '& .MuiDivider-root': {
            backgroundColor: alpha('#FFD700', 0.2),
        }
    }
}));

// Estilização para os itens do menu
const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
    transition: 'all 0.2s ease',
    '&.Mui-selected': {
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.3),
        },
    },
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        transform: 'translateX(5px)',
    },
}));

// Estilização para o ícone de usuário
const UserIconButton = styled(IconButton)(({ theme }) => ({
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
        transform: 'scale(1.1)',
    },
}));

// Menu de usuário estilizado
const UserMenu = styled(Menu)(({ theme }) => ({
    '& .MuiPaper-root': {
        backgroundColor: '#1A1A1A',
        borderRadius: '8px',
        boxShadow: `0 8px 32px ${alpha('#000', 0.4)}`,
        border: `1px solid ${alpha('#FFD700', 0.2)}`,
        '& .MuiMenuItem-root': {
            '&:hover': {
                backgroundColor: alpha('#FFD700', 0.1),
            },
        },
        '& .MuiListItemIcon-root': {
            color: '#FFD700',
        },
        '& .MuiTypography-root': {
            color: '#FFFFFF',
        },
    }
}));

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
        text: 'Cadastro',
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

    // Obter iniciais do nome para o avatar
    const getUserInitials = () => {
        if (!user?.nome_completo) return '';

        return user.nome_completo
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

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
        <StyledAppBar position="fixed">
            <Toolbar sx={{ height: '70px' }}>
                {/* Botão de menu para desktop (abre/fecha sidebar) */}
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={isMobile ? handleMobileMenuOpen : toggleDrawer}
                    edge="start"
                    sx={{
                        mr: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                            transform: 'rotate(180deg)',
                        }
                    }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Menu móvel para navegação */}
                <StyledMobileMenu
                    id="mobile-menu"
                    anchorEl={mobileMenuAnchorEl}
                    keepMounted
                    open={Boolean(mobileMenuAnchorEl)}
                    onClose={handleMobileMenuClose}
                    PaperProps={{
                        sx: {
                            maxHeight: '70vh',
                            width: '250px',
                        }
                    }}
                >
                    {filteredMenuItems.map((item) => (
                        <StyledMenuItem
                            key={item.text}
                            onClick={() => handleNavigate(item.path)}
                            selected={location.pathname === item.path}
                        >
                            <ListItemIcon sx={{ color: '#FFFFFF', minWidth: '40px' }}>
                                {item.icon}
                            </ListItemIcon>
                            <Typography variant="body1">{item.text}</Typography>
                        </StyledMenuItem>
                    ))}
                    <Divider sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.2), my: 1 }} />
                    <StyledMenuItem onClick={() => handleNavigate('/my-account')}>
                        <ListItemIcon sx={{ color: '#FFFFFF', minWidth: '40px' }}>
                            <AccountCircleIcon />
                        </ListItemIcon>
                        <Typography variant="body1">Minha Conta</Typography>
                    </StyledMenuItem>
                    <StyledMenuItem onClick={handleLogout}>
                        <ListItemIcon sx={{ color: '#FFFFFF', minWidth: '40px' }}>
                            <ExitToAppIcon />
                        </ListItemIcon>
                        <Typography variant="body1">Sair</Typography>
                    </StyledMenuItem>
                </StyledMobileMenu>

                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <Box
                        sx={{
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'scale(1.05)',
                            }
                        }}
                    >
                        <img
                            src={logoImage}
                            alt="Logo Polícia Civil"
                            style={{
                                height: '40px',
                                marginRight: '12px',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                            }}
                        />
                    </Box>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        {isMobile ? 'SIF' : 'Sistema de Identificação Facial'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            alignItems: 'center',
                            mr: 2,
                            px: 2,
                            py: 0.5,
                            borderRadius: '20px',
                            background: alpha(theme.palette.primary.main, 0.15),
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: '#FFD700',
                                color: 'black',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                mr: 1,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }}
                        >
                            {getUserInitials()}
                        </Avatar>
                        <Typography variant="body1" sx={{ color: 'white' }}>
                            {user?.nome_completo?.split(' ')[0]}
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<AccountCircleIcon />}
                        onClick={() => navigate('/my-account')}
                        sx={{
                            mr: 2,
                            color: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            '&:hover': {
                                borderColor: 'white',
                                backgroundColor: alpha('#ffffff', 0.1),
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s'
                            }
                        }}
                    >
                        Minha Conta
                    </Button>

                    <Button
                        variant="text"
                        color="inherit"
                        startIcon={<ExitToAppIcon />}
                        onClick={handleLogout}
                        sx={{
                            color: 'white',
                            '&:hover': {
                                backgroundColor: alpha('#ffffff', 0.1)
                            }
                        }}
                    >
                        Sair
                    </Button>
                </Box>
            </Toolbar>
        </StyledAppBar>
    );
};

export default Header;