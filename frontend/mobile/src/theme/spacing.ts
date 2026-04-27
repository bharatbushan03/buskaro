/**
 * Design System - Spacing
 * 
 * 8px grid system for consistent spacing throughout the app.
 */

// Base unit (8px)
const BASE_UNIT = 8;

// Spacing scale
export const spacing = {
  0: 0,
  1: BASE_UNIT * 0.5,  // 4px
  2: BASE_UNIT * 1,    // 8px
  3: BASE_UNIT * 1.5,  // 12px
  4: BASE_UNIT * 2,    // 16px
  5: BASE_UNIT * 2.5,  // 20px
  6: BASE_UNIT * 3,    // 24px
  7: BASE_UNIT * 3.5,  // 28px
  8: BASE_UNIT * 4,    // 32px
  9: BASE_UNIT * 4.5,  // 36px
  10: BASE_UNIT * 5,   // 40px
  12: BASE_UNIT * 6,   // 48px
  14: BASE_UNIT * 7,   // 56px
  16: BASE_UNIT * 8,   // 64px
  20: BASE_UNIT * 10,  // 80px
  24: BASE_UNIT * 12,  // 96px
  32: BASE_UNIT * 16,  // 128px
} as const;

export type Spacing = typeof spacing;

// Common layout constants
export const layout = {
  // Screen padding
  screenPadding: spacing[4], // 16px
  
  // Card padding
  cardPadding: spacing[4], // 16px
  
  // Section spacing
  sectionGap: spacing[6], // 24px
  
  // Component gaps
  gapSmall: spacing[2], // 8px
  gapMedium: spacing[4], // 16px
  gapLarge: spacing[6], // 24px
  
  // Border radius
  radiusSmall: spacing[1], // 4px
  radiusMedium: spacing[2], // 8px
  radiusLarge: spacing[3], // 12px
  radiusXLarge: spacing[4], // 16px
  radiusRound: 9999, // Fully rounded
  
  // Icon sizes
  iconSmall: spacing[4], // 16px
  iconMedium: spacing[6], // 24px
  iconLarge: spacing[8], // 32px
  
  // Button heights
  buttonSmall: spacing[8], // 32px
  buttonMedium: spacing[10], // 40px
  buttonLarge: spacing[12], // 48px
  
  // Input heights
  inputHeight: spacing[12], // 48px
  
  // Avatar sizes
  avatarSmall: spacing[8], // 32px
  avatarMedium: spacing[10], // 40px
  avatarLarge: spacing[14], // 56px
} as const;

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  toast: 500,
} as const;
