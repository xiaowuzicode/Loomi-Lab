import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

// 主题配置
const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

// 自定义主题
export const theme = extendTheme({
  config,
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'lg',
      },
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
          },
          _active: {
            bg: 'primary.700',
          },
        },
        ghost: {
          _hover: {
            bg: 'whiteAlpha.200',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          boxShadow: 'sm',
          border: '1px solid',
          borderColor: 'whiteAlpha.100',
          bg: 'whiteAlpha.50',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'whiteAlpha.100',
            border: '1px solid',
            borderColor: 'whiteAlpha.200',
            _hover: {
              bg: 'whiteAlpha.200',
              borderColor: 'whiteAlpha.300',
            },
            _focus: {
              bg: 'whiteAlpha.200',
              borderColor: 'primary.500',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Select: {
      variants: {
        filled: {
          field: {
            bg: 'whiteAlpha.100',
            border: '1px solid',
            borderColor: 'whiteAlpha.200',
            _hover: {
              bg: 'whiteAlpha.200',
              borderColor: 'whiteAlpha.300',
            },
            _focus: {
              bg: 'whiteAlpha.200',
              borderColor: 'primary.500',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
})
