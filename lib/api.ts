/**
 * API Client for Sybil Admin Panel
 * Communicates with FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// ========================================
// Types
// ========================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  timestamp: string;
}

export interface WhitelistEntry {
  id: number;
  phone_number: string;
  name?: string;
  notes?: string;
  added_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhitelistCreateRequest {
  phone_number: string;
  name?: string;
  notes?: string;
  added_by?: string;
}

export interface WhitelistUpdateRequest {
  phone_number?: string;
  name?: string;
  notes?: string;
  is_active?: boolean;
}

export interface WhitelistStats {
  total: number;
  active: number;
  inactive: number;
}

// ========================================
// Chat API
// ========================================

export async function sendChatMessage(message: string, history?: ChatMessage[]): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ 
      message,
      history: history || []
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function checkChatHealth() {
  const response = await fetch(`${API_BASE_URL}/admin/chat/health`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

// ========================================
// Whitelist API
// ========================================

export async function getWhitelist(includeInactive: boolean = false): Promise<WhitelistEntry[]> {
  const url = new URL(`${API_BASE_URL}/admin/whitelist`);
  url.searchParams.set('include_inactive', includeInactive.toString());

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.entries || [];
}

export async function addToWhitelist(entry: WhitelistCreateRequest): Promise<WhitelistEntry> {
  const response = await fetch(`${API_BASE_URL}/admin/whitelist`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function updateWhitelist(
  id: number,
  update: WhitelistUpdateRequest
): Promise<WhitelistEntry> {
  const response = await fetch(`${API_BASE_URL}/admin/whitelist/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function toggleWhitelistStatus(id: number): Promise<WhitelistEntry> {
  const response = await fetch(`${API_BASE_URL}/admin/whitelist/${id}/toggle`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function deleteFromWhitelist(id: number, hardDelete: boolean = false): Promise<void> {
  const url = new URL(`${API_BASE_URL}/admin/whitelist/${id}`);
  url.searchParams.set('hard_delete', hardDelete.toString());

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
}

export async function checkPhoneNumber(phoneNumber: string): Promise<boolean> {
  const encoded = encodeURIComponent(phoneNumber);
  const response = await fetch(`${API_BASE_URL}/admin/whitelist/check/${encoded}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.is_whitelisted;
}

export async function getWhitelistStats(): Promise<WhitelistStats> {
  const response = await fetch(`${API_BASE_URL}/admin/whitelist/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

// ========================================
// Prompt Configuration API
// ========================================

export interface PromptConfig {
  tone: string;
  use_smart_brevity: boolean;
  people_references: string;
  use_formatting: boolean;
  use_emojis: boolean;
  default_response_length: string;
  ask_about_depth: boolean;
  tone_adapts_by_user: boolean;
  custom_instructions: string;
}

export async function getPromptConfig(): Promise<PromptConfig> {
  const response = await fetch(`${API_BASE_URL}/admin/sybil/prompt-config`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function updatePromptConfig(config: PromptConfig): Promise<PromptConfig> {
  const response = await fetch(`${API_BASE_URL}/admin/sybil/prompt-config`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ========================================
// Google Drive File Monitoring API
// ========================================

export interface GDriveFileStatus {
  id: number;
  file_id: string;
  file_name: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  file_size?: number;
  error_message?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GDriveFileStats {
  total: number;
  pending: number;
  processing: number;
  success: number;
  failed: number;
}

export async function getGDriveFiles(status?: string, limit?: number): Promise<GDriveFileStatus[]> {
  const url = new URL(`${API_BASE_URL}/admin/gdrive/files`);
  if (status) {
    url.searchParams.set('status', status);
  }
  if (limit) {
    url.searchParams.set('limit', limit.toString());
  }

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.files || [];
}

export async function getGDriveFileStatus(fileId: string): Promise<GDriveFileStatus> {
  const response = await fetch(`${API_BASE_URL}/admin/gdrive/files/${encodeURIComponent(fileId)}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getGDriveFileStats(): Promise<GDriveFileStats> {
  const response = await fetch(`${API_BASE_URL}/admin/gdrive/files/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function retryGDriveFile(fileId: string): Promise<{ status: string; message: string; file_status: GDriveFileStatus }> {
  const response = await fetch(`${API_BASE_URL}/admin/gdrive/files/${encodeURIComponent(fileId)}/retry`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ========================================
// Otter Transcripts API
// ========================================

export interface OtterTranscript {
  conversation_id: string;
  title: string;
  processed_at: string;
  doc_id?: string;
  status: 'processed' | 'synced' | 'failed';
  call_type?: 'team' | 'private';
  error_message?: string;
}

export interface OtterTranscriptStats {
  total_processed: number;
  last_processed?: string;
  team_calls_count?: number;
  private_calls_count?: number;
  failed_count?: number;
}

export interface OtterTranscriptsResponse {
  transcripts: OtterTranscript[];
  total: number;
}

export interface OtterTranscriptsParams {
  limit?: number;
  offset?: number;
  sort_by?: 'date' | 'title';
  order?: 'asc' | 'desc';
  call_type_filter?: 'team' | 'private';
  include_failed?: boolean;
}

export interface OtterConfig {
  team_call_indicators: string[];
  team_calls_folder_name: string;
  private_folder_name: string;
}

export async function getOtterTranscripts(params?: OtterTranscriptsParams): Promise<OtterTranscriptsResponse> {
  const url = new URL(`${API_BASE_URL}/admin/otter/transcripts`);
  
  if (params?.limit) {
    url.searchParams.set('limit', params.limit.toString());
  }
  if (params?.offset) {
    url.searchParams.set('offset', params.offset.toString());
  }
  if (params?.sort_by) {
    url.searchParams.set('sort_by', params.sort_by);
  }
  if (params?.order) {
    url.searchParams.set('order', params.order);
  }
  if (params?.call_type_filter) {
    url.searchParams.set('call_type_filter', params.call_type_filter);
  }
  if (params?.include_failed !== undefined) {
    url.searchParams.set('include_failed', params.include_failed.toString());
  }

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      throw new Error('Authentication expired. Please log in again.');
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getOtterTranscriptStats(): Promise<OtterTranscriptStats> {
  const response = await fetch(`${API_BASE_URL}/admin/otter/transcripts/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      throw new Error('Authentication expired. Please log in again.');
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getOtterConfig(): Promise<OtterConfig> {
  const response = await fetch(`${API_BASE_URL}/admin/otter/config`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      throw new Error('Authentication expired. Please log in again.');
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function updateOtterConfig(config: Partial<OtterConfig>): Promise<OtterConfig & { message?: string }> {
  const response = await fetch(`${API_BASE_URL}/admin/otter/config`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      throw new Error('Authentication expired. Please log in again.');
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function retryOtterTranscript(conversationId: string): Promise<{ status: string; message: string; doc_id?: string; conversation_id: string }> {
  const response = await fetch(`${API_BASE_URL}/admin/otter/transcripts/${conversationId}/retry`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      throw new Error('Authentication expired. Please log in again.');
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

