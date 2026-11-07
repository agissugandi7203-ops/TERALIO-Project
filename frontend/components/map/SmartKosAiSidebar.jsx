import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarCheck, Check, MapPin, Mic, MicOff, PhoneOff, Volume2, X } from 'lucide-react';
import ChatComposer from '../chat/ChatComposer.jsx';
import ThinkingOrbStage from '../chat/ThinkingOrbStage.jsx';
import { RealtimeVoiceClient } from '../../services/realtimeVoiceClient.js';

const VOICE_PROGRESS_STEPS = [
  { id: 'listening', label: 'Mendengarkan perintah suara Anda...' },
  { id: 'intent', label: 'Menganalisis kriteria lokasi, tipe kos, & jadwal...' },
  { id: 'database', label: 'Mencari kos terdekat berdasarkan database...' },
  { id: 'routing', label: 'Menghitung jarak & rute jalan kaki ke kampus...' },
  { id: 'redirect', label: 'Mengarahkan layar & memperbarui tampilan...' },
];

function renderFormattedText(text = '') {
  return String(text)
    .split('\n')
    .map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="sk-msg-spacer" />;

      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="sk-msg-h4">
            {trimmed.slice(4)}
          </h4>
        );
      }

      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, sIdx) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={sIdx}>{seg.slice(2, -2)}</strong>;
        }
        return seg;
      });

      if (trimmed.startsWith('- ')) {
        return (
          <div key={idx} className="sk-msg-bullet">
            <span className="sk-msg-bullet__dot">•</span>
            <span>{parts.map((p, i) => (typeof p === 'string' ? p.replace(/^- /, '') : p))}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="sk-msg-p">
          {parts}
        </p>
      );
    });
}

