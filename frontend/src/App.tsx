import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
    // Corrigido: Os ícones na sidebar agora serão brancos para ter bom contraste com o fundo preto
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
    // Ícones nos componentes com fundo branco serão pretos
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
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <Header open={open} toggleDrawer={toggleDrawer} />
          <Sidebar open={open} />
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
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/search" element={<Search />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;