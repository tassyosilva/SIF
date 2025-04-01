import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, TextField, Typography,
    Container, CssBaseline, Paper, Alert,
    alpha, InputAdornment, IconButton, Fade,
    useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authService } from '../services/authService';

// Importe o logo
import logo from '../assets/logo.png';

// Componente de fundo com gradiente cinza claro
const BackgroundContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', // Gradiente cinza claro
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${alpha('#D4AF37', 0)}, #D4AF37, ${alpha('#D4AF37', 0)})`,
        zIndex: 2
    }
}));

// Card de login elegante com as cores padrão
const StyledPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: '#FFFFFF', // Fundo branco
    borderRadius: '16px',
    border: `1px solid ${alpha('#D4AF37', 0.1)}`,
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: `0 10px 30px ${alpha('#000', 0.1)},
               0 1px 8px ${alpha('#D4AF37', 0.2)}`,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '400px',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${alpha('#D4AF37', 0)}, #D4AF37, ${alpha('#D4AF37', 0)})`
    }
}));

// Logo container com animação sutil
const LogoContainer = styled(Box)({
    marginBottom: '20px',
    textAlign: 'center',
    '& img': {
        height: '120px',
        filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.2))'
    }
});

// Estilização para campos de texto
const StyledTextField = styled(TextField)(({ theme }) => ({
    marginBottom: '16px',
    '& .MuiInputBase-root': {
        color: '#000000', // Texto preto
        backgroundColor: alpha('#f5f5f5', 0.7),
        borderRadius: '8px'
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: alpha('#000000', 0.2),
            transition: 'all 0.3s ease'
        },
        '&:hover fieldset': {
            borderColor: alpha('#000000', 0.5)
        },
        '&.Mui-focused fieldset': {
            borderColor: '#D4AF37',
            borderWidth: '2px'
        }
    },
    '& .MuiInputLabel-root': {
        color: alpha('#000000', 0.8)
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#D4AF37'
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
        color: alpha('#000000', 0.7)
    }
}));

// Botão de login estilizado
const LoginButton = styled(Button)(({ theme }) => ({
    marginTop: '24px',
    marginBottom: '16px',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    background: '#000000', // Preto como cor primária
    color: '#FFFFFF', // Texto branco
    boxShadow: `0 4px 15px ${alpha('#000000', 0.2)}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: `0 6px 20px ${alpha('#000000', 0.3)}`,
        transform: 'translateY(-2px)',
        background: alpha('#000000', 0.9)
    },
    '&:active': {
        transform: 'translateY(1px)',
        boxShadow: `0 2px 10px ${alpha('#000000', 0.2)}`
    }
}));

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({ username, password });
            // Redirecionar baseado no tipo de usuário
            switch (response.user.tipo_usuario) {
                case 'administrador':
                    navigate('/');
                    break;
                case 'consultor':
                    navigate('/search');
                    break;
                case 'cadastrador':
                    navigate('/upload');
                    break;
                default:
                    navigate('/');
            }
        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                'Erro ao fazer login. Verifique suas credenciais.'
            );
            setLoading(false);
        }
    };

    return (
        <BackgroundContainer>
            <CssBaseline />
            <Fade in={true} timeout={800}>
                <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 10 }}>
                    <StyledPaper elevation={6}>
                        <LogoContainer>
                            <img src={logo} alt="Logo Sistema de Identificação Facial" />
                        </LogoContainer>

                        <Box sx={{ position: 'relative', mb: 3, textAlign: 'center' }}>
                            <Typography
                                component="h1"
                                variant="h5"
                                sx={{
                                    color: '#000000', // Texto preto
                                    fontWeight: 'bold',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                Sistema de Identificação Facial
                            </Typography>
                            <Box sx={{
                                width: '40px',
                                height: '3px',
                                background: '#D4AF37', // Linha dourada
                                margin: '12px auto 0',
                                borderRadius: '2px'
                            }} />
                        </Box>

                        {error && (
                            <Alert
                                severity="error"
                                variant="filled"
                                sx={{
                                    width: '100%',
                                    marginBottom: 3,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{ width: '100%' }}
                        >
                            <StyledTextField
                                margin="normal"
                                required
                                fullWidth
                                label="Usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <StyledTextField
                                margin="normal"
                                required
                                fullWidth
                                label="Senha"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleTogglePasswordVisibility}
                                                edge="end"
                                                sx={{ color: alpha('#000000', 0.7) }}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <LoginButton
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                startIcon={<LoginIcon />}
                            >
                                Entrar
                            </LoginButton>

                            <Typography
                                variant="caption"
                                sx={{
                                    mt: 2,
                                    color: alpha('#000000', 0.6),
                                    textAlign: 'center',
                                    display: 'block'
                                }}
                            >
                                © {new Date().getFullYear()} - Sistema de Identificação Facial
                            </Typography>
                        </Box>
                    </StyledPaper>
                </Container>
            </Fade>
        </BackgroundContainer>
    );
}