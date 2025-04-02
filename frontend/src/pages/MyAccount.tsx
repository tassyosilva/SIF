import { useState } from 'react';

import {
    Box, Typography, Grid, TextField, Button,
    Alert, IconButton, InputAdornment, Container,
    Card, CardContent, Avatar, Divider, Tooltip,
    CircularProgress, Stack
} from '@mui/material';
import {
    Visibility, VisibilityOff, Save as SaveIcon,
    Person, Badge, Email, VpnKey, Security,
    Lock, AdminPanelSettings
} from '@mui/icons-material';
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
    const [loading, setLoading] = useState(false);

    // Gerar iniciais do nome para o avatar
    const getNameInitials = () => {
        if (!user?.nome_completo) return '?';

        const nameParts = user.nome_completo.split(' ');
        if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Todos os campos são obrigatórios');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Nova senha e confirmação não coincidem');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

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
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 4,
                borderBottom: '3px solid',
                borderColor: 'primary.main',
                pb: 2
            }}>
                <Person sx={{ fontSize: 36, color: 'primary.main', mr: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Minha Conta
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Informações Pessoais */}
                <Grid item xs={12} md={6}>
                    <Card elevation={5} sx={{
                        borderRadius: 2,
                        height: '100%',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s',
                        '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 20px rgba(0,0,0,0.15)'
                        }
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        bgcolor: 'primary.main',
                                        fontSize: 32,
                                        fontWeight: 'bold',
                                        mr: 2,
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {getNameInitials()}
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                        {user.nome_completo}
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ color: 'primary.main' }}>
                                        {user.tipo_usuario === 'administrador' ? 'Administrador' :
                                            user.tipo_usuario === 'consultor' ? 'Consultor' :
                                                user.tipo_usuario === 'cadastrador' ? 'Cadastrador' :
                                                    user.tipo_usuario}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Badge sx={{ color: 'primary.main', mr: 2 }} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Nome</Typography>
                                            <Typography variant="body1">{user.nome_completo}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Email sx={{ color: 'primary.main', mr: 2 }} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Email</Typography>
                                            <Typography variant="body1">{user.email || 'Não informado'}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <AdminPanelSettings sx={{ color: 'primary.main', mr: 2 }} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Tipo de Acesso</Typography>
                                            <Typography variant="body1">
                                                {user.tipo_usuario === 'administrador' ? 'Administrador (Acesso total)' :
                                                    user.tipo_usuario === 'consultor' ? 'Consultor' :
                                                        user.tipo_usuario === 'cadastrador' ? 'Cadastrador' :
                                                            user.tipo_usuario}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Alterar Senha */}
                <Grid item xs={12} md={6}>
                    <Card elevation={5} sx={{
                        borderRadius: 2,
                        height: '100%',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s',
                        '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 20px rgba(0,0,0,0.15)'
                        }
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Box sx={{
                                    backgroundColor: 'primary.main',
                                    borderRadius: '50%',
                                    p: 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                }}>
                                    <VpnKey sx={{ fontSize: 32 }} />
                                </Box>
                                <Typography variant="h5" sx={{ ml: 2, fontWeight: 'bold' }}>
                                    Alterar Senha
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {error && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 3,
                                        borderRadius: 2,
                                        boxShadow: '0 2px 8px rgba(244, 67, 54, 0.2)'
                                    }}
                                    variant="filled"
                                >
                                    {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert
                                    severity="success"
                                    sx={{
                                        mb: 3,
                                        borderRadius: 2,
                                        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)'
                                    }}
                                    variant="filled"
                                >
                                    {success}
                                </Alert>
                            )}

                            <Stack spacing={3}>
                                <TextField
                                    label="Senha Atual"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    fullWidth
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock color="primary" />
                                            </InputAdornment>
                                        ),
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
                                    label="Nova Senha"
                                    type={showNewPassword ? 'text' : 'password'}
                                    fullWidth
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <VpnKey color="primary" />
                                            </InputAdornment>
                                        ),
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
                                    label="Confirmar Nova Senha"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    fullWidth
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <VpnKey color="primary" />
                                            </InputAdornment>
                                        ),
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
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&.Mui-focused fieldset': {
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                />

                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <Tooltip title="Altere sua senha para manter sua conta segura">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="large"
                                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                            onClick={handleChangePassword}
                                            disabled={loading}
                                            sx={{
                                                px: 4,
                                                py: 1.5,
                                                borderRadius: 2,
                                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                                                fontWeight: 'bold',
                                                '&:hover': {
                                                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)',
                                                    transform: 'scale(1.02)',
                                                    transition: 'all 0.2s'
                                                }
                                            }}
                                        >
                                            {loading ? 'Alterando...' : 'Alterar Senha'}
                                        </Button>
                                    </Tooltip>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Informações de Segurança */}
            <Card elevation={5} sx={{
                mt: 4,
                borderRadius: 2,
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.15)'
                }
            }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                            backgroundColor: 'primary.main',
                            borderRadius: '50%',
                            p: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }}>
                            <Security sx={{ fontSize: 32 }} />
                        </Box>
                        <Typography variant="h5" sx={{ ml: 2, fontWeight: 'bold' }}>
                            Informações de Segurança
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AdminPanelSettings sx={{ color: 'primary.main', mr: 2 }} />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Nível de Acesso</Typography>
                                    <Typography variant="body1">
                                        {user.tipo_usuario === 'administrador' ? 'Administrador (Acesso total)' :
                                            user.tipo_usuario === 'consultor' ? 'Consultor' :
                                                user.tipo_usuario === 'cadastrador' ? 'Cadastrador' :
                                                    user.tipo_usuario}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Container>
    );
};

export default MyAccount;