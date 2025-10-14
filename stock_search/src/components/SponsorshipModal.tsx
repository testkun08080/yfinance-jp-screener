import React, { useEffect, useRef } from "react";
import SponsorshipButtons from "./SponsorshipButtons";

interface SponsorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SponsorshipModal: React.FC<SponsorshipModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalCheckboxRef = useRef<HTMLInputElement>(null);
  const modalId = "sponsorship_modal";

  // Handle modal state programmatically
  useEffect(() => {
    if (modalCheckboxRef.current) {
      modalCheckboxRef.current.checked = isOpen;
    }
  }, [isOpen]);

  const handleCloseModal = () => {
    if (modalCheckboxRef.current) {
      modalCheckboxRef.current.checked = false;
    }
    onClose();
  };

  return (
    <>
      {/* DaisyUI Modal Toggle */}
      <input
        ref={modalCheckboxRef}
        type="checkbox"
        id={modalId}
        className="modal-toggle"
      />

      {/* DaisyUI Modal */}
      <div className="modal" role="dialog">
        <div className="modal-box max-w-[90vw] sm:max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <form method="dialog">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-xs sm:btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
              aria-label="閉じる"
            >
              ✕
            </button>
          </form>

          {/* Header */}
          <div className="text-center mb-4 sm:mb-6 pt-2">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 px-4">
              ダウンロードが完了しました！
            </h2>
            <p className="text-sm sm:text-base text-base-content/70 px-4">
              このツールがお役に立てたなら、ぜひサポートをご検討ください
            </p>
          </div>

          {/* Sponsorship buttons */}
          <SponsorshipButtons />

          {/* Footer */}
          <div className="modal-action mt-3 sm:mt-4">
            <button
              onClick={handleCloseModal}
              className="btn btn-ghost w-full text-xs sm:text-sm h-10 sm:h-12 min-h-10 sm:min-h-12"
            >
              今はしない
            </button>
          </div>
        </div>

        {/* Modal backdrop */}
        <label
          className="modal-backdrop"
          onClick={handleCloseModal}
          aria-label="閉じる"
        ></label>
      </div>
    </>
  );
};

export default SponsorshipModal;
