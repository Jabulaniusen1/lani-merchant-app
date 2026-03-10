import type { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: 'Sora_700Bold',
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: 'Sora_600SemiBold',
  },
  headingMd: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 20,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
  },
  bodyMedium: {
    fontFamily: 'DMSans_500Medium',
  },
  caption: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
};
