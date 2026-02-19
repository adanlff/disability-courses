// Accessibility Types and Interfaces

export interface AccessibilitySettings {
  enabled: boolean;
  fontSize: number;
  contrast: 'normal' | 'high' | 'higher';
  brightness: number;
  saturation: number;
  invertColors: boolean;
  grayscale: boolean;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  cursorSize: 'normal' | 'large' | 'extra';
  readingGuide: boolean;
  focusMode: boolean;
  soundEnabled: boolean;
  textToSpeech: boolean;
  ttsRate: number;
  ttsVolume: number;
  ttsVoice: string;
  widgetPosition: 'left' | 'right';
  dyslexiaFont: boolean;
}

export interface SettingButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'success' | 'danger';
}

export interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  displayValue?: string;
}

export interface CategoryPanelProps {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  toggleSetting: (key: keyof AccessibilitySettings) => void;
  speakText: (text: string) => void;
}

export interface AudioPanelProps extends CategoryPanelProps {
  isTTSActive: boolean;
  availableVoices: SpeechSynthesisVoice[];
  handleSoundToggle: () => void;
  handleTextToSpeechToggle: () => void;
}

export const defaultSettings: AccessibilitySettings = {
  enabled: false,
  fontSize: 100,
  contrast: 'normal',
  brightness: 100,
  saturation: 100,
  invertColors: false,
  grayscale: false,
  lineHeight: 100,
  letterSpacing: 0,
  fontWeight: 400,
  textAlign: 'left',
  cursorSize: 'normal',
  readingGuide: false,
  focusMode: false,
  soundEnabled: false,
  textToSpeech: false,
  ttsRate: 1.0,
  ttsVolume: 0.8,
  ttsVoice: '',
  widgetPosition: 'right',
  dyslexiaFont: false
};

