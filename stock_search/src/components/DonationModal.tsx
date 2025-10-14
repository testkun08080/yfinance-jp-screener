interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonationModal = ({ isOpen, onClose }: DonationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-2xl mb-4 text-center">
          💝 このプロジェクトを応援しませんか？
        </h3>

        <div className="py-4">
          <p className="text-base-content/80 text-center mb-6">
            このツールが役に立ったら、サポートしていただけると嬉しいです。
            頂いた寄付は、継続的な開発とモチベーション維持に繋がります。
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="https://github.com/sponsors/testkun08080"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary gap-2 w-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              GitHub Sponsors で応援
            </a>
            <a
              href="https://www.buymeacoffee.com/testkun08080"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-warning gap-2 w-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
              </svg>
              コーヒーをおごる ☕
            </a>
          </div>

          <div className="alert alert-info mt-6 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>
              寄付は任意です。このツールは引き続き無料でご利用いただけます。
            </span>
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
