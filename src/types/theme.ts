export type ThemeName =
  | 'nerv-orange'
  | 'magi-green'
  | 'gehirn-blue'
  | 'seele-white'
  | 'adam-red'
  | 'lilith-purple';

export interface ThemeDefinition {
  label: string;
  vars: Record<string, string>;
}

export type LangName = 'zh-en' | 'ja-en' | 'en-zh';
