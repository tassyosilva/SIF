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
    Container,
    alpha,
    styled,
    useTheme
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
    FilterNone as FilterNoneIcon,
    PhotoLibrary as PhotoLibraryIcon,
    UploadFile as UploadFileIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { api } from '../services/api';
import { uploadImage } from '../services/personService';

// Constante para definir o limite de itens por página
const ITEMS_PER_PAGE = 20;

// Cores principais
const PRIMARY_COLOR = '#000000';
const GOLD_COLOR = '#D4AF37';

// Componente estilizado para o Paper principal com animação
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: `1px solid ${alpha(GOLD_COLOR, 0.1)}`,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    animation: 'fadeIn 0.5s ease-in-out',
    '@keyframes fadeIn': {
        from: { opacity: 0, transform: 'translateY(10px)' },
        to: { opacity: 1, transform: 'translateY(0)' }
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${alpha(GOLD_COLOR, 0)}, ${GOLD_COLOR}, ${alpha(GOLD_COLOR, 0)})`,
    }
}));

// Componente estilizado para os cards de estatísticas
const StatsCard = styled(Card)(({ theme }) => ({
    height: '100%',
    backgroundColor: 'white',
    border: `1px solid ${alpha(GOLD_COLOR, 0.2)}`,
    borderRadius: '12px',
    boxShadow: `0 8px 24px 0 ${alpha('#000', 0.05)}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 12px 30px 0 ${alpha('#000', 0.1)}`
    }
}));

// Zona de upload estilizada
const StyledDropzone = styled(Box)(({ theme, isDragActive }: { theme: any, isDragActive: boolean }) => ({
    border: '2px dashed',
    borderColor: isDragActive ? GOLD_COLOR : alpha(PRIMARY_COLOR, 0.2),
    borderRadius: '12px',
    padding: theme.spacing(4),
    textAlign: 'center',
    backgroundColor: isDragActive ? alpha(GOLD_COLOR, 0.05) : alpha('#f8f8f8', 0.5),
    cursor: 'pointer',
    marginBottom: theme.spacing(3),
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: GOLD_COLOR,
        backgroundColor: alpha(GOLD_COLOR, 0.05),
        transform: 'translateY(-2px)',
        boxShadow: `0 5px 15px ${alpha('#000', 0.05)}`
    }
}));

// Botão primário estilizado
const PrimaryButton = styled(Button)(({ theme }) => ({
    backgroundColor: GOLD_COLOR,
    color: '#000',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: `0 4px 12px ${alpha(GOLD_COLOR, 0.3)}`,
    '&:hover': {
        backgroundColor: '#E6C200',
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 20px ${alpha(GOLD_COLOR, 0.4)}`
    },
    '&.Mui-disabled': {
        backgroundColor: alpha(GOLD_COLOR, 0.3),
        color: alpha('#000', 0.5)
    }
}));

// Botão secundário estilizado
const SecondaryButton = styled(Button)(({ theme }) => ({
    borderColor: GOLD_COLOR,
    color: GOLD_COLOR,
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: GOLD_COLOR,
        backgroundColor: alpha(GOLD_COLOR, 0.1),
        transform: 'translateY(-2px)',
    }
}));

// Componente estilizado para Divider personalizado
const StyledDivider = styled(Divider)({
    borderColor: alpha(GOLD_COLOR, 0.2),
    margin: '24px 0',
    width: '100%'
});

// Componente de barra de progresso estilizado
const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 8,
    borderRadius: 4,
    '& .MuiLinearProgress-bar': {
        borderRadius: 4,
    }
}));

// Tabs estilizadas
const StyledTabs = styled(Tabs)(({ theme }) => ({
    '& .MuiTab-root': {
        fontWeight: 'bold',
        textTransform: 'none',
        transition: 'all 0.2s ease',
        '&.Mui-selected': {
            color: GOLD_COLOR,
        }
    },
    '& .MuiTabs-indicator': {
        backgroundColor: GOLD_COLOR,
        height: 3,
        borderRadius: '3px 3px 0 0'
    }
}));

