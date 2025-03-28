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

// Interceptor para tratamento de erros de autenticação
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se for erro de autorização e ainda não tentou refresh
        if (error.response.status === 401 && !originalRequest._retry) {
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

        return Promise.reject(error);
    }
);