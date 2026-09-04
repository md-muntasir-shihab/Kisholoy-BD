import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Feather, Flower2, CircleDot, Shield, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BrandLogoProps {
  variant?: 'light' | 'dark'; // 'light' for light backgrounds (Navbar), 'dark' for dark backgrounds (Footer/Hero)
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  linkToHome?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  showTagline = true,
  size = 'md',
  className = '',
  linkToHome = true
}) => {
  const { siteContent, language } = useApp();
  const [imageError, setImageError] = useState(false);

  const brandName = language === 'BN' ? (siteContent.brandNameBn || siteContent.brandName) : siteContent.brandName;
  const motto = language === 'BN' ? (siteContent.mottoBn || siteContent.motto) : siteContent.motto;
  
  const logoType = siteContent.logoType || (siteContent.logoUrl ? 'BOTH_IMAGE_AND_TEXT' : 'EMBLEM_AND_TEXT');
  const emblemStyle = siteContent.logoEmblemStyle || 'leaf_sprout';
  const customHeight = siteContent.logoHeight || 40;

  // Resolve logo image URL
  const activeLogoUrl = variant === 'dark' && siteContent.logoDarkUrl 
    ? siteContent.logoDarkUrl 
    : siteContent.logoUrl;

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
      imgHeight: Math.max(48, customHeight),
      gap: 'gap-3'
    },
    xl: {
      text: 'text-4xl sm:text-5xl',
      motto: 'text-xs sm:text-sm',
      emblem: 'w-14 h-14',
      imgHeight: Math.max(60, customHeight),
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
      {/* 1. Render Image Logo if configured & not errored */}
      {(logoType === 'IMAGE' || logoType === 'BOTH_IMAGE_AND_TEXT') && activeLogoUrl && !imageError && (
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

      {/* 2. Render Emblem Motif if EMBLEM_AND_TEXT or fallback */}
      {((logoType === 'EMBLEM_AND_TEXT') || ((logoType === 'IMAGE' || logoType === 'BOTH_IMAGE_AND_TEXT') && (!activeLogoUrl || imageError))) && (
        <div className="flex-shrink-0">
          {renderEmblem()}
        </div>
      )}

      {/* 3. Render Brand Text & Subtitle (unless pure IMAGE mode with valid image) */}
      {!(logoType === 'IMAGE' && activeLogoUrl && !imageError) && (
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
              }`}
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
