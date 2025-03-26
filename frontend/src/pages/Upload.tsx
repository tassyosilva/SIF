import { useState, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    TextField,
    Divider,
    Card,
    CardContent,
    CardMedia,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    LinearProgress,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Avatar,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Image as ImageIcon,
    Person as PersonIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { api } from '../services/api';
import { uploadImage, batchProcess } from '../services/personService';

interface UploadedFile {
    id: string;
    file: File;
    preview: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    progress: number;
    error?: string;
    result?: any;
}

interface BatchProcessResult {
    success: boolean;
    total_files: number;
    processed: number;
    failed: number;
    elapsed_time: number;
    details: any[];
}

const Upload = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [batchResult, setBatchResult] = useState<BatchProcessResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substring(2, 9),
            file,
            preview: URL.createObjectURL(file),
            status: 'pending' as const,
            progress: 0,
        }));

        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.bmp']
        },
        maxSize: 5242880, // 5MB
    });

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(file => file.id !== id));
    };

    const resetUpload = () => {
        setFiles([]);
        setActiveStep(0);
        setBatchResult(null);
        setError(null);
        setSuccess(null);
    };

    const handleNext = () => {
        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const uploadFiles = async () => {
        if (files.length === 0) {
            setError('Por favor, adicione arquivos para upload.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Processar cada arquivo individualmente
            const updatedFiles = [...files];
            const results = [];

            for (let i = 0; i < updatedFiles.length; i++) {
                const file = updatedFiles[i];
                file.status = 'processing';
                file.progress = 0;
                setFiles([...updatedFiles]);

                // Simular progresso de upload
                const progressInterval = setInterval(() => {
                    file.progress = Math.min(file.progress + 10, 90);
                    setFiles([...updatedFiles]);
                }, 200);

                try {
                    // Usando a API real para upload
                    const result = await uploadImage(file.file);

                    // Processar resultado da API
                    clearInterval(progressInterval);

                    if (result.success) {
                        file.status = 'success';
                        file.progress = 100;
                        file.result = result.person;
                        results.push({
                            filename: file.file.name,
                            success: true,
                            message: result.message,
                            person: result.person
                        });
                    } else {
                        file.status = 'error';
                        file.progress = 100;
                        file.error = result.message || 'Erro não especificado';
                        results.push({
                            filename: file.file.name,
                            success: false,
                            message: result.message || 'Erro não especificado'
                        });
                    }
                } catch (err: any) {
                    clearInterval(progressInterval);
                    file.status = 'error';
                    file.progress = 100;
                    file.error = err.response?.data?.detail || 'Erro ao processar o arquivo.';
                    results.push({
                        filename: file.file.name,
                        success: false,
                        message: err.response?.data?.detail || 'Erro ao processar o arquivo.'
                    });
                } finally {
                    setFiles([...updatedFiles]);
                }
            }

            const successCount = results.filter(r => r.success).length;
            setSuccess(`${successCount} de ${results.length} arquivos enviados com sucesso`);

            handleNext();
        } catch (err: any) {
            console.error('Erro no upload:', err);
            setError(err.response?.data?.detail || 'Ocorreu um erro durante o upload. Por favor, tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const processBatch = async () => {
        setBatchProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            // Usando a API real para processamento em lote
            const result = await batchProcess();

            setBatchResult({
                success: true,
                total_files: result.total_files || 0,
                processed: result.processed || 0,
                failed: result.failed || 0,
                elapsed_time: result.elapsed_time || 0,
                details: result.details || []
            });

            setSuccess(`Processamento em lote concluído: ${result.processed} arquivos processados`);
        } catch (err: any) {
            console.error('Erro no processamento em lote:', err);
            setError(err.response?.data?.detail || 'Ocorreu um erro durante o processamento em lote. Por favor, tente novamente.');
        } finally {
            setBatchProcessing(false);
        }
    };

    const showFileDetails = (file: UploadedFile) => {
        setSelectedFile(file);
        setDetailsOpen(true);
    };

    const steps = ['Selecionar Arquivos', 'Processar Imagens', 'Resultados'];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Upload de Imagens
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {activeStep === 0 && (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Arraste e solte imagens aqui ou clique para selecionar arquivos.
                        </Typography>

                        <Box
                            {...getRootProps()}
                            sx={{
                                border: '2px dashed',
                                borderColor: isDragActive ? 'primary.main' : 'grey.400',
                                borderRadius: 2,
                                p: 3,
                                textAlign: 'center',
                                bgcolor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                                cursor: 'pointer',
                                mb: 3,
                                minHeight: 200,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <input {...getInputProps()} />
                            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            {isDragActive ? (
                                <Typography>Solte as imagens aqui...</Typography>
                            ) : (
                                <Typography>
                                    Arraste e solte imagens aqui, ou clique para selecionar arquivos
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Formatos aceitos: JPG, JPEG, PNG, BMP (máx. 5MB)
                            </Typography>
                        </Box>

                        {files.length > 0 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">
                                        {files.length} {files.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<DeleteIcon />}
                                        onClick={resetUpload}
                                    >
                                        Limpar Tudo
                                    </Button>
                                </Box>

                                <Grid container spacing={2}>
                                    {files.map((file) => (
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                                            <Card>
                                                <CardMedia
                                                    component="img"
                                                    height="140"
                                                    image={file.preview}
                                                    alt={file.file.name}
                                                />
                                                <CardContent sx={{ py: 1 }}>
                                                    <Typography variant="body2" noWrap title={file.file.name}>
                                                        {file.file.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {(file.file.size / 1024).toFixed(1)} KB
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                                                    <IconButton size="small" onClick={() => removeFile(file.id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={resetUpload}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                endIcon={<UploadIcon />}
                                onClick={uploadFiles}
                                disabled={files.length === 0 || loading}
                            >
                                {loading ? 'Processando...' : 'Processar Imagens'}
                            </Button>
                        </Box>
                    </Box>
                )}

                {activeStep === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Processando Imagens
                        </Typography>

                        <List>
                            {files.map((file) => (
                                <ListItem key={file.id} divider>
                                    <ListItemIcon>
                                        <Avatar sx={{ width: 40, height: 40 }} src={file.preview} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={file.file.name}
                                        secondary={
                                            file.status === 'success' ? 'Processado com sucesso' :
                                                file.status === 'error' ? file.error :
                                                    file.status === 'processing' ? 'Processando...' :
                                                        'Aguardando processamento'
                                        }
                                    />
                                    <Box sx={{ width: '40%', mr: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={file.progress}
                                            color={
                                                file.status === 'success' ? 'success' :
                                                    file.status === 'error' ? 'error' :
                                                        'primary'
                                            }
                                        />
                                    </Box>
                                    {file.status === 'success' && <CheckCircleIcon color="success" />}
                                    {file.status === 'error' && <ErrorIcon color="error" />}
                                    {file.status === 'processing' && <CircularProgress size={24} />}
                                </ListItem>
                            ))}
                        </List>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                Voltar
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={loading || files.some(f => f.status === 'processing' || f.status === 'pending')}
                            >
                                Continuar
                            </Button>
                        </Box>
                    </Box>
                )}

                {activeStep === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Resultados do Processamento
                        </Typography>

                        <Box sx={{ mb: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="text.secondary" gutterBottom>
                                                Total de Arquivos
                                            </Typography>
                                            <Typography variant="h4">
                                                {files.length}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="text.secondary" gutterBottom>
                                                Processados com Sucesso
                                            </Typography>
                                            <Typography variant="h4" color="success.main">
                                                {files.filter(f => f.status === 'success').length}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="text.secondary" gutterBottom>
                                                Falhas
                                            </Typography>
                                            <Typography variant="h4" color="error.main">
                                                {files.filter(f => f.status === 'error').length}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>

                        <Typography variant="h6" gutterBottom>
                            Detalhes dos Arquivos
                        </Typography>

                        <List>
                            {files.map((file) => (
                                <ListItem key={file.id} divider>
                                    <ListItemIcon>
                                        <Avatar sx={{ width: 40, height: 40 }} src={file.preview} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={file.file.name}
                                        secondary={
                                            file.status === 'success' ?
                                                `ID: ${file.result?.person_id} | Nome: ${file.result?.person_name}` :
                                                file.error || 'Erro no processamento'
                                        }
                                    />
                                    {file.status === 'success' ? (
                                        <Chip
                                            icon={<CheckCircleIcon />}
                                            label="Sucesso"
                                            color="success"
                                            variant="outlined"
                                            sx={{ mr: 1 }}
                                        />
                                    ) : (
                                        <Chip
                                            icon={<ErrorIcon />}
                                            label="Erro"
                                            color="error"
                                            variant="outlined"
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    <IconButton size="small" onClick={() => showFileDetails(file)}>
                                        <InfoIcon />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="h6" gutterBottom>
                            Processamento em Lote
                        </Typography>

                        <Typography variant="body2" paragraph>
                            Você também pode processar todas as imagens no diretório de uploads que ainda não foram processadas.
                        </Typography>

                        <Box sx={{ mb: 3 }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={batchProcessing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                                onClick={processBatch}
                                disabled={batchProcessing}
                            >
                                {batchProcessing ? 'Processando...' : 'Processar Diretório de Uploads'}
                            </Button>
                        </Box>

                        {batchResult && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">
                                    Processamento em lote concluído!
                                </Typography>
                                <Typography variant="body2">
                                    Total de arquivos: {batchResult.total_files || 0} |
                                    Processados: {batchResult.processed} |
                                    Falhas: {batchResult.failed} |
                                    Tempo: {batchResult.elapsed_time ? `${batchResult.elapsed_time.toFixed(2)}s` : 'N/A'}
                                </Typography>
                            </Alert>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={handleBack}
                            >
                                Voltar
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<RefreshIcon />}
                                onClick={resetUpload}
                            >
                                Novo Upload
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Dialog para detalhes do arquivo */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Detalhes do Arquivo
                </DialogTitle>
                <DialogContent dividers>
                    {selectedFile && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Box
                                    component="img"
                                    src={selectedFile.preview}
                                    alt={selectedFile.file.name}
                                    sx={{
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: 300,
                                        objectFit: 'contain',
                                        border: '1px solid #ddd',
                                        borderRadius: 1,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Informações do Arquivo
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Nome:</strong> {selectedFile.file.name}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Tamanho:</strong> {(selectedFile.file.size / 1024).toFixed(1)} KB
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Tipo:</strong> {selectedFile.file.type}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Status:</strong> {
                                        selectedFile.status === 'success' ? 'Processado com sucesso' :
                                            selectedFile.status === 'error' ? 'Erro no processamento' :
                                                selectedFile.status === 'processing' ? 'Processando...' :
                                                    'Aguardando processamento'
                                    }
                                </Typography>

                                {selectedFile.status === 'success' && selectedFile.result && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle1" gutterBottom>
                                            Resultado do Processamento
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>ID da Pessoa:</strong> {selectedFile.result.person_id}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Nome:</strong> {selectedFile.result.person_name}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Origem:</strong> {selectedFile.result.origin}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Face Detectada:</strong> {selectedFile.result.face_detected ? 'Sim' : 'Não'}
                                        </Typography>
                                    </>
                                )}

                                {selectedFile.status === 'error' && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle1" color="error" gutterBottom>
                                            Erro
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedFile.error || 'Erro desconhecido durante o processamento.'}
                                        </Typography>
                                    </>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsOpen(false)}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Upload;