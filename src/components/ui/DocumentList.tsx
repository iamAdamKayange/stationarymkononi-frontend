'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Eye,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { DocumentViewer } from './DocumentViewer';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  pageCount: number;
  uploadedById: string;
  uploadedBy: {
    id: string;
    fullName: string;
    username: string;
    phoneNumber: string;
  };
  createdAt: string;
  downloadUrl?: string;
  viewUrl?: string;
}

interface DocumentListProps {
  stationeryId?: string;
  onDocumentSelect?: (document: Document) => void;
  showFilters?: boolean;
}

export function DocumentList({ stationeryId, onDocumentSelect, showFilters = true }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image' | 'other'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  useEffect(() => {
    loadDocuments();
  }, [stationeryId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = (await api.get('/documents')) as { data: Document[] };
      if (response?.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      toast.error('Imeshindikana kupakia orodha ya nyaraka');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents
    .filter((doc) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          doc.fileName.toLowerCase().includes(query) ||
          doc.uploadedBy.fullName.toLowerCase().includes(query) ||
          doc.uploadedBy.phoneNumber.includes(query)
        );
      }
      return true;
    })
    .filter((doc) => {
      // Type filter
      if (filterType === 'pdf') return doc.fileType === 'application/pdf';
      if (filterType === 'image') return doc.fileType.startsWith('image/');
      if (filterType === 'other') return doc.fileType !== 'application/pdf' && !doc.fileType.startsWith('image/');
      return true;
    })
    .sort((a, b) => {
      // Sort
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name') return a.fileName.localeCompare(b.fileName);
      return 0;
    });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-600" />;
    } else if (fileType.startsWith('image/')) {
      return <Eye className="w-4 h-4 text-blue-600" />;
    }
    return <FileText className="w-4 h-4 text-slate-600" />;
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
  };

  const handleRefresh = () => {
    loadDocuments();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-600 mx-auto animate-spin mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Inapakia nyaraka...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nyaraka Zilizopakiwa</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {filteredDocuments.length} nyaraka {filterType !== 'all' && `(imechujwa: ${filterType})`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} leftIcon={<Loader2 className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tafuta kwa jina la faili, mteja au namba ya simu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'pdf' | 'image' | 'other')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer text-slate-900 dark:text-slate-100"
              >
                <option value="all">Aina Zote</option>
                <option value="pdf">PDF Tu</option>
                <option value="image">Picha Tu</option>
                <option value="other">Nyingine</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            >
              <option value="newest">Mpya Kwanza</option>
              <option value="oldest">Zamani Kwanza</option>
              <option value="name">Kwa Jina</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
          <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Hakuna nyaraka zilizopakiwa</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {searchQuery || filterType !== 'all'
              ? 'Hakuna nyaraka zinazolingana na mchango wako.'
              : 'Bado hakuna nyaraka zilizopakiwa kwenye mfumo.'}
          </p>
          {(searchQuery || filterType !== 'all') && (
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setFilterType('all'); }}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        /* Document List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              onClick={() => handleDocumentClick(document)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/40 transition-colors">
                  {getFileTypeIcon(document.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                    {document.fileName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="neutral" size="sm">
                      {document.fileType === 'application/pdf' ? 'PDF' : document.fileType.startsWith('image/') ? 'Image' : 'Doc'}
                    </Badge>
                    {document.pageCount > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{document.pageCount} pg</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate">{document.uploadedBy.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(document.createdAt).toLocaleDateString('sw-TZ')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">{document.uploadedBy.phoneNumber}</span>
                <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-medium">View</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DocumentViewer
              document={selectedDocument}
              onClose={() => setSelectedDocument(null)}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}