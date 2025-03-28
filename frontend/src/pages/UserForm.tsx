import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    FormControl,
    FormControlLabel,
    FormLabel,
    RadioGroup,
    Radio,
    MenuItem,
    CircularProgress,
    Alert,
    Divider,
    Switch,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
    getUser,
    createUser,
    updateUser,
    getEstados,
    getOrgaos,
    formatCPF,
    unformatCPF
} from '../services/userService';

// Interface para representar um estado (sigla)
interface Estado {
    sigla: string;
}

// Interface para representar um órgão
interface Orgao {
    id: string;
    nome: string;
}

const UserForm = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNewUser = id === 'new';

    // Estados para formulário
    const [login, setLogin] = useState('');
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [matricula, setMatricula] = useState('');
    const [telefone, setTelefone] = useState('');
    const [orgao, setOrgao] = useState('');
    const [estadoDoOrgao, setEstadoDoOrgao] = useState('');
    const [email, setEmail] = useState('');
    const [tipoUsuario, setTipoUsuario] = useState('consultor');
    const [senha, setSenha] = useState('');
    const [confirmSenha, setConfirmSenha] = useState('');
    const [ativo, setAtivo] = useState(true);

    // Estado para listas de opções
    const [estados, setEstados] = useState<Estado[]>([]);
    const [orgaos, setOrgaos] = useState<Orgao[]>([]);

    // Estados para UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Estados para validação
    const [errors, setErrors] = useState<{
        login?: string;
        nome?: string;
        cpf?: string;
        matricula?: string;
        email?: string;
        senha?: string;
        confirmSenha?: string;
    }>({});

    // Carregar dados iniciais
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Carregar estados e órgãos
                const [estadosData, orgaosData] = await Promise.all([
                    getEstados(),
                    getOrgaos()
                ]);

                setEstados(estadosData);
                setOrgaos(orgaosData);

                // Se for edição, carregar dados do usuário
                if (!isNewUser && id) {
                    const userData = await getUser(parseInt(id));
                    setLogin(userData.login);
                    setNome(userData.nome_completo);
                    setCpf(userData.cpf || '');
                    setMatricula(userData.matricula || '');
                    setTelefone(userData.telefone || '');
                    setOrgao(userData.orgao || '');
                    setEstadoDoOrgao(userData.estado_do_orgao || '');
                    setEmail(userData.email);
                    setTipoUsuario(userData.tipo_usuario);
                    setAtivo(userData.ativo);
                }
            } catch (err: any) {
                console.error('Erro ao carregar dados:', err);
                setError(err.response?.data?.detail || 'Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [id, isNewUser]);

    // Função para formatar o CPF durante a digitação
    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCpf(formatCPF(value));
    };

    // Função para formatar o telefone durante a digitação
    const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.length <= 2) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else if (value.length <= 10) {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
            } else {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
            }
        }
        setTelefone(value);
    };

    // Validação do formulário
    const validateForm = () => {
        const newErrors: {
            login?: string;
            nome?: string;
            cpf?: string;
            matricula?: string;
            email?: string;
            senha?: string;
            confirmSenha?: string;
        } = {};

        // Validações apenas para novos usuários
        if (isNewUser) {
            if (!login) newErrors.login = 'Login é obrigatório';
            if (!senha) newErrors.senha = 'Senha é obrigatória';
            else if (senha.length < 6) newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';

            if (!confirmSenha) newErrors.confirmSenha = 'Confirmação de senha é obrigatória';
            else if (senha !== confirmSenha) newErrors.confirmSenha = 'Senhas não conferem';
        }

        // Validações comuns
        if (!nome) newErrors.nome = 'Nome é obrigatório';

        if (!cpf) newErrors.cpf = 'CPF é obrigatório';
        else {
            const cpfLimpo = unformatCPF(cpf);
            if (cpfLimpo.length !== 11) newErrors.cpf = 'CPF deve ter 11 dígitos';
        }

        if (!matricula) newErrors.matricula = 'Matrícula é obrigatória';

        if (!email) newErrors.email = 'E-mail é obrigatório';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'E-mail inválido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Função para enviar o formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const formData = {
                login,
                nome_completo: nome,
                cpf: unformatCPF(cpf),
                matricula,
                telefone: telefone || undefined,
                orgao: orgao || undefined,
                estado_do_orgao: estadoDoOrgao || undefined,
                email,
                tipo_usuario: tipoUsuario,
                ativo
            };

            if (isNewUser) {
                await createUser({
                    ...formData,
                    senha
                });
                setSuccess('Usuário criado com sucesso!');
                // Limpar formulário ou redirecionar
                setTimeout(() => {
                    navigate('/users');
                }, 2000);
            } else if (id) {
                await updateUser(parseInt(id), formData);
                setSuccess('Usuário atualizado com sucesso!');
            }
        } catch (err: any) {
            console.error('Erro ao salvar usuário:', err);
            setError(err.response?.data?.detail || 'Erro ao salvar usuário');
        } finally {
            setLoading(false);
        }
    };

    // Função para voltar à listagem
    const handleBack = () => {
        navigate('/users');
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                {isNewUser ? 'Novo Usuário' : 'Editar Usuário'}
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                {loading && !error && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {success}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Informações básicas */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Informações Básicas
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Login"
                                variant="outlined"
                                fullWidth
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                disabled={!isNewUser}
                                required
                                error={!!errors.login}
                                helperText={errors.login}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Nome Completo"
                                variant="outlined"
                                fullWidth
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                required
                                error={!!errors.nome}
                                helperText={errors.nome}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="CPF"
                                variant="outlined"
                                fullWidth
                                value={cpf}
                                onChange={handleCpfChange}
                                required
                                error={!!errors.cpf}
                                helperText={errors.cpf}
                                inputProps={{ maxLength: 14 }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Matrícula"
                                variant="outlined"
                                fullWidth
                                value={matricula}
                                onChange={(e) => setMatricula(e.target.value)}
                                required
                                error={!!errors.matricula}
                                helperText={errors.matricula}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="E-mail"
                                variant="outlined"
                                type="email"
                                fullWidth
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                error={!!errors.email}
                                helperText={errors.email}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Telefone"
                                variant="outlined"
                                fullWidth
                                value={telefone}
                                onChange={handleTelefoneChange}
                                inputProps={{ maxLength: 15 }}
                            />
                        </Grid>

                        {/* Informações de órgão */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Informações de Órgão
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined">
                                <TextField
                                    select
                                    label="Órgão"
                                    value={orgao}
                                    onChange={(e) => setOrgao(e.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="">
                                        <em>Selecione um órgão</em>
                                    </MenuItem>
                                    {orgaos.map((org) => (
                                        <MenuItem key={org.id} value={org.id}>
                                            {org.nome}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined">
                                <TextField
                                    select
                                    label="Estado do Órgão"
                                    value={estadoDoOrgao}
                                    onChange={(e) => setEstadoDoOrgao(e.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="">
                                        <em>Selecione um estado</em>
                                    </MenuItem>
                                    {estados.map((estado) => (
                                        <MenuItem key={estado.sigla} value={estado.sigla}>
                                            {estado.sigla}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </FormControl>
                        </Grid>

                        {/* Perfil de Acesso */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Perfil de Acesso
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Tipo de Usuário</FormLabel>
                                <RadioGroup
                                    value={tipoUsuario}
                                    onChange={(e) => setTipoUsuario(e.target.value)}
                                >
                                    <FormControlLabel
                                        value="administrador"
                                        control={<Radio />}
                                        label="Administrador"
                                    />
                                    <FormControlLabel
                                        value="consultor"
                                        control={<Radio />}
                                        label="Consultor"
                                    />
                                    <FormControlLabel
                                        value="cadastrador"
                                        control={<Radio />}
                                        label="Cadastrador"
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            {!isNewUser && (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={ativo}
                                            onChange={(e) => setAtivo(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="Usuário Ativo"
                                />
                            )}
                        </Grid>

                        {/* Senha - apenas para novos usuários */}
                        {isNewUser && (
                            <>
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Senha de Acesso
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Senha"
                                        variant="outlined"
                                        type={showPassword ? 'text' : 'password'}
                                        fullWidth
                                        value={senha}
                                        onChange={(e) => setSenha(e.target.value)}
                                        required
                                        error={!!errors.senha}
                                        helperText={errors.senha}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Confirmar Senha"
                                        variant="outlined"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        fullWidth
                                        value={confirmSenha}
                                        onChange={(e) => setConfirmSenha(e.target.value)}
                                        required
                                        error={!!errors.confirmSenha}
                                        helperText={errors.confirmSenha}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        edge="end"
                                                    >
                                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBack}
                        >
                            Voltar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : isNewUser ? 'Criar Usuário' : 'Salvar Alterações'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default UserForm;