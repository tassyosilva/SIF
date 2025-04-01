import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper,
    Card, CardContent, CircularProgress, Alert,
    useMediaQuery, useTheme, alpha
} from '@mui/material';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    CartesianGrid
} from 'recharts';
import { getPersons } from '../services/personService';
import { api } from '../services/api'; // Importando o serviço de API que você já usa no Settings.tsx
import {
    Group, LocationOn, InfoOutlined,
    TrendingUp, Image as ImageIcon
} from '@mui/icons-material';

// Tipo StatCard para cards de estatísticas
interface StatCardProps {
    title: string;
    value: number;
    color: string;
    icon: React.ElementType;
}

// Tipo ChartPanel para painéis de gráficos
interface ChartPanelProps {
    title: string;
    children: React.ReactNode;
    height?: number;
    isEmpty?: boolean;
}

// Cores com bom contraste (dourado, preto, tons de cinza)
const COLORS = ['#D4AF37', '#333333', '#8B7D39', '#4C4C4C', '#666666', '#8B8000', '#5D4037', '#787878'];

// Componente de card estatístico com ícone
const StatCard = ({ title, value, color, icon: Icon }: StatCardProps) => {
    return (
        <Card
            sx={{
                height: '100%',
                backgroundColor: 'white',
                border: `1px solid ${alpha(color, 0.2)}`,
                borderRadius: '12px',
                boxShadow: `0 8px 24px 0 ${alpha(color, 0.15)}`,
                overflow: 'visible',
                transition: 'transform 0.3s, box-shadow 0.3s',
                position: 'relative',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 12px 30px 0 ${alpha(color, 0.2)}`
                }
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '-15px',
                    left: '20px',
                    backgroundColor: color,
                    borderRadius: '12px',
                    width: '55px',
                    height: '55px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: `0 8px 16px 0 ${alpha(color, 0.3)}`
                }}
            >
                <Icon sx={{ fontSize: 28, color: 'white' }} />
            </Box>

            <CardContent sx={{ textAlign: 'right', pt: 3, pb: '16px !important' }}>
                <Typography variant="body2" sx={{ color: alpha('#000000', 0.7), mb: 1 }}>
                    {title}
                </Typography>
                <Typography variant="h3" sx={{ color: color, fontWeight: 700, lineHeight: 1.2 }}>
                    {value.toLocaleString()}
                </Typography>
            </CardContent>
        </Card>
    );
};

// Componente para os painéis de gráficos
const ChartPanel = ({ title, children, height = 300, isEmpty = false }: ChartPanelProps) => {
    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                height: '100%',
                borderRadius: '12px',
                backgroundColor: 'white',
                borderTop: '3px solid #D4AF37',
                boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s',
                '&:hover': {
                    transform: 'scale(1.01)'
                }
            }}
        >
            <Typography
                variant="h6"
                gutterBottom
                sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: '#000000',
                    textAlign: 'center'
                }}
            >
                {title}
            </Typography>
            <Box sx={{ height }}>
                {isEmpty ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}
                    >
                        <InfoOutlined sx={{ fontSize: 40, color: alpha('#000', 0.3), mb: 2 }} />
                        <Typography
                            variant="body1"
                            textAlign="center"
                            sx={{ color: alpha('#000', 0.5) }}
                        >
                            Sem dados suficientes para visualização
                        </Typography>
                    </Box>
                ) : (
                    children
                )}
            </Box>
        </Paper>
    );
};

const Dashboard: React.FC = () => {
    const theme = useTheme();
    // Mantendo a verificação de dispositivo móvel para uso futuro
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [loading, setLoading] = useState(true);
    const [totalPersons, setTotalPersons] = useState(0);
    const [totalImages, setTotalImages] = useState(0);
    const [originStats, setOriginStats] = useState<{ name: string; value: number }[]>([]);
    const [error, setError] = useState('');
    const [hasData, setHasData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Buscar pessoas
                const persons = await getPersons(0, 1000);
                setTotalPersons(persons.length);
                setHasData(persons.length > 0);

                // Buscar informações do sistema usando o mesmo serviço API que funciona na página de configurações
                try {
                    const systemInfoResponse = await api.get('/settings/system-info');
                    // Verificar se a resposta tem os dados esperados
                    if (systemInfoResponse && systemInfoResponse.data) {
                        setTotalImages(systemInfoResponse.data.total_images || 0);
                    } else {
                        // Valor temporário até resolver o problema de API
                        console.log('Dados não encontrados na resposta da API, usando valor temporário');
                        setTotalImages(0);
                    }
                } catch (apiError) {
                    console.error('Erro ao buscar informações do sistema:', apiError);
                    // Valor temporário até resolver o problema de API
                    setTotalImages(0);
                }

                // Estatísticas por origem
                const originCounts: Record<string, number> = {};
                persons.forEach(person => {
                    const origin = person.origin || 'Desconhecido';
                    originCounts[origin] = (originCounts[origin] || 0) + 1;
                });

                const originData = Object.entries(originCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value); // Ordenar por valor decrescente

                setOriginStats(originData);

            } catch (err: any) {
                console.error('Erro ao buscar dados:', err);
                setError('Erro ao carregar estatísticas');
                setHasData(false);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Verificar se os dados são significativos
    const hasMeaningfulData = (data: any[]): boolean => {
        if (!data || data.length === 0) return false;
        return true;
    };

    const hasOriginData = hasMeaningfulData(originStats);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '70vh',
                    bgcolor: 'white'
                }}
            >
                <CircularProgress
                    sx={{
                        color: '#D4AF37',
                        '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round',
                        }
                    }}
                    size={60}
                    thickness={4}
                />
                <Typography
                    variant="h6"
                    sx={{
                        mt: 2,
                        fontWeight: 500,
                        color: '#000000'
                    }}
                >
                    Carregando dados do dashboard...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, bgcolor: 'white' }}>
                <Alert
                    severity="error"
                    sx={{
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{
            p: 3,
            bgcolor: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
        }}>
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                    color: '#000000',
                    fontWeight: 600,
                    mb: 3
                }}
            >
                Dashboard
            </Typography>

            {/* Alerta de dados insuficientes */}
            {!hasData && (
                <Alert
                    severity="info"
                    sx={{
                        mb: 3,
                        borderRadius: '8px',
                        backgroundColor: alpha('#1976d2', 0.1),
                        color: '#000000',
                        border: `1px solid ${alpha('#1976d2', 0.3)}`,
                        '& .MuiAlert-icon': {
                            color: '#1976d2'
                        }
                    }}
                >
                    Não há dados suficientes no sistema. Os gráficos serão exibidos quando houver informações disponíveis.
                </Alert>
            )}

            {/* Cards com estatísticas */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Total de Pessoas"
                        value={totalPersons}
                        color="#D4AF37"
                        icon={Group}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Total de Imagens"
                        value={totalImages}
                        color="#333333"
                        icon={ImageIcon}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Origens Distintas"
                        value={originStats.length}
                        color="#8B7D39"
                        icon={LocationOn}
                    />
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <ChartPanel title="Distribuição por Origem" isEmpty={!hasOriginData}>
                        {hasOriginData && (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={originStats}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={90}
                                        innerRadius={40}
                                        paddingAngle={2}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {originStats.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                stroke={alpha(COLORS[index % COLORS.length], 0.8)}
                                                strokeWidth={1}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [`${value} pessoas`, 'Quantidade']}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid rgba(0, 0, 0, 0.1)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                        }}
                                    />
                                    <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ paddingTop: '20px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </ChartPanel>
                </Grid>
                <Grid item xs={12} md={6}>
                    <ChartPanel title="Pessoas por Origem" isEmpty={!hasOriginData}>
                        {hasOriginData && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={originStats.slice(0, 5)} // Mostrar apenas os 5 principais para melhor visualização
                                    margin={{
                                        top: 5,
                                        right: 30,
                                        left: 20,
                                        bottom: 60,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={70}
                                        tick={{ fontSize: 12, fill: alpha('#000', 0.7) }}
                                        stroke={alpha('#000', 0.2)}
                                    />
                                    <YAxis stroke={alpha('#000', 0.2)} tick={{ fill: alpha('#000', 0.7) }} />
                                    <Tooltip
                                        formatter={(value) => [`${value} pessoas`, 'Quantidade']}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid rgba(0, 0, 0, 0.1)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                        }}
                                        cursor={{ fill: alpha('#000', 0.05) }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar
                                        dataKey="value"
                                        name="Quantidade de Pessoas"
                                        fill="#D4AF37"
                                        radius={[4, 4, 0, 0]}
                                        barSize={30}
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartPanel>
                </Grid>

            </Grid>

            {/* Rodapé com informações de atualização */}
            <Box sx={{
                textAlign: 'center',
                mt: 4,
                pt: 2,
                borderTop: `1px solid ${alpha('#000', 0.1)}`,
                color: alpha('#000', 0.6),
                fontSize: '0.85rem'
            }}>
                <Typography variant="caption">
                    Última atualização dos dados: {new Date().toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption">
                        Sistema de Identificação Facial
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Dashboard;