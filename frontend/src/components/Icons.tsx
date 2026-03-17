import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';
import { useThemeColors } from '@/theme';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Reusable SVG icons used across the app.
 */
export function ArrowLeftIcon({ size = 20, color }: IconProps) {
  const colors = useThemeColors();
  const fill = color ?? colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 5l-7 7 7 7"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ArrowUpIcon({ size = 24, color }: IconProps) {
  const colors = useThemeColors();
  const fill = color ?? colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 11L12 6L17 11M12 18V7"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckboxCheckedIcon({ size = 18 }: { size?: number }) {
  const colors = useThemeColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={4} fill={colors.checkboxFill} />
      <Path
        d="M9 12l2 2 4-4"
        stroke={colors.checkboxCheck}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckboxUncheckedIcon({ size = 18 }: { size?: number }) {
  const colors = useThemeColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={4} stroke={colors.checkboxUnchecked} strokeWidth={2} />
    </Svg>
  );
}
