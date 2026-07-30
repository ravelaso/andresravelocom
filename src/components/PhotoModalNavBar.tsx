import React from 'react';

interface PhotoModalNavBarProps {
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

const PhotoModalNavBar: React.FC<PhotoModalNavBarProps> = ({
  isFirst, isLast, onPrev, onNext, onClose,
}) => (
  <div className="flex items-center justify-center gap-4 px-6 py-3 bg-black/40 border-t border-gray-800">
    <button
      onClick={onPrev}
      disabled={isFirst}
      className={`rounded-full p-2.5 transition-colors ${
        isFirst
          ? 'text-gray-700 bg-transparent cursor-default'
          : 'text-gray-200 bg-white/10 hover:bg-white/20'
      }`}
      aria-label="Previous"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <button
      onClick={onClose}
      className="rounded-full p-2.5 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
      aria-label="Close"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <button
      onClick={onNext}
      disabled={isLast}
      className={`rounded-full p-2.5 transition-colors ${
        isLast
          ? 'text-gray-700 bg-transparent cursor-default'
          : 'text-gray-200 bg-white/10 hover:bg-white/20'
      }`}
      aria-label="Next"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
);

export default PhotoModalNavBar;
