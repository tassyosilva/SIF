import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    TextField,
    LinearProgress,
    Alert,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Pagination
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { getUsers, deleteUser, User } from '../services/userService';

const UserList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

    // Paginação
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getUsers(
                (page - 1) * itemsPerPage,
                itemsPerPage,
                search || undefined
            );
            setUsers(response);
            // Como a API retorna apenas a página atual, estimamos o total de páginas
            // Assumindo que o total de usuários é pelo menos o número de itens retornados
            // A menos que retorne menos que o itemsPerPage
            const estimatedTotal = response.length < itemsPerPage && page === 1
                ? 1
                : Math.ceil(response.length === itemsPerPage ? (page * itemsPerPage) + 1 : page * itemsPerPage / itemsPerPage);
            setTotalPages(Math.max(1, estimatedTotal));
        } catch (err: any) {
            console.error('Erro ao carregar usuários:', err);
            setError(err.response?.data?.detail || 'Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    }, [page, search, itemsPerPage]); // Dependências da função loadUsers

    useEffect(() => {
        loadUsers();
    }, [loadUsers]); // Recarrega quando loadUsers muda (que por sua vez depende de page, search e itemsPerPage)

    const handleSearch = () => {
        setPage(1); // Volta para a primeira página ao pesquisar
        loadUsers();
    };

    const handleAddUser = () => {
        navigate('/users/new');
    };

    const handleEditUser = (id: number) => {
        navigate(`/users/${id}`);
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        setLoading(true);
        try {
            await deleteUser(userToDelete.id);
            setDeleteSuccess(`Usuário ${userToDelete.nome_completo} excluído com sucesso!`);
            setDeleteDialogOpen(false);
            setUserToDelete(null);

            // Recarregar a lista após deletar
            await loadUsers();

            // Limpar mensagem de sucesso após 3 segundos
            setTimeout(() => {
                setDeleteSuccess(null);
            }, 3000);
        } catch (err: any) {
            console.error('Erro ao excluir usuário:', err);
            setError(err.response?.data?.detail || 'Erro ao excluir usuário');
            setDeleteDialogOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    // Função para traduzir o tipo de usuário
    const getTipoUsuarioLabel = (tipo: string) => {
        switch (tipo) {
            case 'administrador':
                return 'Administrador';
            case 'consultor':
                return 'Consultor';
            case 'cadastrador':
                return 'Cadastrador';
            default:
                return tipo;
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Gerenciamento de Usuários
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
                        <TextField
                            label="Buscar usuário"
                            variant="outlined"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            size="small"
                            sx={{ flex: 1, maxWidth: 400 }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SearchIcon />}
                            onClick={handleSearch}
                        >
                            Buscar
                        </Button>
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddUser}
                    >
                        Novo Usuário
                    </Button>
                </Box>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {deleteSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {deleteSuccess}
                    </Alert>
                )}

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Login</TableCell>
                                <TableCell>Nome Completo</TableCell>
                                <TableCell>E-mail</TableCell>
                                <TableCell>Matrícula</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        {loading ? 'Carregando...' : 'Nenhum usuário encontrado'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.login}</TableCell>
                                        <TableCell>{user.nome_completo}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.matricula}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getTipoUsuarioLabel(user.tipo_usuario)}
                                                color={
                                                    user.tipo_usuario === 'administrador' ? 'primary' :
                                                        user.tipo_usuario === 'consultor' ? 'secondary' : 'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleEditUser(user.id)}
                                                size="small"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteClick(user)}
                                                size="small"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                )}
            </Paper>

            {/* Diálogo de confirmação de exclusão */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCancelDelete}
            >
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir o usuário {userToDelete?.nome_completo}?
                        Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserList;