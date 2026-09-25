import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'

type CameraCaptureProps = {
  onCapture: (file: File) => void
  onClose: () => void
  onChoosePhoto: () => void
}

function cameraError(cause: unknown) {
  if (cause instanceof DOMException && cause.name === 'NotAllowedError')
    return 'カメラの使用が許可されていません。撮った写真を選んで続けられます。'
  return 'カメラを開けませんでした。撮った写真を選んで続けられます。'
}

/** Keep capture inside the page so opening a camera app cannot discard this operation. */
export function CameraCapture({ onCapture, onClose, onChoosePhoto }: CameraCaptureProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const active = useRef(false)
  const capturing = useRef(false)
  const callbacks = useRef({ onCapture, onClose, onChoosePhoto })
  const titleId = useId()
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useLayoutEffect(() => {
    callbacks.current = { onCapture, onClose, onChoosePhoto }
  }, [onCapture, onClose, onChoosePhoto])

  function stopCamera() {
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
  }

  function close() {
    active.current = false
    stopCamera()
    callbacks.current.onClose()
  }

  useLayoutEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    // A local flag also distinguishes a stale permission request in React Strict Mode.
    let currentRequest = true
    active.current = true
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable')
        const media = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 800, max: 1280 },
            height: { ideal: 800, max: 1280 },
          },
        })
        if (!currentRequest || !active.current) {
          media.getTracks().forEach((track) => track.stop())
          return
        }
        stream.current = media
        if (video.current) {
          video.current.srcObject = media
          await video.current.play()
        }
      } catch (cause) {
        if (!currentRequest || !active.current) return
        stopCamera()
        setError(cameraError(cause))
      }
    }
    void start()
    const leave = () => {
      active.current = false
      stopCamera()
      callbacks.current.onClose()
    }
    const hide = () => {
      if (document.hidden) leave()
    }
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', leave)
    return () => {
      currentRequest = false
      active.current = false
      stopCamera()
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', leave)
    }
  }, [])

  function capture() {
    const preview = video.current
    if (!ready || capturing.current || !preview?.videoWidth || !preview.videoHeight) return
    capturing.current = true
    setSaving(true)
    setReady(false)
    const canvas = document.createElement('canvas')
    const ratio = Math.min(1, 800 / Math.max(preview.videoWidth, preview.videoHeight))
    canvas.width = Math.max(1, Math.round(preview.videoWidth * ratio))
    canvas.height = Math.max(1, Math.round(preview.videoHeight * ratio))
    try {
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas unavailable')
      context.drawImage(preview, 0, 0, canvas.width, canvas.height)
      stopCamera()
      canvas.toBlob(
        (blob) => {
          canvas.width = 0
          canvas.height = 0
          if (!active.current) return
          if (!blob) {
            setSaving(false)
            setError('写真を保存できませんでした。撮った写真を選んで続けられます。')
            return
          }
          active.current = false
          callbacks.current.onCapture(new File([blob], 'meal-photo.jpg', { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.82,
      )
    } catch {
      stopCamera()
      canvas.width = 0
      canvas.height = 0
      setSaving(false)
      setError('写真を保存できませんでした。撮った写真を選んで続けられます。')
    }
  }

  return (
    <dialog
      ref={dialog}
      className="meal-camera-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        close()
      }}
    >
      <header className="meal-camera-header">
        <h2 id={titleId}>料理の写真を撮る</h2>
        <button type="button" className="icon-button" aria-label="カメラを閉じる" onClick={close}>
          <X size={22} />
        </button>
      </header>
      <div className="meal-camera-preview">
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          aria-label="カメラの映像"
          onLoadedData={() => {
            if (active.current && !capturing.current) setReady(true)
          }}
          onCanPlay={() => {
            if (active.current && !capturing.current) setReady(true)
          }}
        />
        {!ready && !error && (
          <p role="status">{saving ? '写真を保存しています' : 'カメラを準備しています'}</p>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="meal-camera-actions">
        <button
          type="button"
          className="journey-primary"
          disabled={!ready || saving}
          onClick={capture}
        >
          <Camera size={20} /> 撮影する
        </button>
        <button
          type="button"
          className="journey-secondary"
          onClick={() => {
            active.current = false
            stopCamera()
            // Release modal inertness before the parent opens its file picker.
            dialog.current?.close()
            callbacks.current.onChoosePhoto()
          }}
        >
          <ImagePlus size={20} /> 撮った写真を選ぶ
        </button>
      </div>
    </dialog>
  )
}
