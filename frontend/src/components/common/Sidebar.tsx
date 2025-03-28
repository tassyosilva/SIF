import { Link, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Search as SearchIcon,
    Upload as UploadIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { authService } from '../../services/authService';

interface SidebarProps {
    open: boolean;
}

const drawerWidth = 240;

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
        allowedRoles: ['administrador', 'cadastrador']
    },
    {
        text: 'Busca',
        icon: <SearchIcon />,
        path: '/search',
        allowedRoles: ['administrador', 'consultor']
    },
    {
        text: 'Configurações',
        icon: <SettingsIcon />,
        path: '/settings',
        allowedRoles: ['administrador']
    },
];

const Sidebar = ({ open }: SidebarProps) => {
    const location = useLocation();
    const user = authService.getCurrentUser();

    const filteredMenuItems = menuItems.filter(
        item => user && item.allowedRoles.includes(user.tipo_usuario)
    );

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: open ? drawerWidth : 64,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? drawerWidth : 64,
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap',
                    overflowX: 'hidden',
                    transition: theme => theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                },
            }}
        >
            <Toolbar />
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <List>
                {filteredMenuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={location.pathname === item.path}
                            sx={{
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
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                sx={{
                                    opacity: open ? 1 : 0,
                                    color: '#FFFFFF'
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;