import { useState } from 'react';
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
    CardActions,
    CircularProgress,
    Tabs,
    Tab,
    Alert,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    Search as SearchIcon,
    Upload as UploadIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { searchByImage, searchByPersonId, SearchResult } from '../services/recognitionService';

const Search = () => {
    const [searchMethod, setSearchMethod] = useState(0);
    const [personId, setPersonId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSearchMethod(newValue);
        resetSearch();
    };

    const resetSearch = () => {
        setPersonId('');
        setFile(null);
        setPreviewUrl(null);
        setResults([]);
        setError(null);
        setSuccess(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);

            // Criar URL para preview
            const fileUrl = URL.createObjectURL(selectedFile);
            setPreviewUrl(fileUrl);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);
            setResults([]);

            if (searchMethod === 0) {
                // Busca por imagem
                if (!file) {
                    setError('Por favor, selecione uma imagem para busca.');
                    setLoading(false);
                    return;
                }

                const response = await searchByImage(file, 5);

                if (response.success) {
                    setResults(response.results);
                    setSuccess(true);
                    if (response.results.length === 0) {
                        setError('Nenhum resultado encontrado para esta imagem.');
                    }
                } else {
                    setError(response.message || 'Erro desconhecido na busca.');
                }
            } else {
                // Busca por ID
                if (!personId) {
                    setError('Por favor, digite um ID de pessoa válido.');
                    setLoading(false);
                    return;
                }

                const response = await searchByPersonId(personId, 5);

                if (response.success) {
                    setResults(response.results);
                    setSuccess(true);
                    if (response.results.length === 0) {
                        setError('Nenhum resultado encontrado para este ID.');
                    }
                } else {
                    setError(response.message || 'Erro desconhecido na busca.');
                }
            }
        } catch (err: any) {
            console.error('Erro na busca:', err);
            setError(err.response?.data?.detail || 'Ocorreu um erro ao processar sua busca. Por favor, tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const getSimilarityColor = (similarity: number) => {
        if (similarity >= 0.9) return 'success.main';
        if (similarity >= 0.8) return 'info.main';
        if (similarity >= 0.7) return 'warning.main';
        return 'error.main';
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Busca de Faces
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Tabs
                    value={searchMethod}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    centered
                    sx={{ mb: 3 }}
                >
                    <Tab icon={<UploadIcon />} label="Buscar por Imagem" />
                    <Tab icon={<PersonIcon />} label="Buscar por ID" />
                </Tabs>

                {searchMethod === 0 ? (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Faça upload de uma imagem para buscar faces similares no sistema.
                        </Typography>

                        <Grid container spacing={3} alignItems="center">
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
                                        Arquivo selecionado: {file.name}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SearchIcon />}
                                    onClick={handleSearch}
                                    disabled={!file || loading}
                                    fullWidth
                                    sx={{ height: 56 }}
                                >
                                    {loading ? 'Buscando...' : 'Buscar Faces Similares'}
                                </Button>
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
                        </Grid>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Digite o ID da pessoa para buscar faces similares no sistema.
                        </Typography>

                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="ID da Pessoa"
                                    variant="outlined"
                                    fullWidth
                                    value={personId}
                                    onChange={(e) => setPersonId(e.target.value)}
                                    placeholder="Ex: 000000012345"
                                    helperText="Digite o ID de 12 dígitos da pessoa"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SearchIcon />}
                                    onClick={handleSearch}
                                    disabled={!personId || loading}
                                    fullWidth
                                    sx={{ height: 56 }}
                                >
                                    {loading ? 'Buscando...' : 'Buscar Faces Similares'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {loading && (
                    <Box sx={{ width: '100%', mt: 3 }}>
                        <LinearProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                        {error}
                    </Alert>
                )}

                {success && results.length === 0 && (
                    <Alert severity="info" sx={{ mt: 3 }}>
                        Nenhum resultado encontrado para sua busca.
                    </Alert>
                )}
            </Paper>

            {results.length > 0 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        Resultados da Busca
                    </Typography>

                    <Grid container spacing={3}>
                        {results.map((result, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card elevation={3}>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={`http://localhost:8000/api/persons/${result.person_id}/image`}
                                        alt={result.name}
                                        onError={(e: any) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Imagem+não+disponível';
                                        }}
                                    />
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="h6" component="div">
                                                {result.name}
                                            </Typography>
                                            <Chip
                                                label={`${(result.similarity * 100).toFixed(1)}%`}
                                                color={result.similarity >= 0.9 ? "success" : result.similarity >= 0.8 ? "primary" : "warning"}
                                                size="small"
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            ID: {result.person_id}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            Origem: {result.origin}
                                        </Typography>

                                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                                Similaridade:
                                            </Typography>
                                            <Box sx={{ width: '100%', mr: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={result.similarity * 100}
                                                    color={
                                                        result.similarity >= 0.9 ? "success" :
                                                            result.similarity >= 0.8 ? "primary" :
                                                                result.similarity >= 0.7 ? "warning" : "error"
                                                    }
                                                    sx={{ height: 8, borderRadius: 5 }}
                                                />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" color="primary">
                                            Ver Detalhes
                                        </Button>
                                        <Button size="small" color="secondary">
                                            Comparar
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default Search;