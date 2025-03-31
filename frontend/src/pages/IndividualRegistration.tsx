import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Alert,
    Snackbar
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
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
                }, 'image/jpeg', 0.7);  // Qualidade 0.7 (70%)
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

const IndividualRegistration = () => {
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
        const fileExt = 'jpg';  // Forçar extensão jpg após compressão

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

            const result = await uploadImage(renamedFile);

            if (result.success) {
                setSuccess('Indivíduo cadastrado com sucesso!');

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
        <Box>
            <Typography variant="h4" gutterBottom>
                Cadastro de Indivíduo
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
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
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="RG"
                                variant="outlined"
                                fullWidth
                                value={rg}
                                onChange={(e) => setRg(e.target.value.replace(/\D/g, ''))}
                                inputProps={{ maxLength: 11 }}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="CPF"
                                variant="outlined"
                                fullWidth
                                value={cpf}
                                onChange={handleCpfChange}
                                inputProps={{ maxLength: 14 }}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Button
                                variant="contained"
                                component="label"
                                startIcon={<UploadIcon />}
                                fullWidth
                                sx={{ height: 56 }}
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
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </Typography>
                            )}
                        </Grid>

                        {previewUrl && (
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Preview da Imagem:
                                </Typography>
                                <Box
                                    component="img"
                                    src={previewUrl}
                                    alt="Preview"
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: 300,
                                        objectFit: 'contain',
                                        border: '1px solid #ddd',
                                        borderRadius: 1,
                                    }}
                                />
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                disabled={loading}
                            >
                                {loading ? 'Cadastrando...' : 'Cadastrar Indivíduo'}
                            </Button>
                        </Grid>
                    </Grid>
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
                    sx={{ width: '100%' }}
                >
                    {error || success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default IndividualRegistration;