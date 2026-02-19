"use client";

import React from 'react';
import { Volume2, VolumeX, Gauge, User } from 'lucide-react';
import { AudioPanelProps } from './types';
import { SliderControl, SelectControl, SettingButton, InfoBox } from './setting-controls';

const AudioPanel: React.FC<AudioPanelProps> = ({
  settings,
  updateSetting,
  speakText,
  isTTSActive,
  availableVoices,
  handleSoundToggle,
  handleTextToSpeechToggle
}) => {
  // Get rate display text
  const getRateDisplayText = (rate: number): string => {
    if (rate <= 0.5) return 'Sangat Lambat';
    if (rate <= 0.8) return 'Lambat';
    if (rate <= 1.0) return 'Normal';
    if (rate <= 1.3) return 'Cepat';
    return 'Sangat Cepat';
  };

  // Get volume display text
  const getVolumeDisplayText = (volume: number): string => {
    if (volume <= 0.3) return 'Pelan';
    if (volume <= 0.6) return 'Sedang';
    if (volume <= 0.8) return 'Normal';
    return 'Keras';
  };

  return (
    <div className="space-y-3">
      {/* Panel Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="p-1.5 bg-[#005EB8]/10 rounded-md">
          <Volume2 className="w-4 h-4 text-[#005EB8]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Pengaturan Audio
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Text-to-speech dan suara
          </p>
        </div>
      </div>

      {/* Sound Toggle Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <SettingButton
          icon={settings.soundEnabled ? Volume2 : VolumeX}
          label={settings.soundEnabled ? 'Suara Aktif' : 'Suara Mati'}
          active={settings.soundEnabled}
          onClick={handleSoundToggle}
          onMouseEnter={() => speakText(settings.soundEnabled ? 'Suara Aktif' : 'Suara Mati')}
          variant="accent"
          disabled={!settings.enabled}
        />
        
        <SettingButton
          icon={Volume2}
          label="Text-to-Speech"
          active={settings.textToSpeech}
          onClick={handleTextToSpeechToggle}
          onMouseEnter={() => speakText('Text-to-Speech')}
          variant="accent"
          disabled={!settings.enabled || !settings.soundEnabled}
        />
      </div>

      {/* TTS Active Info */}
      {isTTSActive && (
        <InfoBox
          icon={Volume2}
          title="Text-to-Speech Aktif"
          description="Arahkan kursor untuk mendengar teks"
          variant="info"
        />
      )}

      {/* TTS Settings - Only show when TTS is active */}
      {isTTSActive && (
        <>
          {/* Speech Rate */}
          <SliderControl
            label="Kecepatan Bicara"
            value={settings.ttsRate}
            min={0.5}
            max={2.0}
            step={0.1}
            onChange={(value) => updateSetting('ttsRate', value)}
            onIncrement={() => updateSetting('ttsRate', Math.min(2.0, settings.ttsRate + 0.1))}
            onDecrement={() => updateSetting('ttsRate', Math.max(0.5, settings.ttsRate - 0.1))}
            icon={Gauge}
            disabled={!settings.enabled || !settings.soundEnabled}
            displayValue={getRateDisplayText(settings.ttsRate)}
          />

          {/* TTS Volume */}
          <SliderControl
            label="Volume Suara"
            value={settings.ttsVolume}
            min={0.1}
            max={1.0}
            step={0.1}
            onChange={(value) => updateSetting('ttsVolume', value)}
            onIncrement={() => updateSetting('ttsVolume', Math.min(1.0, settings.ttsVolume + 0.1))}
            onDecrement={() => updateSetting('ttsVolume', Math.max(0.1, settings.ttsVolume - 0.1))}
            icon={Volume2}
            disabled={!settings.enabled || !settings.soundEnabled}
            displayValue={getVolumeDisplayText(settings.ttsVolume)}
          />

          {/* Voice Selection */}
          <SelectControl
            label="Pilihan Suara"
            value={settings.ttsVoice}
            onChange={(value) => updateSetting('ttsVoice', value)}
            options={[
              { value: '', label: 'Suara Default' },
              ...availableVoices.map((voice) => ({
                value: voice.voiceURI,
                label: `${voice.name} (${voice.lang})`
              }))
            ]}
            disabled={!settings.enabled || !settings.soundEnabled || availableVoices.length === 0}
            icon={User}
          />

          {/* Test Button */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Test Suara</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Uji pengaturan</p>
              </div>
              <button
                onClick={() => speakText('Ini adalah contoh suara dari text-to-speech.')}
                disabled={!settings.enabled || !settings.soundEnabled}
                className="px-3 py-1.5 bg-[#005EB8] hover:bg-[#004A93] text-white text-xs font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Test
              </button>
            </div>
          </div>
        </>
      )}

      {/* Warning when TTS is on but sound is off */}
      {settings.textToSpeech && !settings.soundEnabled && (
        <InfoBox
          icon={VolumeX}
          title="TTS Tidak Aktif"
          description="Aktifkan 'Suara Aktif' terlebih dahulu"
          variant="warning"
        />
      )}
    </div>
  );
};

export default AudioPanel;
