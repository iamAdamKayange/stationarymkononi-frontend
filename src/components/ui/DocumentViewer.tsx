'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Eye,
  Calendar,
  User,
  HardDrive,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
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

interface DocumentViewerProps {
  document: Document;
  onClose?: () => void;
  showActions?: boolean;
}

export function DocumentViewer({ document: documentData, onClose, showActions = true }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Set preview URL based on file type
    if (documentData.fileType === 'application/pdf') {
      setPreviewUrl(documentData.viewUrl || documentData.fileUrl);
    } else if (documentData.fileType.startsWith('image/')) {
      setPreviewUrl(documentData.viewUrl || documentData.fileUrl);
    } else {
      setPreviewUrl(null); // Cannot preview non-PDF/image files
    }
  }, [documentData]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (documentData.fileType === 'application/pdf') {
      return <FileText className="w-6 h-6 text-red-600" />;
    } else if (documentData.fileType.startsWith('image/')) {
      return <Eye className="w-6 h-6 text-blue-600" />;
    }
    return <FileText className="w-6 h-6 text-slate-600" />;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const downloadUrl = documentData.downloadUrl || documentData.fileUrl;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = documentData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Faili limeanza kushushwa');
    } catch (error) {
      toast.error('Imeshindikana kushusha faili');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const printUrl = documentData.viewUrl || documentData.fileUrl;
      
      // For PDF files, open in new tab and trigger print
      if (documentData.fileType === 'application/pdf') {
        const printWindow = window.open(printUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        } else {
          toast.error('Imeshindikana kufungua dirisha la uchapaji');
        }
      } else {
        // For images, print directly
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>${documentData.fileName}</title>
                <style>
                  body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                  img { max-width: 100%; max-height: 100vh; }
                </style>
              </head>
              <body>
                <img src="${printUrl}" alt="${documentData.fileName}" onload="window.print(); window.close();" />
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
      toast.success('Oda ya uchapaji imewekwa');
    } catch (error) {
      toast.error('Imeshindikana kuandaa uchapaji');
    } finally {
      setIsPrinting(false);
    }
  };

  const canPreview = previewUrl !== null;
  const isPdf = documentData.fileType === 'application/pdf';
  const isImage = documentData.fileType.startsWith('image/');

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              {getFileIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg line-clamp-2">{documentData.fileName}</h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-brand-100">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  {formatFileSize(documentData.fileSize)}
                </span>
                {documentData.pageCount > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {documentData.pageCount} kurasa
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(documentData.createdAt).toLocaleDateString('sw-TZ')}
                </span>
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Funga"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Document Info */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Aliyepakia</p>
              <p className="text-sm font-semibold text-slate-900">{documentData.uploadedBy.fullName}</p>
              <p className="text-xs text-slate-600">{documentData.uploadedBy.phoneNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Aina ya Faili</p>
              <p className="text-sm font-semibold text-slate-900">
                {isPdf ? 'PDF Document' : isImage ? 'Image' : 'Document'}
              </p>
              <p className="text-xs text-slate-600">{documentData.fileType}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="p-6">
        {canPreview ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-600" />
                Mtazamo wa Nyaraka (Preview)
              </h4>
              <Badge variant={isPdf ? 'brand' : 'success'} size="sm">
                {isPdf ? 'PDF' : 'Image'}
              </Badge>
            </div>

            {previewError ? (
              <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                <p className="text-sm text-red-700">Imeshindikana kupakia mtazamo wa nyaraka</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setPreviewError(false)}
                >
                  Jaribu Tena
                </Button>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                {isPdf ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-96"
                    title={documentData.fileName}
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={documentData.fileName}
                    className="w-full h-96 object-contain mx-auto"
                    onError={() => setPreviewError(true)}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600">
              Mtazamo haupatikani kwa aina hii ya faili. Tafadhali shusha faili kuona maudhui.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleDownload}
              disabled={isDownloading}
              leftIcon={<Download className="w-4 h-4" />}
              isLoading={isDownloading}
            >
              {isDownloading ? 'Inashusha...' : 'Shusha Faili (Download)'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handlePrint}
              disabled={isPrinting}
              leftIcon={<Printer className="w-4 h-4" />}
              isLoading={isPrinting}
            >
              {isPrinting ? 'Inaandaa...' : 'Chapa (Print)'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}