"use client";

import React from 'react';
import { Type, Bold, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { CategoryPanelProps } from './types';
import { SliderControl, SelectControl, SettingButton } from './setting-controls';

const TextPanel: React.FC<CategoryPanelProps> = ({
  settings,
  updateSetting,
  toggleSetting,
  speakText
}) => {
  const textAlignOptions = [
    { value: 'left', icon: AlignLeft, label: 'Kiri' },
    { value: 'center', icon: AlignCenter, label: 'Tengah' },
    { value: 'right', icon: AlignRight, label: 'Kanan' },
    { value: 'justify', icon: AlignJustify, label: 'Rata' }
  ];

  return (
    <div className="space-y-3">
      {/* Panel Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="p-1.5 bg-[#005EB8]/10 rounded-md">
          <Type className="w-4 h-4 text-[#005EB8]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Pengaturan Teks
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sesuaikan keterbacaan teks
          </p>
        </div>
      </div>

      {/* Line Height */}
      <SliderControl
        label="Tinggi Baris"
        value={settings.lineHeight}
        min={80}
        max={200}
        step={5}
        unit="%"
        onChange={(value) => updateSetting('lineHeight', value)}
        onIncrement={() => updateSetting('lineHeight', Math.min(200, settings.lineHeight + 5))}
        onDecrement={() => updateSetting('lineHeight', Math.max(80, settings.lineHeight - 5))}
        icon={Type}
        disabled={!settings.enabled}
      />

      {/* Letter Spacing */}
      <SliderControl
        label="Jarak Huruf"
        value={settings.letterSpacing}
        min={0}
        max={5}
        step={0.5}
        unit="px"
        onChange={(value) => updateSetting('letterSpacing', value)}
        onIncrement={() => updateSetting('letterSpacing', Math.min(5, settings.letterSpacing + 0.5))}
        onDecrement={() => updateSetting('letterSpacing', Math.max(0, settings.letterSpacing - 0.5))}
        icon={Type}
        disabled={!settings.enabled}
      />

      {/* Font Weight */}
      <SelectControl
        label="Ketebalan Font"
        value={settings.fontWeight}
        onChange={(value) => updateSetting('fontWeight', Number(value))}
        options={[
          { value: 400, label: 'Normal' },
          { value: 600, label: 'Sedang' },
          { value: 700, label: 'Tebal' },
          { value: 900, label: 'Sangat Tebal' }
        ]}
        disabled={!settings.enabled}
        icon={Bold}
      />

      {/* Text Alignment */}
      <div className={`p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${!settings.enabled ? 'opacity-50' : ''}`}>
        <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <AlignLeft className="w-4 h-4 text-[#005EB8]" />
          <span>Rata Teks</span>
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {textAlignOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => settings.enabled && updateSetting('textAlign', option.value as 'left' | 'center' | 'right' | 'justify')}
                disabled={!settings.enabled}
                className={`p-2 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                  settings.textAlign === option.value
                    ? 'bg-[#005EB8] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={option.label}
                onMouseEnter={() => settings.enabled && speakText(option.label)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dyslexia Font Toggle */}
      <SettingButton
        icon={Type}
        label="Font Disleksia (OpenDyslexic)"
        active={settings.dyslexiaFont}
        onClick={() => toggleSetting('dyslexiaFont')}
        onMouseEnter={() => speakText('Font Disleksia')}
        variant="success"
        disabled={!settings.enabled}
      />
    </div>
  );
};

export default TextPanel;
