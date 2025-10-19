import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="footer sm:footer-horizontal footer-center bg-base-300 text-base-content p-4">
      <div className="grid-flow-row">
        <nav>
          <div className="grid grid-flow-col gap-4">
            <a
              href="https://x.com/testkun08080"
              className="btn btn-ghost btn-circle btn-sm"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg
                width="20"
                height="21"
                viewBox="0 0 1200 1227"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
                  fill="black"
                />
              </svg>
            </a>
            <a
              href="https://github.com/testkun08080/yfinance-jp-screener"
              className="btn btn-ghost btn-circle btn-sm"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>
        </nav>
        <aside>
          <p>
            Copyright © {new Date().getFullYear()} - All right reserved by
            testkun
          </p>

          {/* データ利用に関する重要な注意 */}
          <div className="text-xs text-base-content/60 text-center space-y-1 mt-2">
            <p className="font-semibold">
              ⚠️ このプロジェクトは Yahoo Finance
              のデータ取得を補助するツールです
            </p>
            <p>
              取得したデータの利用については Yahoo の利用規約に従ってください
            </p>
            <p>
              本リポジトリはデータ自体を配布しません・個人利用目的のみで使用してください
            </p>
            <p className="font-semibold text-error">
              🔒 プライベートリポジトリでの使用を強く推奨します
            </p>
          </div>

          {/* 投資判断に関する免責事項 */}
          <p className="text-xs text-base-content/50 text-center mt-2">
            ⚠️
            投資判断は自己責任で行ってください。本サービスで提供される情報は投資助言ではありません。
          </p>
        </aside>
      </div>
    </footer>
  );
};
