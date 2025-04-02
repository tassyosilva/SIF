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
    useTheme,
    Container,
    Avatar,
    Stack
} from '@mui/material';
import {
    Search as SearchIcon,
    Upload as UploadIcon,
    Person as PersonIcon,
    ArrowBackIos as ArrowBackIcon,
    ArrowForwardIos as ArrowForwardIcon,
    Badge as BadgeIcon,
    CreditCard as CreditCardIcon,
    Face as FaceIcon,
    PhotoLibrary as PhotoLibraryIcon
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

    // Função para obter a cor com base na similaridade
    const getSimilarityColor = (similarity: number) => {
        if (similarity >= 0.9) return theme.palette.success.main;
        if (similarity >= 0.8) return theme.palette.primary.main;
        if (similarity >= 0.7) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    // Função para obter o ícone do método de busca
    const getSearchMethodIcon = (index: number) => {
        switch (index) {
            case 0:
                return <FaceIcon />;
            case 1:
                return <BadgeIcon />;
            case 2:
                return <CreditCardIcon />;
            case 3:
                return <PersonIcon />;
            default:
                return <SearchIcon />;
        }
    };


    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>


            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, md: 4 },
                    mb: 4,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <Tabs
                    value={searchMethod}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant={isMobile ? "scrollable" : "fullWidth"}
                    scrollButtons={isMobile ? "auto" : false}
                    allowScrollButtonsMobile
                    sx={{
                        mb: 4,
                        '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: '3px 3px 0 0'
                        },
                        '& .MuiTab-root': {
                            fontWeight: 'medium',
                            py: 2
                        }
                    }}
                >
                    <Tab
                        icon={<UploadIcon />}
                        label="Buscar por Imagem"
                        iconPosition="start"
                        sx={{
                            borderBottom: '1px solid #e0e0e0',
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                                fontWeight: 'bold',
                                color: theme.palette.primary.main
                            }
                        }}
                    />
                    <Tab
                        icon={<BadgeIcon />}
                        label="Buscar por RG"
                        iconPosition="start"
                        sx={{
                            borderBottom: '1px solid #e0e0e0',
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                                fontWeight: 'bold',
                                color: theme.palette.primary.main
                            }
                        }}
                    />
                    <Tab
                        icon={<CreditCardIcon />}
                        label="Buscar por CPF"
                        iconPosition="start"
                        sx={{
                            borderBottom: '1px solid #e0e0e0',
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                                fontWeight: 'bold',
                                color: theme.palette.primary.main
                            }
                        }}
                    />
                    <Tab
                        icon={<PersonIcon />}
                        label="Buscar por Nome"
                        iconPosition="start"
                        sx={{
                            borderBottom: '1px solid #e0e0e0',
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                                fontWeight: 'bold',
                                color: theme.palette.primary.main
                            }
                        }}
                    />
                </Tabs>


                <Box sx={{ px: { xs: 0, sm: 2 }, py: 2, mb: 2 }}>
                    {searchMethod === 0 ? (
                        <Box>
                            <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
                                Faça upload de uma imagem para buscar faces similares no sistema.
                            </Typography>


                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} sm={6}>
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
                                        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: theme.palette.text.secondary }}>
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
                                        sx={{
                                            height: 56,
                                            borderRadius: 2,
                                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                                            '&:hover': {
                                                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)'
                                            }
                                        }}
                                    >
                                        {loading ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                                                Buscando...
                                            </Box>
                                        ) : 'Buscar Faces Similares'}
                                    </Button>
                                </Grid>
                            </Grid>


                            {/* Preview da imagem */}
                            {previewUrl && (
                                <Box sx={{
                                    mt: 3,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    p: 2,
                                    backgroundColor: 'rgba(0,0,0,0.02)',
                                    borderRadius: 2
                                }}>
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
                                </Box>
                            )}
                        </Box>
                    ) : searchMethod === 1 ? (
                        <Box>
                            <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
                                Digite o RG da pessoa para buscar registros no sistema.
                            </Typography>


                            <Grid container spacing={3} alignItems="center">
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
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&.Mui-focused fieldset': {
                                                    borderWidth: 2
                                                }
                                            }
                                        }}
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
                                        sx={{
                                            height: 56,
                                            borderRadius: 2,
                                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                                            '&:hover': {
                                                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)'
                                            }
                                        }}
                                    >
                                        {loading ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                                                Buscando...
                                            </Box>
                                        ) : 'Buscar'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : searchMethod === 2 ? (
                        <Box>
                            <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
                                Digite o CPF da pessoa para buscar registros no sistema.
                            </Typography>


                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="CPF da Pessoa"
                                        variant="outlined"
                                        fullWidth
                                        value={personCpf}
                                        onChange={handleCpfChange}
                                        placeholder="Ex: 000.000.000-00"
                                        helperText="Digite o CPF da pessoa no formato 000.000.000-00"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&.Mui-focused fieldset': {
                                                    borderWidth: 2
                                                }
                                            }
                                        }}
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
                                        sx={{
                                            height: 56,
                                            borderRadius: 2,
                                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                                            '&:hover': {
                                                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)'
                                            }
                                        }}
                                    >
                                        {loading ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                                                Buscando...
                                            </Box>
                                        ) : 'Buscar'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
                                Digite o nome da pessoa para buscar registros no sistema.
                            </Typography>


                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Nome da Pessoa"
                                        variant="outlined"
                                        fullWidth
                                        value={personName}
                                        onChange={handleNameChange}
                                        placeholder="Ex: Joao da Silva"
                                        helperText="Digite o nome sem acentos"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&.Mui-focused fieldset': {
                                                    borderWidth: 2
                                                }
                                            }
                                        }}
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
                                        sx={{
                                            height: 56,
                                            borderRadius: 2,
                                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                                            '&:hover': {
                                                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)'
                                            }
                                        }}
                                    >
                                        {loading ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                                                Buscando...
                                            </Box>
                                        ) : 'Buscar'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>


                {loading && (
                    <Box sx={{ width: '100%', mt: 3 }}>
                        <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                )}


                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mt: 3,
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(244, 67, 54, 0.2)'
                        }}
                        variant="filled"
                    >
                        {error}
                    </Alert>
                )}


                {success && results.length > 0 && (
                    <Alert
                        severity="success"
                        sx={{
                            mt: 3,
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)'
                        }}
                        variant="filled"
                    >
                        Busca realizada com sucesso.
                    </Alert>
                )}


                {success && results.length === 0 && (
                    <Alert
                        severity="info"
                        sx={{
                            mt: 3,
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(33, 150, 243, 0.2)'
                        }}
                        variant="filled"
                    >
                        Nenhum resultado encontrado para sua busca.
                    </Alert>
                )}
            </Paper>


            {results.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Paper
                        sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            backgroundColor: 'rgba(33, 150, 243, 0.05)'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                                {getSearchMethodIcon(searchMethod)}
                            </Avatar>
                            <Typography variant="h5" fontWeight="medium">
                                Resultados da Busca
                            </Typography>
                            <Chip
                                label={`${results.length} encontrado${results.length !== 1 ? 's' : ''}`}
                                size="small"
                                color="primary"
                                sx={{ ml: 2 }}
                            />
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                            {searchMethod === 0
                                ? 'Os resultados estão ordenados por similaridade.'
                                : 'Mostrando os registros que correspondem à sua busca.'}
                        </Typography>
                    </Paper>

                    <Grid container spacing={3}>
                        {results.map((result, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card elevation={3}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={`${process.env.REACT_APP_API_URL || '/api'}/persons/${result.person_id}/image`}
                                        alt={result.person_name}
                                        onError={(e: any) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Imagem+não+disponível';
                                        }}
                                        sx={{
                                            objectFit: 'cover',
                                            objectPosition: 'center top'
                                        }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
                                                {result.person_name}
                                            </Typography>
                                            {shouldShowSimilarity(searchMethod) && (
                                                <Chip
                                                    label={`${(result.similarity * 100).toFixed(1)}%`}
                                                    color={
                                                        result.similarity >= 0.9 ? "success" :
                                                            result.similarity >= 0.8 ? "primary" :
                                                                result.similarity >= 0.7 ? "warning" : "error"
                                                    }
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        ml: 1
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <Stack spacing={1} sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <BadgeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>RG:</strong> {result.person_id}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CreditCardIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>CPF:</strong> {result.cpf}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <FaceIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Origem:</strong> {result.origin}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        {shouldShowSimilarity(searchMethod) && (
                                            <Box sx={{ mt: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Similaridade:
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="medium" sx={{
                                                        color: getSimilarityColor(result.similarity)
                                                    }}>
                                                        {(result.similarity * 100).toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ mt: 1 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={result.similarity * 100}
                                                        color={
                                                            result.similarity >= 0.9 ? "success" :
                                                                result.similarity >= 0.8 ? "primary" :
                                                                    result.similarity >= 0.7 ? "warning" : "error"
                                                        }
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            backgroundColor: 'rgba(0,0,0,0.05)'
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        )}
                                    </CardContent>
                                    <Divider />
                                    <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                                        <Button
                                            size="medium"
                                            color="primary"
                                            variant="contained"
                                            onClick={() => handleOpenDetails(result)}
                                            startIcon={<PhotoLibraryIcon />}
                                            sx={{
                                                borderRadius: 8,
                                                px: 2
                                            }}
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
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    py: 2
                }}>
                    {selectedResult && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">
                                Detalhes de {selectedResult.person_name}
                            </Typography>
                        </Box>
                    )}
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {selectedResult && (
                        <Grid container>
                            <Grid item xs={12} md={6} sx={{
                                bgcolor: 'rgba(0,0,0,0.02)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 3
                            }}>
                                {loadingImages ? (
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '300px'
                                    }}>
                                        <CircularProgress size={40} sx={{ mb: 2 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Carregando imagens...
                                        </Typography>
                                    </Box>
                                ) : personImages.length > 0 ? (
                                    <Box sx={{ position: 'relative', width: '100%' }}>
                                        <Paper
                                            elevation={4}
                                            sx={{
                                                overflow: 'hidden',
                                                borderRadius: 2,
                                                position: 'relative'
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={`${process.env.REACT_APP_API_URL || '/api'}/persons/${selectedResult.person_id}/image?image_id=${personImages[currentImageIndex].id}`}
                                                alt={selectedResult.person_name}
                                                sx={{
                                                    width: '100%',
                                                    height: 400,
                                                    objectFit: 'contain',
                                                    backgroundColor: '#f5f5f5'
                                                }}
                                                onError={(e: any) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/300x400?text=Imagem+não+disponível';
                                                }}
                                            />
                                        </Paper>

                                        {personImages.length > 1 && (
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mt: 2,
                                                px: 2
                                            }}>
                                                <IconButton
                                                    onClick={handlePrevImage}
                                                    disabled={currentImageIndex === 0}
                                                    sx={{
                                                        bgcolor: 'white',
                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                                        '&:hover': {
                                                            bgcolor: 'white',
                                                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                                                        },
                                                        '&.Mui-disabled': {
                                                            bgcolor: 'rgba(255,255,255,0.7)'
                                                        }
                                                    }}
                                                >
                                                    <ArrowBackIcon />
                                                </IconButton>

                                                <Chip
                                                    label={`${currentImageIndex + 1} de ${personImages.length}`}
                                                    color="primary"
                                                    variant="outlined"
                                                />

                                                <IconButton
                                                    onClick={handleNextImage}
                                                    disabled={currentImageIndex === personImages.length - 1}
                                                    sx={{
                                                        bgcolor: 'white',
                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                                        '&:hover': {
                                                            bgcolor: 'white',
                                                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                                                        },
                                                        '&.Mui-disabled': {
                                                            bgcolor: 'rgba(255,255,255,0.7)'
                                                        }
                                                    }}
                                                >
                                                    <ArrowForwardIcon />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    <Paper
                                        elevation={4}
                                        sx={{
                                            overflow: 'hidden',
                                            borderRadius: 2
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={`${process.env.REACT_APP_API_URL || '/api'}/persons/${selectedResult.person_id}/image`}
                                            alt={selectedResult.person_name}
                                            sx={{
                                                width: '100%',
                                                height: 400,
                                                objectFit: 'contain',
                                                backgroundColor: '#f5f5f5'
                                            }}
                                            onError={(e: any) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/300x400?text=Imagem+não+disponível';
                                            }}
                                        />
                                    </Paper>
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ p: 4 }}>
                                    <Typography variant="h5" gutterBottom color="primary.main" sx={{ fontWeight: 'bold' }}>
                                        {selectedResult.person_name}
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    <Stack spacing={2} sx={{ mt: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: theme.palette.primary.light, mr: 2 }}>
                                                <BadgeIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    RG
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {selectedResult.person_id}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: theme.palette.primary.light, mr: 2 }}>
                                                <CreditCardIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    CPF
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {selectedResult.cpf}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: theme.palette.primary.light, mr: 2 }}>
                                                <FaceIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Origem
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {selectedResult.origin}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {personImages.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: theme.palette.primary.light, mr: 2 }}>
                                                    <PhotoLibraryIcon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Total de imagens
                                                    </Typography>
                                                    <Typography variant="body1" fontWeight="medium">
                                                        {personImages.length}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </Stack>

                                    {shouldShowSimilarity(searchMethod) && (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                mt: 4,
                                                p: 2,
                                                bgcolor: 'rgba(0,0,0,0.02)',
                                                borderRadius: 2,
                                                border: '1px solid rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <Typography variant="subtitle2" gutterBottom>
                                                Nível de Similaridade
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                <Box sx={{ width: '100%', mr: 2 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={selectedResult.similarity * 100}
                                                        color={
                                                            selectedResult.similarity >= 0.9 ? "success" :
                                                                selectedResult.similarity >= 0.8 ? "primary" :
                                                                    selectedResult.similarity >= 0.7 ? "warning" : "error"
                                                        }
                                                        sx={{ height: 10, borderRadius: 5 }}
                                                    />
                                                </Box>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color: getSimilarityColor(selectedResult.similarity),
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {(selectedResult.similarity * 100).toFixed(1)}%
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <Button
                        onClick={() => setDetailsOpen(false)}
                        variant="outlined"
                        color="primary"
                        sx={{ borderRadius: 8, px: 3 }}
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Search;