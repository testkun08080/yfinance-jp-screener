import { useState } from "react";
import { CSVViewer } from "../components/CSVViewer";
import { Breadcrumb } from "../components/Breadcrumb";
import { FileUpload } from "../components/FileUpload";

interface CSVFile {
  name: string;
  displayName: string;
  size: number;
  lastModified: string;
  url: string;
}

export const DataPage = () => {
  const [selectedFile, setSelectedFile] = useState<CSVFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setUploadError(null);

    // アップロードされたファイルをCSVFile形式に変換
    const uploadedCSVFile: CSVFile = {
      name: file.name,
      displayName: file.name,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      url: URL.createObjectURL(file),
    };

    setSelectedFile(uploadedCSVFile);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb />
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-base-content mb-2">
          📊 データビューア
        </h1>
        <p className="text-base-content/70">
          CSVファイルをドラッグ&ドロップして分析開始
        </p>
      </div>

      {/* 法的注意事項バナー */}
      <div className="alert alert-warning mb-6">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <div className="font-bold">個人利用目的のみでご利用ください</div>
          <div className="text-sm">
            Yahoo Financeデータの二次配布は禁止されています。
            <a href="/about" className="link link-primary ml-2">
              詳細はこちら
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ファイルアップロード領域 */}
        <FileUpload
          onFileSelect={handleFileUpload}
          loading={false}
          error={uploadError}
        />

        {/* 読み込み済みファイル情報 */}
        {selectedFile && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-lg">📄 {selectedFile.name}</h2>
                  <div className="text-sm text-base-content/70 mt-1">
                    サイズ: {formatFileSize(selectedFile.size)} | 更新日:{" "}
                    {formatDate(selectedFile.lastModified)}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setSelectedFile(null)}
                  aria-label="ファイルを閉じる"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSVビューア */}
        {selectedFile ? (
          <CSVViewer file={selectedFile} />
        ) : (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-2">
                CSVファイルを読み込んでください
              </h3>
              <p className="text-base-content/70 mb-4">
                上のエリアにCSVファイルをドラッグ&ドロップ
                <br />
                またはクリックしてファイルを選択
              </p>

              <div className="divider my-8">使い方</div>

              <div className="max-w-2xl mx-auto text-left">
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm">
                    <div className="font-semibold mb-2">
                      データの取得方法について
                    </div>
                    <p>
                      CSVデータの取得方法は{" "}
                      <a
                        href="https://github.com/testkun08080/yfinance-jp-screener#readme"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
                      >
                        README
                      </a>{" "}
                      をご確認ください
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
