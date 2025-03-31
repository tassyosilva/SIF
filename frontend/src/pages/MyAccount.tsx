import { useState } from 'react';

import {
    Box, Typography, Paper, Grid, TextField, Button,
    Alert, IconButton, InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff, Save as SaveIcon } from '@mui/icons-material';
import { authService } from '../services/authService';
import { api } from '../services/api';

const MyAccount = () => {
    const user = authService.getCurrentUser();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Todos os campos são obrigatórios');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Nova senha e confirmação não coincidem');
            return;
        }

        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            setSuccess('Senha alterada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao alterar senha');
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Minha Conta
            </Typography>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                {user && (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6">Informações Pessoais</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Nome Completo"
                                        fullWidth
                                        value={user.nome_completo}
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="E-mail"
                                        fullWidth
                                        value={user.email}
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Tipo de Usuário"
                                        fullWidth
                                        value={
                                            user.tipo_usuario === 'administrador' ? 'Administrador' :
                                                user.tipo_usuario === 'consultor' ? 'Consultor' :
                                                    user.tipo_usuario === 'cadastrador' ? 'Cadastrador' :
                                                        user.tipo_usuario
                                        }
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6">Alterar Senha</Typography>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Senha Atual"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        fullWidth
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        edge="end"
                                                    >
                                                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Nova Senha"
                                        type={showNewPassword ? 'text' : 'password'}
                                        fullWidth
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        edge="end"
                                                    >
                                                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Confirmar Nova Senha"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        fullWidth
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<SaveIcon />}
                                        onClick={handleChangePassword}
                                    >
                                        Alterar Senha
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                )}
            </Paper>
        </Box>
    );
};

export default MyAccount;
