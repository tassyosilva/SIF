import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper,
    Card, CardContent, CircularProgress, Alert
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getPersons } from '../services/personService';

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [totalPersons, setTotalPersons] = useState(0);
    const [originStats, setOriginStats] = useState<{ name: string; value: number }[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const persons = await getPersons(0, 1000);

                // Calcular estatísticas
                setTotalPersons(persons.length);

                // Estatísticas por origem
                const originCounts: Record<string, number> = {};
                persons.forEach(person => {
                    const origin = person.origin || 'Desconhecido';
                    originCounts[origin] = (originCounts[origin] || 0) + 1;
                });

                const originData = Object.entries(originCounts).map(([name, value]) => ({ name, value }));
                setOriginStats(originData);

            } catch (err: any) {
                console.error('Erro ao buscar dados:', err);
                setError('Erro ao carregar estatísticas');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Cores da Polícia Civil - preto e dourado
    const COLORS = ['#D4AF37', '#000000', '#8B7D39', '#4C4C4C', '#D4C097'];

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#000000' }}>
                Dashboard
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress sx={{ color: '#D4AF37' }} />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Paper elevation={3} sx={{ p: 2, height: '100%', borderTop: '3px solid #D4AF37' }}>
                                <Card sx={{ boxShadow: 'none' }}>
                                    <CardContent>
                                        <Typography variant="h5" component="div" sx={{ color: '#000000' }}>
                                            Total de Pessoas
                                        </Typography>
                                        <Typography variant="h3" component="div" sx={{ mt: 2, color: '#D4AF37', fontWeight: 'bold' }}>
                                            {totalPersons}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={8}>
                            <Paper elevation={3} sx={{ p: 2, height: '100%', borderTop: '3px solid #D4AF37' }}>
                                <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
                                    Distribuição por Origem
                                </Typography>
                                {originStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={originStats}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {originStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`${value} pessoas`, 'Quantidade']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Typography>Sem dados disponíveis</Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper elevation={3} sx={{ p: 2, borderTop: '3px solid #D4AF37' }}>
                                <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
                                    Pessoas por Origem
                                </Typography>
                                {originStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={originStats}
                                            margin={{
                                                top: 5,
                                                right: 30,
                                                left: 20,
                                                bottom: 5,
                                            }}
                                        >
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="value" name="Quantidade" fill="#D4AF37" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Typography>Sem dados disponíveis</Typography>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default Dashboard;