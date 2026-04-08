import { useState } from "react";
import { Link } from "react-router-dom";
import { MdCheck, MdError, MdWarning, MdInfo } from "react-icons/md";
import { useAISettings } from "../hooks/useAISettings";
import { testConnection } from "../services/aiProviders";
import { AI_PROVIDER_DEFAULTS } from "../constants/ai";
import type { AIProvider } from "../types/ai";

type TestStatus = "idle" | "testing" | "ok" | "error";

const PROVIDERS: { value: AIProvider; label: string; description: string }[] = [
  {
    value: "openai",
    label: "OpenAI (ChatGPT)",
    description: "GPT-4o, GPT-4o-mini など",
  },
  {
    value: "anthropic",
    label: "Anthropic (Claude)",
    description: "Claude 3.5 Haiku, Sonnet など",
  },
  {
    value: "ollama",
    label: "Ollama（ローカルLLM）",
    description: "llama3, mistral, gemma など — API キー不要",
  },
  {
    value: "custom",
    label: "カスタム（OpenAI互換）",
    description: "LM Studio など OpenAI 互換 API",
  },
];

export const SettingsPage = () => {
  const { settings, updateSettings, resetSettings } = useAISettings();
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [saved, setSaved] = useState(false);

  const handleProviderChange = (provider: AIProvider) => {
    const defaults = AI_PROVIDER_DEFAULTS[provider];
    updateSettings({
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
      // Keep apiKey when switching between non-ollama providers
    });
    setTestStatus("idle");
    setTestMessage("");
  };

  const handleSave = () => {
    // Settings are already saved reactively in useAISettings,
    // but we show a visual confirmation here.
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
  };

  const isOllama = settings.provider === "ollama";
  const isAnthropic = settings.provider === "anthropic";

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-base-content mb-1">
              🤖 AI 設定
            </h1>
            <p className="text-base-content/60 text-sm">
              スクリーニング中に AI と対話するためのプロバイダー設定
            </p>
          </div>

          {/* Security notice */}
          <div className="alert alert-warning mb-6 text-sm">
            <MdWarning className="text-lg flex-shrink-0" />
            <span>
              APIキーはこのブラウザの localStorage に保存されます。
              <strong>個人端末のみ</strong>
              でご使用ください。
            </span>
          </div>

          {/* Provider selection */}
          <div className="card bg-base-100 border border-base-200 shadow-sm mb-4">
            <div className="card-body">
              <h2 className="card-title text-lg mb-3">プロバイダー選択</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROVIDERS.map((p) => (
                  <label
                    key={p.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      settings.provider === p.value
                        ? "border-primary bg-primary/5"
                        : "border-base-200 hover:border-base-300 hover:bg-base-50"
                    }`}
                  >
                    <input
                      type="radio"
                      className="radio radio-primary radio-sm mt-0.5 flex-shrink-0"
                      checked={settings.provider === p.value}
                      onChange={() => handleProviderChange(p.value)}
                    />
                    <div>
                      <p className="font-semibold text-sm text-base-content">
                        {p.label}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {p.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Connection settings */}
          <div className="card bg-base-100 border border-base-200 shadow-sm mb-4">
            <div className="card-body">
              <h2 className="card-title text-lg mb-3">接続設定</h2>
              <div className="space-y-4">
                {/* API Key — hidden for Ollama */}
                {!isOllama && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">API キー</span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered w-full"
                      placeholder={
                        isAnthropic
                          ? "sk-ant-api03-..."
                          : "sk-..."
                      }
                      value={settings.apiKey}
                      onChange={(e) => updateSettings({ apiKey: e.target.value })}
                      autoComplete="off"
                    />
                  </div>
                )}

                {/* Base URL */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">ベース URL</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="https://api.openai.com/v1"
                    value={settings.baseUrl}
                    onChange={(e) => updateSettings({ baseUrl: e.target.value })}
                  />
                </div>

                {/* Model */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">モデル名</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="gpt-4o-mini"
                    value={settings.model}
                    onChange={(e) => updateSettings({ model: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Provider-specific notes */}
          {isOllama && (
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
          )}
          {isAnthropic && (
            <div className="alert alert-info mb-4 text-sm">
              <MdInfo className="text-lg flex-shrink-0" />
              <span>
                ブラウザから直接 Anthropic API を呼び出すため、
                <code className="mx-1">anthropic-dangerous-allow-browser: true</code>
                ヘッダーを使用します。
              </span>
            </div>
          )}

          {/* Connection test */}
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

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
            >
              {saved ? <><MdCheck className="text-base" /> 保存しました</> : "保存"}
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
