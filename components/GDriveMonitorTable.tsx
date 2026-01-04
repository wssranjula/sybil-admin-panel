'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, AlertCircle, CheckCircle2, Clock, XCircle, RotateCcw, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getGDriveFiles,
  getGDriveFileStats,
  retryGDriveFile,
  type GDriveFileStatus,
  type GDriveFileStats,
} from '@/lib/api';

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return '-';
  try {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds % 60}s`;
    } else {
      return `${diffSeconds}s`;
    }
  } catch {
    return '-';
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: string) {
  const baseClasses = 'px-2 py-1 text-xs font-semibold';
  
  switch (status) {
    case 'success':
      return (
        <Badge className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Success
        </Badge>
      );
    case 'processing':
      return (
        <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>
          <Clock className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case 'failed':
      return (
        <Badge className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    case 'pending':
      return (
        <Badge className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`}>
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return <Badge className={baseClasses}>{status}</Badge>;
  }
}

export function GDriveMonitorTable() {
  const [files, setFiles] = useState<GDriveFileStatus[]>([]);
  const [stats, setStats] = useState<GDriveFileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set());

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [filesData, statsData] = await Promise.all([
        getGDriveFiles(statusFilter === 'all' ? undefined : statusFilter, 100),
        getGDriveFileStats(),
      ]);
      
      console.log('GDrive Monitor - Files loaded:', filesData?.length || 0);
      console.log('GDrive Monitor - Stats:', statsData);
      
      setFiles(filesData || []);
      setStats(statsData || { total: 0, pending: 0, processing: 0, success: 0, failed: 0 });
      
      // If no files but no error, might need migration
      if ((!filesData || filesData.length === 0) && (!statsData || statsData.total === 0)) {
        console.warn('No files found in database. Run migration: python scripts/migrate_gdrive_state_to_db.py');
      }
    } catch (err) {
      console.error('GDrive Monitor - Error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      // If it's a 404, the endpoint might not exist yet - show a helpful message
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        setError('API endpoint not found. Please ensure the backend is running and the admin database is set up.');
      } else {
        setError(errorMessage);
      }
      // Set empty defaults on error
      setFiles([]);
      setStats({ total: 0, pending: 0, processing: 0, success: 0, failed: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleRetry = async (fileId: string, id: number) => {
    if (retryingIds.has(id)) return;
    
    setRetryingIds(prev => new Set(prev).add(id));
    try {
      await retryGDriveFile(fileId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to retry file');
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleErrorExpansion = (id: number) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getGoogleDriveLink = (fileId: string) => {
    return `https://drive.google.com/file/d/${fileId}/view`;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.processing}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Success</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Refresh */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>File Processing Status</CardTitle>
              <CardDescription>Monitor Google Drive file processing progress</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Files</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
              <Button
                onClick={loadData}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold mb-1">Error Loading Data</div>
                  <div className="text-sm">{error}</div>
                  {error.includes('endpoint not found') && (
                    <div className="text-xs mt-2 text-red-700 dark:text-red-300">
                      Make sure to run: <code className="bg-red-100 dark:bg-red-900/30 px-1 py-0.5 rounded">python scripts/setup_admin_tables.py</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isLoading && files.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading files...</span>
            </div>
          ) : !error && files.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="mb-4">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              </div>
              <p className="text-lg font-medium mb-2">No files found</p>
              <p className="text-sm">
                {statusFilter === 'all' 
                  ? 'No files have been processed yet. Files will appear here once processing starts.'
                  : `No files with status "${statusFilter}" found.`}
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Show all files
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">File Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Processing Time</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Started</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Completed</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={getGoogleDriveLink(file.file_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            {file.file_name}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(file.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDuration(file.processing_started_at, file.processing_completed_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(file.processing_started_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(file.processing_completed_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {file.status === 'failed' && (
                            <Button
                              onClick={() => handleRetry(file.file_id, file.id)}
                              disabled={retryingIds.has(file.id)}
                              variant="outline"
                              size="sm"
                            >
                              {retryingIds.has(file.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="w-4 h-4 mr-1" />
                                  Retry
                                </>
                              )}
                            </Button>
                          )}
                          {file.error_message && (
                            <Button
                              onClick={() => toggleErrorExpansion(file.id)}
                              variant="ghost"
                              size="sm"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Error Messages */}
          {files.map((file) => (
            file.error_message && expandedErrors.has(file.id) && (
              <div
                key={`error-${file.id}`}
                className="mt-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-red-800 dark:text-red-200 mb-1">Error Details</div>
                    <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                      {file.error_message}
                    </pre>
                  </div>
                </div>
              </div>
            )
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

