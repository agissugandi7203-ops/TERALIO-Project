import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Mic, MicOff, Sparkles, Volume2, X } from 'lucide-react';
import ChatComposer from '../chat/ChatComposer.jsx';
import ThinkingOrbStage from '../chat/ThinkingOrbStage.jsx';
import { RealtimeVoiceClient } from '../../services/realtimeVoiceClient.js';

const VOICE_PROGRESS_STEPS = [
  { id: 'listening', label: 'Mendengarkan perintah suara Anda...' },
  { id: 'intent', label: 'Menganalisis kriteria lokasi, tipe kos, & budget...' },
  { id: 'database', label: 'Mencari kos terdekat berdasarkan database Supabase...' },
  { id: 'routing', label: 'Menghitung jarak & rute jalan kaki ke kampus...' },
  { id: 'redirect', label: 'Mengarahkan peta & membuka overview lokasi...' },
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
  activeCampusName = 'Telkom University Bandung',
  dataSource = 'supabase',
}) {
  const scrollEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const realtimeClientRef = useRef(null);

  const [isListeningMic, setIsListeningMic] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceStepId, setVoiceStepId] = useState('idle');
  const [voiceStatusLabel, setVoiceStatusLabel] = useState(
    'Tekan Start Talking atau ucapkan kriteria kos yang ingin dicari',
  );
  const [voiceOrbProps, setVoiceOrbProps] = useState({
    state: 'idle',
    variant: 'default',
    phase: 'idle',
  });
  const [lastRedirectedKos, setLastRedirectedKos] = useState(null);
  const [voiceError, setVoiceError] = useState(null);

  useEffect(() => {
    if (scrollEndRef.current && typeof scrollEndRef.current.scrollIntoView === 'function') {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isStreaming, activeStatus]);

  // Sinkronisasi status SSE backend -> indikator Orb & checklist langkah di layar Voice kanan
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

  // Bersihkan WebRTC Realtime, SpeechRecognition, & TTS saat panel voice ditutup / unmount
  useEffect(() => {
    if (!isVoiceOpen) {
      if (realtimeClientRef.current) {
        realtimeClientRef.current.disconnect().catch(() => {});
        realtimeClientRef.current = null;
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
          // ignore synthesis cancel error
        }
      }
      setIsListeningMic(false);
    }
  }, [isVoiceOpen]);

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

  const speakIndonesianSummary = (textToSpeak) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !textToSpeak) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 1.04;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore TTS unsupported browser environments
    }
  };

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
            setVoiceStatusLabel(
              `Lokasi ditemukan! Mengarahkan peta ke ${redirectData.targetKos.name}...`,
            );
          }
          setVoiceOrbProps({
            state: 'using',
            variant: 'zoom',
            phase: 'ai_speaking',
          });
        },
      });

      if (doneData?.voiceSummary) {
        speakIndonesianSummary(doneData.voiceSummary);
      }

      setVoiceStepId('done');
      if (doneData?.targetKos) {
        setLastRedirectedKos(doneData.targetKos);
        setVoiceStatusLabel(
          `Selesai — Peta & Overview telah diarahkan ke ${doneData.targetKos.name}`,
        );
      }
      setVoiceOrbProps({ state: 'idle', variant: 'blink', phase: 'listening' });
    } catch (err) {
      setVoiceError(err?.message || 'Gagal memproses pencarian suara.');
      setVoiceOrbProps({ state: 'retrying', variant: 'surge', phase: 'idle' });
    }
  };

  const startBrowserSpeechFallback = () => {
    const SpeechRec =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      setVoiceError(
        'Browser ini belum mengaktifkan mikrofon langsung. Gunakan tombol perintah suara cepat di bawah.',
      );
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
      setVoiceStatusLabel('Mendengarkan suara Anda... Silakan sebutkan lokasi atau kriteria kos.');
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

    rec.onerror = (ev) => {
      setIsListeningMic(false);
      if (ev?.error !== 'aborted') {
        setVoiceError(
          'Mikrofon tidak menangkap suara. Anda dapat mencoba lagi atau memilih perintah suara cepat di bawah.',
        );
      }
      setVoiceOrbProps({ state: 'idle', variant: 'default', phase: 'idle' });
    };

    rec.onend = () => {
      setIsListeningMic(false);
      const committed = finalSpoken.trim();
      if (committed) {
        runVoiceSearchPipeline(committed);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  const handleToggleMicrophone = async () => {
    if (isListeningMic) {
      if (realtimeClientRef.current) {
        await realtimeClientRef.current.disconnect().catch(() => {});
        realtimeClientRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore stop error
        }
        recognitionRef.current = null;
      }
      setIsListeningMic(false);
      return;
    }

    const canUseWebRtc =
      typeof RTCPeerConnection !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices) &&
      typeof navigator.mediaDevices.getUserMedia === 'function';

    if (canUseWebRtc) {
      setVoiceError(null);
      setLiveTranscript('');
      setLastRedirectedKos(null);

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
            setLastRedirectedKos(null);
            setLiveTranscript('');
            setVoiceStepId('listening');
          } else if (st.phase === 'processing_voice' || st.phase === 'ai_thinking') {
            setVoiceStepId((prev) => (prev === 'done' ? 'done' : 'intent'));
          } else if (st.phase === 'tool_running') {
            setVoiceStepId('database');
            setVoiceStatusLabel('Mencari kos terdekat berdasarkan database Supabase...');
          }
        },
        onTranscript: (ev) => {
          if (ev.role === 'user') {
            if (ev.final && ev.text) {
              setLiveTranscript(ev.text);
              onVoiceRealtimeTurn?.({ role: 'user', text: ev.text });
            } else if (ev.delta) {
              setLiveTranscript((prev) => `${prev}${ev.delta}`);
            }
          } else if (ev.role === 'assistant' && ev.final && ev.text) {
            onVoiceRealtimeTurn?.({ role: 'assistant', text: ev.text });
          }
        },
        onRecommendations: (recPayload) => {
          setVoiceStepId('routing');
          const redirected = onVoiceRealtimeRecommendations?.(recPayload);
          if (redirected) {
            setLastRedirectedKos(redirected);
            setVoiceStepId('done');
            setVoiceStatusLabel(
              `Selesai — Peta & Overview telah diarahkan ke ${redirected.name}`,
            );
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
          reasoningEffort: thinkingEnabled ? 'high' : 'low',
          userContext: {
            activeCampus: activeCampusName,
            activeView: 'Smart Kos Match Interactive Map',
            instructionHint:
              'Wajib panggil tool teralio_search_accommodations saat pengguna mencari kos agar peta Smart Kos langsung redirect otomatis ke lokasi kos.',
          },
        });
        setIsListeningMic(true);
        setVoiceStepId('listening');
        return;
      } catch (webrtcErr) {
        realtimeClientRef.current = null;
        setIsListeningMic(false);
        if (webrtcErr?.code === 'MIC_PERMISSION_DENIED') {
          setVoiceError(webrtcErr.message);
          return;
        }
      }
    }

    startBrowserSpeechFallback();
  };

  const stepOrder = VOICE_PROGRESS_STEPS.map((s) => s.id);
  const currentStepIdx =
    voiceStepId === 'done' ? VOICE_PROGRESS_STEPS.length : stepOrder.indexOf(voiceStepId);

  const dynamicVoiceSuggestions = [
    `Carikan kos putri dekat ${activeCampusName.split(' ')[0]} yang hemat`,
    'Cari kos terdekat jalan kaki dari gerbang PGA Telkom',
    'Carikan kos sekitar ITB Dago yang ada water heater',
    'Cari kos dekat stasiun KRL UI Depok',
  ];

  return (
    <aside
      className="smart-kos-ai-sidebar"
      aria-label="Sidebar Percakapan & Suara Smart Kos AI"
      data-testid="smart-kos-ai-sidebar"
    >
      {/* ==================== LAPISAN #2: CONVERSATION SIDEBAR ==================== */}
      <header className="smart-kos-ai-sidebar__header">
        <div className="smart-kos-ai-sidebar__brand">
          <span className="smart-kos-ai-sidebar__badge">
            <Sparkles size={13} />
            <span>Smart Kos AI</span>
          </span>
          <span className="smart-kos-ai-sidebar__db-tag">
            {dataSource === 'supabase' ? '● Supabase Live' : '● Supabase Ready'}
          </span>
        </div>

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
              {/* Live Thinking Orb Indicator (sama seperti halaman Chat, hanya bubble muter) */}
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

              {/* Kartu Mini Hasil Kos yang Dapat Diklik untuk Redirect Peta */}
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
            </div>
          );
        })}
        <div ref={scrollEndRef} />
      </div>

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
          placeholder="Tanya lanjut lokasi, harga, atau fasilitas kos..."
        />
      </div>

      {/* ==================== LAPISAN #3: VOICE ORB MENUTUPI CONVERSATION SIDEBAR KANAN ==================== */}
      {isVoiceOpen && (
        <div
          className="smart-kos-voice-cover"
          role="dialog"
          aria-label="Pencarian Suara Smart Kos AI"
          data-testid="smart-kos-voice-overlay"
        >
          <div className="smart-kos-voice-cover__top">
            <span
              className="smart-kos-voice-cover__eyebrow"
              style={{ color: '#475569', background: '#f8fafc', borderColor: '#e2e8f0' }}
            >
              TERALIO Voice
            </span>
            <button
              type="button"
              className="smart-kos-voice-cover__close"
              onClick={onCloseVoice}
              aria-label="Tutup layar suara dan lihat percakapan"
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

            <p className="smart-kos-voice-cover__status sr-only" data-testid="smart-kos-voice-status">
              {voiceStatusLabel}
            </p>

            {liveTranscript && (
              <div className="smart-kos-voice-cover__transcript" data-testid="smart-kos-voice-transcript">
                <span>&ldquo;{liveTranscript}&rdquo;</span>
              </div>
            )}

            {/* Indikator Progres Langkah Database disembunyikan agar visual hanya bubble bersih */}
            <div
              className="smart-kos-voice-steps sr-only"
              data-testid="voice-db-progress-steps"
            >
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

            {/* Banner Konfirmasi Redirect Lokasi Kos */}
            {lastRedirectedKos && (
              <div
                className="smart-kos-voice-redirect-banner"
                data-testid="smart-kos-voice-redirect-banner"
              >
                <div>
                  <strong>✓ Diarahkan ke {lastRedirectedKos.name}</strong>
                  <span>
                    {lastRedirectedKos.price} • {lastRedirectedKos.distance}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCloseVoice}
                  className="smart-kos-voice-redirect-banner__btn"
                >
                  Lihat Chat
                </button>
              </div>
            )}

            {voiceError && <p className="smart-kos-voice-error">{voiceError}</p>}
          </div>

          {/* Kontrol Mikrofon & Quick Utterances (disembunyikan dari visual sesuai permintaan: cukup bubble) */}
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
                  🎙️ &ldquo;{utterance}&rdquo;
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`smart-kos-voice-mic-btn ${isListeningMic ? 'is-listening' : ''}`}
              onClick={handleToggleMicrophone}
              disabled={isStreaming}
              data-testid="smart-kos-voice-start-btn"
            >
              {isListeningMic ? <MicOff size={18} /> : <Mic size={18} />}
              <span>{isListeningMic ? 'Mendengarkan...' : 'Start Talking'}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default SmartKosAiSidebar;
