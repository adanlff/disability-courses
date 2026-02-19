"use client";

import React from 'react';
import { Navigation, MousePointer, Eye, EyeOff, Focus } from 'lucide-react';
import { CategoryPanelProps } from './types';
import { SelectControl, SettingButton, InfoBox } from './setting-controls';

const NavigationPanel: React.FC<CategoryPanelProps> = ({
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
          <Navigation className="w-4 h-4 text-[#005EB8]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Navigasi & Motor
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bantuan navigasi dan motorik
          </p>
        </div>
      </div>

      {/* Cursor Size */}
      <SelectControl
        label="Ukuran Kursor"
        value={settings.cursorSize}
        onChange={(value) => updateSetting('cursorSize', value as 'normal' | 'large' | 'extra')}
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'large', label: 'Besar' },
          { value: 'extra', label: 'Ekstra Besar' }
        ]}
        disabled={!settings.enabled}
        icon={MousePointer}
      />

      {/* Feature Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <SettingButton
          icon={Focus}
          label="Panduan Baca"
          active={settings.readingGuide}
          onClick={() => toggleSetting('readingGuide')}
          onMouseEnter={() => speakText('Panduan Baca')}
          variant="success"
          disabled={!settings.enabled}
        />
        
        <SettingButton
          icon={settings.focusMode ? EyeOff : Eye}
          label="Mode Fokus"
          active={settings.focusMode}
          onClick={() => toggleSetting('focusMode')}
          onMouseEnter={() => speakText('Mode Fokus')}
          variant="success"
          disabled={!settings.enabled}
        />
      </div>

      {/* Info Boxes */}
      {settings.readingGuide && settings.enabled && (
        <InfoBox
          icon={Focus}
          title="Panduan Baca Aktif"
          description="Garis horizontal mengikuti kursor"
          variant="success"
        />
      )}

      {settings.focusMode && settings.enabled && (
        <InfoBox
          icon={Eye}
          title="Mode Fokus Aktif"
          description="Elemen aktif ditandai outline"
          variant="info"
        />
      )}
    </div>
  );
};

export default NavigationPanel;
