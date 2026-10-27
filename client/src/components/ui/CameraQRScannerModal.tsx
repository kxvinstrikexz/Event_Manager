import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CameraQRScannerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  onCameraUnavailable?: () => void;
  eventName?: string;
}

type ScannerStatus = 'initializing' | 'scanning' | 'unavailable';

export const CameraQRScannerModal: React.FC<CameraQRScannerModalProps> = ({
  onClose,
  onScanSuccess,
  onCameraUnavailable,
  eventName
}) => {
  const [status, setStatus] = useState<ScannerStatus>('initializing');
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const activeStreamRef = useRef<MediaStream | null>(null);
  const allActiveStreamsRef = useRef<MediaStream[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const hasScannedRef = useRef<boolean>(false);
  const originalGUMRef = useRef<typeof navigator.mediaDevices.getUserMedia | null>(null);
  const elementId = 'campus-events-camera-preview';

  // Comprehensive camera cleanup: stops all tracks, detaches video, destroys scanner
  const cleanupCamera = useCallback(async () => {
    isCancelledRef.current = true;

    // 1. Stop and clear Html5Qrcode scanner instance
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('[Camera Cleanup] scanner.stop error:', err);
      }
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('[Camera Cleanup] scanner.clear error:', err);
      }
      scannerRef.current = null;
    }

    // 2. Stop EVERY MediaStreamTrack on active streams and release camera device
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      } catch (e) {
        console.warn('[Camera Cleanup] activeStream track stop error:', e);
      }
      activeStreamRef.current = null;
    }

    allActiveStreamsRef.current.forEach(stream => {
      try {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      } catch (e) {}
    });
    allActiveStreamsRef.current = [];

    // 3. Disconnect stream from video element and clear video srcObject
    const container = containerRef.current || document.getElementById(elementId);
    if (container) {
      const videos = container.querySelectorAll('video');
      videos.forEach(video => {
        try {
          if (video.srcObject instanceof MediaStream) {
            video.srcObject.getTracks().forEach(track => track.stop());
          }
        } catch (e) {}
        try {
          video.pause();
        } catch (e) {}
        video.srcObject = null;
      });
    }

    // Check all video elements associated with this scanner container ID
    try {
      const lingeringVideos = document.querySelectorAll(`[id^="${elementId}"] video, #${elementId} video`);
      lingeringVideos.forEach(v => {
        const video = v as HTMLVideoElement;
        if (video.srcObject instanceof MediaStream) {
          video.srcObject.getTracks().forEach(t => t.stop());
        }
        try {
          video.pause();
        } catch (e) {}
        video.srcObject = null;
      });
    } catch (e) {}

    // Restore original getUserMedia if overridden
    if (originalGUMRef.current && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = originalGUMRef.current;
      originalGUMRef.current = null;
    }
  }, []);

  // Initialize and start camera with robust fallback strategy
  const startCamera = useCallback(async (cameraIdToUse?: string) => {
    // PREVENT MULTIPLE CAMERA STREAMS:
    // 1. Check whether an existing camera stream is active & stop it completely
    // 2. Clear old video srcObject
    // 3. Then initialize new camera
    await cleanupCamera();

    isCancelledRef.current = false;
    hasScannedRef.current = false;
    setStatus('initializing');
    setErrorMessage('');

    // Small delay to ensure container element is mounted in DOM
    await new Promise(resolve => setTimeout(resolve, 80));

    if (isCancelledRef.current) return;

    // Intercept getUserMedia so we always hold an exact reference to active MediaStream
    if (navigator.mediaDevices && !originalGUMRef.current) {
      originalGUMRef.current = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
        if (isCancelledRef.current) {
          throw new DOMException('Camera initialization cancelled', 'AbortError');
        }
        const stream = await originalGUMRef.current!(constraints);
        if (isCancelledRef.current) {
          // Scanner closed while awaiting permission/device - kill tracks immediately
          stream.getTracks().forEach(t => t.stop());
          throw new DOMException('Camera initialization cancelled', 'AbortError');
        }
        activeStreamRef.current = stream;
        allActiveStreamsRef.current.push(stream);
        return stream;
      };
    }

    const container = containerRef.current || document.getElementById(elementId);
    if (!container || isCancelledRef.current) {
      return;
    }

    try {
      const scanner = new Html5Qrcode(elementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });
      scannerRef.current = scanner;

      const qrConfig = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      const handleScanSuccess = async (decodedText: string) => {
        if (hasScannedRef.current) return;
        hasScannedRef.current = true;
        isCancelledRef.current = true;

        // Stop camera stream & release tracks immediately on scan success
        await cleanupCamera();

        // Pass decoded QR value to parent
        onScanSuccess(decodedText);
      };

      let started = false;

      // If specific camera ID chosen
      if (cameraIdToUse) {
        try {
          await scanner.start(
            cameraIdToUse,
            qrConfig,
            handleScanSuccess,
            () => {}
          );
          started = true;
        } catch (e) {
          console.warn('[Camera] Specific camera ID failed:', e);
        }
      }

      // Attempt 1: Environment facing mode (mobile rear camera)
      if (!started && !isCancelledRef.current) {
        try {
          await scanner.start(
            { facingMode: 'environment' },
            qrConfig,
            handleScanSuccess,
            () => {}
          );
          started = true;
        } catch (envErr) {
          console.warn('[Camera] Environment mode failed, trying user mode (webcam)...', envErr);
        }
      }

      // Attempt 2: User facing mode (laptop/desktop webcam)
      if (!started && !isCancelledRef.current) {
        try {
          await scanner.start(
            { facingMode: 'user' },
            qrConfig,
            handleScanSuccess,
            () => {}
          );
          started = true;
        } catch (userErr) {
          console.warn('[Camera] User mode failed, trying enumerated devices...', userErr);
        }
      }

      // Attempt 3: First enumerated videoinput device
      if (!started && !isCancelledRef.current && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter(d => d.kind === 'videoinput');
          if (videoDevs.length > 0) {
            await scanner.start(
              videoDevs[0].deviceId,
              qrConfig,
              handleScanSuccess,
              () => {}
            );
            started = true;
          }
        } catch (devErr) {
          console.warn('[Camera] Enumerated device start failed:', devErr);
        }
      }

      if (isCancelledRef.current) {
        // Modal was closed during startup
        await cleanupCamera();
        return;
      }

      if (!started) {
        throw new Error('Camera could not be started');
      }

      // Scanner started successfully!
      setStatus('scanning');

      // Ensure video element plays inline, is muted, and has active stream
      const videoEl = container.querySelector('video');
      if (videoEl) {
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('webkit-playsinline', 'true');
        videoEl.muted = true;
        videoEl.autoplay = true;
        videoEl.play().catch(() => {});
      }

      // Query available camera list for switcher
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
          const videoDevs = devices.filter(d => d.kind === 'videoinput');
          if (videoDevs.length > 0) {
            setAvailableCameras(
              videoDevs.map((d, i) => ({
                id: d.deviceId,
                label: d.label || `Camera ${i + 1}`
              }))
            );
          }
        }).catch(() => {});
      }
    } catch (err: any) {
      if (isCancelledRef.current) {
        await cleanupCamera();
        return;
      }
      console.warn('[Camera Scanner Initialization Error]', err);
      await cleanupCamera();
      setStatus('unavailable');
      setErrorMessage('Camera unavailable. You can use manual entry below.');
      if (onCameraUnavailable) {
        onCameraUnavailable();
      }
    }
  }, [cleanupCamera, onCameraUnavailable, onScanSuccess]);

  // REACT LIFECYCLE:
  // Component mounts -> start camera
  // Component unmounts (modal close, navigate away, unmount) -> cleanupCamera runs
  useEffect(() => {
    startCamera();

    return () => {
      // Runs when Close Scanner is clicked, user navigates away, or component unmounts
      cleanupCamera();
    };
  }, [startCamera, cleanupCamera]);

  // Switch camera when user selects different device
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    startCamera(newId);
  };

  // Close Scanner action: Stop QR decoder, stop stream, clear srcObject, release camera, close UI
  const handleClose = async () => {
    isCancelledRef.current = true;
    await cleanupCamera();
    onClose();
  };

  // Use Manual Entry action: Clean up camera and return to manual form
  const handleUseManualEntry = async () => {
    isCancelledRef.current = true;
    await cleanupCamera();
    if (onCameraUnavailable) {
      onCameraUnavailable();
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 24, 31, 0.75)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '440px',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-strong)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--dark-base)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
                Live Checkpoint
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                Scan QR Code
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close scanner"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: '#FFFFFF',
              opacity: 0.85,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Event Checkpoint Indicator */}
        {eventName && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--bg-secondary-light)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Event Session:</span>
            <strong style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {eventName}
            </strong>
          </div>
        )}

        {/* Camera Selector (if multiple webcams detected) */}
        {availableCameras.length > 1 && status === 'scanning' && (
          <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Camera:</span>
            <select
              value={selectedCameraId}
              onChange={handleCameraChange}
              style={{
                flex: 1,
                fontSize: '0.78125rem',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)'
              }}
            >
              {availableCameras.map(cam => (
                <option key={cam.id} value={cam.id}>
                  {cam.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Main Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* CAMERA UNAVAILABLE STATE */}
          {status === 'unavailable' && (
            <div style={{ textAlign: 'center', width: '100%', padding: '16px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--status-warning-bg)',
                  border: '2px solid var(--status-warning-border)',
                  color: 'var(--status-warning-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Camera Unavailable
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '340px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                {errorMessage || 'Camera unavailable. You can use manual entry below.'}
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="btn btn-primary"
                  style={{ height: '38px', fontSize: '0.8125rem' }}
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={handleUseManualEntry}
                  className="btn btn-outline"
                  style={{ height: '38px', fontSize: '0.8125rem' }}
                >
                  Use Manual Entry
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE CAMERA VIEWPORT / INITIALIZING STATE */}
          {status !== 'unavailable' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* LIVE CAMERA ELEMENT CONTAINER */}
              <div
                ref={containerRef}
                style={{
                  position: 'relative',
                  width: '320px',
                  height: '320px',
                  backgroundColor: '#0F181F',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {/* Real Html5Qrcode video renders inside this ID */}
                <div id={elementId} style={{ width: '100%', height: '100%' }} />

                {/* Target reticle scan frame overlay */}
                {status === 'scanning' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '210px',
                      height: '210px',
                      border: '2px dashed #7FA6B8',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 0 0 9999px rgba(15, 24, 31, 0.45)',
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ width: '16px', height: '16px', borderTop: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF' }} />
                      <div style={{ width: '16px', height: '16px', borderTop: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ width: '16px', height: '16px', borderBottom: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF' }} />
                      <div style={{ width: '16px', height: '16px', borderBottom: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF' }} />
                    </div>
                  </div>
                )}

                {/* Initializing Spinner Overlay */}
                {status === 'initializing' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(15, 24, 31, 0.9)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      zIndex: 10
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        border: '3px solid rgba(255,255,255,0.2)',
                        borderTopColor: 'var(--accent-base)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginBottom: '12px'
                      }}
                    />
                    Connecting to device camera...
                  </div>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div style={{ marginTop: '16px', textAlign: 'center', width: '100%' }}>
                {status === 'scanning' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        display: 'inline-block',
                        animation: 'pulse 1.5s infinite'
                      }}
                    />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Live Camera Active
                    </span>
                  </div>
                )}

                <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                  Position the student's digital QR pass within the frame to scan automatically.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {/* Close Scanner Button */}
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn btn-outline"
                    style={{ height: '36px', fontSize: '0.8125rem' }}
                  >
                    Close Scanner
                  </button>

                  <button
                    type="button"
                    onClick={handleUseManualEntry}
                    className="btn btn-outline"
                    style={{ height: '36px', fontSize: '0.8125rem' }}
                  >
                    Use Manual Entry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
