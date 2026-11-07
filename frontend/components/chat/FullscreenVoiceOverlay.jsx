import React, { useState, useRef, useEffect, useCallback } from 'react';
import ThinkingOrbStage from './ThinkingOrbStage.jsx';
import { RealtimeVoiceClient } from '../../services/realtimeVoiceClient.js';

const INITIAL_VOICE_STATE = {
  phase: 'idle',
  orbState: 'idle',
  variant: 'default',
  speed: 1,
  paused: false,
  label: '',
};

export function FullscreenVoiceOverlay({
  isOpen = false,
  onClose,
  thinkingEnabled = false,
  userContext = null,
  onVoiceTurnCompleted,
  onVoiceRecommendations,
}) {
  const [voiceState, setVoiceState] = useState(INITIAL_VOICE_STATE);
  const [isMuted, setIsMuted] = useState(false);
  const [liveCaption, setLiveCaption] = useState('');
  const [errorBanner, setErrorBanner] = useState(null);

  const clientRef = useRef(null);
  const heroStageRef = useRef(null);
  const draftTranscriptMapRef = useRef(new Map());

  const resetAudioVariables = useCallback(() => {
    const el = heroStageRef.current;
    if (el) {
      el.style.setProperty('--mic-level', '0');
      el.style.setProperty('--ai-audio-level', '0');
    }
  }, []);

  const stopSession = useCallback(async () => {
    const activeClient = clientRef.current;
    clientRef.current = null;
    draftTranscriptMapRef.current.clear();
    if (activeClient) {
      await activeClient.disconnect();
    }
    setIsMuted(false);
    setLiveCaption('');
    resetAudioVariables();
    setVoiceState(INITIAL_VOICE_STATE);
  }, [resetAudioVariables]);

  // Bersihkan koneksi WebRTC & track mikrofon saat overlay ditutup atau unmount
  useEffect(() => {
    if (!isOpen) {
      stopSession();
      setErrorBanner(null);
    }
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [isOpen, stopSession]);

  const handleClose = useCallback(async () => {
    await stopSession();
    onClose?.();
  }, [stopSession, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  const handleStartConversation = async () => {
    if (clientRef.current) {
      await stopSession();
    }

    setErrorBanner(null);
    setLiveCaption('');
    setIsMuted(false);

    const client = new RealtimeVoiceClient({
      onStateChange: (nextState) => {
        setVoiceState((prev) => ({ ...prev, ...nextState }));
      },
      onAudioLevels: ({ micLevel, aiLevel }) => {
        const el = heroStageRef.current;
        if (el) {
          el.style.setProperty('--mic-level', micLevel.toFixed(3));
          el.style.setProperty('--ai-audio-level', aiLevel.toFixed(3));
        }
      },
      onTranscript: ({ role, itemId, delta, text, final }) => {
        if (final && text) {
          draftTranscriptMapRef.current.delete(itemId);
          setLiveCaption(text);
          onVoiceTurnCompleted?.({ role, content: text });
        } else if (delta) {
          const prevText = draftTranscriptMapRef.current.get(itemId) || '';
          const updated = prevText + delta;
          draftTranscriptMapRef.current.set(itemId, updated);
          setLiveCaption(updated);
        }
      },
      onRecommendations: (recPayload) => {
        if (recPayload?.hasValidRecommendations) {
          onVoiceRecommendations?.(recPayload);
        }
      },
      onError: (err) => {
        setErrorBanner(
          err?.message || 'Gagal memulai percakapan suara. Periksa konfigurasi layanan AI.',
        );
      },
    });

    clientRef.current = client;

    try {
      await client.connect({
        userContext,
        reasoningEffort: thinkingEnabled ? 'high' : 'low',
      });
    } catch {
      clientRef.current = null;
      resetAudioVariables();
      setVoiceState({
        phase: 'idle',
        orbState: 'idle',
        variant: 'default',
        speed: 1,
        paused: true,
        label: 'Sesi suara belum aktif',
      });
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    clientRef.current?.setMuted(next);
  };

  const handleInterrupt = () => {
    clientRef.current?.interrupt();
  };

  if (!isOpen) return null;

  const isSessionActive = voiceState.phase !== 'idle';
  const isConnecting = voiceState.phase === 'connecting';

  return (
    <div
      className="voice-fullscreen-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="TERALIO Voice Conversation"
      data-testid="fullscreen-voice-overlay"
    >
      {/* Minimal Top Bar: Hanya tombol kembali/tutup */}
      <div className="voice-fullscreen__topbar">
        <span className="voice-fullscreen__brand">TERALIO Voice</span>
        <button
          type="button"
          className="voice-fullscreen__close-btn"
          onClick={handleClose}
          aria-label="Tutup percakapan suara"
          data-testid="voice-close-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Center Stage: Thinking Orbs sebagai pusat visual tunggal (animasi muter saat idle, tanpa backdrop biru) */}
      <div className="voice-fullscreen__center">
        <ThinkingOrbStage
          ref={heroStageRef}
          mode="hero"
          state={voiceState.orbState}
          variant={voiceState.variant}
          phase={voiceState.phase}
          speed={voiceState.speed}
          paused={false}
          size={184}
          label={voiceState.label}
          showLabel={false}
        />

        <p className="voice-fullscreen__status sr-only" data-testid="voice-status-label">
          {voiceState.label}
        </p>

        {liveCaption && (
          <p className="voice-fullscreen__caption" data-testid="voice-live-caption">
            {liveCaption}
          </p>
        )}

        {errorBanner && (
          <div className="voice-fullscreen__error" role="alert" data-testid="voice-error-banner">
            {errorBanner}
          </div>
        )}
      </div>

      {/* Bottom Controls: Start Conversation atau kontrol aktif */}
      <div className="voice-fullscreen__bottom">
        {!isSessionActive ? (
          <button
            type="button"
            className="voice-start-btn"
            onClick={handleStartConversation}
            data-testid="voice-start-btn"
          >
            Start Conversation
          </button>
        ) : (
          <div className="voice-active-controls" data-testid="voice-active-controls">
            <button
              type="button"
              className={`voice-ctrl-btn ${isMuted ? 'is-muted' : ''}`}
              onClick={handleToggleMute}
              disabled={isConnecting}
              aria-pressed={isMuted}
              aria-label={isMuted ? 'Aktifkan mikrofon' : 'Bisukan mikrofon'}
              data-testid="voice-mute-btn"
            >
              {isMuted ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {voiceState.phase === 'ai_speaking' && (
              <button
                type="button"
                className="voice-ctrl-btn is-interrupt"
                onClick={handleInterrupt}
                aria-label="Hentikan suara AI"
                data-testid="voice-interrupt-btn"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" />
                </svg>
                <span>Interrupt</span>
              </button>
            )}

            <button
              type="button"
              className="voice-ctrl-btn is-end"
              onClick={stopSession}
              aria-label="Akhiri percakapan suara"
              data-testid="voice-end-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>End Conversation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FullscreenVoiceOverlay;
