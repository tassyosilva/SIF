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

interface SidebarProps {
    open: boolean;
}

const drawerWidth = 240;

const menuItems = [
    {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/',
    },
    {
        text: 'Upload',
        icon: <UploadIcon />,
        path: '/upload',
    },
    {
        text: 'Busca',
        icon: <SearchIcon />,
        path: '/search',
    },
    {
        text: 'Configurações',
        icon: <SettingsIcon />,
        path: '/settings',
    },
];

const Sidebar = ({ open }: SidebarProps) => {
    const location = useLocation();

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
                    // Cor já definida no theme
                },
            }}
        >
            <Toolbar />
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <List>
                {menuItems.map((item) => (
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
                                    // Cor já definida no theme
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                sx={{
                                    opacity: open ? 1 : 0,
                                    color: '#FFFFFF' // Garantindo que o texto seja branco
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