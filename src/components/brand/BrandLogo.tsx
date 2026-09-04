import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Feather, Flower2, CircleDot, Shield, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BrandLogoProps {
  variant?: 'light' | 'dark'; // 'light' for light backgrounds (Navbar), 'dark' for dark backgrounds (Footer/Hero)
  showTagline?: boolean;
  taglineClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  linkToHome?: boolean;
}

export const OfficialKisholoyVector: React.FC<{
  variant?: 'light' | 'dark';
  height?: number;
  className?: string;
}> = ({ variant = 'light', height = 44, className = '' }) => {
  const isDark = variant === 'dark';
  const pineStroke = isDark ? '#f8fafc' : '#083732';
  const botanicalStroke = isDark ? '#34d399' : '#23653b';
  const terracottaDot = isDark ? '#f43f5e' : '#9e3434';
  const orangeDot = isDark ? '#fb923c' : '#d46332';
  const botanicalDot = isDark ? '#34d399' : '#23653b';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 920 370"
      style={{ height: `${height}px`, width: 'auto' }}
      className={`object-contain flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
      aria-label="কিশলয় লোগো (Kisholoy Official Logo)"
    >
      <g id="kisholoy-wordmark">
        {/* ==================== LETTER 1: 'কি' ==================== */}
        {/* 'ি'-kar Top Botanical Arc */}
        <path d="M 68 126 A 78 78 0 0 1 232 110" fill="none" stroke={botanicalStroke} strokeWidth="26" strokeLinecap="round" />
        <circle cx="58" cy="132" r="18" fill={terracottaDot} />
        
        {/* Vertical stem of 'ি' dropping down and curving right at bottom */}
        <path d="M 108 116 L 108 274 Q 108 316 148 316 L 174 316" fill="none" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" />

        {/* Top bar / matra of 'ক' */}
        <line x1="108" y1="124" x2="282" y2="124" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" />

        {/* Loop of 'ক' */}
        <path d="M 194 124 C 146 148 142 222 186 242 C 228 260 252 206 226 168 C 206 142 194 124 194 124" fill="none" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Descending right stroke of 'ক' */}
        <path d="M 224 200 Q 242 254 262 316" fill="none" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" />

        {/* Inside Terracotta Orange Circle for 'ক' */}
        <circle cx="272" cy="226" r="28" fill={orangeDot} />

        {/* ==================== LETTER 2: 'শ' ==================== */}
        <circle cx="396" cy="74" r="18" fill={terracottaDot} />
        <circle cx="396" cy="220" r="56" fill="none" stroke={pineStroke} strokeWidth="26" />
        <circle cx="396" cy="220" r="24" fill={terracottaDot} />
        <circle cx="396" cy="326" r="18" fill={orangeDot} />

        <path d="M 324 124 L 484 124" fill="none" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" />
        <circle cx="484" cy="74" r="18" fill={terracottaDot} />
        <line x1="484" y1="124" x2="484" y2="292" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" />
        <circle cx="484" cy="340" r="18" fill={orangeDot} />

        {/* ==================== LETTER 3: 'ল' ==================== */}
        <path d="M 494 124 C 540 120 574 162 562 216 C 550 268 506 280 484 238" fill="none" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" />
        <circle cx="568" cy="220" r="28" fill={orangeDot} />
        <circle cx="568" cy="74" r="18" fill={terracottaDot} />
        <circle cx="568" cy="326" r="18" fill={orangeDot} />

        <path d="M 554 124 L 652 124 L 652 292" fill="none" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="652" cy="340" r="18" fill={botanicalDot} />

        {/* ==================== LETTER 4: 'য়' ==================== */}
        <circle cx="724" cy="74" r="18" fill={orangeDot} />
        <path d="M 652 124 C 684 116 732 114 772 130 C 812 148 834 186 834 238 L 834 292" fill="none" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" />
        <path d="M 724 124 C 724 190 706 254 756 274 C 798 284 832 246 832 198" fill="none" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" />
        <circle cx="788" cy="220" r="26" fill={orangeDot} />
        <line x1="864" y1="124" x2="864" y2="292" stroke={pineStroke} strokeWidth="26" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  showTagline = true,
  taglineClassName = '',
  size = 'md',
  className = '',
  linkToHome = true
}) => {
  const { siteContent, language } = useApp();
  const [imageError, setImageError] = useState(false);

  const brandName = language === 'BN' ? (siteContent.brandNameBn || siteContent.brandName) : siteContent.brandName;
  const motto = language === 'BN' ? (siteContent.mottoBn || siteContent.motto) : siteContent.motto;
  
  // Default to IMAGE for the official logo wordmark unless explicitly set otherwise
  const logoType = siteContent.logoType || 'IMAGE';
  const emblemStyle = siteContent.logoEmblemStyle || 'leaf_sprout';
  const customHeight = siteContent.logoHeight || 44;

  // Resolve logo image URL - defaults to the official brand vector
  const defaultOfficialUrl = variant === 'dark' ? '/brand/kisholoy-logo-dark.svg' : '/brand/kisholoy-logo.svg';
  const activeLogoUrl = variant === 'dark' && siteContent.logoDarkUrl 
    ? siteContent.logoDarkUrl 
    : (siteContent.logoUrl || defaultOfficialUrl);

  const isOfficialAsset = !activeLogoUrl || 
    activeLogoUrl === '/brand/kisholoy-logo.svg' || 
    activeLogoUrl === '/brand/kisholoy-logo-dark.svg' ||
    activeLogoUrl.includes('kisholoy-logo');

  // Size configurations
  const sizeConfig = {
    sm: {
      text: 'text-xl sm:text-2xl',
      motto: 'text-[9px]',
      emblem: 'w-7 h-7',
      imgHeight: Math.min(32, customHeight),
      gap: 'gap-2'
    },
    md: {
      text: 'text-2xl sm:text-3xl',
      motto: 'text-[10px]',
      emblem: 'w-9 h-9',
      imgHeight: customHeight,
      gap: 'gap-2.5'
    },
    lg: {
      text: 'text-3xl sm:text-4xl',
      motto: 'text-xs',
      emblem: 'w-11 h-11',
      imgHeight: Math.max(50, customHeight),
      gap: 'gap-3'
    },
    xl: {
      text: 'text-4xl sm:text-5xl',
      motto: 'text-xs sm:text-sm',
      emblem: 'w-14 h-14',
      imgHeight: Math.max(64, customHeight),
      gap: 'gap-4'
    }
  }[size];

  // Render Emblem Vector
  const renderEmblem = () => {
    switch (emblemStyle) {
      case 'jamdani_flower':
        return (
          <div className={`relative flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
            variant === 'dark' 
              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 shadow-amber-500/20 shadow-md' 
              : 'bg-gradient-to-br from-teal-900 to-emerald-950 text-amber-300 shadow-teal-950/20 shadow-md'
          } ${sizeConfig.emblem}`}>
            <Flower2 className="w-5 h-5 animate-pulse" />
          </div>
        );
      case 'terracotta_seal':
        return (
          <div className={`relative flex items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-12 ${
            variant === 'dark' 
              ? 'bg-gradient-to-br from-orange-500 to-amber-700 text-white shadow-orange-900/40 shadow-md border border-orange-400/30' 
              : 'bg-gradient-to-br from-amber-800 to-amber-950 text-amber-200 shadow-amber-900/30 shadow-md border border-amber-600/30'
          } ${sizeConfig.emblem}`}>
            <CircleDot className="w-5 h-5" />
          </div>
        );
      case 'heritage_loom':
        return (
          <div className={`relative flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
            variant === 'dark' 
              ? 'bg-gradient-to-br from-teal-400 to-emerald-600 text-stone-950 shadow-teal-400/20 shadow-md' 
              : 'bg-gradient-to-br from-teal-900 to-teal-950 text-teal-200 shadow-teal-900/20 shadow-md'
          } ${sizeConfig.emblem}`}>
            <Feather className="w-5 h-5" />
          </div>
        );
      case 'bengal_royal':
        return (
          <div className={`relative flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
            variant === 'dark' 
              ? 'bg-gradient-to-br from-amber-300 to-yellow-500 text-stone-900 shadow-amber-400/30 shadow-md' 
              : 'bg-gradient-to-br from-stone-900 to-stone-950 text-amber-400 border border-amber-500/40 shadow-stone-950/30 shadow-md'
          } ${sizeConfig.emblem}`}>
            <Shield className="w-5 h-5" />
          </div>
        );
      case 'minimalist_k':
        return (
          <div className={`relative flex items-center justify-center rounded-xl font-serif font-black transition-transform duration-300 group-hover:scale-105 ${
            variant === 'dark' 
              ? 'bg-white text-stone-950 shadow-white/10 shadow-md' 
              : 'bg-stone-900 text-white shadow-stone-900/20 shadow-md'
          } ${sizeConfig.emblem}`}>
            <span className="text-lg">ক</span>
          </div>
        );
      case 'leaf_sprout':
      default:
        return (
          <div className={`relative flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
            variant === 'dark' 
              ? 'bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 text-stone-950 shadow-emerald-500/20 shadow-md' 
              : 'bg-gradient-to-br from-teal-900 via-emerald-900 to-teal-950 text-teal-200 shadow-teal-900/20 shadow-md border border-teal-700/40'
          } ${sizeConfig.emblem}`}>
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5 fill-current" 
              aria-hidden="true"
            >
              <path d="M17.5 3C13.5 3 10 6.5 10 10.5C10 11.2 10.1 11.9 10.3 12.5C7.8 13.2 6 15.4 6 18C6 21.3 8.7 22 12 22C12 20 12.5 17 14.5 15.5C16.5 14 18 13.5 20 13.5C20.5 13.5 21 13.5 21.5 13.6C21.8 12.6 22 11.6 22 10.5C22 6.5 18.5 3 17.5 3Z" />
              <path d="M6 18C4 18 2 19 2 21H12C12 19.5 11 18 9 18C7.5 18 6.5 18 6 18Z" opacity="0.6" />
            </svg>
          </div>
        );
    }
  };

  const content = (
    <div className={`group inline-flex items-center ${sizeConfig.gap} ${className}`}>
      {/* 1. Official Asset Vector rendering (zero network latency, crisp vector) */}
      {(logoType === 'IMAGE' || logoType === 'BOTH_IMAGE_AND_TEXT') && isOfficialAsset && (
        <div className="relative flex-shrink-0 flex items-center">
          <OfficialKisholoyVector variant={variant} height={sizeConfig.imgHeight} />
        </div>
      )}

      {/* 2. Custom Image Logo if uploaded/custom URL & not errored */}
      {(logoType === 'IMAGE' || logoType === 'BOTH_IMAGE_AND_TEXT') && !isOfficialAsset && activeLogoUrl && !imageError && (
        <div className="relative flex-shrink-0 flex items-center">
          <img
            src={activeLogoUrl}
            alt={brandName}
            style={{ maxHeight: `${sizeConfig.imgHeight}px` }}
            onError={() => setImageError(true)}
            className="w-auto object-contain transition-transform duration-300 group-hover:scale-105 rounded-md"
            loading="eager"
          />
        </div>
      )}

      {/* 3. Render Emblem Motif if EMBLEM_AND_TEXT or if custom image errored without official asset */}
      {((logoType === 'EMBLEM_AND_TEXT') || (!isOfficialAsset && (!activeLogoUrl || imageError))) && (
        <div className="flex-shrink-0">
          {renderEmblem()}
        </div>
      )}

      {/* 4. Render Brand Text & Subtitle (unless pure IMAGE mode) */}
      {!(logoType === 'IMAGE') && (
        <div className="flex flex-col justify-center text-left">
          <div className="flex items-center gap-1.5">
            <span 
              className={`font-serif font-black tracking-tight leading-none ${sizeConfig.text} ${
                variant === 'dark' ? 'text-white' : 'text-stone-900 dark:text-white'
              }`}
            >
              {brandName}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${
              variant === 'dark' ? 'bg-amber-400' : 'bg-teal-700 dark:bg-teal-400'
            }`}></span>
          </div>

          {showTagline && motto && (
            <span 
              className={`uppercase font-semibold tracking-widest leading-tight mt-0.5 ${sizeConfig.motto} ${
                variant === 'dark' ? 'text-stone-400' : 'text-stone-500 dark:text-stone-400'
              } ${taglineClassName}`}
            >
              {motto}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-block focus:outline-none rounded-lg" aria-label={`${brandName} Home`}>
        {content}
      </Link>
    );
  }

  return content;
};
