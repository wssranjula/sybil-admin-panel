'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, ExternalLink, ArrowUp, ArrowDown, Settings, Plus, X, AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  getOtterTranscripts,
  getOtterTranscriptStats,
  getOtterConfig,
  updateOtterConfig,
  retryOtterTranscript,
  type OtterTranscript,
  type OtterTranscriptStats,
  type OtterConfig,
} from '@/lib/api';

const DEFAULT_INDICATORS = [
  "hac team call",
  "all hands",
  "srm discussion",
  "us strategy",
  "ben_chris",
  "team",
  "hac",
  "standup",
  "sync",
  "weekly",
  "daily",
  "meeting",
  "call"
];

function getDefaultConfig(): OtterConfig {
  return {
    team_call_indicators: DEFAULT_INDICATORS,
    team_calls_folder_name: "Team Calls",
    private_folder_name: "Private"
  };
}

export function OtterTranscriptsTable() {
  const { logout } = useAuth();
  const [allTranscripts, setAllTranscripts] = useState<OtterTranscript[]>([]);
  const [transcripts, setTranscripts] = useState<OtterTranscript[]>([]);
  const [stats, setStats] = useState<OtterTranscriptStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'processed' | 'failed'>('all');
  const [callTypeFilter, setCallTypeFilter] = useState<'all' | 'team' | 'private'>('all');
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<OtterConfig | null>(null);
  const [newIndicator, setNewIndicator] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [transcriptsData, statsData] = await Promise.all([
        getOtterTranscripts({
          sort_by: sortBy,
          order: sortOrder,
          call_type_filter: callTypeFilter !== 'all' ? callTypeFilter : undefined,
          include_failed: true,
        }),
        getOtterTranscriptStats(),
      ]);
      
      setAllTranscripts(transcriptsData.transcripts);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      
      if (errorMessage.includes('expired') || errorMessage.includes('Authentication')) {
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortOrder, callTypeFilter, logout]);

  const loadConfig = useCallback(async () => {
    try {
      const configData = await getOtterConfig();
      if (!configData.team_call_indicators || configData.team_call_indicators.length === 0) {
        const defaults = getDefaultConfig();
        setConfig({
          ...defaults,
          team_calls_folder_name: configData.team_calls_folder_name || defaults.team_calls_folder_name,
          private_folder_name: configData.private_folder_name || defaults.private_folder_name,
        });
      } else {
        setConfig(configData);
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load config';
      setError(errorMessage);
      setConfig(getDefaultConfig());
    }
  }, []);

  const saveConfig = async () => {
    if (!config) return;
    setIsSavingConfig(true);
    setError(null);
    try {
      const updated = await updateOtterConfig({
        team_call_indicators: config.team_call_indicators,
        team_calls_folder_name: config.team_calls_folder_name,
        private_folder_name: config.private_folder_name,
      });
      setConfig(updated);
      alert(updated.message || 'Config saved successfully! Restart service for changes to fully take effect.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save config';
      setError(errorMessage);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const addIndicator = () => {
    if (!config || !newIndicator.trim()) return;
    const trimmed = newIndicator.trim().toLowerCase();
    if (!config.team_call_indicators.includes(trimmed)) {
      setConfig({
        ...config,
        team_call_indicators: [...config.team_call_indicators, trimmed],
      });
    }
    setNewIndicator('');
  };

  const removeIndicator = (indicator: string) => {
    if (!config) return;
    setConfig({
      ...config,
      team_call_indicators: config.team_call_indicators.filter(i => i !== indicator),
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (showConfig && !config) {
      loadConfig();
    }
  }, [showConfig, config, loadConfig]);

  useEffect(() => {
    let filtered = allTranscripts;
    if (statusFilter === 'processed') {
      filtered = filtered.filter(t => t.status === 'processed');
    } else if (statusFilter === 'failed') {
      filtered = filtered.filter(t => t.status === 'failed');
    }
    setTranscripts(filtered);
  }, [allTranscripts, statusFilter]);

  const handleRetry = async (conversationId: string) => {
    setRetryingId(conversationId);
    setError(null);
    try {
      await retryOtterTranscript(conversationId);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry transcript';
      setError(errorMessage);
    } finally {
      setRetryingId(null);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getGoogleDocUrl = (docId: string | undefined) => {
    if (!docId) return null;
    return `https://docs.google.com/document/d/${docId}`;
  };

  // Loading state
  if (isLoading && transcripts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-2 hover:shadow-lg transition-shadow border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-green-700 dark:text-green-400">
                Total Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                {stats.total_processed}
              </div>
              <CardDescription className="mt-2">
                Transcripts synced to Google Drive
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                Team Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                {stats.team_calls_count ?? 0}
              </div>
              <CardDescription className="mt-2">
                Team meeting transcripts
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-400">
                Private Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-500">
                {stats.private_calls_count ?? 0}
              </div>
              <CardDescription className="mt-2">
                Private meeting transcripts
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-red-700 dark:text-red-400">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-500">
                {stats.failed_count ?? 0}
              </div>
              <CardDescription className="mt-2">
                Failed processing attempts
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow border-teal-200 dark:border-teal-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-teal-700 dark:text-teal-400">
                Last Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-teal-600 dark:text-teal-500">
                {stats.last_processed ? formatDate(stats.last_processed) : 'N/A'}
              </div>
              <CardDescription className="mt-2">
                Most recent transcript sync
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-2 border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Otter Transcripts</CardTitle>
              <CardDescription>
                Monitor all transcripts that have been synced to Google Drive
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'processed' | 'failed')}
                className="px-3 py-2 border border-green-300 dark:border-green-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="processed">Processed</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={callTypeFilter}
                onChange={(e) => setCallTypeFilter(e.target.value as 'all' | 'team' | 'private')}
                className="px-3 py-2 border border-green-300 dark:border-green-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-[140px]"
              >
                <option value="all">All Calls</option>
                <option value="team">Team Calls</option>
                <option value="private">Private</option>
              </select>

              <Button
                onClick={toggleSortOrder}
                variant="outline"
                className="border-green-300 dark:border-green-700"
              >
                {sortOrder === 'desc' ? (
                  <ArrowDown className="h-4 w-4 mr-2" />
                ) : (
                  <ArrowUp className="h-4 w-4 mr-2" />
                )}
                Sort {sortBy === 'date' ? 'Date' : 'Title'} ({sortOrder === 'desc' ? 'Newest' : 'Oldest'})
              </Button>

              <Button
                onClick={() => {
                  setShowConfig(!showConfig);
                  if (!showConfig && !config) {
                    loadConfig();
                  }
                }}
                variant={showConfig ? "default" : "outline"}
                className={showConfig 
                  ? "bg-green-600 text-white hover:bg-green-700 border-green-600" 
                  : "border-green-300 dark:border-green-700"
                }
              >
                <Settings className={`h-4 w-4 mr-2 ${showConfig ? 'animate-spin' : ''}`} />
                {showConfig ? 'Hide Config' : 'Config'}
              </Button>

              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-green-300 dark:border-green-700"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {transcripts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium">No transcripts found</p>
              <p className="text-sm mt-2">
                {statusFilter === 'processed' 
                  ? 'No processed transcripts match the current filter.'
                  : statusFilter === 'failed'
                  ? 'No failed transcripts found.'
                  : 'No transcripts have been processed yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcripts.map((transcript) => (
                <Card
                  key={transcript.conversation_id}
                  className={`hover:shadow-md transition-shadow border-2 animate-in fade-in duration-300 ${
                    transcript.status === 'failed'
                      ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                      : 'border-green-200 dark:border-green-800'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Title</p>
                        <p className="font-semibold text-lg">{transcript.title || 'Untitled'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Conversation ID</p>
                        <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                          {transcript.conversation_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {transcript.status === 'failed' ? 'Failed Date' : 'Processed Date'}
                        </p>
                        <p className="text-sm">{formatDate(transcript.processed_at)}</p>
                      </div>
                      {transcript.status !== 'failed' && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Google Doc ID</p>
                          <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                            {transcript.doc_id || 'N/A'}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status</p>
                        <Badge
                          variant={transcript.status === 'processed' ? 'default' : transcript.status === 'failed' ? 'destructive' : 'secondary'}
                          className={
                            transcript.status === 'processed'
                              ? 'bg-green-600 text-white'
                              : transcript.status === 'failed'
                              ? 'bg-red-600 text-white'
                              : 'bg-teal-600 text-white'
                          }
                        >
                          {transcript.status === 'failed' ? (
                            <span className="flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </span>
                          ) : (
                            transcript.status
                          )}
                        </Badge>
                      </div>
                      {transcript.status !== 'failed' && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Call Type</p>
                          {transcript.call_type ? (
                            <Badge
                              variant="outline"
                              className={
                                transcript.call_type === 'team'
                                  ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
                                  : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                              }
                            >
                              {transcript.call_type === 'team' ? 'Team' : 'Private'}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Unknown</span>
                          )}
                        </div>
                      )}
                      {transcript.status === 'failed' && transcript.error_message && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Error Message</p>
                          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200 dark:border-red-800">
                            {transcript.error_message}
                          </p>
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        {transcript.status === 'failed' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(transcript.conversation_id)}
                            disabled={retryingId === transcript.conversation_id}
                            className="border-red-300 dark:border-red-700 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {retryingId === transcript.conversation_id ? (
                              <span className="flex items-center">
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Retrying...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <RotateCw className="h-4 w-4 mr-1" />
                                Retry
                              </span>
                            )}
                          </Button>
                        ) : transcript.doc_id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = getGoogleDocUrl(transcript.doc_id);
                              if (url) window.open(url, '_blank');
                            }}
                            className="border-green-300 dark:border-green-700 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open Doc
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">No document available</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {isLoading && transcripts.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            </div>
          )}
        </CardContent>
      </Card>

      {showConfig && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfig(false);
            }
          }}
        >
          <Card 
            id="otter-config-panel"
            className="border-2 border-green-200 dark:border-green-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Call Indicators Configuration</CardTitle>
                  <CardDescription>
                    Configure which words in transcript titles indicate team calls
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowConfig(false)}
                  variant="outline"
                  size="sm"
                  className="border-green-300 dark:border-green-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {config ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Call Indicators
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {config.team_call_indicators && config.team_call_indicators.length > 0 ? (
                        config.team_call_indicators.map((indicator) => (
                          <Badge
                            key={indicator}
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700 px-3 py-1"
                          >
                            {indicator}
                            <button
                              onClick={() => removeIndicator(indicator)}
                              className="ml-2 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No indicators configured. Using defaults.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newIndicator}
                        onChange={(e) => setNewIndicator(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addIndicator();
                          }
                        }}
                        placeholder="Add new indicator..."
                        className="flex-1 px-3 py-2 border border-green-300 dark:border-green-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <Button
                        onClick={addIndicator}
                        variant="outline"
                        size="sm"
                        className="border-green-300 dark:border-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Team Calls Folder Name
                      </label>
                      <input
                        type="text"
                        value={config.team_calls_folder_name}
                        onChange={(e) =>
                          setConfig({ ...config, team_calls_folder_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Private Folder Name
                      </label>
                      <input
                        type="text"
                        value={config.private_folder_name}
                        onChange={(e) =>
                          setConfig({ ...config, private_folder_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => setShowConfig(false)}
                      variant="outline"
                      className="border-green-300 dark:border-green-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveConfig}
                      disabled={isSavingConfig || !config.team_call_indicators || config.team_call_indicators.length === 0}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSavingConfig ? (
                        <span className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        'Save Config'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
