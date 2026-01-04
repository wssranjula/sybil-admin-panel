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

