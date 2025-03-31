import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Alert,
    Snackbar} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { uploadImage } from '../services/personService';
import { formatCPF, unformatCPF } from '../services/userService';
import { authService } from '../services/authService';

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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);

            const fileUrl = URL.createObjectURL(selectedFile);
            setPreviewUrl(fileUrl);
        }
    };

    const generateFilename = () => {
        if (!user || !file) return '';

        // Usar o órgão do usuário para gerar a origem
        const origin = user.orgao ? user.orgao.padStart(3, '0').slice(0, 3) : '001';
        const cleanCpf = unformatCPF(cpf);
        const cleanRg = rg.padStart(11, '0');
        const cleanName = name.toUpperCase().replace(/\s+/g, '_');
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

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
            const renamedFile = new File([file], newFilename, { type: file.type });

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
                                    {file.name}
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