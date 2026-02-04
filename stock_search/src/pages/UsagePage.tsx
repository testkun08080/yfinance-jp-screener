import { Breadcrumb } from "../components/Breadcrumb";
import { EXTERNAL_URLS } from "../constants/urls";
import { BREADCRUMB_ITEMS } from "../constants/ui";

export const UsagePage = () => {
  const breadcrumbItems = [BREADCRUMB_ITEMS.home, BREADCRUMB_ITEMS.usage];

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-base-content mb-2">
              📚 使い方
            </h1>
            <p className="text-base-content/70">
              このアプリの使い方やセットアップ方法について
            </p>
          </div>

          {/* 記事リンクセクション */}
          <div className="card bg-base-200 shadow-sm mb-8">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">
                📖 詳細な使い方ガイド
              </h2>
              <p className="text-base-content/80 leading-relaxed mb-6">
                このアプリの使い方やセットアップ方法については、以下の記事をご覧ください。
                開発者向けの詳細な情報から、初心者向けの分かりやすい説明まで用意しています。
              </p>

              <div className="space-y-6">
                {/* Zenn記事 */}
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">📘</div>
                      <div className="flex-1">
                        <h3 className="card-title text-xl mb-2">
                          開発者向け記事（Zenn）
                        </h3>
                        <p className="text-base-content/70 mb-4">
                          技術的な詳細、アーキテクチャ、セットアップ方法、GitHub
                          Actions
                          の使い方など、開発者向けの詳細な情報を掲載しています。
                        </p>
                        <a
                          href={EXTERNAL_URLS.documentation.zennArticle}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                          Zenn記事を読む
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note記事 */}
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">📝</div>
                      <div className="flex-1">
                        <h3 className="card-title text-xl mb-2">
                          初心者向け記事（Note）
                        </h3>
                        <p className="text-base-content/70 mb-4">
                          プログラミング初心者の方でも理解しやすいように、基本的な使い方から丁寧に説明しています。
                        </p>
                        <a
                          href={EXTERNAL_URLS.documentation.noteArticle}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                          Note記事を読む
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* README */}
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">📋</div>
                      <div className="flex-1">
                        <h3 className="card-title text-xl mb-2">
                          GitHub README
                        </h3>
                        <p className="text-base-content/70 mb-4">
                          プロジェクトの概要、セットアップ手順、技術スタックなどの詳細情報は
                          GitHub の README をご覧ください。
                        </p>
                        <a
                          href={EXTERNAL_URLS.documentation.readme}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          READMEを読む
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* クイックスタート */}
          <div className="card bg-base-100 shadow-sm mb-8">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">🚀 クイックスタート</h2>
              <div className="space-y-4 text-base-content/80 leading-relaxed">
                <p>
                  このアプリは、CSV
                  ファイルをドラッグ&ドロップするだけで、日本株のスクリーニングが可能です。
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>
                    <strong>データの取得</strong>
                    <br />
                    データは GitHub Actions
                    を使用して自動取得するか、ローカル環境で取得できます。
                    詳細は上記の記事をご覧ください。
                  </li>
                  <li>
                    <strong>CSV ファイルのアップロード</strong>
                    <br />
                    ホームページで CSV
                    ファイルをドラッグ&ドロップするか、ファイル選択ボタンからアップロードします。
                  </li>
                  <li>
                    <strong>スクリーニング</strong>
                    <br />
                    検索フィルターを使用して、条件に合う銘柄を絞り込みます。
                  </li>
                  <li>
                    <strong>結果の確認・ダウンロード</strong>
                    <br />
                    検索結果を確認し、必要に応じて CSV
                    形式でダウンロードできます。
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="mt-8 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm text-center">
              ⚠️ <strong>データの取り扱いについて</strong>
              <br />
              このプロジェクトは個人利用・研究・教育目的でのみ使用してください。
              データの取得方法や利用規約については、上記の記事や README
              を必ずご確認ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
