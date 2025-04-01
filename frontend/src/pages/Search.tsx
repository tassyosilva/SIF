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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Search as SearchIcon,
    Upload as UploadIcon,
    Person as PersonIcon,
    ArrowBackIos as ArrowBackIcon,
    ArrowForwardIos as ArrowForwardIcon
} from '@mui/icons-material';
import { searchByImage, searchByPersonId, SearchResult } from '../services/recognitionService';
import {
    searchByPersonCpf,
    searchByPersonName
} from '../services/recognitionService';
import { getPersonImages, PersonImage } from '../services/personService';


const Search = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [searchMethod, setSearchMethod] = useState(0);
    const [personId, setPersonId] = useState('');
    const [personCpf, setPersonCpf] = useState('');
    const [personName, setPersonName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
    const [personImages, setPersonImages] = useState<PersonImage[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loadingImages, setLoadingImages] = useState(false);


    // Função para formatar CPF
    const formatCPF = (value: string) => {
        const cpf = value.replace(/\D/g, '');
        const cpfLimited = cpf.slice(0, 11);
        if (cpfLimited.length <= 3) {
            return cpfLimited;
        } else if (cpfLimited.length <= 6) {
            return `${cpfLimited.slice(0, 3)}.${cpfLimited.slice(3)}`;
        } else if (cpfLimited.length <= 9) {
            return `${cpfLimited.slice(0, 3)}.${cpfLimited.slice(3, 6)}.${cpfLimited.slice(6)}`;
        } else {
            return `${cpfLimited.slice(0, 3)}.${cpfLimited.slice(3, 6)}.${cpfLimited.slice(6, 9)}-${cpfLimited.slice(9)}`;
        }
    };


    // Função para remover acentos
    const removeAccents = (str: string) => {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };


    // Handlers para os campos de entrada
    const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPersonId(e.target.value.slice(0, 11));
    };


    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPersonCpf(formatCPF(e.target.value));
    };


    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPersonName(removeAccents(e.target.value));
    };


    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSearchMethod(newValue);
        resetSearch();
    };


    const resetSearch = () => {
        setPersonId('');
        setPersonCpf('');
        setPersonName('');
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


            let response;


            switch (searchMethod) {
                case 0: // Busca por imagem
                    if (!file) {
                        setError('Por favor, selecione uma imagem para busca.');
                        setLoading(false);
                        return;
                    }
                    response = await searchByImage(file, 5);


                    // Para busca por imagem, mantemos o comportamento atual
                    if (response.success) {
                        // Agrupar resultados por person_id, mantendo apenas o resultado com maior similaridade
                        const groupedResults: { [key: string]: SearchResult } = {};


                        response.results.forEach(result => {
                            if (!groupedResults[result.person_id] ||
                                result.similarity > groupedResults[result.person_id].similarity) {
                                groupedResults[result.person_id] = result;
                            }
                        });


                        // Converter de volta para array e ordenar por similaridade
                        const uniqueResults = Object.values(groupedResults).sort(
                            (a, b) => b.similarity - a.similarity
                        );


                        setResults(uniqueResults);
                    }
                    break;


                case 1: // Busca por RG
                    if (!personId) {
                        setError('Por favor, digite um RG válido.');
                        setLoading(false);
                        return;
                    }
                    response = await searchByPersonId(personId, 1); // Limitamos a 1 resultado


                    // Para busca por RG, queremos apenas o resultado exato
                    if (response.success && response.results.length > 0) {
                        // Filtramos apenas o resultado com RG exato
                        const exactMatches = response.results.filter(
                            result => result.person_id === personId
                        );


                        // Se não houver correspondências exatas, mostramos uma mensagem
                        if (exactMatches.length === 0) {
                            setError('RG não encontrado no sistema.');
                        } else {
                            // Definimos similaridade como 1.0 (100%) para resultados exatos
                            exactMatches.forEach(match => match.similarity = 1.0);
                            setResults(exactMatches);
                        }
                    }
                    break;


                case 2: // Busca por CPF
                    if (!personCpf) {
                        setError('Por favor, digite um CPF válido.');
                        setLoading(false);
                        return;
                    }
                    response = await searchByPersonCpf(personCpf, 1); // Limitamos a 1 resultado


                    // Para busca por CPF, queremos apenas o resultado exato
                    if (response.success && response.results.length > 0) {
                        // Filtramos apenas o resultado com CPF exato (considerando formatação)
                        const exactMatches = response.results.filter(
                            result => result.cpf === personCpf
                        );


                        // Se não houver correspondências exatas, mostramos uma mensagem
                        if (exactMatches.length === 0) {
                            setError('CPF não encontrado no sistema.');
                        } else {
                            // Definimos similaridade como 1.0 (100%) para resultados exatos
                            exactMatches.forEach(match => match.similarity = 1.0);
                            setResults(exactMatches);
                        }
                    }
                    break;


                case 3: // Busca por Nome
                    if (!personName) {
                        setError('Por favor, digite um nome para busca.');
                        setLoading(false);
                        return;
                    }
                    response = await searchByPersonName(personName, 5);


                    // Para busca por nome, filtramos resultados para incluir apenas aqueles
                    // que contêm o termo de pesquisa no nome
                    if (response.success && response.results.length > 0) {
                        const nameMatches = response.results.filter(
                            result => result.person_name.toLowerCase().includes(personName.toLowerCase())
                        );


                        // Se não houver correspondências, mostramos uma mensagem
                        if (nameMatches.length === 0) {
                            setError('Nome não encontrado no sistema.');
                        } else {
                            // Definimos similaridade como 1.0 (100%) para resultados por nome
                            nameMatches.forEach(match => match.similarity = 1.0);


                            // Agrupar resultados por person_id, mantendo apenas um resultado por pessoa
                            const groupedResults: { [key: string]: SearchResult } = {};


                            nameMatches.forEach(result => {
                                if (!groupedResults[result.person_id]) {
                                    groupedResults[result.person_id] = result;
                                }
                            });


                            // Converter de volta para array
                            const uniqueResults = Object.values(groupedResults);


                            setResults(uniqueResults);
                        }
                    }
                    break;


                default:
                    setError('Método de busca inválido.');
                    setLoading(false);
                    return;
            }


            console.log("API Response:", response);
            console.log("Results:", response.results);


            if (response.success) {
                if (response.results.length > 0) {
                    setSuccess(true);
                } else {
                    setError('Nenhum resultado encontrado para sua busca.');
                }
            } else {
                setError(response.message || 'Erro desconhecido na busca.');
            }
        } catch (err: any) {
            console.error('Erro na busca:', err);
            // Se for erro 404, apresenta mensagem personalizada
            if (err.response?.status === 404) {
                switch (searchMethod) {
                    case 1:
                        setError('RG não encontrado no sistema.');
                        break;
                    case 2:
                        setError('CPF não encontrado no sistema.');
                        break;
                    case 3:
                        setError('Nome não encontrado no sistema.');
                        break;
                    default:
                        setError('Registro não encontrado no sistema.');
                }
            } else {
                setError(err.response?.data?.detail || 'Ocorreu um erro ao processar sua busca. Por favor, tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };


    // Nova função para carregar todas as imagens de uma pessoa
    const loadPersonImages = async (personId: string) => {
        try {
            setLoadingImages(true);
            const images = await getPersonImages(personId);
            setPersonImages(images);
            setCurrentImageIndex(0);
        } catch (error) {
            console.error('Erro ao carregar imagens da pessoa:', error);
            setPersonImages([]);
        } finally {
            setLoadingImages(false);
        }
    };


    const handleOpenDetails = (result: SearchResult) => {
        setSelectedResult(result);
        setDetailsOpen(true);
        // Carregar todas as imagens da pessoa quando o modal é aberto
        loadPersonImages(result.person_id);
    };


    const handleNextImage = () => {
        if (currentImageIndex < personImages.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
        }
    };


    const handlePrevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
        }
    };


    // Função para verificar se deve mostrar a similaridade com base no método de busca
    const shouldShowSimilarity = (method: number) => {
        // Mostrar similaridade apenas para busca por imagem (método 0)
        return method === 0;
    };


    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Busca de Faces
            </Typography>


            <Paper elevation={3} sx={{
                p: { xs: 2, md: 3 },
                mb: 3
            }}>
                <Tabs
                    value={searchMethod}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons={isMobile}
                    allowScrollButtonsMobile
                    centered={!isMobile}
                    sx={{
                        mb: 3,
                        '& .MuiTabs-scrollButtons': {
                            color: 'primary.main'
                        }
                    }}
                >
                    <Tab icon={<UploadIcon />} label="Buscar por Imagem" />
                    <Tab icon={<PersonIcon />} label="Buscar por RG" />
                    <Tab icon={<PersonIcon />} label="Buscar por CPF" />
                    <Tab icon={<PersonIcon />} label="Buscar por Nome" />
                </Tabs>


                {searchMethod === 0 ? (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Faça upload de uma imagem para buscar faces similares no sistema.
                        </Typography>


                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
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
                                    <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                        {file.name}
                                    </Typography>
                                )}
                            </Grid>


                            <Grid item xs={12} sm={6}>
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
                        </Grid>


                        {/* Preview da imagem */}
                        {previewUrl && (
                            <Box sx={{
                                mt: 2,
                                display: 'flex',
                                justifyContent: 'center'
                            }}>
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
                            </Box>
                        )}
                    </Box>
                ) : searchMethod === 1 ? (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Digite o RG da pessoa para buscar faces similares no sistema.
                        </Typography>


                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="RG da Pessoa"
                                    variant="outlined"
                                    fullWidth
                                    value={personId}
                                    onChange={handleRgChange}
                                    placeholder="Ex: 12345"
                                    helperText="Digite o RG da pessoa (máximo 11 caracteres)"
                                    inputProps={{ maxLength: 11 }}
                                />
                            </Grid>


                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SearchIcon />}
                                    onClick={handleSearch}
                                    disabled={!personId || loading}
                                    fullWidth
                                    sx={{ height: 56 }}
                                >
                                    {loading ? 'Buscando...' : 'Buscar'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                ) : searchMethod === 2 ? (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Digite o CPF da pessoa para buscar faces similares no sistema.
                        </Typography>


                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="CPF da Pessoa"
                                    variant="outlined"
                                    fullWidth
                                    value={personCpf}
                                    onChange={handleCpfChange}
                                    placeholder="Ex: 000.000.000-00"
                                    helperText="Digite o CPF da pessoa no formato 000.000.000-00"
                                />
                            </Grid>


                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SearchIcon />}
                                    onClick={handleSearch}
                                    disabled={!personCpf || loading}
                                    fullWidth
                                    sx={{ height: 56 }}
                                >
                                    {loading ? 'Buscando...' : 'Buscar'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Digite o nome da pessoa para buscar faces similares no sistema.
                        </Typography>


                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Nome da Pessoa"
                                    variant="outlined"
                                    fullWidth
                                    value={personName}
                                    onChange={handleNameChange}
                                    placeholder="Ex: Joao da Silva"
                                    helperText="Digite o nome sem acentos"
                                />
                            </Grid>


                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SearchIcon />}
                                    onClick={handleSearch}
                                    disabled={!personName || loading}
                                    fullWidth
                                    sx={{ height: 56 }}
                                >
                                    {loading ? 'Buscando...' : 'Buscar'}
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


                {success && results.length > 0 && (
                    <Alert severity="success" sx={{ mt: 3 }}>
                        Busca realizada com sucesso.
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


                    <Grid container spacing={2}>
                        {results.map((result, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card elevation={3}>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={`${process.env.REACT_APP_API_URL || '/api'}/persons/${result.person_id}/image`}
                                        alt={result.person_name}
                                        onError={(e: any) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Imagem+não+disponível';
                                        }}
                                    />
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="h6" component="div">
                                                {result.person_name}
                                            </Typography>
                                            {shouldShowSimilarity(searchMethod) && (
                                                <Chip
                                                    label={`${(result.similarity * 100).toFixed(1)}%`}
                                                    color={result.similarity >= 0.9 ? "success" : result.similarity >= 0.8 ? "primary" : "warning"}
                                                    size="small"
                                                />
                                            )}
                                        </Box>


                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            RG: {result.person_id}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            CPF: {result.cpf}
                                        </Typography>


                                        <Typography variant="body2" color="text.secondary">
                                            Origem: {result.origin}
                                        </Typography>


                                        {shouldShowSimilarity(searchMethod) && (
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
                                        )}
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenDetails(result)}
                                        >
                                            Ver Detalhes
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}


            {/* Modal de detalhes com suporte a múltiplas imagens */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Detalhes da Pessoa
                </DialogTitle>
                <DialogContent dividers>
                    {selectedResult && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                {loadingImages ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : personImages.length > 0 ? (
                                    <Box sx={{ position: 'relative' }}>
                                        <Box
                                            component="img"
                                            src={`${process.env.REACT_APP_API_URL || '/api'}/persons/${selectedResult.person_id}/image?image_id=${personImages[currentImageIndex].id}`}
                                            alt={selectedResult.person_name}
                                            sx={{
                                                width: '100%',
                                                maxHeight: 400,
                                                objectFit: 'contain',
                                                border: '1px solid #ddd',
                                                borderRadius: 1,
                                            }}
                                            onError={(e: any) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/300x400?text=Imagem+não+disponível';
                                            }}
                                        />


                                        {personImages.length > 1 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                <IconButton
                                                    onClick={handlePrevImage}
                                                    disabled={currentImageIndex === 0}
                                                >
                                                    <ArrowBackIcon />
                                                </IconButton>


                                                <Typography>
                                                    {currentImageIndex + 1} / {personImages.length}
                                                </Typography>


                                                <IconButton
                                                    onClick={handleNextImage}
                                                    disabled={currentImageIndex === personImages.length - 1}
                                                >
                                                    <ArrowForwardIcon />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    <Box
                                        component="img"
                                        src={`${process.env.REACT_APP_API_URL || '/api'}/persons/${selectedResult.person_id}/image`}
                                        alt={selectedResult.person_name}
                                        sx={{
                                            width: '100%',
                                            maxHeight: 400,
                                            objectFit: 'contain',
                                            border: '1px solid #ddd',
                                            borderRadius: 1,
                                        }}
                                        onError={(e: any) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/300x400?text=Imagem+não+disponível';
                                        }}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="h5" gutterBottom>
                                    {selectedResult.person_name}
                                </Typography>


                                <Divider sx={{ my: 2 }} />


                                <Typography variant="body1">
                                    <strong>RG:</strong> {selectedResult.person_id}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>CPF:</strong> {selectedResult.cpf}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Origem:</strong> {selectedResult.origin}
                                </Typography>


                                {shouldShowSimilarity(searchMethod) && (
                                    <Typography variant="body1">
                                        <strong>Similaridade:</strong> {(selectedResult.similarity * 100).toFixed(1)}%
                                    </Typography>
                                )}


                                {personImages.length > 0 && (
                                    <Typography variant="body1" sx={{ mt: 1 }}>
                                        <strong>Total de imagens:</strong> {personImages.length}
                                    </Typography>
                                )}


                                {shouldShowSimilarity(searchMethod) && (
                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ mr: 1 }}>
                                            Similaridade:
                                        </Typography>
                                        <Box sx={{ width: '100%', mr: 1 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={selectedResult.similarity * 100}
                                                color={
                                                    selectedResult.similarity >= 0.9 ? "success" :
                                                        selectedResult.similarity >= 0.8 ? "primary" :
                                                            selectedResult.similarity >= 0.7 ? "warning" : "error"
                                                }
                                                sx={{ height: 8, borderRadius: 5 }}
                                            />
                                        </Box>
                                    </Box>
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


export default Search;
