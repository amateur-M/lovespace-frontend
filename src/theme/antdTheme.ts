import type { ThemeConfig } from 'antd'

/**
 * LoveSpace 暖色主题（对齐 ui-ux-pro-max：玫瑰主色 + 暖橙点缀 + 浅粉背景）。
 */
export const lovespaceTheme: ThemeConfig = {
  token: {
    colorPrimary: '#e11d48',
    colorSuccess: '#059669',
    colorWarning: '#ea580c',
    colorError: '#dc2626',
    colorInfo: '#db2777',
    borderRadius: 10,
    fontFamily: 'var(--ls-font-sans)',
    colorBgLayout: '#fff1f2',
    colorBgContainer: '#ffffff',
    colorBorder: '#fecdd3',
    colorBorderSecondary: '#ffe4e6',
    colorText: '#431407',
    colorTextSecondary: '#9f1239',
    colorTextTertiary: '#be123c',
    lineWidth: 1,
    controlOutlineWidth: 2,
  },
  components: {
    Layout: {
      headerBg: 'rgba(255,255,255,0.94)',
      bodyBg: '#fff1f2',
      footerBg: '#fff7f7',
      headerHeight: 56,
      headerPadding: '0 20px',
    },
    Menu: {
      itemBg: 'transparent',
      itemHoverBg: 'rgba(225,29,72,0.06)',
      itemSelectedBg: 'rgba(225,29,72,0.1)',
      itemSelectedColor: '#9f1239',
      itemColor: '#57534e',
      itemHoverColor: '#be123c',
      horizontalItemSelectedColor: '#9f1239',
      activeBarHeight: 2,
      activeBarBorderWidth: 0,
    },
    Card: {
      paddingLG: 24,
    },
    Button: {
      controlHeight: 40,
      fontWeight: 500,
    },
    Input: {
      controlHeight: 40,
    },
    Select: {
      controlHeight: 40,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    FloatButton: {
      colorPrimary: '#e11d48',
    },
  },
}
