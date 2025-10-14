import React, { useState } from "react";

interface ShareButtonProps {
  shareUrl: string;
  title?: string;
  description?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  shareUrl,
  title = "投資分析結果",
  description = "株式検索結果を共有",
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyMessage("🔗 URLをコピーしました！");
      setTimeout(() => setCopyMessage(null), 2000);
    } catch (error) {
      setCopyMessage("❗ URLのコピーに失敗しました");
      setTimeout(() => setCopyMessage(null), 2000);
    }
    setIsDropdownOpen(false);
  };

  const handleSNSShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);

    let shareUrlSNS = "";

    switch (platform) {
      case "twitter":
        shareUrlSNS = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case "facebook":
        shareUrlSNS = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "line":
        shareUrlSNS = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case "linkedin":
        shareUrlSNS = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "email":
        shareUrlSNS = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
        break;
      default:
        return;
    }

    window.open(shareUrlSNS, "_blank", "width=600,height=400");
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <div className="dropdown dropdown-end">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="btn btn-outline btn-sm flex items-center gap-2"
          title="検索結果を共有"
        >
          📤 共有
        </button>

        {isDropdownOpen && (
          <div className="dropdown-content z-[1000] mt-2 menu p-2 shadow-lg bg-base-100 rounded-lg w-64 border border-base-300">
            <div className="menu-title text-sm font-bold text-base-content/70 px-4 py-2">
              📤 検索結果を共有
            </div>

            {/* URL Copy Button */}
            <li>
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-3 hover:bg-base-200 rounded-lg p-3"
              >
                <span className="text-lg">🔗</span>
                <div className="text-left">
                  <div className="font-medium">URLをコピー</div>
                  <div className="text-xs text-base-content/60">
                    リンクをクリップボードにコピー
                  </div>
                </div>
              </button>
            </li>

            <div className="divider my-1"></div>

            {/* SNS Share Buttons */}
            <li>
              <button
                onClick={() => handleSNSShare("twitter")}
                className="flex items-center gap-3 hover:bg-base-200 rounded-lg p-3"
              >
                <span className="text-lg">🐦</span>
                <div className="text-left">
                  <div className="font-medium">Twitter</div>
                  <div className="text-xs text-base-content/60">
                    X (旧Twitter) で共有
                  </div>
                </div>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleSNSShare("line")}
                className="flex items-center gap-3 hover:bg-base-200 rounded-lg p-3"
              >
                <span className="text-lg">💬</span>
                <div className="text-left">
                  <div className="font-medium">LINE</div>
                  <div className="text-xs text-base-content/60">
                    LINEで友達に共有
                  </div>
                </div>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleSNSShare("facebook")}
                className="flex items-center gap-3 hover:bg-base-200 rounded-lg p-3"
              >
                <span className="text-lg">📘</span>
                <div className="text-left">
                  <div className="font-medium">Facebook</div>
                  <div className="text-xs text-base-content/60">
                    Facebookで共有
                  </div>
                </div>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleSNSShare("linkedin")}
                className="flex items-center gap-3 hover:bg-base-200 rounded-lg p-3"
              >
                <span className="text-lg">💼</span>
                <div className="text-left">
                  <div className="font-medium">LinkedIn</div>
                  <div className="text-xs text-base-content/60">
                    LinkedIn で共有
                  </div>
                </div>
              </button>
            </li>

            <div className="divider my-1"></div>

            <li>
              <button
                onClick={() => handleSNSShare("email")}
                className="flex items-center gap-3 hover:bg-base-200 rounded-lg p-3"
              >
                <span className="text-lg">📧</span>
                <div className="text-left">
                  <div className="font-medium">メール</div>
                  <div className="text-xs text-base-content/60">
                    メールで送信
                  </div>
                </div>
              </button>
            </li>
          </div>
        )}
      </div>

      {/* Copy Success Message */}
      {copyMessage && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-success text-success-content text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
          {copyMessage}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-[999]"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};
