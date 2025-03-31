import axios from 'axios';
import { authService } from './authService';

export const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se for erro de autorização e ainda não tentou refresh
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Tentar refresh do token
                const newToken = await authService.refreshToken();

                // Atualizar token no cabeçalho
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Retentar a requisição original
                return api(originalRequest);
            } catch (refreshError) {
                // Se refresh falhar, fazer logout
                authService.logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Melhorar o tratamento de erros para fornecer mensagens mais claras
        if (error.response) {
            // O servidor respondeu com um status de erro (4xx, 5xx)
            console.error('Erro da API:', error.response.status, error.response.data);
        } else if (error.request) {
            // A requisição foi feita mas não houve resposta
            console.error('Sem resposta do servidor:', error.request);
            error.message = 'O servidor não respondeu à solicitação. Verifique sua conexão de rede.';
        } else {
            // Erro ao configurar a requisição
            console.error('Erro na configuração da requisição:', error.message);
        }

        return Promise.reject(error);
    }
);