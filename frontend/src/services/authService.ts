import { api } from './api';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface User {
    nome_completo: string;
    tipo_usuario: string;
    email: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

async function refreshToken() {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No token');
        }
        const response = await api.post<AuthResponse>('/auth/refresh', {
            token: token
        });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data.access_token;
    } catch (error) {
        // Se refresh falhar, fazer logout
        authService.logout();
        window.location.href = '/login';
        throw error;
    }
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const formData = new FormData();
            formData.append('username', credentials.username);
            formData.append('password', credentials.password);

            const response = await api.post<AuthResponse>('/auth/token', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Salvar token e usuário no localStorage
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    },

    logout() {
        // Limpar dados de autenticação
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    },

    refreshToken
};
