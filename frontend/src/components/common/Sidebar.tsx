import { Link, useLocation } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
    alpha,
    styled,
    Box,
    Typography,
    useTheme
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Search as SearchIcon,
    Upload as UploadIcon,
    Settings as SettingsIcon,
    People as PeopleIcon,
    Person as PersonAddIcon
} from '@mui/icons-material';
import { authService } from '../../services/authService';

interface SidebarProps {
    open: boolean;
}

const drawerWidth = 240;

// Drawer estilizada
const StyledDrawer = styled(Drawer)(({ theme }) => ({
    '& .MuiDrawer-paper': {
        backgroundColor: alpha('#000000', 0.95),
        backgroundImage: `linear-gradient(rgba(20, 20, 25, 0.7), rgba(20, 20, 25, 0.9))`,
        borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        boxShadow: `4px 0 20px ${alpha('#000', 0.3)}`,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
}));

// Estilização para o ListItemButton normal
const listItemButtonStyles = (theme: any) => ({
    margin: '4px 8px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: alpha('#FFD700', 0.15),
        transform: 'translateX(5px)',
    },
    '&.Mui-selected': {
        backgroundColor: alpha('#FFD700', 0.2),
        color: '#FFD700',
        '&:hover': {
            backgroundColor: alpha('#FFD700', 0.25),
        },
        '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '70%',
            backgroundColor: '#FFD700',
            borderRadius: '0 4px 4px 0',
        }
    }
});

// Ajustando as permissões de acordo com os novos requisitos
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

const Sidebar = ({ open }: SidebarProps) => {
    const location = useLocation();
    const user = authService.getCurrentUser();
    const theme = useTheme();

    const filteredMenuItems = menuItems.filter(
        item => user && item.allowedRoles.includes(user.tipo_usuario)
    );

    return (
        <StyledDrawer
            variant="permanent"
            sx={{
                width: open ? drawerWidth : 64,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? drawerWidth : 64,
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap',
                    overflowX: 'hidden',
                },
            }}
        >
            <Toolbar
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '70px',
                    background: alpha('#000', 0.2)
                }}
            />
            <Divider sx={{
                borderColor: alpha('#FFFFFF', 0.12),
                boxShadow: `0 1px 5px ${alpha('#000', 0.5)}`
            }} />

            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                    background: alpha('#000', 0.1),
                },
                '&::-webkit-scrollbar-thumb': {
                    background: alpha('#FFFFFF', 0.3),
                    borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    background: alpha('#FFFFFF', 0.5),
                },
            }}>
                <List sx={{ py: 2 }}>
                    {filteredMenuItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                selected={location.pathname === item.path}
                                sx={{
                                    ...listItemButtonStyles(theme),
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        color: location.pathname === item.path ?
                                            '#FFD700' : '#FFFFFF',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                                    }}
                                    sx={{
                                        opacity: open ? 1 : 0,
                                        color: '#FFFFFF'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            {open && (
                <>
                    <Divider sx={{ borderColor: alpha('#FFFFFF', 0.12) }} />
                    <Box sx={{
                        p: 2,
                        background: alpha('#000', 0.2),
                        textAlign: 'center'
                    }}>
                        <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                            © 2025 Sistema de Identificação Facial
                        </Typography>
                    </Box>
                </>
            )}
        </StyledDrawer>
    );
};

export default Sidebar;