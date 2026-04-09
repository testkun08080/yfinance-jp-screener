import { Link } from "react-router-dom";
import { MdArrowBack, MdSettings, MdSmartToy } from "react-icons/md";
import { AIChatView } from "../components/AIChatView";
import { useAISettings } from "../hooks/useAISettings";

export const ChatPage = () => {
  const { isConfigured } = useAISettings();

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-base-200 flex-shrink-0">
        <Link
          to="/"
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="データビューアに戻る"
          title="データビューアに戻る"
        >
          <MdArrowBack className="text-xl" />
        </Link>
        <MdSmartToy className="text-primary text-xl flex-shrink-0" />
        <h1 className="text-lg font-semibold text-base-content truncate flex-1">
          AI チャット
        </h1>
        <Link
          to="/settings"
          className="btn btn-ghost btn-sm gap-1 text-base-content/70"
        >
          <MdSettings className="text-base" />
          <span className="hidden sm:inline">設定</span>
        </Link>
      </header>

      <AIChatView isConfigured={isConfigured} className="flex-1" />
    </div>
  );
};
