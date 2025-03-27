import { api } from './api';

export interface SearchResult {
    person_id: string;
    person_name: string; // Alterado de "name" para "person_name"
    origin: string;
    similarity: number;
    file_path: string;
    cpf: string;
    rank: number;
    distance: number;
    filename: string;
    processed_date: string;
}

export interface SearchResponse {
    success: boolean;
    message: string;
    results: SearchResult[];
    query_image?: string;
}

// Buscar faces similares a partir de uma imagem
export const searchByImage = async (file: File, k: number = 5) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<SearchResponse>(`/recognition/search/?k=${k}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Buscar faces similares a partir do ID de uma pessoa
export const searchByPersonId = async (personId: string, k: number = 5) => {
    const response = await api.post<SearchResponse>(`/recognition/search-by-id/?k=${k}`, { person_id: personId });
    return response.data;
};

// Buscar faces similares a partir do CPF de uma pessoa
export const searchByPersonCpf = async (cpf: string, k: number = 5) => {
    try {
        const response = await api.post<SearchResponse>(`/recognition/search-by-cpf/?k=${k}`, { cpf: cpf });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar por CPF:', error);
        return {
            success: false,
            message: 'Erro ao buscar por CPF',
            results: []
        };
    }
};

// Buscar faces similares a partir do nome de uma pessoa
export const searchByPersonName = async (name: string, k: number = 5) => {
    try {
        const response = await api.post<SearchResponse>(`/recognition/search-by-name/?k=${k}`, { name: name });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar por nome:', error);
        return {
            success: false,
            message: 'Erro ao buscar por nome',
            results: []
        };
    }
};