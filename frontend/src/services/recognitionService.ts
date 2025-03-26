// frontend/src/services/recognitionService.ts
import { api } from './api';

export interface SearchResult {
    person_id: string;
    name: string;
    origin: string;
    similarity: number;
    file_path: string;
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
