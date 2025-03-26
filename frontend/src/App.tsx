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

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
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