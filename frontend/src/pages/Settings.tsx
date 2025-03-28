import { useState, useEffect } from 'react';

import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    Switch,
    Slider,
    Select,
    MenuItem,
    InputLabel,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import {
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Storage as StorageIcon,
    Memory as MemoryIcon,
    Build as BuildIcon,
    Backup as BackupIcon,
    People as PeopleIcon,
    Image as ImageIcon,
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
    const [saveLoading, setSaveLoading] = useState(false);
    const [rebuildLoading, setRebuildLoading] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
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

    const handleSettingChange = (setting: string, value: any) => {
        setSettings({
            ...settings,
            [setting]: value,
        });
    };

    const handleRebuildClick = () => {
        setOpenConfirmDialog(true);
    };

    const confirmRebuild = async () => {
        setOpenConfirmDialog(false);
        setRebuildLoading(true);
        setError(null);

        try {
            await api.post('/settings/rebuild-index');
            setSuccess(true);
            setSuccessMessage('Reconstrução do índice FAISS iniciada. Este processo pode levar alguns minutos dependendo da quantidade de imagens.');

            // Atualizar informações do sistema após reconstruir o índice
            setTimeout(() => {
                fetchSystemInfo();
            }, 5000); // Aumentado para 5 segundos
        } catch (err) {
            console.error('Erro ao reconstruir índice:', err);
            setError('Ocorreu um erro ao reconstruir o índice FAISS. Por favor, tente novamente.');
        } finally {
            setRebuildLoading(false);
        }
    };

    const createBackup = async () => {
        setBackupLoading(true);
        setError(null);

        try {
            await api.post('/settings/backup');
            setSuccess(true);
            setSuccessMessage('Backup criado com sucesso!');

            // Atualizar informações do sistema após criar backup
            setTimeout(() => {
                fetchSystemInfo();
            }, 2000); // Esperar um pouco para o processo em segundo plano iniciar
        } catch (err) {
            console.error('Erro ao criar backup:', err);
            setError('Ocorreu um erro ao criar o backup. Por favor, tente novamente.');
        } finally {
            setBackupLoading(false);
        }
    };

    const saveAndApplyConfiguration = async () => {
        setSaveLoading(true);
        setSuccess(false);
        setError(null);

        try {
            // Primeiro salvamos as configurações
            console.log("Salvando configurações:", settings);
            await api.put('/settings', settings);

            // Esperamos um pouco para garantir que os dados foram salvos
            await new Promise(resolve => setTimeout(resolve, 500));

            // Depois recarregamos as configurações no servidor
            console.log("Aplicando configurações");
            const response = await api.post('/settings/reload-config');
            console.log("Resposta do reload-config:", response.data);

            // Mostramos mensagem de sucesso
            setSuccess(true);
            setSuccessMessage('Configurações salvas e aplicadas com sucesso!');

            // Recarregar tudo
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchSettings();
            await fetchSystemInfo();
        } catch (err) {
            console.error('Erro ao salvar e aplicar configurações:', err);
            setError('Ocorreu um erro ao salvar ou aplicar as configurações. Por favor, tente novamente.');
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Configurações do Sistema
            </Typography>

            <Grid container spacing={3}>
                {/* Informações do Sistema */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Informações do Sistema
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

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
                            <ListItem>
                                <ListItemIcon>
                                    <StorageIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Banco de Dados"
                                    secondary={systemInfo.database_status}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <StorageIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Armazenamento Utilizado"
                                    secondary={`${systemInfo.storage_used} / ${systemInfo.storage_available}`}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <PeopleIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Total de Pessoas"
                                    secondary={systemInfo.total_persons}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <ImageIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Total de Imagens"
                                    secondary={systemInfo.total_images}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <MemoryIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Tamanho do Índice FAISS"
                                    secondary={systemInfo.faiss_index_size}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <BackupIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Último Backup"
                                    secondary={systemInfo.last_backup}
                                />
                            </ListItem>
                        </List>

                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={rebuildLoading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                                onClick={handleRebuildClick}
                                disabled={rebuildLoading || backupLoading}
                            >
                                {rebuildLoading ? 'Reconstruindo...' : 'Reconstruir Índice FAISS'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={backupLoading ? <CircularProgress size={20} color="inherit" /> : <BackupIcon />}
                                onClick={createBackup}
                                disabled={rebuildLoading || backupLoading}
                            >
                                {backupLoading ? 'Criando Backup...' : 'Criar Backup Agora'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Configurações */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Configurações
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            {/* Diretórios */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Diretórios
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            label="Diretório de Uploads"
                                            fullWidth
                                            value={settings.upload_dir}
                                            onChange={(e) => handleSettingChange('upload_dir', e.target.value)}
                                            margin="normal"
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            label="Diretório de Processados"
                                            fullWidth
                                            value={settings.processed_dir}
                                            onChange={(e) => handleSettingChange('processed_dir', e.target.value)}
                                            margin="normal"
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            label="Diretório de Modelos"
                                            fullWidth
                                            value={settings.models_dir}
                                            onChange={(e) => handleSettingChange('models_dir', e.target.value)}
                                            margin="normal"
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* InsightFace */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Configurações do InsightFace
                                </Typography>
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel>Modelo InsightFace</InputLabel>
                                    <Select
                                        value={settings.insightface_model}
                                        label="Modelo InsightFace"
                                        onChange={(e) => handleSettingChange('insightface_model', e.target.value)}
                                    >
                                        <MenuItem value="buffalo_l">Buffalo L (Padrão)</MenuItem>
                                        <MenuItem value="buffalo_m">Buffalo M</MenuItem>
                                        <MenuItem value="buffalo_s">Buffalo S</MenuItem>
                                        <MenuItem value="arcface_r100">ArcFace R100</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* FAISS */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Configurações do FAISS
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Dimensão dos Embeddings"
                                            type="number"
                                            fullWidth
                                            value={settings.faiss_dimension}
                                            onChange={(e) => handleSettingChange('faiss_dimension', parseInt(e.target.value))}
                                            margin="normal"
                                            size="small"
                                            InputProps={{ readOnly: true }}
                                            helperText="Definido pelo modelo de face escolhido"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth margin="normal" size="small">
                                            <InputLabel>Tipo de Índice FAISS</InputLabel>
                                            <Select
                                                value={settings.faiss_index_type}
                                                label="Tipo de Índice FAISS"
                                                onChange={(e) => handleSettingChange('faiss_index_type', e.target.value)}
                                            >
                                                <MenuItem value="L2">L2 (Distância Euclidiana)</MenuItem>
                                                <MenuItem value="IP">IP (Produto Interno)</MenuItem>
                                                <MenuItem value="IVF">IVF (Quantização Vetorial)</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Processamento */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Configurações de Processamento
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography id="batch-workers-slider" gutterBottom>
                                            Número de Workers para Processamento em Lote: {settings.batch_workers}
                                        </Typography>
                                        <Slider
                                            value={settings.batch_workers}
                                            onChange={(_, value) => handleSettingChange('batch_workers', value)}
                                            aria-labelledby="batch-workers-slider"
                                            valueLabelDisplay="auto"
                                            step={1}
                                            marks
                                            min={1}
                                            max={8}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography id="similarity-threshold-slider" gutterBottom>
                                            Limiar de Similaridade: {settings.similarity_threshold.toFixed(2)}
                                        </Typography>
                                        <Slider
                                            value={settings.similarity_threshold}
                                            onChange={(_, value) => handleSettingChange('similarity_threshold', value)}
                                            aria-labelledby="similarity-threshold-slider"
                                            valueLabelDisplay="auto"
                                            step={0.05}
                                            marks
                                            min={0.5}
                                            max={0.95}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Backup */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Configurações de Backup
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <FormGroup>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settings.auto_backup}
                                                        onChange={(e) => handleSettingChange('auto_backup', e.target.checked)}
                                                    />
                                                }
                                                label="Backup Automático"
                                            />
                                        </FormGroup>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Intervalo de Backup (horas)"
                                            type="number"
                                            fullWidth
                                            value={settings.backup_interval}
                                            onChange={(e) => handleSettingChange('backup_interval', parseInt(e.target.value))}
                                            margin="normal"
                                            size="small"
                                            disabled={!settings.auto_backup}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Diretório de Backups"
                                            fullWidth
                                            value={settings.backup_dir}
                                            onChange={(e) => handleSettingChange('backup_dir', e.target.value)}
                                            margin="normal"
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>

                        {success && (
                            <Alert severity="success" sx={{ mt: 3 }}>
                                {successMessage || "Operação realizada com sucesso!"}
                            </Alert>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mt: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                onClick={saveAndApplyConfiguration}
                                disabled={saveLoading}
                            >
                                {saveLoading ? 'Processando...' : 'Salvar e Aplicar Configurações'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Diálogo de confirmação */}
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
                <DialogTitle>Confirmar reconstrução do índice</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Você deseja prosseguir? Esse processo pode levar alguns minutos dependendo da quantidade de imagens.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={confirmRebuild} color="primary" variant="contained">
                        Sim, reconstruir
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SettingsPage;