import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Componentes comuns
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

// Páginas
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Login from './pages/Login';
import UserList from './pages/UserList';
import UserForm from './pages/UserForm';
import MyAccount from './pages/MyAccount';
import IndividualRegistration from './pages/IndividualRegistration';

// Serviço de autenticação
import { authService } from './services/authService';

// Componente de rota protegida
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente de rota com permissão específica
const RoleProtectedRoute = ({
  children,
  allowedRoles
}: {
  children: JSX.Element,
  allowedRoles: string[]
}) => {
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.tipo_usuario)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Cores da Polícia Civil
const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', // Preto
      contrastText: '#FFFFFF', // Texto branco sobre fundo preto
    },
    secondary: {
      main: '#D4AF37', // Dourado
      contrastText: '#000000', // Texto preto sobre fundo dourado
    },
    background: {
      default: '#FFFFFF', // Fundo branco
      paper: '#FFFFFF', // Componentes com fundo branco
    },
    text: {
      primary: '#000000', // Texto preto
      secondary: '#757575', // Texto cinza secundário
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000', // AppBar preta
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#000000', // Sidebar preta
          color: '#FFFFFF', // Texto branco na sidebar
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#FFFFFF', // Ícones brancos na sidebar (fundo preto)
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(212, 175, 55, 0.4)', // Dourado mais escuro para item selecionado
            '&:hover': {
              backgroundColor: 'rgba(212, 175, 55, 0.5)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)', // Branco com transparência para hover
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          '&.MuiSvgIcon-colorPrimary': {
            color: '#000000', // Ícones primários pretos
          },
        },
      },
    },
  },
});

