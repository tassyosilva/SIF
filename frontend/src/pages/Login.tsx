import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, TextField, Typography,
    Container, CssBaseline, Paper, Alert
} from '@mui/material';
import { authService } from '../services/authService';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

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
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Paper
                elevation={3}
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 4
                }}
            >
                <Typography component="h1" variant="h5">
                    Login do Sistema
                </Typography>

                {error && (
                    <Alert
                        severity="error"
                        sx={{ width: '100%', mt: 2 }}
                    >
                        {error}
                    </Alert>
                )}

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ width: '100%', mt: 1 }}
                >
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Entrar
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}