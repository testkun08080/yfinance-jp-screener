import { useState } from "react";
import { Link } from "react-router-dom";
import { MdCheck, MdError, MdInfo, MdRefresh, MdWarning } from "react-icons/md";
import { useAISettings } from "../hooks/useAISettings";
import {
  fetchOllamaTags,
  getOllamaRootFromOpenAIBaseUrl,
  type OllamaTagModel,
  testConnection,
} from "../services/aiProviders";
import { AI_SYSTEM_PROMPT, OLLAMA_DEFAULTS } from "../constants/ai";

type TestStatus = "idle" | "testing" | "ok" | "error";

function formatBytes(n: number | undefined): string {
  if (n == null || n <= 0) return "—";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.min(
    Math.floor(Math.log(n) / Math.log(k)),
    units.length - 1
  );
  const v = n / Math.pow(k, i);
  const decimals = i === 0 ? 0 : i <= 2 ? 1 : 2;
  return `${v.toFixed(decimals)} ${units[i]}`;
}

export const SettingsPage = () => {
  const { settings, updateSettings, resetSettings } = useAISettings();
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [saved, setSaved] = useState(false);

  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [tagsHttpStatus, setTagsHttpStatus] = useState<number | null>(null);
  const [tagModels, setTagModels] = useState<OllamaTagModel[]>([]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTestStatus("testing");
    setTestMessage("");
    const result = await testConnection(settings);
    setTestStatus(result.ok ? "ok" : "error");
    setTestMessage(result.message);
  };

  const handleReset = () => {
    resetSettings();
    setTestStatus("idle");
    setTestMessage("");
    setTagsError(null);
    setTagsHttpStatus(null);
    setTagModels([]);
  };

  const handleFetchTags = async () => {
    setTagsLoading(true);
    setTagsError(null);
    setTagsHttpStatus(null);
    const result = await fetchOllamaTags(settings.baseUrl);
    setTagsLoading(false);
    setTagsHttpStatus(result.httpStatus ?? null);
    if (result.ok) {
      setTagModels(result.models);
      setTagsError(null);
    } else {
      setTagModels([]);
      setTagsError(result.error ?? "取得に失敗しました");
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-base-content mb-1">
              🤖 AI 設定（Ollama）
            </h1>
            <p className="text-base-content/60 text-sm">
              ローカルの Ollama と連携してスクリーニング結果を分析します
            </p>
          </div>

          <div className="alert alert-warning mb-6 text-sm">
            <MdWarning className="text-lg flex-shrink-0" />
            <span>
              接続先はローカルの Ollama のみです。ブラウザから直接リクエストするため、
              下記の CORS 設定が必要です。
            </span>
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm mb-4">
            <div className="card-body">
              <h2 className="card-title text-lg mb-3">接続設定</h2>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">ベース URL</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full font-mono text-sm"
                    placeholder={OLLAMA_DEFAULTS.baseUrl}
                    value={settings.baseUrl}
                    onChange={(e) => updateSettings({ baseUrl: e.target.value })}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">
                      OpenAI 互換 API のベース（例: …/v1 まで）
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">モデル名</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full font-mono text-sm"
                    placeholder={OLLAMA_DEFAULTS.model}
                    value={settings.model}
                    onChange={(e) => updateSettings({ model: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm mb-4">
            <div className="card-body">
              <h2 className="card-title text-lg mb-1">マスターシステムプロンプト</h2>
              <p className="text-sm text-base-content/60 mb-3">
                AI
                チャットで毎回の先頭に送るシステム指示です。データビューアの絞り込み表は、この後ろに自動で付与されます（ここには含めなくて構いません）。
              </p>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-medium">プロンプト本文</span>
                  <span className="label-text-alt text-base-content/50">
                    {settings.systemPrompt.trim() === ""
                      ? "空欄 → アプリ既定を使用"
                      : `${settings.systemPrompt.length} 文字`}
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full font-sans text-sm leading-relaxed min-h-[14rem] max-h-[28rem]"
                  spellCheck={false}
                  value={settings.systemPrompt}
                  onChange={(e) =>
                    updateSettings({ systemPrompt: e.target.value })
                  }
                  placeholder={AI_SYSTEM_PROMPT}
                  aria-label="マスターシステムプロンプト"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    updateSettings({ systemPrompt: AI_SYSTEM_PROMPT })
                  }
                >
                  アプリ既定の文言に戻す
                </button>
              </div>
            </div>
          </div>

          <div className="alert alert-info mb-4 text-sm">
            <MdInfo className="text-lg flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Ollama の CORS 設定が必要です</p>
              <p className="font-mono text-xs bg-base-100/60 px-2 py-1 rounded mt-1 inline-block">
                OLLAMA_ORIGINS=* ollama serve
              </p>
              <p className="mt-1 text-xs text-base-content/70">
                または環境変数 <code>OLLAMA_ORIGINS</code> に使用するサイトの URL を設定してください。
              </p>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm mb-4">
            <div className="card-body">
              <h2 className="card-title text-lg mb-1">Ollama API（/api/tags）</h2>
              <p className="text-sm text-base-content/60 mb-3">
                設定のベース URL から Ollama ルート（
                <code className="text-xs bg-base-200 px-1 rounded">
                  {getOllamaRootFromOpenAIBaseUrl(settings.baseUrl) || "—"}
                </code>
                ）を求め、<code className="text-xs">GET /api/tags</code>{" "}
                で API の有効性とモデル一覧を取得します。
              </p>
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <button
                  type="button"
                  className={`btn btn-outline btn-sm ${
                    tagsLoading ? "loading" : ""
                  }`}
                  onClick={handleFetchTags}
                  disabled={tagsLoading}
                >
                  {!tagsLoading && (
                    <>
                      <MdRefresh className="text-base" />
                      モデル一覧を取得
                    </>
                  )}
                  {tagsLoading && "取得中..."}
                </button>
                {tagsHttpStatus != null && (
                  <span className="text-sm text-base-content/70">
                    HTTP {tagsHttpStatus}
                    {tagsHttpStatus === 200 && (
                      <span className="text-success ml-2">· API 応答あり</span>
                    )}
                  </span>
                )}
              </div>
              {tagsError && (
                <p className="text-sm bg-error/10 text-error px-3 py-2 rounded-lg mb-3">
                  {tagsError}
                </p>
              )}
              {tagModels.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-base-200">
                  <table className="table table-sm table-zebra">
                    <thead>
                      <tr>
                        <th>モデル名</th>
                        <th>サイズ</th>
                        <th>パラメータ</th>
                        <th>量子化</th>
                        <th>備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tagModels.map((m) => (
                        <tr key={m.name}>
                          <td className="font-mono text-xs whitespace-nowrap">
                            {m.name}
                          </td>
                          <td className="text-xs whitespace-nowrap">
                            {formatBytes(m.size)}
                          </td>
                          <td className="text-xs">
                            {m.details?.parameter_size ?? "—"}
                          </td>
                          <td className="text-xs">
                            {m.details?.quantization_level ?? "—"}
                          </td>
                          <td className="text-xs text-base-content/70">
                            {m.remote_host ? (
                              <>
                                クラウド: {m.remote_model ?? ""}
                                <br />
                                <span className="opacity-80">{m.remote_host}</span>
                              </>
                            ) : (
                              "ローカル"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm mb-6">
            <div className="card-body">
              <h2 className="card-title text-lg mb-3">接続テスト</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  className={`btn btn-outline btn-sm ${
                    testStatus === "testing" ? "loading" : ""
                  }`}
                  onClick={handleTest}
                  disabled={testStatus === "testing"}
                >
                  {testStatus !== "testing" && "接続テスト"}
                  {testStatus === "testing" && "テスト中..."}
                </button>

                {testStatus === "ok" && (
                  <div className="flex items-center gap-1.5 text-success text-sm">
                    <MdCheck className="text-base" />
                    <span>接続 OK</span>
                  </div>
                )}
                {testStatus === "error" && (
                  <div className="flex items-center gap-1.5 text-error text-sm">
                    <MdError className="text-base" />
                    <span>エラー</span>
                  </div>
                )}
              </div>
              {testMessage && (
                <p
                  className={`mt-2 text-xs px-3 py-2 rounded-lg ${
                    testStatus === "ok"
                      ? "bg-success/10 text-success"
                      : "bg-error/10 text-error"
                  }`}
                >
                  {testMessage}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
            >
              {saved ? (
                <>
                  <MdCheck className="text-base" /> 保存しました
                </>
              ) : (
                "保存"
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-base-content/60"
              onClick={handleReset}
            >
              リセット
            </button>
            <Link to="/" className="btn btn-ghost btn-sm ml-auto">
              ← データビューアに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