export function SmartKosAiSidebar({
  isOpen = false,
  isVoiceOpen = false,
  onCloseSidebar,
  onOpenVoice,
  onCloseVoice,
  messages = [],
  isStreaming = false,
  activeStatus = null,
  onSelectKos,
  onOpenSchedule,
  composerValue = '',
  onComposerChange,
  onSubmitPrompt,
  onStopStreaming,
  thinkingEnabled = false,
  onToggleThinking,
  attachments = [],
  onSelectFiles,
  onRemoveAttachment,
  onExecuteVoiceQuery,
  onVoiceRealtimeTurn,
  onVoiceRealtimeRecommendations,
  onVoiceUiAction,
  activeCampusName = 'Universitas Teknologi Bandung (UTB)',
  activePageLabel = 'Smart Kos Match',
  fixedMode = false,
}) {
  const scrollEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const realtimeClientRef = useRef(null);
  const autoConnectTriggeredRef = useRef(false);
  const runVoiceSearchPipelineRef = useRef(null);

  // Latest-Ref agar callback WebRTC multi-turn & lintas halaman tidak pernah memegang closure basi
  const latestPropsRef = useRef({
    onVoiceRealtimeTurn,
    onVoiceRealtimeRecommendations,
    onVoiceUiAction,
    activeCampusName,
    activePageLabel,
    thinkingEnabled,
  });
  latestPropsRef.current = {
    onVoiceRealtimeTurn,
    onVoiceRealtimeRecommendations,
    onVoiceUiAction,
    activeCampusName,
    activePageLabel,
    thinkingEnabled,
  };

  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceStepId, setVoiceStepId] = useState('idle');
  const [voiceStatusLabel, setVoiceStatusLabel] = useState(
    'Menghubungkan asisten suara TERALIO...',
  );
  const [voiceOrbProps, setVoiceOrbProps] = useState({
    state: 'idle',
    variant: 'default',
    phase: 'idle',
  });
  const [lastRedirectedKos, setLastRedirectedKos] = useState(null);
  const [lastBookedVisit, setLastBookedVisit] = useState(null);
  const [voiceError, setVoiceError] = useState(null);

  useEffect(() => {
    if (scrollEndRef.current && typeof scrollEndRef.current.scrollIntoView === 'function') {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isStreaming, activeStatus]);

  useEffect(() => {
    if (!isVoiceOpen || !activeStatus) return;
    setVoiceOrbProps({
      state: activeStatus.orbState || 'searching',
      variant: activeStatus.variant || 'default',
      phase: 'processing_voice',
    });
    if (activeStatus.step) {
      setVoiceStepId(activeStatus.step);
    }
    if (activeStatus.label) {
      setVoiceStatusLabel(activeStatus.label);
    }
  }, [isVoiceOpen, activeStatus]);

  const teardownVoiceSession = useCallback(async () => {
    if (realtimeClientRef.current) {
      const active = realtimeClientRef.current;
      realtimeClientRef.current = null;
      await active.disconnect().catch(() => {});
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop error
      }
      recognitionRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsListeningMic(false);
    setIsConnectingVoice(false);
    setIsMuted(false);
  }, []);

  const startVoiceConversation = useCallback(async () => {
    await teardownVoiceSession();

    const canUseWebRtc =
      typeof RTCPeerConnection !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices) &&
      typeof navigator.mediaDevices.getUserMedia === 'function';

    if (canUseWebRtc) {
      setVoiceError(null);
      setLiveTranscript('');
      setLastRedirectedKos(null);
      setLastBookedVisit(null);
      setIsConnectingVoice(true);

      const client = new RealtimeVoiceClient({
        onStateChange: (st) => {
          setVoiceOrbProps({
            state: st.orbState || 'idle',
            variant: st.variant || 'default',
            phase: st.phase || 'listening',
          });
          if (st.label) {
            setVoiceStatusLabel(st.label);
          }

          if (st.phase === 'user_speaking') {
            setLiveTranscript('');
            setVoiceStepId('listening');
          } else if (st.phase === 'processing_voice' || st.phase === 'ai_thinking') {
            setVoiceStepId('intent');
          } else if (st.phase === 'tool_running') {
            setVoiceStepId('database');
          }
        },
        onTranscript: (ev) => {
          if (ev.role === 'user') {
            if (ev.final && ev.text) {
              setLiveTranscript(ev.text);
              latestPropsRef.current.onVoiceRealtimeTurn?.({ role: 'user', text: ev.text });
            } else if (ev.delta) {
              setLiveTranscript((prev) => `${prev}${ev.delta}`);
            }
          } else if (ev.role === 'assistant' && ev.final && ev.text) {
            latestPropsRef.current.onVoiceRealtimeTurn?.({ role: 'assistant', text: ev.text });
          }
        },
        onRecommendations: (recPayload) => {
          setVoiceStepId('routing');
          const redirected = latestPropsRef.current.onVoiceRealtimeRecommendations?.(recPayload);
          if (redirected) {
            setLastRedirectedKos(redirected);
            setVoiceStepId('done');
            setVoiceStatusLabel(`Peta diarahkan ke ${redirected.name}`);
          }
        },
        onUiAction: (actionPayload) => {
          if (!actionPayload) return;
          const result = latestPropsRef.current.onVoiceUiAction?.(actionPayload);
          if (actionPayload.type === 'focus_map' && (result || actionPayload.targetKos)) {
            const target = result || actionPayload.targetKos;
            setLastRedirectedKos(target);
            setVoiceStepId('done');
            setVoiceStatusLabel(`Peta diarahkan ke ${target.name}`);
          } else if (actionPayload.type === 'open_schedule') {
            setLastBookedVisit(actionPayload.booking || { scheduledLabel: 'Jadwal Kunjungan' });
            setVoiceStepId('done');
            setVoiceStatusLabel('Halaman Visit Schedule dibuka otomatis');
          }
        },
        onError: (err) => {
          if (err?.message) {
            setVoiceError(err.message);
          }
        },
      });

      realtimeClientRef.current = client;
      try {
        await client.connect({
          autoGreet: false,
          reasoningEffort: latestPropsRef.current.thinkingEnabled ? 'high' : 'low',
          userContext: {
            activeCampus: latestPropsRef.current.activeCampusName,
            activeView: latestPropsRef.current.activePageLabel,
            instructionHint:
              'Setiap kali pengguna menanyakan atau berpindah ke kos lain, WAJIB panggil teralio_focus_map_location atau teralio_search_accommodations agar kamera peta berpindah. Jika pengguna setuju survei/booking jam temu, LANGSUNG panggil teralio_create_visit_schedule agar halaman Visit Schedule terbuka otomatis. Jika ingin ganti jam temu, panggil teralio_update_visit_schedule.',
          },
        });
        if (realtimeClientRef.current === client && !client.disposed) {
          setIsConnectingVoice(false);
          setIsListeningMic(true);
          setVoiceStepId('listening');
        }
        return;
      } catch (webrtcErr) {
        realtimeClientRef.current = null;
        setIsConnectingVoice(false);
        setIsListeningMic(false);
        setVoiceError(
          webrtcErr?.message || 'Gagal memulai koneksi suara WebRTC. Silakan coba kembali.',
        );
        return;
      }
    }

    // Fallback untuk browser non-WebRTC (misal SpeechRecognition lokal)
    const SpeechRec =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      return;
    }

    setVoiceError(null);
    setLiveTranscript('');
    setLastRedirectedKos(null);

    const rec = new SpeechRec();
    rec.lang = 'id-ID';
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalSpoken = '';

    rec.onstart = () => {
      setIsListeningMic(true);
      setVoiceStepId('listening');
      setVoiceStatusLabel('Mendengarkan suara Anda...');
      setVoiceOrbProps({ state: 'idle', variant: 'blink', phase: 'user_speaking' });
    };

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalSpoken += `${chunk} `;
        } else {
          interim += chunk;
        }
      }
      setLiveTranscript((finalSpoken + interim).trim());
    };

    rec.onerror = () => {
      setIsListeningMic(false);
      setVoiceOrbProps({ state: 'idle', variant: 'default', phase: 'idle' });
    };

    rec.onend = () => {
      setIsListeningMic(false);
      const committed = finalSpoken.trim();
      if (committed) {
        runVoiceSearchPipelineRef.current?.(committed);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setIsListeningMic(false);
    }
  }, [teardownVoiceSession]);

  // Saat panel Voice dibuka (klik ikon Wave), langsung buka sesi suara & AI menyapa otomatis!
  useEffect(() => {
    if (isVoiceOpen) {
      if (!autoConnectTriggeredRef.current) {
        autoConnectTriggeredRef.current = true;
        startVoiceConversation();
      }
    } else {
      autoConnectTriggeredRef.current = false;
      teardownVoiceSession();
    }
  }, [isVoiceOpen, startVoiceConversation, teardownVoiceSession]);

  useEffect(
    () => () => {
      if (realtimeClientRef.current) {
        realtimeClientRef.current.disconnect().catch(() => {});
        realtimeClientRef.current = null;
      }
    },
    [],
  );

  if (!isOpen && !isVoiceOpen) {
    return null;
  }

  const runVoiceSearchPipeline = async (spokenText) => {
    const cleaned = String(spokenText || '').trim();
    if (!cleaned || !onExecuteVoiceQuery) return;

    setVoiceError(null);
    setLiveTranscript(cleaned);
    setLastRedirectedKos(null);
    setVoiceStepId('intent');
    setVoiceStatusLabel('Menganalisis kriteria lokasi, tipe kos, & budget...');
    setVoiceOrbProps({ state: 'reasoning', variant: 'twins', phase: 'processing_voice' });

    try {
      const doneData = await onExecuteVoiceQuery(cleaned, {
        onStepUpdate: (statusData) => {
          if (statusData?.step) setVoiceStepId(statusData.step);
          if (statusData?.label) setVoiceStatusLabel(statusData.label);
          setVoiceOrbProps({
            state: statusData?.orbState || 'searching',
            variant: statusData?.variant || 'lighthouse',
            phase: 'processing_voice',
          });
        },
        onRedirect: (redirectData) => {
          setVoiceStepId('redirect');
          if (redirectData?.targetKos) {
            setLastRedirectedKos(redirectData.targetKos);
            setVoiceStatusLabel(`Mengarahkan peta ke ${redirectData.targetKos.name}...`);
          }
          setVoiceOrbProps({
            state: 'using',
            variant: 'zoom',
            phase: 'ai_speaking',
          });
        },
      });

      setVoiceStepId('done');
      if (doneData?.targetKos) {
        setLastRedirectedKos(doneData.targetKos);
        setVoiceStatusLabel(`Peta diarahkan ke ${doneData.targetKos.name}`);
      }
      setVoiceOrbProps({ state: 'idle', variant: 'blink', phase: 'listening' });
    } catch (err) {
      setVoiceError(err?.message || 'Gagal memproses pencarian suara.');
      setVoiceOrbProps({ state: 'retrying', variant: 'surge', phase: 'idle' });
    }
  };
  runVoiceSearchPipelineRef.current = runVoiceSearchPipeline;

  const handleFinishVoiceConversation = async () => {
    await teardownVoiceSession();
    onCloseVoice?.();
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    realtimeClientRef.current?.setMuted(next);
  };

  const stepOrder = VOICE_PROGRESS_STEPS.map((s) => s.id);
  const currentStepIdx =
    voiceStepId === 'done' ? VOICE_PROGRESS_STEPS.length : stepOrder.indexOf(voiceStepId);

  const dynamicVoiceSuggestions = [
    'Carikan kos terdekat jalan kaki dari kampus UTB Soekarno-Hatta',
    `Carikan kos putri dekat ${activeCampusName.split(' ')[0]} yang hemat`,
    'Carikan kos sekitar ITB Dago yang ada water heater',
    'Cari kos dekat gerbang PGA Telkom University',
  ];

  const isSessionLive = isListeningMic || isConnectingVoice;

  return (
    <aside
      className={`smart-kos-ai-sidebar ${fixedMode ? 'is-fixed-crosspage' : ''}`}
      aria-label="Sidebar Percakapan & Suara TERALIO"
      data-testid="smart-kos-ai-sidebar"
    >
      {/* Header Minimalis & Bersih (Tanpa ikon bintang maupun badge database) */}
      <header className="smart-kos-ai-sidebar__header">
        <span className="smart-kos-ai-sidebar__clean-title">Percakapan</span>

        <button
          type="button"
          className="smart-kos-ai-sidebar__close"
          onClick={onCloseSidebar}
          aria-label="Tutup sidebar percakapan AI"
          data-testid="close-smart-kos-ai-sidebar"
        >
          <X size={16} />
        </button>
      </header>

      <div className="smart-kos-ai-sidebar__messages" data-testid="smart-kos-ai-messages">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="sk-chat-turn is-user">
                <div className="sk-chat-user-bubble">
                  {msg.viaVoice && (
                    <span className="sk-chat-voice-pill">
                      <Volume2 size={11} /> Suara
                    </span>
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="sk-chat-turn is-assistant">
              {(msg.isStreaming || msg.statusLabel) && (
                <div className="sk-chat-orb-row">
                  <ThinkingOrbStage
                    mode="inline"
                    size={19}
                    state={msg.orbState || (msg.isStreaming ? 'searching' : 'idle')}
                    variant={msg.orbVariant || (msg.isStreaming ? 'lighthouse' : 'default')}
                    paused={false}
                    showLabel={false}
                  />
                </div>
              )}

              {msg.text && (
                <div className="sk-chat-assistant-body">{renderFormattedText(msg.text)}</div>
              )}

              {Array.isArray(msg.matchedKosList) && msg.matchedKosList.length > 0 && (
                <div className="sk-chat-matched-list">
                  {msg.matchedKosList.slice(0, 3).map((kosItem) => (
                    <button
                      key={kosItem.id}
                      type="button"
                      className="sk-chat-kos-pill-card"
                      onClick={() => onSelectKos?.(kosItem)}
                      data-testid={`sidebar-matched-kos-${kosItem.id}`}
                    >
                      <div className="sk-chat-kos-pill-card__main">
                        <strong>{kosItem.name}</strong>
                        <span>
                          {kosItem.price} • {kosItem.type}
                        </span>
                      </div>
                      <span className="sk-chat-kos-pill-card__go">
                        <MapPin size={13} />
                        <span>Fokus</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {msg.bookedVisit && onOpenSchedule && (
                <button
                  type="button"
                  className="sk-chat-kos-pill-card"
                  onClick={() => onOpenSchedule(msg.bookedVisit)}
                >
                  <div className="sk-chat-kos-pill-card__main">
                    <strong>Jadwal Survei: {msg.bookedVisit.accommodationName}</strong>
                    <span>{msg.bookedVisit.scheduledLabel}</span>
                  </div>
                  <span className="sk-chat-kos-pill-card__go">
                    <CalendarCheck size={13} />
                    <span>Kalender</span>
                  </span>
                </button>
              )}
            </div>
          );
        })}
        <div ref={scrollEndRef} />
      </div>

      {/* Bottom Composer Ringkas di Bawah (Tidak Menghalangi Inputan) */}
      <div className="smart-kos-ai-sidebar__composer">
        <ChatComposer
          value={composerValue}
          onChange={onComposerChange}
          onSubmit={onSubmitPrompt}
          onStopStreaming={onStopStreaming}
          onOpenVoice={onOpenVoice}
          thinkingEnabled={thinkingEnabled}
          onToggleThinking={onToggleThinking}
          attachments={attachments}
          onSelectFiles={onSelectFiles}
          onRemoveAttachment={onRemoveAttachment}
          isStreaming={isStreaming}
          placeholder="Tanya lanjut..."
        />
      </div>

      {/* Voice Orb Overlay Menutupi Sidebar Kanan */}
      {isVoiceOpen && (
        <div
          className="smart-kos-voice-cover"
          role="dialog"
          aria-label="Percakapan Suara TERALIO"
          data-testid="smart-kos-voice-overlay"
        >
          <div className="smart-kos-voice-cover__top">
            <span className="smart-kos-voice-cover__eyebrow">TERALIO Voice</span>
            <button
              type="button"
              className="smart-kos-voice-cover__close"
              onClick={handleFinishVoiceConversation}
              aria-label="Selesaikan dan tutup percakapan suara"
              data-testid="smart-kos-voice-close-btn"
            >
              <X size={17} />
            </button>
          </div>

          <div className="smart-kos-voice-cover__stage">
            <ThinkingOrbStage
              mode="hero"
              size={142}
              state={voiceOrbProps.state}
              variant={voiceOrbProps.variant}
              phase={voiceOrbProps.phase}
              paused={false}
              showLabel={false}
            />

            <p className="smart-kos-voice-cover__status-visible" data-testid="smart-kos-voice-status">
              {voiceStatusLabel}
            </p>

            {liveTranscript && (
              <div className="smart-kos-voice-cover__transcript" data-testid="smart-kos-voice-transcript">
                <span>&ldquo;{liveTranscript}&rdquo;</span>
              </div>
            )}

            <div className="smart-kos-voice-steps sr-only" data-testid="voice-db-progress-steps">
              {VOICE_PROGRESS_STEPS.map((step, idx) => {
                const isDone = currentStepIdx > idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div
                    key={step.id}
                    className={`smart-kos-voice-step ${isDone ? 'is-done' : ''} ${
                      isCurrent ? 'is-current' : ''
                    }`}
                    data-step-id={step.id}
                    data-step-state={isDone ? 'done' : isCurrent ? 'active' : 'pending'}
                  >
                    <span className="smart-kos-voice-step__text">{step.label}</span>
                  </div>
                );
              })}
            </div>

            {lastRedirectedKos && (
              <div
                className="smart-kos-voice-redirect-banner"
                data-testid="smart-kos-voice-redirect-banner"
              >
                <div>
                  <strong>
                    <Check size={14} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: '4px' }} />
                    Diarahkan ke {lastRedirectedKos.name}
                  </strong>
                  <span>
                    {lastRedirectedKos.price} • {lastRedirectedKos.distance}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFinishVoiceConversation}
                  className="smart-kos-voice-redirect-banner__btn"
                >
                  Selesai
                </button>
              </div>
            )}

            {lastBookedVisit && (
              <div
                className="smart-kos-voice-redirect-banner"
                data-testid="smart-kos-voice-schedule-banner"
              >
                <div>
                  <strong>
                    <Check size={14} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: '4px' }} />
                    Janji Temu Terjadwal
                  </strong>
                  <span>{lastBookedVisit.scheduledLabel || 'Halaman Visit Schedule aktif'}</span>
                </div>
              </div>
            )}

            {voiceError && <p className="smart-kos-voice-error">{voiceError}</p>}
          </div>

          <div className="smart-kos-voice-cover__footer">
            <div className="smart-kos-voice-quick-chips sr-only" aria-label="Contoh Perintah Suara Cepat">
              {dynamicVoiceSuggestions.map((utterance) => (
                <button
                  key={utterance}
                  type="button"
                  disabled={isStreaming}
                  className="smart-kos-voice-chip"
                  onClick={() => runVoiceSearchPipeline(utterance)}
                  data-testid="voice-quick-utterance-btn"
                >
                  &ldquo;{utterance}&rdquo;
                </button>
              ))}
            </div>

            <div className="smart-kos-voice-controls-row">
              {isListeningMic && (
                <button
                  type="button"
                  className={`smart-kos-voice-mute-btn ${isMuted ? 'is-muted' : ''}`}
                  onClick={handleToggleMute}
                  aria-label={isMuted ? 'Aktifkan mikrofon' : 'Bisukan mikrofon'}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  data-testid="smart-kos-voice-mute-btn"
                >
                  {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
                </button>
              )}

              {isSessionLive ? (
                <button
                  type="button"
                  className="smart-kos-voice-mic-btn is-finish"
                  onClick={handleFinishVoiceConversation}
                  data-testid="smart-kos-voice-end-btn"
                >
                  <PhoneOff size={17} />
                  <span>Selesaikan Conversation</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="smart-kos-voice-mic-btn is-finish"
                  onClick={handleFinishVoiceConversation}
                  data-testid="smart-kos-voice-start-btn"
                >
                  <PhoneOff size={17} />
                  <span>Selesaikan Conversation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default SmartKosAiSidebar;
