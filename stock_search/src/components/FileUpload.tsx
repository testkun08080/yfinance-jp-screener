import React, { useRef } from "react";
import { CSV_FILE_CONFIG } from "../constants/csv";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  loading,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === CSV_FILE_CONFIG.mimeType) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-base-content mb-4">
        CSVファイル読み込み
      </h3>

      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${loading ? "border-gray-300 bg-gray-50" : "border-primary hover:border-primary-focus hover:bg-primary/5"}
        `}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={CSV_FILE_CONFIG.acceptAttribute}
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-base-content/70">CSVファイルを読み込み中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl text-primary">📁</div>
            <div>
              <p className="text-base-content font-medium mb-1">
                CSVファイルをドラッグ&ドロップ
              </p>
              <p className="text-base-content/70 text-sm">
                または
                <span className="text-primary font-medium">
                  クリックして選択
                </span>
              </p>
            </div>
            <div className="text-xs text-base-content/50">
              対応形式: CSV ({CSV_FILE_CONFIG.extension})
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error mt-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
