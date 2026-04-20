import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#F8FAFC',
          surface: '#FFFFFF',
          'surface-variant': '#F1F5F9',
          'surface-light': '#FFFFFF',
          primary: '#2563EB',
          secondary: '#64748B',
          accent: '#3B82F6',
          tertiary: '#7C3AED',
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          info: '#2563EB',
          'on-background': '#0F172A',
          'on-surface': '#0F172A',
          'on-primary': '#FFFFFF',
        },
      },
      dark: {
        dark: true,
        colors: {
          background: '#0F172A',
          surface: '#13203B',
          'surface-variant': '#1E293B',
          'surface-light': '#23314F',
          primary: '#60A5FA',
          secondary: '#CBD5E1',
          accent: '#93C5FD',
          tertiary: '#A78BFA',
          error: '#F87171',
          warning: '#FBBF24',
          success: '#34D399',
          info: '#38BDF8',
          'on-background': '#E2E8F0',
          'on-surface': '#E2E8F0',
          'on-primary': '#0F172A',
        },
      },
    },
  },
  defaults: {
    VBtn: { variant: 'flat', rounded: 'xl' },
    VTextField: { variant: 'outlined', density: 'compact', rounded: 'xl' },
    VSelect: { variant: 'outlined', density: 'compact', rounded: 'xl' },
    VAutocomplete: { variant: 'outlined', density: 'compact', rounded: 'xl' },
    VTextarea: { variant: 'outlined', density: 'compact', rounded: 'xl' },
    VCard: { rounded: 'xl', variant: 'flat' },
    VChip: { rounded: 'lg', size: 'small' },
    VDialog: { maxWidth: 600 },
  },
});
