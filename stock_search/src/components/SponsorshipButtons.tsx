import React from "react";
import { EXTERNAL_URLS } from "../constants/urls";

interface SponsorshipButtonsProps {
  className?: string;
}

const SponsorshipButtons: React.FC<SponsorshipButtonsProps> = ({
  className = "",
}) => {
  const sponsorshipLinks = {
    github: EXTERNAL_URLS.sponsorship.githubSponsors,
    buyMeACoffee: EXTERNAL_URLS.sponsorship.buyMeACoffee,
    amazonBook: EXTERNAL_URLS.sponsorship.amazonBook,
  };

  const handleSponsorClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="text-center mb-2 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-base-content mb-1 sm:mb-2">
          ☕ サポートのお願い
        </h3>
        <p className="text-xs sm:text-sm text-base-content/60 px-2">
          このアプリケーションが便利だと思っていただけた場合、開発者への寄付をご検討ください。
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 justify-center px-2 sm:px-0">
        {/* GitHub Sponsors Button */}
        <button
          onClick={() => handleSponsorClick(sponsorshipLinks.github)}
          className="btn btn-neutral flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-10 sm:h-12 min-h-10 sm:min-h-12"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="truncate">GitHub Sponsors</span>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>

        {/* Buy Me a Coffee Button */}
        <button
          onClick={() => handleSponsorClick(sponsorshipLinks.buyMeACoffee)}
          className="btn btn-warning flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-10 sm:h-12 min-h-10 sm:min-h-12"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-.766-1.688a4.436 4.436 0 0 0-1.263-1.265c-.329-.14-.695-.233-1.087-.233H6.533a3.268 3.268 0 0 0-3.29 3.29v9.857a3.268 3.268 0 0 0 3.29 3.29h10.435a3.268 3.268 0 0 0 3.29-3.29V6.415zm-3.726 2.195c.119 0 .233.036.327.103.095.067.148.158.148.257 0 .099-.053.19-.148.257a.478.478 0 0 1-.327.103H7.509c-.119 0-.233-.036-.327-.103a.358.358 0 0 1-.148-.257c0-.099.053-.19.148-.257a.478.478 0 0 1 .327-.103h9.056z" />
          </svg>
          <span className="truncate">Buy Me a Coffee</span>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>

        {/* Divider */}
        <div className="divider text-xs sm:text-sm my-1 sm:my-2">または</div>

        {/* Amazon Book Link */}
        <button
          onClick={() => handleSponsorClick(sponsorshipLinks.amazonBook)}
          className="btn btn-primary flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-10 sm:h-12 min-h-10 sm:min-h-12"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M13.5 2C13.5 2 13 2.44 13 3.5v7c0 .88.39 1.67 1 2.22v4.28c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-4.28c.61-.55 1-1.34 1-2.22v-7C11 2.44 10.5 2 10.5 2h-3C7.5 2 7 2.44 7 3.5v7c0 .88.39 1.67 1 2.22v4.28c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4.28c.61-.55 1-1.34 1-2.22v-7c0-1.06-.5-1.5-.5-1.5h-3zM8 6h8v4H8V6zm2 11.5c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5s-.22.5-.5.5h-3c-.28 0-.5-.22-.5-.5z" />
          </svg>
          <span className="truncate">📚 参考書籍を購入</span>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      </div>

      <div className="text-center mt-2 sm:mt-4 px-2">
        <p className="text-xs sm:text-sm text-base-content/60">
          皆様からのサポートが、継続的な開発とメンテナンスの大きな励みになります。
        </p>
      </div>
    </div>
  );
};

export default SponsorshipButtons;
