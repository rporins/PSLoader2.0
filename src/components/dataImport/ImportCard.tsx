import React, { useRef } from 'react';
import {
  Upload,
  TableChart as FileSpreadsheet,
  Close as X,
  CheckCircle as CheckCircle2,
  Error as AlertCircle,
  Loop as Loader2,
  CancelPresentation as FileX,
  ExpandMore as ChevronDown
} from '@mui/icons-material';
import { ImportFile, ImportStatus } from '../../types/dataImport';

interface ImportCardProps {
  importFile: ImportFile;
  onFileSelect: (importId: string, file: File) => void;
  onRemoveFile: (importId: string) => void;
  isProcessing: boolean;
  fileInputRef?: (ref: HTMLInputElement | null) => void;
}

const ImportCard: React.FC<ImportCardProps> = ({
  importFile,
  onFileSelect,
  onRemoveFile,
  isProcessing,
  fileInputRef
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && importFile.fileTypes.includes(fileExtension)) {
        onFileSelect(importFile.id, file);
      } else {
        alert(`Please select a valid file type: ${importFile.fileTypes.join(', ')}`);
      }
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && importFile.fileTypes.includes(fileExtension)) {
        onFileSelect(importFile.id, file);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const getStatusIcon = () => {
    switch (importFile.status) {
      case ImportStatus.Validating:
      case ImportStatus.Processing:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case ImportStatus.Complete:
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case ImportStatus.Failed:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return importFile.file ? <FileSpreadsheet className="w-5 h-5 text-gray-400" /> : null;
    }
  };

  const getStatusColor = () => {
    switch (importFile.status) {
      case ImportStatus.Validating:
      case ImportStatus.Processing:
        return 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20';
      case ImportStatus.Complete:
        return 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20';
      case ImportStatus.Failed:
        return 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20';
      default:
        return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const isDisabled = isProcessing || importFile.status === ImportStatus.Processing;

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 ${getStatusColor()} ${
        !isDisabled ? 'hover:shadow-md' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {importFile.displayName}
              </h3>
              {importFile.required && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                  Required
                </span>
              )}
            </div>
            {importFile.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {importFile.description}
              </p>
            )}
          </div>
          {getStatusIcon()}
        </div>

        {!importFile.file ? (
          <div
            onClick={() => !isDisabled && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDisabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-900'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Drop file here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Accepts: {importFile.fileTypes.map(ft => `.${ft}`).join(', ')}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileSpreadsheet className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {importFile.fileName}
                  </p>
                  {importFile.rowCount !== undefined && (
                    <p className="text-xs text-gray-500">
                      {importFile.rowCount.toLocaleString()} rows detected
                    </p>
                  )}
                </div>
              </div>
              {!isDisabled && (
                <button
                  onClick={() => onRemoveFile(importFile.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            {importFile.status === ImportStatus.Validating && (
              <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Validating file structure...
                </p>
              </div>
            )}

            {importFile.status === ImportStatus.Complete && (
              <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                <p className="text-xs text-green-700 dark:text-green-400 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  File validated successfully
                </p>
              </div>
            )}

            {importFile.error && (
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">
                <p className="text-xs text-red-700 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {importFile.error}
                </p>
              </div>
            )}
          </div>
        )}

        <input
          ref={(ref) => {
            if (inputRef) inputRef.current = ref;
            if (fileInputRef) fileInputRef(ref);
          }}
          type="file"
          accept={importFile.fileTypes.map(ft => `.${ft}`).join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={isDisabled}
        />
      </div>
    </div>
  );
};

export default ImportCard;