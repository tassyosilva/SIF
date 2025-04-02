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
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { api } from '../services/api';
import { uploadImage } from '../services/personService';

// Constante para definir o limite de itens por página
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

// Interface para acompanhar o progresso total do upload
interface UploadProgress {
    totalFiles: number;
    processed: number;
    successful: number;
    failed: number;
    overallProgress: number;
}

// Função auxiliar para extrair CPF do nome do arquivo
function extrairCpfDoNomeArquivo(filename: string): string | null {
    // Padrão: OOOCCCCCCCCCCCRRRRRRRRRRRNOME.ext
    const match = filename.match(/^(\d{3})(\d{11})(\d{11})/);
    if (match) {
        const cpfRaw = match[2]; // Grupo 2 captura os 11 dígitos do CPF
        // Formatar o CPF (ex: 123.456.789-10)
        return `${cpfRaw.substring(0, 3)}.${cpfRaw.substring(3, 6)}.${cpfRaw.substring(6, 9)}-${cpfRaw.substring(9, 11)}`;
    }
    return null;
}

const Upload = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Novos estados para otimização
    const [currentPage, setCurrentPage] = useState(1);
    const [tabValue, setTabValue] = useState(0);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
        totalFiles: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        overallProgress: 0
    });

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
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substring(2, 9),
            file,
            status: 'pending' as const,
            progress: 0,
        }));

        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    // Cleanup quando componente for desmontado
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

                        // Estruturar os dados conforme a expectativa do componente
                        file.result = {
                            ...result.person,
                            // O backend não retorna esses valores diretamente no objeto person,
                            // mas sabemos que se o upload foi bem-sucedido, a face foi detectada
                            face_detected: true,

                            // Extrair CPF do nome do arquivo, já que não está vindo na resposta
                            cpf: extrairCpfDoNomeArquivo(file.file.name) || "Não disponível"
                        };

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

    const showFileDetails = (file: UploadedFile) => {
        // Gerar preview apenas quando necessário para o diálogo de detalhes
        if (!file.preview && file.file) {
            file.preview = URL.createObjectURL(file.file);
        }

        setSelectedFile(file);
        setDetailsOpen(true);
    };

    const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE);
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

                        {/* Exibição de arquivos - Simplificada - Apenas lista de nomes */}
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
                                        disabled={loading}
                                    >
                                        Limpar Tudo
                                    </Button>
                                </Box>

                                {/* Lista simplificada de arquivos */}
                                <List sx={{ maxHeight: '300px', overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    {paginatedFiles().map((file) => (
                                        <ListItem key={file.id} divider>
                                            <ListItemIcon>
                                                <ImageIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={file.file.name}
                                                secondary={`${(file.file.size / 1024).toFixed(1)} KB`}
                                            />
                                            <IconButton size="small" onClick={() => removeFile(file.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>

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

                        {/* Lista de resultados */}
                        <List>
                            {paginatedFiles().map((file) => (
                                <ListItem key={file.id} divider>
                                    <ListItemIcon>
                                        {file.status === 'success' ? (
                                            <CheckCircleIcon color="success" />
                                        ) : (
                                            <ErrorIcon color="error" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={file.file.name}
                                        secondary={
                                            file.status === 'success' ?
                                                `ID: ${file.result?.person_id || file.result?.id} | CPF: ${file.result?.cpf || 'Não disponível'} | Nome: ${file.result?.name || 'Não disponível'}` :
                                                file.error || 'Erro no processamento'
                                        }
                                    />
                                    <IconButton size="small" onClick={() => showFileDetails(file)}>
                                        <InfoIcon />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>

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
                                            <strong>ID da Pessoa:</strong> {selectedFile.result.person_id || selectedFile.result.id || "Não disponível"}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>CPF:</strong> {selectedFile.result.cpf || "Não disponível"}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Nome:</strong> {selectedFile.result.name || "Não disponível"}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Origem:</strong> {selectedFile.result.origin || "Não disponível"}
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