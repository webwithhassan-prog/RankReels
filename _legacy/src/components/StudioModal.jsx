import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Sparkles,
  Wand2,
  UserCheck,
  Layers,
  FileText,
  Sliders,
  Check,
  Copy,
  Upload,
  ArrowRight,
  Flame,
  Crown,
  Video,
  Camera,
  Bot,
  Mic,
  Disc,
  CheckCircle2,
  Shuffle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PRESET_REELS, BROLL_VIDEO_PRESETS } from '../data/mockData';
import {
  getAvailableVoices,
  AI_VOICE_PERSONAS,
  matchVoiceForPersona,
  speakText,
  stopSpeaking,
  startProceduralBeat,
  stopProceduralBeat,
  playTierSlamSound,
  playChimeSound
} from '../utils/audioEngine';
import { startCanvasRecording, downloadVideoBlob } from '../utils/videoExporter';

export default function StudioModal({ isOpen, onClose, initialReel }) {
  if (!isOpen) return null;

  // Active Tab: 'player' | 'video' | 'voiceagent' | 'ranking' | 'script'
  const [activeTab, setActiveTab] = useState('player');

  // Creator & Digital Twin state
  const [creatorName, setCreatorName] = useState('Alex Rivera');
  const [creatorHandle, setCreatorHandle] = useState('@alexrivera.tech');
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  );

  // Video Background / B-Roll / Talking Head state
  const [videoMode, setVideoMode] = useState('preset'); // 'none' | 'preset' | 'upload' | 'webcam'
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [selectedBrollId, setSelectedBrollId] = useState('neon-waves');
  const [autoShuffleOnTier, setAutoShuffleOnTier] = useState(true);
  // User‑defined list of B‑roll ids participating in manual shuffle
  const [shuffleSet, setShuffleSet] = useState(BROLL_VIDEO_PRESETS.map(p => p.id));
  const [shuffleToast, setShuffleToast] = useState(null);
  const [isRecordingWebcam, setIsRecordingWebcam] = useState(false);
  const [webcamCountdown, setWebcamCountdown] = useState(0);

  // AI Voice Agent State
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState('agent-orion');
  const [customPitch, setCustomPitch] = useState(1.0);
  const [customRate, setCustomRate] = useState(1.05);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Reel Content State
  const [reelTitle, setReelTitle] = useState(initialReel?.title || PRESET_REELS[0].title);
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [titleFontSize, setTitleFontSize] = useState(34);
  const [niche, setNiche] = useState(initialReel?.niche || PRESET_REELS[0].niche);
  const [hook, setHook] = useState(initialReel?.hook || PRESET_REELS[0].hook);
  const [cta, setCta] = useState(initialReel?.cta || PRESET_REELS[0].cta);
  const [items, setItems] = useState(initialReel?.items || PRESET_REELS[0].items);

  // Playback & Studio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0); // 0 to 15 seconds
  const [bgMusicEnabled, setBgMusicEnabled] = useState(true);
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDownloadUrl, setExportDownloadUrl] = useState(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const canvasRef = useRef(null);
  const videoElementRef = useRef(null);
  const animFrameRef = useRef(null);
  const playbackTimerRef = useRef(null);
  const avatarFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const webcamStreamRef = useRef(null);

  // Load available speech synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      const voices = getAvailableVoices();
      setAvailableVoices(voices);
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const activePersona = AI_VOICE_PERSONAS.find((p) => p.id === selectedPersonaId) || AI_VOICE_PERSONAS[0];

  useEffect(() => {
    setCustomPitch(activePersona.defaultPitch);
    setCustomRate(activePersona.defaultRate);
  }, [selectedPersonaId]);

// Shuffle Video Feature: Randomly picks next b-roll preset from user‑selected set
const handleShuffleVideo = () => {
  // Filter to only presets the user has enabled in the shuffle set
  const pool = BROLL_VIDEO_PRESETS.filter(p => shuffleSet.includes(p.id));
  const currentIndex = pool.findIndex(p => p.id === selectedBrollId);
  // Guard against empty pool
  if (pool.length === 0) return;
  let nextIndex = Math.floor(Math.random() * pool.length);
  if (nextIndex === currentIndex) {
    nextIndex = (currentIndex + 1) % pool.length;
  }
  const nextPreset = pool[nextIndex];
  setSelectedBrollId(nextPreset.id);
  setVideoMode('preset');
  setUploadedVideoUrl(null);
  if (videoElementRef.current) videoElementRef.current.src = '';

  setShuffleToast(`Shuffled to: ${nextPreset.name}`);
  playChimeSound();
  setTimeout(() => setShuffleToast(null), 2400);
};

  // Handle uploaded video file
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      setVideoMode('upload');
      if (videoElementRef.current) {
        videoElementRef.current.src = url;
        videoElementRef.current.play();
      }
    }
  };

  // Record selfie / talking head video using browser Webcam (100% Free!)
  const startWebcamRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 720, height: 1280, facingMode: 'user' },
        audio: true
      });
      webcamStreamRef.current = stream;

      setWebcamCountdown(3);
      const countInterval = setInterval(() => {
        setWebcamCountdown((c) => {
          if (c <= 1) {
            clearInterval(countInterval);
            beginActualWebcamCapture(stream);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      alert('Camera access denied or unavailable. Please allow camera permissions.');
    }
  };

  const beginActualWebcamCapture = (stream) => {
    setIsRecordingWebcam(true);
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setUploadedVideoUrl(url);
      setVideoMode('webcam');
      setIsRecordingWebcam(false);

      if (videoElementRef.current) {
        videoElementRef.current.src = url;
        videoElementRef.current.play();
      }

      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();

    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, 6000);
  };

  // Test AI Voice Agent
  const testVoicePersona = () => {
    setIsTestingVoice(true);
    const voice = matchVoiceForPersona(activePersona, availableVoices);
    speakText(
      activePersona.sampleText,
      { voice, pitch: customPitch, rate: customRate },
      null,
      () => setIsTestingVoice(false)
    );
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Topic Generator
  const generateNewTopic = (topicKey) => {
    const topicsMap = {
      ai: {
        title: 'Top 5 AI Coding Tools for 2026',
        niche: 'AI & Engineering',
        hook: 'I tested 40+ AI coding tools so you do not waste 100 hours. Here is the honest ranking from S-tier to D-tier.',
        cta: 'What is in your daily stack? Drop your favorite tool in the comments and follow for daily breakdowns.',
        items: [
          { tier: 'S', name: 'Claude 3.7 & Agent Stack', score: '9.9/10', reasoning: 'Unbeatable autonomous logic, refactoring, and multi-file coherence.' },
          { tier: 'A', name: 'Cursor IDE', score: '9.2/10', reasoning: 'Best inline flow, multi-cursor AI tab, and composer mode.' },
          { tier: 'B', name: 'GitHub Copilot', score: '8.1/10', reasoning: 'Solid code completion, but lacks autonomous deep workspace reasoning.' },
          { tier: 'C', name: 'Standard ChatGPT Plus', score: '6.8/10', reasoning: 'Good for single snippets, painful for whole repos and terminal sync.' },
          { tier: 'D', name: 'Generic Autocomplete Plugins', score: '4.2/10', reasoning: 'Outdated models that hallucinate syntax from 2021.' }
        ]
      },
      marketing: {
        title: 'Ranking 5 B2B Growth Engines to $100K MRR',
        niche: 'SaaS Growth',
        hook: 'Most founders burn $5,000 a month on dead acquisition channels. Let us rank what actually generates qualified B2B demos.',
        cta: 'Are you running S-tier channels or burning cash on D-tier ads? Comment SCALE for the blueprint.',
        items: [
          { tier: 'S', name: 'Founder Organic Video', score: '9.8/10', reasoning: 'Highest conversion velocity and instant buyer trust.' },
          { tier: 'A', name: 'Targeted Outbound Sequence', score: '8.9/10', reasoning: 'Predictable pipeline when targeted at hyper-specific ICP triggers.' },
          { tier: 'B', name: 'Product-Led SEO Clusters', score: '7.8/10', reasoning: 'Great long-term compounding, but takes 6+ months to kick in.' },
          { tier: 'C', name: 'Cold Meta Retargeting', score: '6.1/10', reasoning: 'High CPMs and low buyer intent for enterprise ACVs.' },
          { tier: 'D', name: 'Generic Spray-and-Pray Email', score: '3.5/10', reasoning: 'Burns your domain reputation straight into the spam box.' }
        ]
      },
      founder: {
        title: '5 Costliest Founder Mistakes Ranked',
        niche: 'Startups & Business',
        hook: 'I lost $180,000 on my first company because nobody told me this. Ranking the 5 most lethal startup traps.',
        cta: 'Which mistake have you felt the most? Share below and follow for weekly founder postmortems.',
        items: [
          { tier: 'S', name: 'Building Without Pre-Sales', score: 'Fatal #1', reasoning: 'Coding for 6 months only to hear deafening silence on launch day.' },
          { tier: 'A', name: 'Premature Hiring & Bloat', score: 'Fatal #2', reasoning: 'Hiring specialists before finding repeatable product-market fit.' },
          { tier: 'B', name: 'Underpricing Your Solution', score: 'Severe', reasoning: 'Charging $19/mo for something that saves clients $2,000/mo.' },
          { tier: 'C', name: 'Endless Feature Creep', score: 'Dangerous', reasoning: 'Adding more buttons instead of fixing the core onboarding leak.' },
          { tier: 'D', name: 'Obsessing Over Logo & Pitchdeck', score: 'Rookie Trap', reasoning: 'Playing business instead of talking to paying customers.' }
        ]
      }
    };

    const selected = topicsMap[topicKey] || topicsMap.ai;
    setReelTitle(selected.title);
    setNiche(selected.niche);
    setHook(selected.hook);
    setCta(selected.cta);
    setItems(selected.items);
    resetPlayback();
  };

  // Playback control
  const startPlayback = () => {
    setIsPlaying(true);
    if (bgMusicEnabled) {
      startProceduralBeat(94);
    }
    if (voiceoverEnabled) {
      const voice = matchVoiceForPersona(activePersona, availableVoices);
      const fullScript = `${hook}. Starting with D-tier: ${items[4]?.name}, ${items[4]?.reasoning}. Next, C-tier: ${items[3]?.name}. B-tier: ${items[2]?.name}. A-tier: ${items[1]?.name}. And taking the undisputed S-tier crown: ${items[0]?.name}! ${items[0]?.reasoning}. ${cta}`;
      speakText(fullScript, { voice, pitch: customPitch, rate: customRate });
    }
    if (videoElementRef.current && uploadedVideoUrl) {
      videoElementRef.current.currentTime = 0;
      videoElementRef.current.play();
    }
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    stopProceduralBeat();
    stopSpeaking();
    if (videoElementRef.current) {
      videoElementRef.current.pause();
    }
  };

  const resetPlayback = () => {
    pausePlayback();
    setPlaybackTime(0);
    if (videoElementRef.current) {
      videoElementRef.current.currentTime = 0;
    }
  };

  // Playback timeline timer
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= 15) {
            pausePlayback();
            return 0;
          }
          const next = prev + 0.25;
          if (Math.floor(next) !== Math.floor(prev)) {
            const sec = Math.floor(next);
            if (sec === 2 || sec === 4 || sec === 6 || sec === 8) {
              playTierSlamSound();
            } else if (sec === 10) {
              playChimeSound();
            }
          }
          return next;
        });
      }, 250);
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying]);

  const currentItemToShow =
    playbackTime < 2.5
      ? null
      : playbackTime < 5
      ? items[4]
      : playbackTime < 7.5
      ? items[3]
      : playbackTime < 10
      ? items[2]
      : playbackTime < 12.5
      ? items[1]
      : items[0];

  // Determine current active b-roll preset (either user selected, or auto-cut on each tier)
  const currentBrollPreset = (() => {
    if (!autoShuffleOnTier) {
      return BROLL_VIDEO_PRESETS.find((p) => p.id === selectedBrollId) || BROLL_VIDEO_PRESETS[0];
    }
    // Auto-cut on each tier transition (Pattern interrupts!)
    if (playbackTime < 2.5) return BROLL_VIDEO_PRESETS[0]; // Hook
    if (playbackTime < 5) return BROLL_VIDEO_PRESETS[1];   // D-tier
    if (playbackTime < 7.5) return BROLL_VIDEO_PRESETS[2]; // C-tier
    if (playbackTime < 10) return BROLL_VIDEO_PRESETS[3];  // B-tier
    if (playbackTime < 12.5) return BROLL_VIDEO_PRESETS[4];// A-tier
    return BROLL_VIDEO_PRESETS[5] || BROLL_VIDEO_PRESETS[0];// S-tier
  })();

  // Canvas 9:16 Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = avatarUrl;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const t = playbackTime * 2.5;

      // Base background: Draw video if present, otherwise draw active B-Roll preset procedural video
      const vid = videoElementRef.current;
      if (uploadedVideoUrl && vid && vid.readyState >= 2) {
        ctx.drawImage(vid, 0, 0, w, h);
        ctx.fillStyle = 'rgba(7, 7, 9, 0.72)';
        ctx.fillRect(0, 0, w, h);
      } else {
        // Draw active B-Roll preset procedural motion
        const pId = currentBrollPreset.id;

        // Base dark gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0D0D14');
        bgGrad.addColorStop(0.5, '#07070A');
        bgGrad.addColorStop(1, '#040406');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        if (pId === 'neon-waves') {
          // Flowing sine waves
          for (let layer = 0; layer < 5; layer++) {
            ctx.beginPath();
            ctx.strokeStyle = layer % 2 === 0 ? 'rgba(99, 102, 241, 0.18)' : 'rgba(14, 165, 233, 0.15)';
            ctx.lineWidth = 1.5;
            for (let x = 0; x <= w; x += 20) {
              const y = 320 + Math.sin(x * 0.008 + t + layer * 1.2) * (30 + layer * 10) + layer * 35;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        } else if (pId === 'cyber-matrix') {
          // Matrix code columns
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.font = '14px monospace';
          for (let col = 20; col < w; col += 36) {
            const charCount = 8;
            for (let row = 0; row < charCount; row++) {
              const y = ((t * 80 + col * 7 + row * 24) % (h - 200)) + 60;
              const char = String.fromCharCode(65 + ((col + row) % 26));
              ctx.fillText(char, col, y);
            }
          }
        } else if (pId === 'quantum-grid') {
          // 3D Perspective Tunnel Grid
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
          ctx.lineWidth = 1;
          const vanishingX = w / 2;
          const vanishingY = 220;
          for (let rad = -w; rad <= w * 2; rad += 60) {
            ctx.beginPath();
            ctx.moveTo(vanishingX, vanishingY);
            ctx.lineTo(rad, h);
            ctx.stroke();
          }
          for (let yGrid = 280; yGrid < h; yGrid += 45) {
            const shiftY = ((yGrid + t * 40) % (h - 260)) + 260;
            ctx.beginPath();
            ctx.moveTo(0, shiftY);
            ctx.lineTo(w, shiftY);
            ctx.stroke();
          }
        } else if (pId === 'tokyo-lights') {
          // Drifting neon bokeh circles
          for (let b = 0; b < 12; b++) {
            const bx = (b * 67 + Math.sin(t * 0.5 + b) * 40) % w;
            const by = (h - ((t * 35 + b * 90) % h));
            const br = 20 + (b % 4) * 12;
            const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
            bGrad.addColorStop(0, b % 2 === 0 ? 'rgba(236, 72, 153, 0.25)' : 'rgba(139, 92, 246, 0.2)');
            bGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = bGrad;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (pId === 'golden-hour') {
          // Golden sunset beam flares
          const flareGrad = ctx.createRadialGradient(w / 2, 220, 10, w / 2, 220, 380);
          flareGrad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
          flareGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.1)');
          flareGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = flareGrad;
          ctx.fillRect(0, 0, w, 500);

          // Horizontal streak
          ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
          ctx.fillRect(0, 218, w, 4);
        } else {
          // Luxury studio default
          const radSpot = ctx.createRadialGradient(w / 2, 200, 10, w / 2, 200, 360);
          radSpot.addColorStop(0, 'rgba(99, 102, 241, 0.18)');
          radSpot.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = radSpot;
          ctx.fillRect(0, 0, w, 460);
        }
      }

      // Top Creator Profile Header
      const avatarX = 40;
      const avatarY = 50;
      const avatarR = 34;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarR, avatarY + avatarR, avatarR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      try {
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarR * 2, avatarR * 2);
      } catch {
        ctx.fillStyle = '#6366F1';
        ctx.fillRect(avatarX, avatarY, avatarR * 2, avatarR * 2);
      }
      ctx.restore();

      // Border around avatar
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(avatarX + avatarR, avatarY + avatarR, avatarR, 0, Math.PI * 2);
      ctx.stroke();

      // Creator details
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "Inter Tight", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(creatorName, 126, 82);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = '500 17px "Inter", sans-serif';
      ctx.fillText(creatorHandle, 126, 110);

      // AI Voice Agent / B-Roll tag
      ctx.fillStyle = '#818CF8';
      ctx.font = 'bold 12.5px "Inter Tight", sans-serif';
      ctx.fillText(`AI VOICE: ${activePersona.name.toUpperCase()} · B-ROLL: ${currentBrollPreset.name.toUpperCase()}`, 126, 134);

      // Video Title
      // Dynamic title rendering – supports color, size, and multiline
      ctx.fillStyle = titleColor;
      ctx.font = `bold ${titleFontSize}px "Inter Tight", sans-serif`;
      ctx.textAlign = 'center';
      const titleLines = reelTitle.split('\n');
      const lineHeight = titleFontSize * 1.2;
      let startY = 215 - ((titleLines.length - 1) * lineHeight) / 2;
      titleLines.forEach((line, i) => {
        ctx.fillText(line, w / 2, startY + i * lineHeight);
      });
      // Main Visual Section: 5 Tier Cards Stack
      const startY = 275;
      const cardHeight = 86;
      const gap = 15;

      const tiersConfig = [
        { label: 'S', color: '#F59E0B', textColor: '#160F03', item: items[0] },
        { label: 'A', color: '#8B5CF6', textColor: '#FFFFFF', item: items[1] },
        { label: 'B', color: '#0EA5E9', textColor: '#FFFFFF', item: items[2] },
        { label: 'C', color: '#10B981', textColor: '#FFFFFF', item: items[3] },
        { label: 'D', color: '#64748B', textColor: '#FFFFFF', item: items[4] }
      ];

      tiersConfig.forEach((tierObj, index) => {
        const y = startY + index * (cardHeight + gap);
        const isCurrent = currentItemToShow && currentItemToShow.name === tierObj.item?.name;

        ctx.fillStyle = isCurrent ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = isCurrent ? '#6366F1' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isCurrent ? 2 : 1;

        ctx.beginPath();
        ctx.roundRect(40, y, w - 80, cardHeight, 14);
        ctx.fill();
        ctx.stroke();

        // Tier Badge
        ctx.fillStyle = tierObj.color;
        ctx.beginPath();
        ctx.roundRect(54, y + 14, 58, 58, 10);
        ctx.fill();

        ctx.fillStyle = tierObj.textColor;
        ctx.font = '900 30px "Inter Tight", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tierObj.label, 83, y + 54);

        // Item text
        ctx.textAlign = 'left';
        ctx.fillStyle = isCurrent ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 23px "Inter Tight", sans-serif';
        ctx.fillText(tierObj.item?.name || `Item ${index + 1}`, 130, y + 40);

        // Reasoning
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '400 15px "Inter", sans-serif';
        const truncatedReason = (tierObj.item?.reasoning || '').slice(0, 48) + '...';
        ctx.fillText(truncatedReason, 130, y + 68);

        // Active indicator pulse
        if (isCurrent) {
          ctx.fillStyle = '#6366F1';
          ctx.beginPath();
          ctx.arc(w - 68, y + cardHeight / 2, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Bottom Subtitles Box
      const subBoxY = h - 250;
      ctx.fillStyle = 'rgba(5, 5, 8, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(40, subBoxY, w - 80, 175, 18);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#818CF8';
      ctx.font = 'bold 15px "Inter Tight", sans-serif';
      ctx.fillText('DYNAMIC CAPTIONS', w / 2, subBoxY + 32);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 21px "Inter", sans-serif';
      let displayText = hook;
      if (playbackTime >= 2.5 && currentItemToShow) {
        displayText = `${currentItemToShow.tier}-TIER: "${currentItemToShow.name}" — ${currentItemToShow.reasoning}`;
      } else if (playbackTime >= 13) {
        displayText = cta;
      }

      const words = displayText.split(' ');
      let line = '';
      let lineY = subBoxY + 72;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > w - 120 && n > 0) {
          ctx.fillText(line, w / 2, lineY);
          line = words[n] + ' ';
          lineY += 30;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, w / 2, lineY);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    avatarUrl,
    creatorName,
    creatorHandle,
    niche,
    reelTitle,
    items,
    playbackTime,
    hook,
    cta,
    activePersona,
    uploadedVideoUrl,
    currentBrollPreset
  ]);

  // Video Export Handler
  const handleExportVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    setExportProgress(10);
    resetPlayback();
    startPlayback();

    const recorder = startCanvasRecording(
      canvas,
      null,
      (blobUrl) => {
        setIsExporting(false);
        setExportProgress(100);
        setExportDownloadUrl(blobUrl);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      },
      (err) => {
        console.error('Recording error', err);
        setIsExporting(false);
      }
    );

    let progressTimer = setInterval(() => {
      setExportProgress((p) => Math.min(p + 6, 95));
    }, 1000);

    setTimeout(() => {
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
      }
      pausePlayback();
      clearInterval(progressTimer);
    }, 15000);
  };

  const copyFullScript = () => {
    const fullScript = `🎬 HOOK:
${hook}

📊 TIER LIST BREAKDOWN:
- [S-TIER]: ${items[0]?.name} (${items[0]?.score}) - ${items[0]?.reasoning}
- [A-TIER]: ${items[1]?.name} (${items[1]?.score}) - ${items[1]?.reasoning}
- [B-TIER]: ${items[2]?.name} (${items[2]?.score}) - ${items[2]?.reasoning}
- [C-TIER]: ${items[3]?.name} (${items[3]?.score}) - ${items[3]?.reasoning}
- [D-TIER]: ${items[4]?.name} (${items[4]?.score}) - ${items[4]?.reasoning}

🎯 CALL TO ACTION:
${cta}

#rankreels #tierlist #${niche.replace(/\s+/g, '').toLowerCase()} #viralreels`;

    navigator.clipboard.writeText(fullScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(3, 3, 5, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <video ref={videoElementRef} playsInline muted loop style={{ display: 'none' }} />

      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1220px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--tile)',
          border: '1px solid var(--hair-2)',
          borderRadius: '24px',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--hair)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(11, 11, 14, 0.75)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                display: 'grid',
                placeItems: 'center',
                color: '#FFF'
              }}
            >
              <Wand2 size={16} />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter Tight', fontWeight: 700, fontSize: '17px', color: '#FFF' }}>
                RankReels Studio <span style={{ color: 'var(--accent-light)', fontSize: '12.5px', fontWeight: 600 }}>100% Free Engine</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                Client-side video synthesis • Zero paid APIs
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '999px',
              padding: '3px',
              border: '1px solid var(--hair)'
            }}
          >
            {[
              { id: 'player', label: 'Studio Player', icon: Play },
              { id: 'video', label: 'Video & B-Roll', icon: Video },
              { id: 'voiceagent', label: 'AI Voice Agent', icon: Bot },
              { id: 'ranking', label: 'Tier List', icon: Layers },
              { id: 'script', label: 'Script & Hooks', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: 'none',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#FFF' : 'var(--text-2)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              resetPlayback();
              onClose();
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--hair)',
              color: 'var(--text-2)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Main Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Column (Active Tab Form) */}
          <div
            style={{
              flex: '1 1 55%',
              padding: '24px 28px',
              overflowY: 'auto',
              borderRight: '1px solid var(--hair)'
            }}
          >
            {/* TAB 1: STUDIO CONTROLS & EXPORT */}
            {activeTab === 'player' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span className="lab" style={{ marginBottom: '6px' }}>1-Click Topic Presets</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <button
                        onClick={() => generateNewTopic('ai')}
                        className="btn btn-secondary sm"
                        style={{ fontSize: '12px' }}
                      >
                        <Sparkles size={12} style={{ color: 'var(--accent-light)' }} /> 2026 AI Tools
                      </button>
                      <button
                        onClick={() => generateNewTopic('marketing')}
                        className="btn btn-secondary sm"
                        style={{ fontSize: '12px' }}
                      >
                        <Flame size={12} style={{ color: '#F2B27C' }} /> B2B Growth
                      </button>
                      <button
                        onClick={() => generateNewTopic('founder')}
                        className="btn btn-secondary sm"
                        style={{ fontSize: '12px' }}
                      >
                        <Crown size={12} style={{ color: '#F59E0B' }} /> Founder Pitfalls
                      </button>
                    </div>
                  </div>

                  {/* Shuffle Video quick trigger in top controls */}
                  <button
                    onClick={handleShuffleVideo}
                    className="btn btn-secondary sm"
                    style={{ fontSize: '12.5px', background: 'rgba(99,102,241,0.1)', borderColor: 'var(--accent)' }}
                    title="Randomize the background B-roll video style"
                  >
                    <Shuffle size={13} style={{ color: 'var(--accent-light)' }} />
                    <span>Shuffle Video</span>
                  </button>
                  {/* Custom Shuffle Set */}
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Shuffle Set (pick videos to include):</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {BROLL_VIDEO_PRESETS.map(p => (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-2)' }}>
                          <input
                            type="checkbox"
                            checked={shuffleSet.includes(p.id)}
                            onChange={() => {
                              setShuffleSet(prev =>
                                prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                              );
                            }}
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reel Meta Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
                      Reel Headline
                    </label>
                    <input
                      type="text"
                      value={reelTitle}
                      onChange={(e) => setReelTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--hair-2)',
                        borderRadius: '8px',
                        color: '#FFF',
                        fontSize: '13.5px',
                        fontFamily: 'Inter Tight'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
                      Target Niche
                    </label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--hair-2)',
                        borderRadius: '8px',
                        color: '#FFF',
                        fontSize: '13.5px'
                      }}
                    />
                  </div>
                </div>

                {/* Audio Engine Toggles */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--hair)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bot size={15} style={{ color: 'var(--accent-light)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFF' }}>
                        AI Voice Agent: {activePersona.name} ({activePersona.tag})
                      </span>
                    </div>
                    <button
                      onClick={() => setVoiceoverEnabled(!voiceoverEnabled)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--hair)',
                        background: voiceoverEnabled ? 'rgba(99,102,241,0.2)' : 'transparent',
                        color: voiceoverEnabled ? 'var(--accent-light)' : 'var(--text-3)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {voiceoverEnabled ? 'ENABLED' : 'MUTED'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Disc size={15} style={{ color: '#F59E0B' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFF' }}>
                        Procedural Lo-fi Beat (Free Web Audio Synthesizer)
                      </span>
                    </div>
                    <button
                      onClick={() => setBgMusicEnabled(!bgMusicEnabled)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--hair)',
                        background: bgMusicEnabled ? 'rgba(99,102,241,0.2)' : 'transparent',
                        color: bgMusicEnabled ? 'var(--accent-light)' : 'var(--text-3)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {bgMusicEnabled ? 'ENABLED' : 'MUTED'}
                    </button>
                  </div>
                </div>

                {/* Video Export Section */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    background: 'linear-gradient(145deg, rgba(99,102,241,0.08), rgba(0,0,0,0.3))',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#FFF' }}>
                        Export 1080×1920 Vertical Video
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                        Client-side canvas recording • 100% free download
                      </div>
                    </div>

                    {!exportDownloadUrl ? (
                      <button
                        onClick={handleExportVideo}
                        disabled={isExporting}
                        className="btn btn-accent sm"
                        style={{ padding: '9px 18px' }}
                      >
                        <Download size={15} />
                        <span>{isExporting ? `Rendering (${exportProgress}%)` : 'Render Video'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => downloadVideoBlob(exportDownloadUrl, `${reelTitle.toLowerCase().replace(/\s+/g, '-')}.webm`)}
                        className="btn btn-primary sm"
                        style={{ padding: '9px 18px', background: '#10B981', color: '#FFF' }}
                      >
                        <Check size={15} />
                        <span>Download MP4/WebM</span>
                      </button>
                    )}
                  </div>

                  {isExporting && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${exportProgress}%`,
                            height: '100%',
                            background: 'var(--accent)',
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', textAlign: 'right' }}>
                        Compiling frames... {exportProgress}%
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={copyFullScript}
                      className="btn btn-secondary sm"
                      style={{ fontSize: '12px' }}
                    >
                      {copiedScript ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
                      <span>{copiedScript ? 'Script Copied' : 'Copy Script & Hashtags'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VIDEO & B-ROLL (With Shuffle Video Feature) */}
            {activeTab === 'video' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="lab" style={{ marginBottom: '4px' }}>Video &amp; B-Roll Backgrounds</span>
                    <p style={{ color: 'var(--text-2)', fontSize: '13.5px', margin: 0 }}>
                      Shuffle high-retention video backgrounds, upload custom clips, or record your talking head directly in the browser!
                    </p>
                  </div>

                  <button
                    onClick={handleShuffleVideo}
                    className="btn btn-accent sm"
                    style={{ gap: '6px', padding: '8px 16px' }}
                  >
                    <Shuffle size={14} />
                    <span>Shuffle Video</span>
                  </button>
                </div>

                {/* Auto-Shuffle Toggle ("Smart Video Cuts") */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--hair-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#FFF' }}>
                      Auto-Shuffle Video on Each Tier (Pattern Interrupts)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>
                      Automatically cuts to a fresh energetic video angle as each tier card drops in to keep viewers hooked.
                    </div>
                  </div>

                  <button
                    onClick={() => setAutoShuffleOnTier(!autoShuffleOnTier)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      border: '1px solid var(--hair)',
                      background: autoShuffleOnTier ? 'var(--accent)' : 'transparent',
                      color: autoShuffleOnTier ? '#FFF' : 'var(--text-3)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {autoShuffleOnTier ? 'AUTO-CUT ON' : 'OFF'}
                  </button>
                </div>

                {/* B-Roll Video Presets Library Grid */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>
                    Curated Royalty-Free B-Roll Library ({BROLL_VIDEO_PRESETS.length} Styles)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    {BROLL_VIDEO_PRESETS.map((preset) => {
                      const isSelected = selectedBrollId === preset.id && !autoShuffleOnTier && !uploadedVideoUrl;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setSelectedBrollId(preset.id);
                            setAutoShuffleOnTier(false);
                            setUploadedVideoUrl(null);
                            if (videoElementRef.current) videoElementRef.current.src = '';
                          }}
                          className="glass-tile"
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            borderColor: isSelected ? 'var(--accent)' : 'var(--hair)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--tile)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: preset.color1 }} />
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFF' }}>{preset.name}</span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{preset.tag}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Video Upload & Camera Record Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
                  <div
                    className="glass-tile"
                    style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-light)', fontWeight: 600 }}>
                      <Upload size={16} />
                      <span>Upload Video File</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>
                      Upload any MP4/WebM vertical video from your phone or camera.
                    </p>
                    <input
                      type="file"
                      ref={videoFileInputRef}
                      onChange={handleVideoUpload}
                      style={{ display: 'none' }}
                      accept="video/mp4,video/webm,video/quicktime"
                    />
                    <button
                      onClick={() => videoFileInputRef.current?.click()}
                      className="btn btn-secondary sm"
                      style={{ marginTop: 'auto' }}
                    >
                      Choose Video File
                    </button>
                  </div>

                  <div
                    className="glass-tile"
                    style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 600 }}>
                      <Camera size={16} />
                      <span>Record Selfie Video</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>
                      Record a 6-second selfie video with your webcam (Zero extra apps required).
                    </p>
                    <button
                      onClick={startWebcamRecording}
                      disabled={isRecordingWebcam || webcamCountdown > 0}
                      className="btn btn-secondary sm"
                      style={{ marginTop: 'auto', background: isRecordingWebcam ? '#EF4444' : undefined, color: isRecordingWebcam ? '#FFF' : undefined }}
                    >
                      {webcamCountdown > 0
                        ? `Starting in ${webcamCountdown}...`
                        : isRecordingWebcam
                        ? 'Recording (6s)...'
                        : 'Record with Camera'}
                    </button>
                  </div>
                </div>

                {uploadedVideoUrl && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} />
                      <span>Custom video layer loaded into 9:16 Canvas!</span>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedVideoUrl(null);
                        setVideoMode('preset');
                        if (videoElementRef.current) videoElementRef.current.src = '';
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Remove Video
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FREE AI VOICE AGENT */}
            {activeTab === 'voiceagent' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <span className="lab" style={{ marginBottom: '4px' }}>Free AI Voice Agent Personas</span>
                  <p style={{ color: 'var(--text-2)', fontSize: '13.5px', margin: 0 }}>
                    Select an AI voice agent persona that narrates your ranking reels using the browser's native speech synthesis engine (100% free, zero token costs).
                  </p>
                </div>

                {/* Persona Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {AI_VOICE_PERSONAS.map((persona) => {
                    const isSelected = selectedPersonaId === persona.id;
                    return (
                      <div
                        key={persona.id}
                        onClick={() => setSelectedPersonaId(persona.id)}
                        className="glass-tile"
                        style={{
                          padding: '16px',
                          cursor: 'pointer',
                          borderColor: isSelected ? 'var(--accent)' : 'var(--hair)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--tile)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: '#FFF' }}>{persona.name}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                              color: '#FFF'
                            }}
                          >
                            {persona.tag}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.4 }}>
                          {persona.style}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Test Voice Button */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--hair)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#FFF' }}>
                      Listen to {activePersona.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>
                      Speaks sample hook using your browser voice engine
                    </div>
                  </div>

                  <button
                    onClick={testVoicePersona}
                    disabled={isTestingVoice}
                    className="btn btn-secondary sm"
                  >
                    <Volume2 size={14} style={{ color: 'var(--accent-light)' }} />
                    <span>{isTestingVoice ? 'Speaking...' : 'Test Voice Persona'}</span>
                  </button>
                </div>

                {/* Sliders: Pacing & Pitch */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-2)', marginBottom: '6px' }}>
                      <span>Vocal Speed / Pacing</span>
                      <span>{customRate.toFixed(2)}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={customRate}
                      onChange={(e) => setCustomRate(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-2)', marginBottom: '6px' }}>
                      <span>Vocal Pitch</span>
                      <span>{customPitch.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.25"
                      step="0.05"
                      value={customPitch}
                      onChange={(e) => setCustomPitch(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TIER LIST ITEMS EDITOR */}
            {activeTab === 'ranking' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="lab" style={{ marginBottom: 0 }}>Configure 5 Ranked Items</span>
                <p style={{ color: 'var(--text-2)', fontSize: '13.5px', margin: 0 }}>
                  Customize the 5 tiers from S-Tier to D-Tier. The algorithm rewards controversial, opinionated rankings!
                </p>

                {items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--hair)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        className={`tier-${item.tier.toLowerCase()}`}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          fontWeight: 900,
                          fontSize: '14px',
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        {item.tier}
                      </span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].name = e.target.value;
                          setItems(updated);
                        }}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--hair-2)',
                          borderRadius: '6px',
                          color: '#FFF',
                          fontSize: '13px',
                          fontWeight: 600
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      value={item.reasoning}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].reasoning = e.target.value;
                        setItems(updated);
                      }}
                      placeholder="Why does this deserve this tier?"
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--hair)',
                        borderRadius: '6px',
                        color: 'var(--text-2)',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: SCRIPT & HOOKS */}
            {activeTab === 'script' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--accent-light)', marginBottom: '6px' }}>
                    0-3s High-Retention Hook
                  </label>
                  <textarea
                    rows={3}
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--hair-2)',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '13.5px',
                      lineHeight: 1.5,
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                    Call To Action (CTA)
                  </label>
                  <textarea
                    rows={2}
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--hair-2)',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '13.5px',
                      lineHeight: 1.5,
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <button onClick={copyFullScript} className="btn btn-secondary sm" style={{ alignSelf: 'flex-start' }}>
                  {copiedScript ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
                  <span>{copiedScript ? 'Script Copied' : 'Copy Full Formatted Script'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: 9:16 Mobile Canvas Simulator */}
          <div
            style={{
              flex: '1 1 45%',
              background: '#040406',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              position: 'relative'
            }}
          >
            {/* Toast notification when video is shuffled */}
            {shuffleToast && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  zIndex: 30,
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(99, 102, 241, 0.95)',
                  boxShadow: '0 8px 24px var(--accent-glow)',
                  color: '#FFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'floatBob 0.3s ease-out'
                }}
              >
                <Shuffle size={12} />
                <span>{shuffleToast}</span>
              </div>
            )}

            {/* 9:16 Mobile Phone Frame */}
            <div
              style={{
                position: 'relative',
                width: '280px',
                height: '497px',
                borderRadius: '30px',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 0 8px #141419, 0 0 0 9px rgba(255,255,255,0.1)',
                background: '#09090C'
              }}
            >
              <canvas
                ref={canvasRef}
                width={720}
                height={1280}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />

              {!isPlaying && (
                <div
                  onClick={startPlayback}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    margin: 'auto',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#FFF',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.6)',
                    zIndex: 10
                  }}
                >
                  <Play size={24} fill="#FFF" style={{ marginLeft: '3px' }} />
                </div>
              )}
            </div>

            {/* Playback Controls & Shuffle Button Under Phone */}
            <div
              style={{
                marginTop: '14px',
                width: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--hair)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={isPlaying ? pausePlayback : startPlayback}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isPlaying ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
                    border: 'none',
                    color: '#FFF',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isPlaying ? <Pause size={14} fill="#FFF" /> : <Play size={14} fill="#FFF" style={{ marginLeft: '1.5px' }} />}
                </button>

                <button
                  onClick={resetPlayback}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
                  title="Reset video"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  onClick={handleShuffleVideo}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer' }}
                  title="Shuffle Background Video B-Roll"
                >
                  <Shuffle size={15} />
                </button>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-2)', fontFamily: 'monospace' }}>
                {playbackTime.toFixed(1)}s / 15.0s
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
