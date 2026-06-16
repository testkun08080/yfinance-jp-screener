import { useState } from "react";
import { MdLink } from "react-icons/md";

interface ShareUrlButtonProps {
  onCopyShareUrl: () => Promise<boolean>;
  className?: string;
}

export function ShareUrlButton({ onCopyShareUrl, className = "" }: ShareUrlButtonProps) {
  const [copyOk, setCopyOk] = useState(false);

  const handleCopy = async () => {
    const ok = await onCopyShareUrl();
    setCopyOk(ok);
    if (ok) setTimeout(() => setCopyOk(false), 2000);
  };

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copyOk ? "URLをコピーしました" : "現在の条件でURLをコピー"}
        title={copyOk ? "コピーしました" : "URL共有"}
        className="btn btn-outline btn-sm inline-flex items-center justify-center min-h-9 h-9 w-9 px-0 gap-0"
      >
        <MdLink className="text-xl shrink-0" aria-hidden />
      </button>
      {copyOk && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-base-100 border border-base-300 text-sm rounded-lg shadow-lg whitespace-nowrap z-20">
          コピーしました
        </div>
      )}
    </div>
  );
}
