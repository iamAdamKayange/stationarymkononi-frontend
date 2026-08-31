'use client';

import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

interface DocumentUploadResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  pageCount: number;
  uploadedById: string;
  createdAt: string;
}

interface DocumentUploadProps {
  onUploadSuccess: (document: DocumentUploadResponse) => void;
  maxFileSize?: number; // in bytes, default 50MB
  acceptedTypes?: string[];
  className?: string;
}

export function DocumentUpload({
  onUploadSuccess,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  className = '',
}: DocumentUploadProps) {
  const { isAuthenticated } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDoc, setUploadedDoc] = useState<DocumentUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `Faili ni kubwa sana. Maksimum: ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB`,
      };
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `Aina ya faili haikubaliki. Zinazokubalika: ${acceptedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!isAuthenticated) {
      toast.error('Tafadhali ingia kwenye akaunti yako ili ku-upload nyaraka');
      return;
    }

    setError(null);
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setError(validation.error || 'Faili si sahihi');
      toast.error(validation.error || 'Faili si sahihi');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = (await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })) as { data: DocumentUploadResponse };

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadedDoc(response.data);
      onUploadSuccess(response.data);
      toast.success(`Nyaraka '${response.data.fileName}' imepakiwa vizuri!`);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Kupakia nyaraka kumeshindikana';
      setError(errorMessage);
      toast.error(errorMessage);
      setUploadedDoc(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [isAuthenticated, maxFileSize, acceptedTypes, onUploadSuccess]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedDoc(null);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!uploadedDoc ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-brand-500 bg-brand-50/30'
              : 'border-slate-300 hover:border-brand-500 bg-slate-50/50 hover:bg-brand-50/30'
          } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            type="file"
            onChange={handleFileInput}
            disabled={isUploading}
            accept={acceptedTypes.join(',')}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 text-brand-600 mx-auto animate-spin" />
              <div>
                <p className="text-sm font-bold text-slate-800">Inapakia nyaraka...</p>
                <p className="text-xs text-slate-500 mt-1">{uploadProgress}% imekamilika</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <UploadCloud className={`w-12 h-12 mx-auto ${isDragging ? 'text-brand-600 animate-bounce' : 'text-brand-600'}`} />
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {isDragging ? 'Rusha faili hapa' : 'Bonyeza au buruta nyaraka hapa'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, DOC, DOCX, JPG, PNG (Upeo wa {(maxFileSize / (1024 * 1024)).toFixed(0)}MB)
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{uploadedDoc.fileName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-brand-800">
                    {uploadedDoc.pageCount} kurasa • {formatFileSize(uploadedDoc.fileSize)}
                  </p>
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Imepakiwa: {new Date(uploadedDoc.createdAt).toLocaleString('sw-TZ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-brand-100 rounded-lg transition-colors"
              title="Ondoa faili"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}