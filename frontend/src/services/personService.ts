import { api } from './api';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosProgressEvent, AxiosError } from 'axios';

// Interface para representar a resposta de erro da API
interface ApiErrorResponse {
    detail?: string;
    message?: string;
}

export interface Person {
    id: number;
    person_id: string;
    cpf: string; // Campo adicionado
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
    cpf: string; // Campo adicionado
    name: string;
    origin_code: string;
    origin: string;
}

export interface PersonUpdate {
    name?: string;
    cpf?: string; // Campo adicionado
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

export interface PersonImage {
    id: number;
    person_id: string;
    filename: string;
    original_filename: string;
    processed: boolean;
    processed_date: string | null;
    face_detected: boolean;
    faiss_id: number | null;
    created_at: string;
    updated_at: string;
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

export const getPersonImages = async (personId: string) => {
    try {
        const response = await api.get<PersonImage[]>(`/persons/${personId}/images`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar imagens da pessoa:', error);
        throw error;
    }
};

// Constantes para o mecanismo de retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

// Função de upload com mecanismo de retry
async function uploadWithRetry(
    file: File,
    batchId: string,
    onProgressUpdate?: (progress: number) => void,
    retriesLeft = MAX_RETRIES
): Promise<any> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('batch_id', batchId);

        const response = await api.post('/persons/upload-file/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 5 * 60 * 1000, // 5 minutos
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgressUpdate?.(percentCompleted);
                }
            }
        });

        return response.data;
    } catch (error) {
        if (retriesLeft > 0) {
            console.warn(`Tentativa de retry para ${file.name}. Restam ${retriesLeft} tentativas`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return uploadWithRetry(file, batchId, onProgressUpdate, retriesLeft - 1);
        }
        throw error;
    }
}

// Iniciar um upload em lote
export const startBatchUpload = async (totalFiles: number) => {
    try {
        const batchId = uuidv4();
        const response = await api.post('/persons/batch-upload-start/', {
            batch_id: batchId,
            total_files: totalFiles
        });
        return response.data.batch_id;
    } catch (error) {
        console.error('Erro ao iniciar upload em lote:', error);
        throw new Error('Não foi possível iniciar o upload. Tente novamente.');
    }
};

// Fazer upload de um arquivo individual para um lote
export const uploadFileInBatch = async (file: File, batchId: string, onProgressUpdate?: (progress: number) => void) => {
    try {
        return await uploadWithRetry(file, batchId, onProgressUpdate);
    } catch (error) {
        console.error(`Erro no upload do arquivo ${file.name}:`, error);
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorMessage = axiosError.response?.data?.detail ||
            axiosError.response?.data?.message ||
            'Erro desconhecido';
        throw new Error(`Falha no upload do arquivo ${file.name}. ${errorMessage}`);
    }
};

// Finalizar e processar um lote de upload
export const completeBatchUpload = async (batchId: string) => {
    try {
        const response = await api.post('/persons/batch-upload-complete/', {
            batch_id: batchId
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao finalizar o lote de upload:', error);
        throw new Error('Não foi possível finalizar o processamento do lote. Tente novamente.');
    }
};
