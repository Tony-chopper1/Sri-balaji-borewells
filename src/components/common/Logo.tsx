// Sri Balaji Borewells - Centralized Brand Logo Component
import React from 'react';
import { OFFICIAL_LOGO_URL, OFFICIAL_COMPANY_NAME } from '../../constants/branding';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'print' | 'print-4x6';
  showText?: boolean;
  showTagline?: boolean;
  customLogoUrl?: string;
  className?: string;
  imageClassName?: string;
  variant?: 'light' | 'dark' | 'print';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  showTagline = false,
  customLogoUrl,
  className = '',
  imageClassName = '',
  variant = 'dark',
}) => {
  const logoSrc = customLogoUrl || OFFICIAL_LOGO_URL;

  // Keep the square logo at a consistent size across screen and print layouts.
  const sizeStyles: Record<string, string> = {
    xs: 'h-7 w-auto max-w-[42px]',
    sm: 'h-10 w-auto max-w-[60px]',
    md: 'h-14 w-auto max-w-[84px]',
    lg: 'h-20 w-auto max-w-[120px]',
    xl: 'h-28 w-auto max-w-[168px]',
    '2xl': 'h-36 w-auto max-w-[216px]',
    'print-4x6': 'h-14 w-auto max-w-[84px]',
    print: 'h-20 w-auto max-w-[120px]',
  };

  const textSizes: Record<string, string> = {
    xs: 'text-xs font-black tracking-tight',
    sm: 'text-sm font-black tracking-tight',
    md: 'text-lg font-black tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight',
    '2xl': 'text-4xl font-black tracking-tight',
    'print-4x6': 'text-base font-black tracking-tight',
    print: 'text-xl font-black tracking-tight',
  };

  const taglineSizes: Record<string, string> = {
    xs: 'text-[8px]',
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
    '2xl': 'text-base',
    'print-4x6': 'text-[9px]',
    print: 'text-[10px]',
  };

  const textColor = variant === 'light'
    ? 'text-white'
    : (variant === 'print' ? 'text-black' : 'text-slate-900');

  const taglineColor = variant === 'light'
    ? 'text-orange-400'
    : (variant === 'print' ? 'text-slate-700' : 'text-orange-600');

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official Sri Balaji Borewells logo */}
      <img
        src={logoSrc}
        alt={OFFICIAL_COMPANY_NAME}
        loading="eager"
        decoding="async"
        className={`${sizeStyles[size] || sizeStyles.md} object-contain transition-transform duration-150 ${imageClassName}`}
        style={{
          aspectRatio: '1 / 1',
          objectFit: 'contain',
        }}
      />

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${textSizes[size] || textSizes.md} ${textColor} font-sans uppercase`}>
            {OFFICIAL_COMPANY_NAME}
          </span>
          {showTagline && (
            <span className={`${taglineSizes[size] || taglineSizes.md} ${taglineColor} font-bold uppercase tracking-wider`}>
              Drilling &amp; Water Solutions
            </span>
          )}
        </div>
      )}
    </div>
  );
};