function App() {
  const [open, setOpen] = useState(() => {
    // Verifica se é um dispositivo móvel e inicia com o menu fechado
    const isMobile = window.innerWidth <= 960; // breakpoint padrão do Material-UI para md
    return !isMobile;
  });

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <>
                    <Header open={open} toggleDrawer={toggleDrawer} />
                    <Box
                      sx={{
                        display: {
                          xs: 'none',  // Esconde em dispositivos móveis 
                          md: 'block'  // Mostra em dispositivos maiores 
                        }
                      }}
                    >
                      <Sidebar open={open} />
                    </Box>
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        width: '100%',
                        transition: theme => theme.transitions.create(['margin', 'width'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                      }}
                    >
                      <Toolbar />
                      <Dashboard />
                    </Box>
                  </>
                </ProtectedRoute>
              }
            />
            {/* Rota Upload - apenas para administrador */}
            <Route
              path="/upload"
              element={
                <RoleProtectedRoute allowedRoles={['administrador']}>
                  <>
                    <Header open={open} toggleDrawer={toggleDrawer} />
                    <Box
                      sx={{
                        display: {
                          xs: 'none',  // Esconde em dispositivos móveis 
                          md: 'block'  // Mostra em dispositivos maiores 
                        }
                      }}
                    >
                      <Sidebar open={open} />
                    </Box>
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        width: '100%',
                        transition: theme => theme.transitions.create(['margin', 'width'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                      }}
                    >
                      <Toolbar />
                      <Upload />
                    </Box>
                  </>
                </RoleProtectedRoute>
              }
            />
            {/* Rota Cadastro Individual - para administrador e cadastrador */}
            <Route
              path="/individual-registration"
              element={
                <RoleProtectedRoute allowedRoles={['administrador', 'cadastrador']}>
                  <>
                    <Header open={open} toggleDrawer={toggleDrawer} />
                    <Box
                      sx={{
                        display: {
                          xs: 'none',  // Esconde em dispositivos móveis 
                          md: 'block'  // Mostra em dispositivos maiores 
                        }
                      }}
                    >
                      <Sidebar open={open} />
                    </Box>
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        width: '100%',
                        transition: theme => theme.transitions.create(['margin', 'width'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                      }}
                    >
                      <Toolbar />
                      <IndividualRegistration />
                    </Box>
                  </>
                </RoleProtectedRoute>
              }
            />
            {/* Rota Busca - para todos os perfis */}
            <Route
              path="/search"
              element={
                <RoleProtectedRoute allowedRoles={['administrador', 'consultor', 'cadastrador']}>
                  <>
                    <Header open={open} toggleDrawer={toggleDrawer} />
                    <Box
                      sx={{
                        display: {
                          xs: 'none',  // Esconde em dispositivos móveis 
                          md: 'block'  // Mostra em dispositivos maiores 
                        }
                      }}
                    >
                      <Sidebar open={open} />
                    </Box>
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        width: '100%',
                        transition: theme => theme.transitions.create(['margin', 'width'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                      }}
                    >
                      <Toolbar />
                      <Search />
                    </Box>
                  </>
                </RoleProtectedRoute>
              }
            />
            {/* Rota Usuários - apenas para administrador */}
            <Route
              path="/users"
              element={
                <RoleProtectedRoute allowedRoles={['administrador']}>
                  <>
                    <Header open={open} toggleDrawer={toggleDrawer} />
                    <Box
                      sx={{
                        display: {
                          xs: 'none',  // Esconde em dispositivos móveis 
                          md: 'block'  // Mostra em dispositivos maiores 
                        }
                      }}
                    >
                      <Sidebar open={open} />
                    </Box>
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        width: '100%',
                        transition: theme => theme.transitions.create(['margin', 'width'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                      }}
                    >
                      <Toolbar />
                      <UserList />
                    </Box>
                  </>
                </RoleProtectedRoute>
              }
            />
            {/* Rota de edição/criação de usuário - apenas para administrador */}
            <Route
              path="/users/:id"
              element={
                <RoleProtectedRoute allowedRoles={['administrador']}>
                  <>
                    <Header open={open} toggleDrawer={toggleDrawer} />
                    <Box
                      sx={{
                        display: {
                          xs: 'none',  // Esconde em dispositivos móveis 
                          md: 'block'  // Mostra em dispositivos maiores 
                        }
                      }}
                    >
                      <Sidebar open={open} />
                    </Box>
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        width: '100%',
                        transition: theme => theme.transitions.create(['margin', 'width'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                      }}
                    >
                      <Toolbar />
                      <UserForm />
                    </Box>
                  </>
                </RoleProtectedRoute>
              }
            />
            {/* Rota Configurações - apenas para administrador */}
            <Route
              path="/settings"
              element={
                <RoleProtectedRoute allowedRoles={['administrador']}>
                  <>
                    <Header open={open} toggleDrawer={toggleDrawer} />
                    <Box
                      sx={{
                        display: {
                          xs: 'none',  // Esconde em dispositivos móveis 
                          md: 'block'  // Mostra em dispositivos maiores 
                        }
                      }}
                    >
                      <Sidebar open={open} />
                    </Box>
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        width: '100%',
                        transition: theme => theme.transitions.create(['margin', 'width'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                      }}
                    >
                      <Toolbar />
                      <Settings />
                    </Box>
                  </>
                </RoleProtectedRoute>
              }
            />
            {/* Rota Minha Conta - para todos os perfis */}
            <Route
              path="/my-account"
              element={
                <RoleProtectedRoute allowedRoles={['administrador', 'consultor', 'cadastrador']}>
                  <>
                    <Header open={open} toggleDrawer={toggleDrawer} />
                    <Box
                      sx={{
                        display: {
                          xs: 'none',  // Esconde em dispositivos móveis 
                          md: 'block'  // Mostra em dispositivos maiores 
                        }
                      }}
                    >
                      <Sidebar open={open} />
                    </Box>
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        width: '100%',
                        transition: theme => theme.transitions.create(['margin', 'width'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                      }}
                    >
                      <Toolbar />
                      <MyAccount />
                    </Box>
                  </>
                </RoleProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
