"use client";

import React from 'react';
import { Monitor, Type, Contrast, Palette } from 'lucide-react';
import { CategoryPanelProps } from './types';
import { SliderControl, SelectControl, SettingButton } from './setting-controls';

const VisualPanel: React.FC<CategoryPanelProps> = ({
  settings,
  updateSetting,
  toggleSetting,
  speakText
}) => {
  return (
    <div className="space-y-3">
      {/* Panel Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="p-1.5 bg-[#005EB8]/10 rounded-md">
          <Monitor className="w-4 h-4 text-[#005EB8]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Pengaturan Visual
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sesuaikan tampilan layar
          </p>
        </div>
      </div>

      {/* Font Size */}
      <SliderControl
        label="Ukuran Font"
        value={settings.fontSize}
        min={80}
        max={150}
        step={5}
        unit="%"
        onChange={(value) => updateSetting('fontSize', value)}
        onIncrement={() => updateSetting('fontSize', Math.min(150, settings.fontSize + 5))}
        onDecrement={() => updateSetting('fontSize', Math.max(80, settings.fontSize - 5))}
        icon={Type}
        disabled={!settings.enabled}
      />

      {/* Brightness */}
      <SliderControl
        label="Kecerahan"
        value={settings.brightness}
        min={50}
        max={150}
        step={5}
        unit="%"
        onChange={(value) => updateSetting('brightness', value)}
        onIncrement={() => updateSetting('brightness', Math.min(150, settings.brightness + 5))}
        onDecrement={() => updateSetting('brightness', Math.max(50, settings.brightness - 5))}
        icon={Monitor}
        disabled={!settings.enabled}
      />

      {/* Saturation */}
      <SliderControl
        label="Saturasi"
        value={settings.saturation}
        min={0}
        max={200}
        step={5}
        unit="%"
        onChange={(value) => updateSetting('saturation', value)}
        onIncrement={() => updateSetting('saturation', Math.min(200, settings.saturation + 5))}
        onDecrement={() => updateSetting('saturation', Math.max(0, settings.saturation - 5))}
        icon={Palette}
        disabled={!settings.enabled}
      />

      {/* Contrast Select */}
      <SelectControl
        label="Kontras"
        value={settings.contrast}
        onChange={(value) => updateSetting('contrast', value as 'normal' | 'high' | 'higher')}
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'high', label: 'Tinggi (150%)' },
          { value: 'higher', label: 'Sangat Tinggi (200%)' }
        ]}
        disabled={!settings.enabled}
        icon={Contrast}
      />

      {/* Toggle Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <SettingButton
          icon={Palette}
          label="Balik Warna"
          active={settings.invertColors}
          onClick={() => toggleSetting('invertColors')}
          onMouseEnter={() => speakText('Balik Warna')}
          variant="accent"
          disabled={!settings.enabled}
        />
        
        <SettingButton
          icon={Contrast}
          label="Grayscale"
          active={settings.grayscale}
          onClick={() => toggleSetting('grayscale')}
          onMouseEnter={() => speakText('Grayscale')}
          variant="accent"
          disabled={!settings.enabled}
        />
      </div>
    </div>
  );
};

export default VisualPanel;
