import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Alert,
    Snackbar,
    Container,
    Stack,
    Divider,
    Card,
    CardContent,
    CircularProgress,
    Avatar,
    IconButton,
    useTheme
} from '@mui/material';
import {
    Upload as UploadIcon,
    Person as PersonIcon,
    Badge as BadgeIcon,
    CreditCard as CreditCardIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import { uploadImage } from '../services/personService';
import { formatCPF, unformatCPF } from '../services/userService';
import { authService } from '../services/authService';

// Função de compressão de imagem
const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        // Se o arquivo for menor que 400KB, retornar original
        if (file.size <= 400 * 1024) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Reduzir a qualidade e o tamanho da imagem
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;
                let width = img.width;
                let height = img.height;

                // Redimensionar mantendo a proporção
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Desenhar a imagem no canvas
                ctx?.drawImage(img, 0, 0, width, height);

                // Comprimir para JPEG com qualidade reduzida
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Falha na compressão'));
                        return;
                    }
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', 0.7); // Qualidade 0.7 (70%)
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

const IndividualRegistration = () => {
    const theme = useTheme();
    const [name, setName] = useState('');
    const [rg, setRg] = useState('');
    const [cpf, setCpf] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const user = authService.getCurrentUser();

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCpf(formatCPF(value));
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            try {
                const selectedFile = event.target.files[0];
                // Comprimir a imagem
                const compressedFile = await compressImage(selectedFile);
                setFile(compressedFile);
                const fileUrl = URL.createObjectURL(compressedFile);
                setPreviewUrl(fileUrl);
            } catch (err) {
                console.error('Erro ao comprimir imagem:', err);
                setError('Erro ao processar a imagem. Tente novamente.');
            }
        }
    };

    const generateFilename = () => {
        if (!user || !file) return '';

        // Usar o órgão do usuário para gerar a origem
        const origin = user.orgao ? user.orgao.padStart(3, '0').slice(0, 3) : '001';
        const cleanCpf = unformatCPF(cpf);
        const cleanRg = rg.padStart(11, '0');
        const cleanName = name.toUpperCase().replace(/\s+/g, '_');
        const fileExt = 'jpg'; // Forçar extensão jpg após compressão

        return `${origin}${cleanCpf}${cleanRg}${cleanName}.${fileExt}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validações
        if (!name.trim()) {
            setError('Nome completo é obrigatório');
            return;
        }
        if (!rg.trim()) {
            setError('RG é obrigatório');
            return;
        }
        if (!cpf.trim()) {
            setError('CPF é obrigatório');
            return;
        }
        if (!file) {
            setError('Imagem é obrigatória');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Criar um novo arquivo com o nome gerado
            const newFilename = generateFilename();
            const renamedFile = new File([file], newFilename, { type: 'image/jpeg' });
            // Agora passamos true para permitir duplicatas
            const result = await uploadImage(renamedFile, true);

            if (result.success) {
                setSuccess('Pessoa cadastrada com sucesso!');
                // Limpar formulário
                setName('');
                setRg('');
                setCpf('');
                setFile(null);
                setPreviewUrl(null);
            } else {
                setError(result.message || 'Erro ao cadastrar indivíduo');
            }
        } catch (err: any) {
            console.error('Erro no cadastro:', err);
            setError(err.response?.data?.detail || 'Erro ao processar o cadastro');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setError(null);
        setSuccess(null);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <Box
                    sx={{
                        bgcolor: 'primary.main',
                        p: 2,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <PersonIcon sx={{ mr: 1.5 }} />
                    <Typography variant="h6">Informações da Pessoa</Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ p: { xs: 2, md: 4 } }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={3}>
                                    <TextField
                                        label="Nome Completo"
                                        variant="outlined"
                                        fullWidth
                                        value={name}
                                        onChange={(e) => {
                                            // Remove acentos e caracteres especiais
                                            const cleanValue = e.target.value
                                                .normalize('NFD')
                                                .replace(/[\u0300-\u036f]/g, '')
                                                .replace(/[^a-zA-Z\s]/g, '');
                                            setName(cleanValue);
                                        }}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <PersonIcon color="action" sx={{ mr: 1 }} />
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&.Mui-focused fieldset': {
                                                    borderWidth: 2
                                                }
                                            }
                                        }}
                                    />

                                    <TextField
                                        label="RG"
                                        variant="outlined"
                                        fullWidth
                                        value={rg}
                                        onChange={(e) => setRg(e.target.value.replace(/\D/g, ''))}
                                        inputProps={{ maxLength: 11 }}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <BadgeIcon color="action" sx={{ mr: 1 }} />
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&.Mui-focused fieldset': {
                                                    borderWidth: 2
                                                }
                                            }
                                        }}
                                    />

                                    <TextField
                                        label="CPF"
                                        variant="outlined"
                                        fullWidth
                                        value={cpf}
                                        onChange={handleCpfChange}
                                        inputProps={{ maxLength: 14 }}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <CreditCardIcon color="action" sx={{ mr: 1 }} />
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&.Mui-focused fieldset': {
                                                    borderWidth: 2
                                                }
                                            }
                                        }}
                                    />

                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadIcon />}
                                        fullWidth
                                        sx={{
                                            height: 56,
                                            borderRadius: 2,
                                            borderWidth: 2,
                                            borderStyle: 'dashed',
                                            borderColor: theme.palette.primary.light,
                                            '&:hover': {
                                                borderColor: theme.palette.primary.main,
                                                backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                            }
                                        }}
                                    >
                                        Selecionar Imagem
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </Button>

                                    {file && (
                                        <Box sx={{
                                            mt: 1,
                                            p: 1.5,
                                            borderRadius: 1,
                                            bgcolor: 'rgba(0,0,0,0.03)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                            </Typography>
                                            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: file.size > 400 * 1024 ? 'warning.main' : 'success.main',
                                                    fontWeight: 'medium'
                                                }}
                                            >
                                                {file.size > 400 * 1024 ? 'Comprimido' : 'Pronto'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card
                                    elevation={2}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 2,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box sx={{
                                        bgcolor: 'primary.main',
                                        p: 1.5,
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 1.5 }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Typography variant="subtitle1">Preview da Imagem</Typography>
                                    </Box>

                                    <CardContent sx={{
                                        flexGrow: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(0,0,0,0.02)',
                                        p: 3
                                    }}>
                                        {previewUrl ? (
                                            <Box
                                                component="img"
                                                src={previewUrl}
                                                alt="Preview"
                                                sx={{
                                                    maxWidth: '100%',
                                                    maxHeight: 300,
                                                    objectFit: 'contain',
                                                    borderRadius: 1,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                        ) : (
                                            <Box sx={{
                                                width: '100%',
                                                height: 300,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px dashed',
                                                borderColor: 'rgba(0,0,0,0.1)',
                                                borderRadius: 2,
                                                color: 'text.disabled'
                                            }}>
                                                <UploadIcon sx={{ fontSize: 60, mb: 2, opacity: 0.7 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Nenhuma imagem selecionada
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" align="center" sx={{ mt: 1, maxWidth: '80%' }}>
                                                    Selecione uma imagem para visualizar o preview
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                disabled={loading}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                                    '&:hover': {
                                        boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)'
                                    }
                                }}
                            >
                                {loading ? 'Cadastrando...' : 'Cadastrar Pessoa'}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>

            <Snackbar
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                open={!!error || !!success}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={error ? 'error' : 'success'}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: error
                            ? '0 4px 12px rgba(244, 67, 54, 0.2)'
                            : '0 4px 12px rgba(76, 175, 80, 0.2)',
                        alignItems: 'center'
                    }}
                    icon={error ? <CloseIcon /> : <CheckIcon />}
                    action={
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={handleCloseSnackbar}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    {error || success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default IndividualRegistration;
