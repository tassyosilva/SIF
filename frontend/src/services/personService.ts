import { api } from './api';

export interface Person {
    id: number;
    person_id: string;
    name: string;
    origin_code: string;
    origin: string;
    filename: string;
    file_path: string;
    processed: boolean;
    processed_date: string | null;
    face_detected: boolean;
    faiss_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface PersonCreate {
    person_id: string;
    name: string;
    origin_code: string;
    origin: string;
}

export interface PersonUpdate {
    name?: string;
    origin_code?: string;
    origin?: string;
}

export interface UploadResponse {
    success: boolean;
    message: string;
    person?: {
        id: number;
        person_id: string;
        name: string;
        origin: string;
    };
}

export interface BatchProcessResponse {
    success: boolean;
    message?: string;
    total_files: number;
    processed: number;
    failed: number;
    elapsed_time: number;
    details: Array<{
        success: boolean;
        filename: string;
        person_id?: string;
        person_name?: string;
        origin?: string;
        faiss_id?: number;
        error?: string;
    }>;
}

// Obter lista de pessoas com filtros opcionais
export const getPersons = async (
    skip = 0,
    limit = 100,
    name?: string,
    person_id?: string,
    origin?: string
) => {
    const params = { skip, limit, name, person_id, origin };
    const response = await api.get<Person[]>('/persons/', { params });
    return response.data;
};

// Obter uma pessoa pelo ID
export const getPerson = async (personId: string) => {
    const response = await api.get<Person>(`/persons/${personId}`);
    return response.data;
};

// Criar uma nova pessoa
export const createPerson = async (personData: PersonCreate) => {
    const response = await api.post<Person>('/persons/', personData);
    return response.data;
};

// Atualizar uma pessoa existente
export const updatePerson = async (personId: string, personData: PersonUpdate) => {
    const response = await api.put<Person>(`/persons/${personId}`, personData);
    return response.data;
};

// Excluir uma pessoa
export const deletePerson = async (personId: string) => {
    const response = await api.delete(`/persons/${personId}`);
    return response.data;
};

// Fazer upload de uma imagem
export const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/persons/upload/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

// Processar lote de imagens
export const batchProcess = async () => {
    const response = await api.post<BatchProcessResponse>('/persons/batch-process/');
    return response.data;
};
