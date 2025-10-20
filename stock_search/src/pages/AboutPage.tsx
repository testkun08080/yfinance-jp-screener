import { Breadcrumb } from "../components/Breadcrumb";
import { FaGithub, FaEnvelope } from "react-icons/fa";
import { EXTERNAL_URLS } from "../constants/urls";
import { BREADCRUMB_ITEMS } from "../constants/ui";

export const AboutPage = () => {
  const breadcrumbItems = [
    BREADCRUMB_ITEMS.home,
    BREADCRUMB_ITEMS.about,
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-base-content mb-2">
            ℹ️ このアプリについて
          </h1>
          <p className="text-base-content/70">
            yf x 日本株スクリーニングサービス
          </p>
        </div>

        {/* 概要 */}
        <div className="card bg-base-200 shadow-sm mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">🎯 概要</h2>
            <p className="text-base-content/80 leading-relaxed">
              本サービスは、YahooFinanceのデータを使った日本株式のスクリーニングサービスです。
            </p>
          </div>
        </div>

        {/* なぜ作成したか */}
        <div className="card bg-base-200 shadow-sm mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">❓ なぜ作成したか？</h2>
            <div className="space-y-4 text-base-content/80 leading-relaxed">
              <p>
                日本で頑張ってる企業を見つけたい。
                <br />
                けど、せっかくなら割安株を見つけてみたい。
                <br /> そんな想いと、
                <a
                  href={EXTERNAL_URLS.sponsorship.amazonBook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary font-semibold"
                >
                  わが投資術
                </a>
                という本を拝読して作り始めたのがきっかけです。
              </p>
              <p>
                少しプログラムの知識がありましたので、yfinanceのデータを使用してまずはこのアプリで検索がしやすいように可視化してみました。
              </p>
              <p>
                日本をもっと盛り上げていく企業を探して、利益も出しつつ、というようなwin-winを目指して作成しました。
              </p>
              <p>
                また、わが投資術の著者がおっしゃっているように、
                <br />
                「なんでもいいから他人の役に立っている」という実感が生きていく上で必要なのではないかとおっしゃっています。
              </p>
              <p>実際私もそう感じるところがあります。</p>
              <p className="font-semibold">
                このプロジェクトが使われる方の役に立てれば幸いです。
              </p>
            </div>
          </div>
        </div>

        {/* データソース */}
        <div className="card bg-base-100 shadow-sm mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
              📊 データソース / 🙏 お礼
            </h2>
            <p className="text-base-content/80 leading-relaxed mb-4">
              株式のリストは以下のJPXのエクセルデータを元にしています。
            </p>
            <ul className="list-disc list-inside text-base-content/80 mb-4">
              <li>
                <a
                  href={EXTERNAL_URLS.dataSources.jpxData}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  JPX (日本取引所グループ) 公式データ
                </a>
              </li>
              <li>
                <a
                  href={EXTERNAL_URLS.dataSources.yfinanceAPI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  yfinance APIによるデータ
                </a>
              </li>
            </ul>
            <p className="text-base-content/80 leading-relaxed">
              ※使わせていただいているJPXのデータやyfinanceの作成者に感謝申し上げます。
            </p>
          </div>
        </div>

        {/* 法的情報・重要な注意事項 */}
        <div className="card bg-error/5 border border-error/20 shadow-sm mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4 text-error">
              ⚖️ 法的情報・重要な注意事項
            </h2>

            <div className="alert alert-warning mb-4">
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
                <h3 className="font-bold">データ利用に関する重要な警告</h3>
                <div className="text-sm mt-2">
                  本サービスは<strong>個人利用目的のみ</strong>
                  でご利用ください。
                </div>
              </div>
            </div>

            <div className="space-y-4 text-base-content/80 leading-relaxed">
              <div>
                <h3 className="font-semibold text-base-content mb-2">
                  📌 yfinance ライセンス情報
                </h3>
                <p className="mb-2">
                  このプロジェクトは <strong>yfinance</strong>{" "}
                  ライブラリを使用してYahoo
                  Financeの公開APIからデータを取得しています。
                </p>
                <div className="bg-base-200 p-4 rounded-lg mb-2">
                  <p className="text-sm italic">
                    "yfinance is distributed under the Apache Software License."
                  </p>
                  <p className="text-sm italic mt-2">
                    "<strong>AGAIN</strong> - yfinance is{" "}
                    <strong>
                      not affiliated, endorsed, or vetted by Yahoo, Inc.
                    </strong>
                    It's an open-source tool that uses Yahoo's publicly
                    available APIs, and is intended for
                    <strong> research and educational purposes</strong>."
                  </p>
                </div>
              </div>

              <div className="divider"></div>

              <div>
                <h3 className="font-semibold text-base-content mb-2">
                  🚫 データの二次配布禁止
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Yahoo Financeから取得したデータの
                    <strong className="text-error">二次配布は禁止</strong>
                    されています
                  </li>
                  <li>
                    データは<strong>あなた自身の環境</strong>で取得してください
                  </li>
                  <li>
                    本サービスのリポジトリにはデータファイルは含まれていません
                  </li>
                  <li>ユーザーは個人的な研究・教育目的でのみ使用できます</li>
                </ul>
              </div>

              <div className="divider"></div>

              <div>
                <h3 className="font-semibold text-base-content mb-2">
                  📚 Yahoo! 利用規約
                </h3>
                <p className="mb-2">
                  取得したデータの使用権については、以下のYahoo!の利用規約を参照してください：
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>
                    <a
                      href={EXTERNAL_URLS.legal.yahooTerms}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      Yahoo Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href={EXTERNAL_URLS.legal.yahooDevTerms}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      Yahoo Developer Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href={EXTERNAL_URLS.legal.yahooFinanceTerms}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      Yahoo Finance Terms
                    </a>
                  </li>
                </ul>
              </div>

              <div className="divider"></div>

              <div>
                <h3 className="font-semibold text-base-content mb-2">
                  ✅ データ取得方法
                </h3>
                <p className="mb-2">
                  データの取得方法や使用方法については、{" "}
                  <a
                    href={EXTERNAL_URLS.social.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary font-semibold"
                  >
                    GitHubリポジトリのREADME
                  </a>{" "}
                  を参考にしてください。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 寄付について */}
        <div className="card bg-base-100 shadow-sm mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">💰 寄付について</h2>
            <div className="space-y-4 text-base-content/80 leading-relaxed">
              <p>
                このプロジェクトが役に立った場合、任意で寄付を受け付けています。
              </p>

              {/* 寄付ボタン */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center my-6">
                <a
                  href={EXTERNAL_URLS.sponsorship.githubSponsors}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary gap-2 flex-1 sm:flex-initial"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  GitHub Sponsors
                </a>
                <a
                  href={EXTERNAL_URLS.sponsorship.buyMeACoffee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-warning gap-2 flex-1 sm:flex-initial"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
                  </svg>
                  Buy Me a Coffee
                </a>
              </div>

              <div className="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <div>
                  <p className="text-sm mt-1">
                    開発の継続やモチベーション維持になります！
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* コンタクト */}
        <div className="card bg-base-100 shadow-sm mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">📧 コンタクト</h2>
            <p className="text-base-content/80 leading-relaxed mb-4">
              ご質問やご要望がございましたら、お気軽にご連絡ください。
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href={EXTERNAL_URLS.social.email}
                className="btn btn-outline gap-2 hover:bg-red-500 hover:text-white hover:border-red-500"
                title="メールでお問い合わせ"
              >
                <FaEnvelope size={20} />
                メール
              </a>
              <a
                href={EXTERNAL_URLS.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline gap-2 hover:bg-gray-800 hover:text-white hover:border-gray-800"
                title="GitHub プロフィール"
              >
                <FaGithub size={20} />
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* 注意・免責事項 */}
        <div className="mt-8 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <p className="text-sm text-center">
            ⚠️ <strong>投資判断に関する免責事項</strong>
            <br />
            本サービスで提供される情報は参考情報であり、投資助言ではありません。
            投資判断は自己責任で行い、損失に対する責任は負いかねます。
          </p>
        </div>
      </div>
    </div>
  );
};
