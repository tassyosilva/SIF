import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Divider,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListSubheader,
    Alert,
    Chip,
    Stack,
    useTheme,
} from '@mui/material';
import {
    Storage as StorageIcon,
    Memory as MemoryIcon,
    Build as BuildIcon,
    People as PeopleIcon,
    Image as ImageIcon,
    Folder as FolderIcon,
    Speed as SpeedIcon,
    BrokenImage as BrokenImageIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { api } from '../services/api';

interface SystemInfo {
    version: string;
    database_status: string;
    storage_used: string;
    storage_available: string;
    total_persons: number;
    total_images: number;
    faiss_index_size: string;
    last_backup: string;
}

interface Settings {
    upload_dir: string;
    processed_dir: string;
    models_dir: string;
    insightface_model: string;
    faiss_dimension: number;
    faiss_index_type: string;
    batch_workers: number;
    similarity_threshold: number;
    auto_backup: boolean;
    backup_interval: number;
    backup_dir: string;
}

const SettingsPage = () => {
    const theme = useTheme();
    const [error, setError] = useState<string | null>(null);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>({
        version: '',
        database_status: '',
        storage_used: '',
        storage_available: '',
        total_persons: 0,
        total_images: 0,
        faiss_index_size: '',
        last_backup: '',
    });

    // Configurações
    const [settings, setSettings] = useState<Settings>({
        // Configurações gerais
        upload_dir: './data/uploads',
        processed_dir: './data/processed',
        models_dir: './data/models',
        // Configurações do InsightFace
        insightface_model: 'buffalo_l',
        // Configurações do FAISS
        faiss_dimension: 512,
        faiss_index_type: 'L2',
        // Configurações de processamento
        batch_workers: 4,
        similarity_threshold: 0.7,
        // Configurações de backup
        auto_backup: true,
        backup_interval: 24, // horas
        backup_dir: './data/backups',
    });

    // Carregar configurações e informações do sistema ao montar o componente
    useEffect(() => {
        fetchSettings();
        fetchSystemInfo();
    }, []);

    // Buscar configurações do sistema
    const fetchSettings = async () => {
        setError(null);
        try {
            // Adicione um parâmetro de timestamp para evitar cache
            const response = await api.get(`/settings?t=${new Date().getTime()}`);
            console.log("Configurações carregadas:", response.data);
            setSettings(response.data);
        } catch (err) {
            console.error('Erro ao carregar configurações:', err);
            setError('Ocorreu um erro ao carregar as configurações. Por favor, tente novamente.');
        }
    };

    // Buscar informações do sistema
    const fetchSystemInfo = async () => {
        setError(null);
        try {
            const response = await api.get('/settings/system-info');
            setSystemInfo(response.data);
        } catch (err) {
            console.error('Erro ao carregar informações do sistema:', err);
            setError('Ocorreu um erro ao carregar as informações do sistema. Por favor, tente novamente.');
        }
    };

    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>Configurações do Sistema</Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            <Grid container spacing={3}>
                {/* Informações do Sistema */}
                <Grid item xs={12} md={5} lg={4}>
                    <Stack spacing={3}>
                        <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ bgcolor: theme.palette.primary.main, color: 'white', p: 2 }}>
                                <Typography variant="h6">
                                    <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Informações do Sistema
                                </Typography>
                            </Box>
                            <CardContent sx={{ p: 0 }}>
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon>
                                            <BuildIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Versão"
                                            secondary={systemInfo.version}
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemIcon>
                                            <StorageIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Banco de Dados"
                                            secondary={systemInfo.database_status}
                                        />
                                        <Box>
                                            <Chip
                                                label={systemInfo.database_status}
                                                color={systemInfo.database_status === "Connected" ? "success" : "error"}
                                                size="small"
                                            />
                                        </Box>
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemIcon>
                                            <StorageIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Armazenamento"
                                            secondary={`${systemInfo.storage_used} usado / ${systemInfo.storage_available} disponível`}
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemIcon>
                                            <PeopleIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Total de Pessoas"
                                            secondary={systemInfo.total_persons.toLocaleString()}
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemIcon>
                                            <ImageIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Total de Imagens"
                                            secondary={systemInfo.total_images.toLocaleString()}
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemIcon>
                                            <MemoryIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Tamanho do Índice FAISS"
                                            secondary={systemInfo.faiss_index_size}
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                </List>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>

                {/* Configurações - Somente Visualização */}
                <Grid item xs={12} md={7} lg={8}>
                    <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ bgcolor: theme.palette.primary.main, color: 'white', p: 2 }}>
                            <Typography variant="h6">
                                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Configurações do Sistema
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
                                Modo somente visualização
                            </Typography>
                        </Box>
                        <CardContent>
                            <Grid container spacing={3}>
                                {/* Diretórios */}
                                <Grid item xs={12}>
                                    <Card variant="outlined" sx={{ mb: 2 }}>
                                        <CardContent sx={{ p: 0 }}>
                                            <List
                                                subheader={
                                                    <ListSubheader sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.primary }}>
                                                        <FolderIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                                                        Diretórios
                                                    </ListSubheader>
                                                }
                                            >
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Diretório de Uploads"
                                                        secondary={settings.upload_dir}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Diretório de Processados"
                                                        secondary={settings.processed_dir}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Diretório de Modelos"
                                                        secondary={settings.models_dir}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Diretório de Backups"
                                                        secondary={settings.backup_dir}
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* InsightFace */}
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent sx={{ p: 0 }}>
                                            <List
                                                subheader={
                                                    <ListSubheader sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.primary }}>
                                                        <BrokenImageIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                                                        InsightFace
                                                    </ListSubheader>
                                                }
                                            >
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Modelo"
                                                        secondary={settings.insightface_model}
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* FAISS */}
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent sx={{ p: 0 }}>
                                            <List
                                                subheader={
                                                    <ListSubheader sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.primary }}>
                                                        <MemoryIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                                                        FAISS
                                                    </ListSubheader>
                                                }
                                            >
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Dimensão dos Embeddings"
                                                        secondary={settings.faiss_dimension}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Tipo de Índice"
                                                        secondary={settings.faiss_index_type}
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Processamento */}
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent sx={{ p: 0 }}>
                                            <List
                                                subheader={
                                                    <ListSubheader sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.primary }}>
                                                        <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                                                        Processamento
                                                    </ListSubheader>
                                                }
                                            >
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Workers para Processamento"
                                                        secondary={settings.batch_workers.toString()}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Limiar de Similaridade"
                                                        secondary={`${(settings.similarity_threshold * 100).toFixed(0)}%`}
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SettingsPage;
