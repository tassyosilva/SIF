import { api } from './api';

export interface User {
    id: number;
    login: string;
    nome_completo: string;
    cpf: string;
    matricula: string;
    telefone?: string;
    orgao?: string;
    estado_do_orgao?: string;
    email: string;
    tipo_usuario: string;
    ativo: boolean;
    criado_em: string;
    atualizado_em: string;
}

export interface UserCreate {
    login: string;
    nome_completo: string;
    cpf: string;
    matricula: string;
    telefone?: string;
    orgao?: string;
    estado_do_orgao?: string;
    email: string;
    tipo_usuario: string;
    senha: string;
}

export interface UserUpdate {
    nome_completo?: string;
    telefone?: string;
    orgao?: string;
    estado_do_orgao?: string;
    tipo_usuario?: string;
    ativo?: boolean;
}

// Obter lista de usuários com filtros opcionais
export const getUsers = async (
    skip = 0,
    limit = 100,
    nome?: string,
    ativo?: boolean
) => {
    const params = { skip, limit, nome, ativo };
    const response = await api.get<User[]>('/users/', { params });
    return response.data;
};

// Obter um usuário específico
export const getUser = async (id: number) => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
};

// Criar um novo usuário
export const createUser = async (userData: UserCreate) => {
    const response = await api.post<User>('/users/', userData);
    return response.data;
};

// Atualizar um usuário existente
export const updateUser = async (id: number, userData: UserUpdate) => {
    const response = await api.put<User>(`/users/${id}`, userData);
    return response.data;
};

// Excluir um usuário (ou desativar)
export const deleteUser = async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

// Obter lista de estados
export const getEstados = async () => {
    const response = await api.get<{ sigla: string }[]>('/estados/');
    return response.data;
};

// Obter lista de órgãos
export const getOrgaos = async () => {
    const response = await api.get<{ id: string, nome: string }[]>('/orgaos/');
    return response.data;
};

// Formatar CPF
export const formatCPF = (cpf: string): string => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length <= 3) return cpfLimpo;
    if (cpfLimpo.length <= 6) return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3)}`;
    if (cpfLimpo.length <= 9) return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6)}`;
    return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6, 9)}-${cpfLimpo.slice(9, 11)}`;
};

// Remover formatação do CPF
export const unformatCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
};