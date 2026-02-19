"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Accessibility,
  X,
  RotateCcw,
  Power,
  PowerOff,
  Move,
  Monitor,
  Type,
  Navigation,
  Volume2,
  Minimize2,
  Maximize2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { AccessibilitySettings, defaultSettings } from './types';
import VisualPanel from './visual-panel';
import TextPanel from './text-panel';
import NavigationPanel from './navigation-panel';
import AudioPanel from './audio-panel';

const AccessibilityOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isWidgetMinimized, setIsWidgetMinimized] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('visual');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTTSActive, setIsTTSActive] = useState<boolean>(false);

  // Refs
  const ttsEnabledRef = useRef<boolean>(false);
  const mouseEnterHandlerRef = useRef<((e: Event) => void) | null>(null);
  const mouseLeaveHandlerRef = useRef<((e: Event) => void) | null>(null);

  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('accessibility-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          return { ...defaultSettings, ...parsed };
        }
      } catch (error) {
        console.warn('Failed to load accessibility settings:', error);
      }
    }
    return defaultSettings;
  });

  // Categories configuration
  const categories = [
    { id: 'visual', label: 'Visual', icon: Monitor },
    { id: 'text', label: 'Teks', icon: Type },
    { id: 'motor', label: 'Navigasi', icon: Navigation },
    { id: 'audio', label: 'Audio', icon: Volume2 }
  ];

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);

      if (voices.length > 0 && !settings.ttsVoice) {
        const defaultVoice = voices.find(voice => voice.lang.includes('id')) ||
          voices.find(voice => voice.lang.includes('en')) ||
          voices[0];
        if (defaultVoice) {
          setSettings(prev => ({ ...prev, ttsVoice: defaultVoice.voiceURI }));
        }
      }
    };

    loadVoices();

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Update TTS enabled ref
  useEffect(() => {
    ttsEnabledRef.current = settings.textToSpeech && settings.soundEnabled && settings.enabled;
    setIsTTSActive(ttsEnabledRef.current);
  }, [settings.textToSpeech, settings.soundEnabled, settings.enabled]);

  // Body scroll management - REMOVED overflow hidden to allow page scrolling
  // The overlay now uses its own scroll container without blocking page scroll

  // Save settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('accessibility-settings', JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save accessibility settings:', error);
      }
    }
  }, [settings]);

  // Apply visual settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const oldStyleElement = document.getElementById('accessibility-styles');
    if (oldStyleElement) oldStyleElement.remove();

    const styleElement = document.createElement('style');
    styleElement.id = 'accessibility-styles';

    if (!settings.enabled) {
      document.head.appendChild(styleElement);
      document.documentElement.style.filter = '';
      document.documentElement.classList.remove('focus-mode');
      const guide = document.getElementById('reading-guide');
      if (guide) guide.remove();
      return;
    }

    let css = '';

    // Font Size
    if (settings.fontSize !== 100) {
      css += `body *:not(#accessibility-overlay):not(#accessibility-overlay *) { font-size: calc(1em * ${settings.fontSize / 100}) !important; }`;
    }

    // Line Height
    if (settings.lineHeight !== 100) {
      css += `body *:not(#accessibility-overlay):not(#accessibility-overlay *) { line-height: ${settings.lineHeight / 100} !important; }`;
    }

    // Letter Spacing
    if (settings.letterSpacing !== 0) {
      css += `body *:not(#accessibility-overlay):not(#accessibility-overlay *) { letter-spacing: ${settings.letterSpacing}px !important; }`;
    }

    // Font Weight
    if (settings.fontWeight !== 400) {
      css += `body *:not(#accessibility-overlay):not(#accessibility-overlay *) { font-weight: ${settings.fontWeight} !important; }`;
    }

    // Text Align
    if (settings.textAlign !== 'left') {
      css += `body *:not(#accessibility-overlay):not(#accessibility-overlay *) { text-align: ${settings.textAlign} !important; }`;
    }

    // Focus mode
    if (settings.focusMode) {
      css += `.focus-mode *:not(#accessibility-overlay):not(#accessibility-overlay *) { outline: 2px solid #005EB8 !important; outline-offset: 2px !important; }`;
    }

    // Dyslexia friendly font (OpenDyslexic)
    if (settings.dyslexiaFont) {
      css += `
        @import url('https://fonts.cdnfonts.com/css/opendyslexic');
        body *:not(#accessibility-overlay):not(#accessibility-overlay *) {
          font-family: 'OpenDyslexic', sans-serif !important;
        }
      `;
    }

    // Cursor size
    if (settings.cursorSize !== 'normal') {
      const cursorSize = settings.cursorSize === 'large' ? '32' : '48';
      css += `body *:not(#accessibility-overlay):not(#accessibility-overlay *) { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23005EB8" opacity="0.8"/></svg>') 16 16, auto !important; }`;
    }

    // Visual filters
    const filters: string[] = [];
    if (settings.contrast === 'high') filters.push('contrast(150%)');
    if (settings.contrast === 'higher') filters.push('contrast(200%)');
    if (settings.brightness !== 100) filters.push(`brightness(${settings.brightness}%)`);
    if (settings.saturation !== 100) filters.push(`saturate(${settings.saturation}%)`);
    if (settings.invertColors) filters.push('invert(1)');
    if (settings.grayscale) filters.push('grayscale(1)');

    if (filters.length > 0) {
      css += `body { filter: ${filters.join(' ')} !important; } #accessibility-overlay { filter: none !important; }`;
    }

    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    // Focus mode class
    if (settings.focusMode) {
      document.documentElement.classList.add('focus-mode');
    } else {
      document.documentElement.classList.remove('focus-mode');
    }

    // Reading guide
    if (settings.readingGuide) {
      setupReadingGuide();
    } else {
      const guide = document.getElementById('reading-guide');
      if (guide) guide.remove();
    }
  }, [settings]);

  // Setup reading guide
  const setupReadingGuide = useCallback(() => {
    if (typeof window === 'undefined') return;

    let guide = document.getElementById('reading-guide');
    if (!guide) {
      guide = document.createElement('div');
      guide.id = 'reading-guide';
      guide.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: #005EB8;
        z-index: 9999;
        pointer-events: none;
        transform: translateY(-100%);
        transition: transform 0.2s ease;
      `;
      document.body.appendChild(guide);
    }

    const handleMouseMove = (e: MouseEvent): void => {
      if (guide) {
        guide.style.transform = `translateY(${e.clientY - 1}px)`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      const guideElement = document.getElementById('reading-guide');
      if (guideElement) guideElement.remove();
    };
  }, []);

  // TTS Functions
  const getTextFromElement = useCallback((element: HTMLElement): string => {
    try {
      if (element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        return img.alt || img.title || 'Gambar';
      }

      if (element.tagName === 'INPUT') {
        const input = element as HTMLInputElement;
        const label = document.querySelector(`label[for="${input.id}"]`) as HTMLLabelElement | null;
        return label?.textContent?.trim() || input.placeholder || input.getAttribute('aria-label') || `Input ${input.type}`;
      }

      if (element.tagName === 'BUTTON') {
        return element.textContent?.trim() || element.getAttribute('aria-label') || element.getAttribute('title') || 'Tombol';
      }

      if (element.tagName === 'A') {
        return element.textContent?.trim() || element.getAttribute('title') || element.getAttribute('aria-label') || 'Link';
      }

      if (element.tagName === 'SELECT') {
        const select = element as HTMLSelectElement;
        const selectedOption = select.options[select.selectedIndex];
        return `Pilihan: ${selectedOption?.text || 'Tidak ada pilihan'}`;
      }

      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel;

      let text = '';
      const childNodes = element.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
          const textContent = node.textContent?.trim();
          if (textContent) text += textContent + ' ';
        }
      }

      if (!text.trim()) {
        const textElements = element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, td, th, li');
        for (let i = 0; i < Math.min(textElements.length, 3); i++) {
          const el = textElements[i] as HTMLElement;
          const elementText = el.textContent?.trim();
          if (elementText && elementText.length < 100) {
            text += elementText + '. ';
          }
        }
      }

      return text.trim().substring(0, 200);
    } catch (error) {
      console.warn('Error getting text from element:', error);
      return '';
    }
  }, []);

  const speakElementText = useCallback((text: string) => {
    if (!ttsEnabledRef.current) return;

    try {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.ttsRate;
      utterance.volume = settings.ttsVolume;

      if (settings.ttsVoice && availableVoices.length > 0) {
        const selectedVoice = availableVoices.find(voice => voice.voiceURI === settings.ttsVoice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          const indonesianVoice = availableVoices.find(voice => voice.lang.includes('id'));
          if (indonesianVoice) utterance.voice = indonesianVoice;
        }
      }

      if (!utterance.voice) utterance.lang = 'id-ID';

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Error with text-to-speech:', error);
    }
  }, [settings.ttsRate, settings.ttsVolume, settings.ttsVoice, availableVoices]);

  const handleMouseEnter = useCallback((e: Event) => {
    if (!ttsEnabledRef.current) return;

    const target = e.target as HTMLElement;

    if (!target || target.closest('#accessibility-overlay')) return;
    if (target.tagName === 'BODY' || target.tagName === 'HTML') return;

    const textToSpeak = getTextFromElement(target);

    if (textToSpeak && textToSpeak.length > 0) {
      speakElementText(textToSpeak);
    }
  }, [getTextFromElement, speakElementText]);

  const handleMouseLeave = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  const setupTTSListeners = useCallback(() => {
    if (typeof window === 'undefined') return;

    mouseEnterHandlerRef.current = handleMouseEnter;
    mouseLeaveHandlerRef.current = handleMouseLeave;

    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
      }
    });
  }, [handleMouseEnter, handleMouseLeave]);

  const removeTTSListeners = useCallback(() => {
    if (typeof window === 'undefined') return;

    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        if (mouseEnterHandlerRef.current) {
          element.removeEventListener('mouseenter', mouseEnterHandlerRef.current);
        }
        if (mouseLeaveHandlerRef.current) {
          element.removeEventListener('mouseleave', mouseLeaveHandlerRef.current);
        }
      }
    });

    mouseEnterHandlerRef.current = null;
    mouseLeaveHandlerRef.current = null;
  }, []);

  // TTS Effect
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const shouldEnableTTS = settings.textToSpeech && settings.soundEnabled && settings.enabled;

    if (!shouldEnableTTS) {
      removeTTSListeners();
      speechSynthesis.cancel();
      setIsTTSActive(false);
      return;
    }

    setupTTSListeners();
    setIsTTSActive(true);

    return () => {
      removeTTSListeners();
      speechSynthesis.cancel();
    };
  }, [settings.textToSpeech, settings.soundEnabled, settings.enabled, settings.ttsRate, settings.ttsVolume, settings.ttsVoice, availableVoices, setupTTSListeners, removeTTSListeners]);

  // Settings handlers
  const resetSettings = useCallback((): void => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    removeTTSListeners();
    setSettings(defaultSettings);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('accessibility-settings');
      } catch (error) {
        console.warn('Failed to clear accessibility settings:', error);
      }
    }
  }, [removeTTSListeners]);

  const toggleSetting = useCallback((key: keyof AccessibilitySettings): void => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]): void => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const speakText = useCallback((text: string): void => {
    if (!settings.enabled || !settings.soundEnabled) return;

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.rate = settings.ttsRate;
        utterance.volume = settings.ttsVolume;

        if (settings.ttsVoice && availableVoices.length > 0) {
          const selectedVoice = availableVoices.find(voice => voice.voiceURI === settings.ttsVoice);
          if (selectedVoice) utterance.voice = selectedVoice;
        }

        if (!utterance.voice) utterance.lang = 'id-ID';

        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Error speaking text:', error);
    }
  }, [settings.enabled, settings.soundEnabled, settings.ttsRate, settings.ttsVolume, settings.ttsVoice, availableVoices]);

  const handleSoundToggle = useCallback((): void => {
    const newSoundEnabled = !settings.soundEnabled;

    if (!newSoundEnabled) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    }

    setSettings(prev => ({
      ...prev,
      soundEnabled: newSoundEnabled,
      textToSpeech: newSoundEnabled ? prev.textToSpeech : false
    }));
  }, [settings.soundEnabled]);

  const handleTextToSpeechToggle = useCallback((): void => {
    const newTextToSpeech = !settings.textToSpeech;

    if (!newTextToSpeech) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    }

    setSettings(prev => ({ ...prev, textToSpeech: newTextToSpeech }));
  }, [settings.textToSpeech]);

  const handleWidgetPositionToggle = useCallback((): void => {
    const newPosition = settings.widgetPosition === 'right' ? 'left' : 'right';
    setSettings(prev => ({ ...prev, widgetPosition: newPosition }));
  }, [settings.widgetPosition]);

  // Position classes - Widget always stays on right, only panel position changes
  const overlayPositionClass = settings.widgetPosition === 'right' ? 'right-0' : 'left-0';

  // Render active panel
  const renderActivePanel = () => {
    const panelProps = {
      settings,
      updateSetting,
      toggleSetting,
      speakText
    };

    switch (activeCategory) {
      case 'visual':
        return <VisualPanel {...panelProps} />;
      case 'text':
        return <TextPanel {...panelProps} />;
      case 'motor':
        return <NavigationPanel {...panelProps} />;
      case 'audio':
        return (
          <AudioPanel
            {...panelProps}
            isTTSActive={isTTSActive}
            availableVoices={availableVoices}
            handleSoundToggle={handleSoundToggle}
            handleTextToSpeechToggle={handleTextToSpeechToggle}
          />
        );
      default:
        return <VisualPanel {...panelProps} />;
    }
  };

  return (
    <>
      {/* Widget Container - Always on right side */}
      <div className="fixed bottom-6 right-0 z-50 transition-all duration-300">
        {/* Hidden State - Small edge tab to restore */}
        {isWidgetMinimized ? (
          <button
            onClick={() => setIsWidgetMinimized(false)}
            className={`
              px-1.5 py-3 rounded-l-lg shadow-lg transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-[#005EB8]/50
              hover:px-2.5
              ${settings.enabled ? 'bg-[#008A00] hover:bg-[#007700]' : 'bg-[#005EB8] hover:bg-[#004A93]'}
            `}
            aria-label="Buka widget aksesibilitas"
            onMouseEnter={() => speakText('Buka Aksesibilitas')}
          >
            <Accessibility className="w-4 h-4 text-white" />
          </button>
        ) : (
          /* Full Widget - with close button */
          <div className="relative mr-6">
            {/* Close button to hide widget */}
            <button
              onClick={() => setIsWidgetMinimized(true)}
              className="
                absolute -top-2 -right-2 p-1 rounded-full bg-gray-700 hover:bg-gray-800 shadow-md transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-400 z-10
              "
              aria-label="Sembunyikan widget"
              onMouseEnter={() => speakText('Sembunyikan Widget')}
            >
              <X className="w-3 h-3 text-white" />
            </button>
            
            {/* Main FAB Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`
                p-4 rounded-full shadow-lg transition-all duration-300
                focus:outline-none focus:ring-4 focus:ring-[#005EB8]/50
                hover:scale-105 active:scale-95
                ${settings.enabled ? 'bg-[#008A00] hover:bg-[#007700]' : 'bg-[#005EB8] hover:bg-[#004A93]'}
              `}
              aria-label={`${settings.enabled ? 'Aksesibilitas aktif' : 'Aksesibilitas nonaktif'} - Buka pengaturan`}
              onMouseEnter={() => speakText('Pengaturan Aksesibilitas')}
            >
              <Accessibility className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Overlay Panel - Clean design matching mentor/user pages */}
      {isOpen && (
        <div
          id="accessibility-overlay"
          className={`fixed top-0 h-screen bg-white dark:bg-gray-900 shadow-sm border-l border-gray-200 dark:border-gray-700 z-[10000] w-full max-w-[360px] flex flex-col transition-all duration-300 ${overlayPositionClass}`}
          style={{ maxHeight: '100vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#005EB8] to-[#004A93]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-md">
                <Accessibility className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Aksesibilitas
                </h2>
                <p className="text-white/80 text-[10px]">
                  Sesuaikan pengalaman Anda
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={resetSettings}
                className="p-1.5 text-white/80 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                aria-label="Reset pengaturan"
                onMouseEnter={() => speakText('Reset Pengaturan')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                aria-label="Tutup"
                onMouseEnter={() => speakText('Tutup')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.enabled ? (
                  <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <Power className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <PowerOff className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {settings.enabled ? 'Aktif' : 'Nonaktif'}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {settings.enabled ? 'Fitur aktif' : 'Klik untuk aktifkan'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting('enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005EB8] ${settings.enabled ? 'bg-[#008A00]' : 'bg-gray-300 dark:bg-gray-600'}`}
                aria-label={`${settings.enabled ? 'Matikan' : 'Aktifkan'} aksesibilitas`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Panel Position Toggle */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-[#005EB8]" />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Panel: {settings.widgetPosition === 'right' ? 'Kanan' : 'Kiri'}
                </span>
              </div>
              <button
                onClick={handleWidgetPositionToggle}
                disabled={!settings.enabled}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#005EB8] disabled:opacity-50 ${settings.enabled ? 'bg-[#005EB8]' : 'bg-gray-300 dark:bg-gray-600'}`}
                aria-label="Ganti posisi panel"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${settings.widgetPosition === 'right' ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="grid grid-cols-4 gap-1.5">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => settings.enabled && setActiveCategory(category.id)}
                    disabled={!settings.enabled}
                    className={`
                      flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-all duration-200
                      ${isActive
                        ? settings.enabled
                          ? 'bg-[#005EB8] text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                        : settings.enabled
                          ? 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                      }
                      disabled:cursor-not-allowed
                      focus:outline-none focus:ring-1 focus:ring-[#005EB8]
                    `}
                    onMouseEnter={() => settings.enabled && speakText(category.label)}
                  >
                    <Icon className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-[10px] font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800/30">
            {settings.enabled ? (
              renderActivePanel()
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-3">
                  <PowerOff className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Aksesibilitas Nonaktif
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Aktifkan tombol di atas untuk mulai
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AccessibilityOverlay;