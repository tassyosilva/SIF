import { useState, useRef, useCallback, useEffect } from 'react';
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
    FormControlLabel,
    Switch,
    Tabs,
    Tab,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
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
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { api } from '../services/api';
import { uploadImage, batchProcess } from '../services/personService';

// Constante para definir o limite de miniaturas a serem exibidas
const THUMBNAIL_THRESHOLD = 50;
const ITEMS_PER_PAGE = 20;

interface UploadedFile {
    id: string;
    file: File;
    preview?: string; // Tornando opcional
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

// Interface para acompanhar o progresso total do upload
interface UploadProgress {
    totalFiles: number;
    processed: number;
    successful: number;
    failed: number;
    overallProgress: number;
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

    // Novos estados para otimização
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showThumbnails, setShowThumbnails] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [tabValue, setTabValue] = useState(0);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
        totalFiles: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        overallProgress: 0
    });

    // Determinar se estamos lidando com um grande volume de arquivos
    const isLargeFileSet = files.length > THUMBNAIL_THRESHOLD;

    // Calcular arquivos paginados
    const paginatedFiles = useCallback(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return files.slice(startIndex, endIndex);
    }, [files, currentPage]);

    // Atualizar o progresso geral
    useEffect(() => {
        if (files.length > 0) {
            const processed = files.filter(f => f.status === 'success' || f.status === 'error').length;
            const successful = files.filter(f => f.status === 'success').length;
            const failed = files.filter(f => f.status === 'error').length;
            const totalProgress = files.reduce((sum, file) => sum + file.progress, 0);
            const overallProgress = files.length > 0 ? totalProgress / files.length : 0;

            setUploadProgress({
                totalFiles: files.length,
                processed,
                successful,
                failed,
                overallProgress
            });
        } else {
            setUploadProgress({
                totalFiles: 0,
                processed: 0,
                successful: 0,
                failed: 0,
                overallProgress: 0
            });
        }
    }, [files]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Verificar se estamos adicionando muitos arquivos
        const exceedsThreshold = acceptedFiles.length + files.length > THUMBNAIL_THRESHOLD;

        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substring(2, 9),
            file,
            // Só gerar preview se não exceder o limite ou se thumbnails estiverem habilitados
            preview: (!exceedsThreshold || showThumbnails) ? URL.createObjectURL(file) : undefined,
            status: 'pending' as const,
            progress: 0,
        }));

        // Se exceder o limite, sugerir desabilitar thumbnails
        if (exceedsThreshold && showThumbnails) {
            setShowThumbnails(false);
        }

        setFiles(prev => [...prev, ...newFiles]);
    }, [files, showThumbnails]);

    // Cleanup de objetos URL quando componente for desmontado
    useEffect(() => {
        return () => {
            files.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.bmp']
        },
        maxSize: 5242880, // 5MB
    });

    const removeFile = (id: string) => {
        const fileToRemove = files.find(file => file.id === id);
        if (fileToRemove?.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
        }
        setFiles(prev => prev.filter(file => file.id !== id));
    };

    const resetUpload = () => {
        // Limpar os URL objects
        files.forEach(file => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });

        setFiles([]);
        setActiveStep(0);
        setBatchResult(null);
        setError(null);
        setSuccess(null);
        setCurrentPage(1);
    };

    const handleNext = () => {
        setActiveStep(prev => prev + 1);
        setCurrentPage(1); // Reset pagination on step change
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
        setCurrentPage(1); // Reset pagination on step change
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
    };

    const toggleThumbnails = () => {
        // Se estiver habilitando thumbnails, gere-os para arquivos existentes que não têm
        if (!showThumbnails) {
            setFiles(prev =>
                prev.map(file => {
                    if (!file.preview) {
                        return {
                            ...file,
                            preview: URL.createObjectURL(file.file)
                        };
                    }
                    return file;
                })
            );
        }
        setShowThumbnails(prev => !prev);
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
            let processedCount = 0;

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
                    processedCount++;
                    setFiles([...updatedFiles]);

                    // Atualizar o status periodicamente (a cada 10 arquivos ou no final)
                    if (processedCount % 10 === 0 || processedCount === updatedFiles.length) {
                        const successCount = results.filter(r => r.success).length;
                        setSuccess(`Progresso: ${processedCount} de ${updatedFiles.length} arquivos processados (${successCount} com sucesso)`);
                    }
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
        // Se não tiver preview e for necessário, criar um
        if (!file.preview && file.file) {
            file.preview = URL.createObjectURL(file.file);
        }

        setSelectedFile(file);
        setDetailsOpen(true);
    };

    const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE);
    const steps = ['Selecionar Arquivos', 'Processar Imagens', 'Resultados'];

    const renderFileItem = (file: UploadedFile) => {
        return viewMode === 'grid' ? (
            <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                <Card>
                    {showThumbnails && file.preview ? (
                        <CardMedia
                            component="img"
                            height="140"
                            image={file.preview}
                            alt={file.file.name}
                        />
                    ) : (
                        <Box
                            sx={{
                                height: 140,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            <ImageIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                        </Box>
                    )}
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
        ) : (
            <ListItem key={file.id} divider>
                <ListItemIcon>
                    {showThumbnails && file.preview ? (
                        <Avatar sx={{ width: 40, height: 40 }} src={file.preview} />
                    ) : (
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                            <ImageIcon sx={{ color: 'text.secondary' }} />
                        </Avatar>
                    )}
                </ListItemIcon>
                <ListItemText
                    primary={file.file.name}
                    secondary={`${(file.file.size / 1024).toFixed(1)} KB`}
                />
                <IconButton size="small" onClick={() => removeFile(file.id)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </ListItem>
        );
    };

    const renderFilesPreview = () => {
        if (files.length === 0) {
            return null;
        }

        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        {files.length} {files.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showThumbnails}
                                    onChange={toggleThumbnails}
                                    disabled={loading}
                                />
                            }
                            label="Miniaturas"
                        />
                        <IconButton onClick={toggleViewMode} disabled={loading}>
                            {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
                        </IconButton>
                        <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={resetUpload}
                            disabled={loading}
                        >
                            Limpar Tudo
                        </Button>
                    </Box>
                </Box>

                {isLargeFileSet && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Grande volume de arquivos detectado ({files.length}). {showThumbnails ? 'Considere desativar as miniaturas para melhor desempenho.' : 'Miniaturas desativadas para melhor desempenho.'}
                    </Alert>
                )}

                {viewMode === 'grid' ? (
                    <Grid container spacing={2}>
                        {paginatedFiles().map(file => renderFileItem(file))}
                    </Grid>
                ) : (
                    <List>
                        {paginatedFiles().map(file => renderFileItem(file))}
                    </List>
                )}

                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                )}
            </Box>
        );
    };

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

                        {renderFilesPreview()}

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

                        {/* Progresso geral */}
                        <Box sx={{ mb: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="text.secondary" gutterBottom>
                                                Total
                                            </Typography>
                                            <Typography variant="h5">
                                                {uploadProgress.totalFiles}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="text.secondary" gutterBottom>
                                                Processados
                                            </Typography>
                                            <Typography variant="h5">
                                                {uploadProgress.processed}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="text.secondary" gutterBottom>
                                                Sucesso
                                            </Typography>
                                            <Typography variant="h5" color="success.main">
                                                {uploadProgress.successful}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="text.secondary" gutterBottom>
                                                Falhas
                                            </Typography>
                                            <Typography variant="h5" color="error.main">
                                                {uploadProgress.failed}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Barra de progresso geral */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Progresso geral: {Math.round(uploadProgress.overallProgress)}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={uploadProgress.overallProgress}
                                sx={{ height: 10, borderRadius: 5 }}
                            />
                        </Box>

                        {/* Abas para diferentes visualizações */}
                        <Box sx={{ mb: 2 }}>
                            <Tabs value={tabValue} onChange={handleTabChange}>
                                <Tab label="Resumo" />
                                <Tab label="Detalhes" />
                            </Tabs>
                        </Box>

                        {tabValue === 0 ? (
                            <Alert severity="info">
                                Processando {uploadProgress.totalFiles} arquivos.
                                {uploadProgress.processed} processados ({uploadProgress.successful} com sucesso, {uploadProgress.failed} falhas).
                                {loading ? ' Processamento em andamento...' : ' Processamento concluído.'}
                            </Alert>
                        ) : (
                            <Box>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Arquivo</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Progresso</TableCell>
                                                <TableCell>Ações</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedFiles().map((file) => (
                                                <TableRow key={file.id}>
                                                    <TableCell>{file.file.name}</TableCell>
                                                    <TableCell>
                                                        {file.status === 'success' ? (
                                                            <Chip size="small" icon={<CheckCircleIcon />} label="Sucesso" color="success" />
                                                        ) : file.status === 'error' ? (
                                                            <Chip size="small" icon={<ErrorIcon />} label="Erro" color="error" />
                                                        ) : file.status === 'processing' ? (
                                                            <Chip size="small" icon={<CircularProgress size={16} />} label="Processando" color="primary" />
                                                        ) : (
                                                            <Chip size="small" label="Pendente" color="default" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell width="30%">
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={file.progress}
                                                            color={
                                                                file.status === 'success' ? 'success' :
                                                                    file.status === 'error' ? 'error' :
                                                                        'primary'
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton size="small" onClick={() => showFileDetails(file)}>
                                                            <InfoIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {totalPages > 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                        <Pagination
                                            count={totalPages}
                                            page={currentPage}
                                            onChange={handlePageChange}
                                            color="primary"
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

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

                        {/* Resumo em vez de lista detalhada para grandes conjuntos */}
                        {isLargeFileSet ? (
                            <Box>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Processados {files.length} arquivos no total. Clique em "Exportar Resultados" para obter um relatório detalhado.
                                </Alert>

                                {/* Adicionar botão para exportar resultados */}
                                <Button
                                    variant="outlined"
                                    sx={{ mb: 2 }}
                                    onClick={() => {
                                        // Implementação para exportar CSV ou JSON com os resultados
                                        const results = files.map(file => ({
                                            name: file.file.name,
                                            size: file.file.size,
                                            status: file.status,
                                            error: file.error || '',
                                            person_id: file.result?.person_id || '',
                                            cpf: file.result?.cpf || '',
                                            person_name: file.result?.name || ''
                                        }));

                                        // Criar arquivo CSV
                                        const headers = ['name', 'size', 'status', 'error', 'person_id', 'cpf', 'person_name'];
                                        const csvContent = [
                                            headers.join(','),
                                            ...results.map(item =>
                                                headers.map(header =>
                                                    JSON.stringify(item[header as keyof typeof item] || '')
                                                ).join(',')
                                            )
                                        ].join('\n');

                                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.setAttribute('href', url);
                                        link.setAttribute('download', `resultados_${new Date().toISOString().split('T')[0]}.csv`);
                                        link.style.visibility = 'hidden';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                >
                                    Exportar Resultados (CSV)
                                </Button>

                                {/* Mostrar tabs com resumo de sucessos e erros */}
                                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                                    <Tab label="Resumo" />
                                    <Tab label="Sucessos" />
                                    <Tab label="Falhas" />
                                </Tabs>

                                {tabValue === 0 && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        {files.filter(f => f.status === 'success').length} arquivos processados com sucesso.
                                        {files.filter(f => f.status === 'error').length > 0 &&
                                            ` ${files.filter(f => f.status === 'error').length} arquivos com erro.`}
                                    </Alert>
                                )}

                                {tabValue === 1 && files.filter(f => f.status === 'success').length > 0 && (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Arquivo</TableCell>
                                                    <TableCell>ID da Pessoa</TableCell>
                                                    <TableCell>CPF</TableCell>
                                                    <TableCell>Nome</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {paginatedFiles()
                                                    .filter(f => f.status === 'success')
                                                    .map((file) => (
                                                        <TableRow key={file.id}>
                                                            <TableCell>{file.file.name}</TableCell>
                                                            <TableCell>{file.result?.person_id || '-'}</TableCell>
                                                            <TableCell>{file.result?.cpf || '-'}</TableCell>
                                                            <TableCell>{file.result?.name || '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>

                                        {totalPages > 1 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                                <Pagination
                                                    count={Math.ceil(files.filter(f => f.status === 'success').length / ITEMS_PER_PAGE)}
                                                    page={currentPage}
                                                    onChange={handlePageChange}
                                                    color="primary"
                                                />
                                            </Box>
                                        )}
                                    </TableContainer>
                                )}

                                {tabValue === 2 && files.filter(f => f.status === 'error').length > 0 && (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Arquivo</TableCell>
                                                    <TableCell>Erro</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {paginatedFiles()
                                                    .filter(f => f.status === 'error')
                                                    .map((file) => (
                                                        <TableRow key={file.id}>
                                                            <TableCell>{file.file.name}</TableCell>
                                                            <TableCell>{file.error || 'Erro desconhecido'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>

                                        {Math.ceil(files.filter(f => f.status === 'error').length / ITEMS_PER_PAGE) > 1 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                                <Pagination
                                                    count={Math.ceil(files.filter(f => f.status === 'error').length / ITEMS_PER_PAGE)}
                                                    page={currentPage}
                                                    onChange={handlePageChange}
                                                    color="primary"
                                                />
                                            </Box>
                                        )}
                                    </TableContainer>
                                )}
                            </Box>
                        ) : (
                            <List>
                                {paginatedFiles().map((file) => (
                                    <ListItem key={file.id} divider>
                                        <ListItemIcon>
                                            {showThumbnails && file.preview ? (
                                                <Avatar sx={{ width: 40, height: 40 }} src={file.preview} />
                                            ) : (
                                                <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.200' }}>
                                                    <ImageIcon />
                                                </Avatar>
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={file.file.name}
                                            secondary={
                                                file.status === 'success' ?
                                                    `ID: ${file.result?.person_id} | CPF: ${file.result?.cpf} | Nome: ${file.result?.name}` :
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
                        )}

                        {totalPages > 1 && !isLargeFileSet && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={handlePageChange}
                                    color="primary"
                                />
                            </Box>
                        )}

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
                                {selectedFile.preview ? (
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
                                ) : (
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: 200,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid #ddd',
                                            borderRadius: 1,
                                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                                        }}
                                    >
                                        <ImageIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
                                    </Box>
                                )}
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
                                            <strong>CPF:</strong> {selectedFile.result.cpf}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Nome:</strong> {selectedFile.result.name}
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