// Stepper estilizado
const StyledStepper = styled(Stepper)(({ theme }) => ({
    '& .MuiStepIcon-root.Mui-active': {
        color: GOLD_COLOR,
    },
    '& .MuiStepIcon-root.Mui-completed': {
        color: GOLD_COLOR,
    },
    '& .MuiStepLabel-label.Mui-active': {
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
    }
}));

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

const Upload = () => {
    const theme = useTheme();
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
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Box sx={{
                mb: 4,
                display: 'flex',
                alignItems: 'center'
            }}>
                <Box sx={{
                    backgroundColor: alpha(GOLD_COLOR, 0.1),
                    borderRadius: '50%',
                    p: 1,
                    mr: 2,
                    display: 'flex'
                }}>
                    <UploadFileIcon sx={{ color: GOLD_COLOR, fontSize: 28 }} />
                </Box>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 600,
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            width: '40%',
                            height: '3px',
                            bottom: '-8px',
                            left: '0',
                            backgroundColor: GOLD_COLOR,
                            borderRadius: '2px'
                        }
                    }}
                >
                    Upload de Imagens
                </Typography>
            </Box>

            <StyledPaper>
                <StyledStepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label, index) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </StyledStepper>

                {error && (
                    <Alert
                        severity="error"
                        variant="filled"
                        sx={{
                            mb: 3,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.15)'
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert
                        severity="success"
                        variant="filled"
                        sx={{
                            mb: 3,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)'
                        }}
                    >
                        {success}
                    </Alert>
                )}

                {activeStep === 0 && (
                    <Box>
                        <Typography variant="body1" sx={{ mb: 2, color: alpha(PRIMARY_COLOR, 0.7) }}>
                            Arraste e solte imagens aqui ou clique para selecionar arquivos.
                        </Typography>

                        <StyledDropzone theme={undefined} {...getRootProps()} isDragActive={isDragActive}>
                            <input {...getInputProps()} />
                            <UploadIcon sx={{ fontSize: 48, color: GOLD_COLOR, mb: 2 }} />
                            {isDragActive ? (
                                <Typography variant="h6" sx={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}>
                                    Solte as imagens aqui...
                                </Typography>
                            ) : (
                                <Typography variant="h6" sx={{ color: PRIMARY_COLOR, fontWeight: 'bold', mb: 1 }}>
                                    Arraste e solte imagens aqui
                                </Typography>
                            )}
                            <Typography variant="body1" sx={{ color: alpha(PRIMARY_COLOR, 0.6), mb: 2 }}>
                                ou clique para selecionar arquivos
                            </Typography>
                            <Chip
                                label="Formatos aceitos: JPG, JPEG, PNG, BMP (máx. 5MB)"
                                size="small"
                                sx={{
                                    bgcolor: alpha(GOLD_COLOR, 0.1),
                                    color: alpha(PRIMARY_COLOR, 0.7),
                                    borderRadius: '4px'
                                }}
                            />
                        </StyledDropzone>

                        {/* Exibição de arquivos */}
                        {files.length > 0 && (
                            <Box>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2,
                                    p: 2,
                                    borderRadius: '8px',
                                    bgcolor: alpha(GOLD_COLOR, 0.05)
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <FilterNoneIcon sx={{ color: GOLD_COLOR, mr: 1 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            {files.length} {files.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={resetUpload}
                                        disabled={loading}
                                        sx={{
                                            borderRadius: '8px',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        Limpar Tudo
                                    </Button>
                                </Box>

                                {/* Lista de arquivos */}
                                <List sx={{
                                    maxHeight: '300px',
                                    overflow: 'auto',
                                    border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
                                    borderRadius: '8px',
                                    bgcolor: 'white'
                                }}>
                                    {paginatedFiles().map((file) => (
                                        <ListItem
                                            key={file.id}
                                            divider
                                            sx={{
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: alpha(GOLD_COLOR, 0.05)
                                                }
                                            }}
                                        >
                                            <ListItemIcon>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: alpha(GOLD_COLOR, 0.1),
                                                        color: GOLD_COLOR
                                                    }}
                                                >
                                                    <ImageIcon />
                                                </Avatar>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={file.file.name}
                                                secondary={`${(file.file.size / 1024).toFixed(1)} KB`}
                                                primaryTypographyProps={{ fontWeight: 'medium' }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => removeFile(file.id)}
                                                sx={{
                                                    color: 'error.main',
                                                    bgcolor: alpha('#f44336', 0.1),
                                                    '&:hover': {
                                                        bgcolor: alpha('#f44336', 0.2),
                                                    }
                                                }}
                                            >
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
                                            sx={{
                                                '& .MuiPaginationItem-root.Mui-selected': {
                                                    backgroundColor: GOLD_COLOR,
                                                    color: 'black'
                                                }
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                            <SecondaryButton
                                variant="outlined"
                                onClick={resetUpload}
                            >
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton
                                variant="contained"
                                endIcon={<UploadIcon />}
                                onClick={uploadFiles}
                                disabled={files.length === 0 || loading}
                            >
                                {loading ? 'Processando...' : 'Processar Imagens'}
                            </PrimaryButton>
                        </Box>
                    </Box>
                )}

                {activeStep === 1 && (
                    <Box>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 3,
                            p: 2,
                            borderRadius: '8px',
                            bgcolor: alpha(GOLD_COLOR, 0.05)
                        }}>
                            <PhotoLibraryIcon sx={{ color: GOLD_COLOR, mr: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Processando Imagens
                            </Typography>
                        </Box>

                        {/* Progresso geral */}
                        <Box sx={{ mb: 4 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatsCard>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Total
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha(GOLD_COLOR, 0.1)
                                                    }}
                                                >
                                                    <FilterNoneIcon sx={{ color: GOLD_COLOR }} />
                                                </Box>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                    {uploadProgress.totalFiles}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </StatsCard>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatsCard>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Processados
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha('#2196f3', 0.1)
                                                    }}
                                                >
                                                    <RefreshIcon sx={{ color: '#2196f3' }} />
                                                </Box>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                    {uploadProgress.processed}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </StatsCard>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatsCard>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Sucesso
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha('#4caf50', 0.1)
                                                    }}
                                                >
                                                    <CheckCircleIcon sx={{ color: '#4caf50' }} />
                                                </Box>
                                                <Typography
                                                    variant="h4"
                                                    color="success.main"
                                                    sx={{ fontWeight: 'bold' }}
                                                >
                                                    {uploadProgress.successful}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </StatsCard>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatsCard>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Falhas
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha('#f44336', 0.1)
                                                    }}
                                                >
                                                    <ErrorIcon sx={{ color: '#f44336' }} />
                                                </Box>
                                                <Typography
                                                    variant="h4"
                                                    color="error.main"
                                                    sx={{ fontWeight: 'bold' }}
                                                >
                                                    {uploadProgress.failed}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </StatsCard>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Barra de progresso geral */}
                        <Box sx={{
                            mb: 3,
                            p: 3,
                            borderRadius: '12px',
                            border: `1px solid ${alpha(GOLD_COLOR, 0.2)}`,
                            bgcolor: alpha(GOLD_COLOR, 0.02)
                        }}>
                            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                                Progresso geral: {Math.round(uploadProgress.overallProgress)}%
                            </Typography>
                            <StyledLinearProgress
                                variant="determinate"
                                value={uploadProgress.overallProgress}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: alpha(GOLD_COLOR, 0.2),
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: GOLD_COLOR
                                    }
                                }}
                            />
                        </Box>

                        {/* Abas para diferentes visualizações */}
                        <Box sx={{ mb: 3 }}>
                            <StyledTabs value={tabValue} onChange={handleTabChange}>
                                <Tab
                                    label="Resumo"
                                    icon={<AssessmentIcon />}
                                    iconPosition="start"
                                />
                                <Tab
                                    label="Detalhes"
                                    icon={<InfoIcon />}
                                    iconPosition="start"
                                />
                            </StyledTabs>
                            <StyledDivider />
                        </Box>

                        {tabValue === 0 ? (
                            <Alert
                                severity="info"
                                variant="filled"
                                sx={{
                                    mb: 3,
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)'
                                }}
                            >
                                <Box sx={{ fontWeight: 'medium', mb: 1 }}>Status do Processamento:</Box>
                                <Box>
                                    • Processando {uploadProgress.totalFiles} arquivos<br />
                                    • {uploadProgress.processed} processados ({uploadProgress.successful} com sucesso, {uploadProgress.failed} falhas)<br />
                                    • {loading ? 'Processamento em andamento...' : 'Processamento concluído.'}
                                </Box>
                            </Alert>
                        ) : (
                            <Box>
                                <TableContainer
                                    component={Paper}
                                    elevation={0}
                                    sx={{
                                        border: `1px solid ${alpha('#000', 0.1)}`,
                                        borderRadius: '8px',
                                        mb: 3
                                    }}
                                >
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: alpha(GOLD_COLOR, 0.05) }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Arquivo</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Progresso</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedFiles().map((file) => (
                                                <TableRow
                                                    key={file.id}
                                                    sx={{
                                                        '&:hover': {
                                                            bgcolor: alpha(GOLD_COLOR, 0.05)
                                                        }
                                                    }}
                                                >
                                                    <TableCell>{file.file.name}</TableCell>
                                                    <TableCell>
                                                        {file.status === 'success' ? (
                                                            <Chip
                                                                size="small"
                                                                icon={<CheckCircleIcon />}
                                                                label="Sucesso"
                                                                color="success"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                                                                }}
                                                            />
                                                        ) : file.status === 'error' ? (
                                                            <Chip
                                                                size="small"
                                                                icon={<ErrorIcon />}
                                                                label="Erro"
                                                                color="error"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                                                                }}
                                                            />
                                                        ) : file.status === 'processing' ? (
                                                            <Chip
                                                                size="small"
                                                                icon={<CircularProgress size={16} />}
                                                                label="Processando"
                                                                color="primary"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                                                                }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                size="small"
                                                                label="Pendente"
                                                                color="default"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                                                                }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell width="30%">
                                                        <StyledLinearProgress
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
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => showFileDetails(file)}
                                                            sx={{
                                                                bgcolor: alpha(GOLD_COLOR, 0.1),
                                                                color: GOLD_COLOR,
                                                                '&:hover': {
                                                                    bgcolor: alpha(GOLD_COLOR, 0.2),
                                                                }
                                                            }}
                                                        >
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
                                            sx={{
                                                '& .MuiPaginationItem-root.Mui-selected': {
                                                    backgroundColor: GOLD_COLOR,
                                                    color: 'black'
                                                }
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                            <SecondaryButton
                                variant="outlined"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                Voltar
                            </SecondaryButton>
                            <PrimaryButton
                                variant="contained"
                                onClick={handleNext}
                                disabled={loading || files.some(f => f.status === 'processing' || f.status === 'pending')}
                            >
                                Continuar
                            </PrimaryButton>
                        </Box>
                    </Box>
                )}

                {activeStep === 2 && (
                    <Box>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 3,
                            p: 2,
                            borderRadius: '8px',
                            bgcolor: alpha(GOLD_COLOR, 0.05)
                        }}>
                            <AssessmentIcon sx={{ color: GOLD_COLOR, mr: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Resultados do Processamento
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={4}>
                                    <StatsCard>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Total de Arquivos
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha(GOLD_COLOR, 0.1)
                                                    }}
                                                >
                                                    <FilterNoneIcon sx={{ color: GOLD_COLOR }} />
                                                </Box>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                    {files.length}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </StatsCard>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <StatsCard>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Processados com Sucesso
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha('#4caf50', 0.1)
                                                    }}
                                                >
                                                    <CheckCircleIcon sx={{ color: '#4caf50' }} />
                                                </Box>
                                                <Typography
                                                    variant="h4"
                                                    color="success.main"
                                                    sx={{ fontWeight: 'bold' }}
                                                >
                                                    {files.filter(f => f.status === 'success').length}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </StatsCard>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <StatsCard>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Falhas
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha('#f44336', 0.1)
                                                    }}
                                                >
                                                    <ErrorIcon sx={{ color: '#f44336' }} />
                                                </Box>
                                                <Typography
                                                    variant="h4"
                                                    color="error.main"
                                                    sx={{ fontWeight: 'bold' }}
                                                >
                                                    {files.filter(f => f.status === 'error').length}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </StatsCard>
                                </Grid>
                            </Grid>
                        </Box>

                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2
                            }}
                        >
                            <PhotoLibraryIcon sx={{ mr: 1, color: GOLD_COLOR }} />
                            Detalhes dos Arquivos
                        </Typography>

                        {/* Lista de resultados */}
                        <List
                            sx={{
                                border: `1px solid ${alpha('#000', 0.1)}`,
                                borderRadius: '8px',
                                bgcolor: 'white',
                                mb: 3
                            }}
                        >
                            {paginatedFiles().map((file) => (
                                <ListItem
                                    key={file.id}
                                    divider
                                    sx={{
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            bgcolor: alpha(GOLD_COLOR, 0.05)
                                        }
                                    }}
                                >
                                    <ListItemIcon>
                                        {file.status === 'success' ? (
                                            <Avatar sx={{ bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}>
                                                <CheckCircleIcon />
                                            </Avatar>
                                        ) : (
                                            <Avatar sx={{ bgcolor: alpha('#f44336', 0.1), color: '#f44336' }}>
                                                <ErrorIcon />
                                            </Avatar>
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {file.file.name}
                                            </Typography>
                                        }
                                        secondary={
                                            file.status === 'success' ?
                                                <Box component="span" sx={{ color: alpha('#000', 0.7) }}>
                                                    <b>ID:</b> {file.result?.person_id} | <b>CPF:</b> {file.result?.cpf} | <b>Nome:</b> {file.result?.name}
                                                </Box> :
                                                <Box component="span" sx={{ color: 'error.main' }}>
                                                    {file.error || 'Erro no processamento'}
                                                </Box>
                                        }
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => showFileDetails(file)}
                                        sx={{
                                            bgcolor: alpha(GOLD_COLOR, 0.1),
                                            color: GOLD_COLOR,
                                            '&:hover': {
                                                bgcolor: alpha(GOLD_COLOR, 0.2),
                                            }
                                        }}
                                    >
                                        <InfoIcon />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>

                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 3 }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={handlePageChange}
                                    color="primary"
                                    sx={{
                                        '& .MuiPaginationItem-root.Mui-selected': {
                                            backgroundColor: GOLD_COLOR,
                                            color: 'black'
                                        }
                                    }}
                                />
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                            <SecondaryButton
                                variant="outlined"
                                onClick={handleBack}
                            >
                                Voltar
                            </SecondaryButton>
                            <PrimaryButton
                                variant="contained"
                                color="primary"
                                startIcon={<RefreshIcon />}
                                onClick={resetUpload}
                            >
                                Novo Upload
                            </PrimaryButton>
                        </Box>
                    </Box>
                )}
            </StyledPaper>

            {/* Dialog para detalhes do arquivo */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: alpha(GOLD_COLOR, 0.05),
                    borderBottom: `1px solid ${alpha(GOLD_COLOR, 0.2)}`,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <InfoIcon sx={{ mr: 1, color: GOLD_COLOR }} />
                    Detalhes do Arquivo
                </DialogTitle>
                <DialogContent dividers>
                    {selectedFile && (
                        <Grid container spacing={3}>
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
                                            border: `1px solid ${alpha('#000', 0.1)}`,
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
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
                                            border: `1px solid ${alpha('#000', 0.1)}`,
                                            borderRadius: '8px',
                                            bgcolor: alpha('#000', 0.05)
                                        }}
                                    >
                                        <ImageIcon sx={{ fontSize: 80, color: alpha('#000', 0.3) }} />
                                    </Box>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography
                                    variant="subtitle1"
                                    gutterBottom
                                    sx={{
                                        fontWeight: 'bold',
                                        color: GOLD_COLOR,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <ImageIcon sx={{ mr: 1, fontSize: 20 }} />
                                    Informações do Arquivo
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <b>Nome:</b> {selectedFile.file.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <b>Tamanho:</b> {(selectedFile.file.size / 1024).toFixed(1)} KB
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <b>Tipo:</b> {selectedFile.file.type}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <b>Status:</b>{' '}
                                        {selectedFile.status === 'success' ? (
                                            <Chip
                                                size="small"
                                                label="Processado com sucesso"
                                                color="success"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        ) : selectedFile.status === 'error' ? (
                                            <Chip
                                                size="small"
                                                label="Erro no processamento"
                                                color="error"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        ) : selectedFile.status === 'processing' ? (
                                            <Chip
                                                size="small"
                                                label="Processando..."
                                                color="primary"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        ) : (
                                            <Chip
                                                size="small"
                                                label="Aguardando processamento"
                                                color="default"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        )}
                                    </Typography>
                                </Box>

                                {selectedFile.status === 'success' && selectedFile.result && (
                                    <>
                                        <StyledDivider />
                                        <Typography
                                            variant="subtitle1"
                                            gutterBottom
                                            sx={{
                                                fontWeight: 'bold',
                                                color: GOLD_COLOR,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                                            Resultado do Processamento
                                        </Typography>
                                        <Box
                                            sx={{
                                                p: 2,
                                                backgroundColor: alpha('#f5f5f5', 0.5),
                                                borderRadius: '8px',
                                                border: `1px solid ${alpha('#000', 0.1)}`
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <b>ID da Pessoa:</b> {selectedFile.result.person_id}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <b>CPF:</b> {selectedFile.result.cpf}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <b>Nome:</b> {selectedFile.result.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                <b>Origem:</b> {selectedFile.result.origin}
                                            </Typography>
                                            <Typography variant="body2">
                                                <b>Face Detectada:</b>{' '}
                                                {selectedFile.result.face_detected ? (
                                                    <Chip
                                                        size="small"
                                                        label="Sim"
                                                        color="success"
                                                        sx={{ fontWeight: 'bold' }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        size="small"
                                                        label="Não"
                                                        color="error"
                                                        sx={{ fontWeight: 'bold' }}
                                                    />
                                                )}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                {selectedFile.status === 'error' && (
                                    <>
                                        <StyledDivider />
                                        <Typography
                                            variant="subtitle1"
                                            color="error"
                                            gutterBottom
                                            sx={{
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <ErrorIcon sx={{ mr: 1, fontSize: 20 }} />
                                            Erro
                                        </Typography>
                                        <Alert
                                            severity="error"
                                            variant="outlined"
                                            sx={{ mt: 1 }}
                                        >
                                            {selectedFile.error || 'Erro desconhecido durante o processamento.'}
                                        </Alert>
                                    </>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: alpha(GOLD_COLOR, 0.02) }}>
                    <Button
                        onClick={() => setDetailsOpen(false)}
                        sx={{
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            borderColor: GOLD_COLOR,
                            color: GOLD_COLOR,
                            '&:hover': {
                                borderColor: GOLD_COLOR,
                                backgroundColor: alpha(GOLD_COLOR, 0.1)
                            }
                        }}
                        variant="outlined"
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Upload;