import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Camera, X } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import './sample-photo-capture.css'

type SamplePhotoCaptureProps = {
  photo?: string
  destination: RefObject<HTMLImageElement | null>
  onComplete: () => void
  onClose: () => void
}

/** A sample follows the camera-to-table gesture without opening the real camera. */
export function SamplePhotoCapture({
  photo,
  destination,
  onComplete,
  onClose,
}: SamplePhotoCaptureProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const picture = useRef<HTMLDivElement>(null)
  const preview = useRef<HTMLImageElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const camera = useRef<HTMLDivElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onComplete, onClose })
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<'loading' | 'capture' | 'placing'>('loading')

  useLayoutEffect(() => {
    callbacks.current = { onComplete, onClose }
  }, [onComplete, onClose])

  useLayoutEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => {
      element?.close()
    }
  }, [])

  useEffect(() => {
    if (!photo) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const animations: Animation[] = []
    function animate(element: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) {
      const animation = element.animate(frames, { fill: 'forwards', ...options })
      animations.push(animation)
      return animation.finished
    }
    async function play() {
      await preview.current?.decode()
      if (cancelled || !picture.current) return
      setPhase('capture')
      if (reducedMotion) {
        // Briefly show the same photo without a flash or flight.
        await new Promise<void>((resolve) => {
          timer = setTimeout(resolve, 250)
        })
      } else {
        void animate(
          backdrop.current!,
          [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }],
          { duration: 240 },
        ).catch(() => {})
        void animate(
          flash.current!,
          [{ opacity: 0 }, { opacity: 0.45, offset: 0.15 }, { opacity: 0 }],
          {
            delay: 80,
            duration: 90,
          },
        ).catch(() => {})
        await animate(
          picture.current,
          [
            { transform: 'translate(-50%, -50%) scale(1)' },
            { transform: 'translate(-50%, -50%) scale(0.97)', offset: 0.26 },
            { transform: 'translate(-50%, -50%) scale(1.035)', offset: 0.42 },
            { transform: 'translate(-50%, -50%) scale(1)', offset: 0.65 },
            { transform: 'translate(-50%, -50%) scale(1)' },
          ],
          { duration: 380, easing: 'ease-out' },
        )
        if (cancelled) return
        const target = destination.current?.getBoundingClientRect()
        if (target?.width && target.height) {
          const source = picture.current.getBoundingClientRect()
          setPhase('placing')
          void animate(camera.current!, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 }).catch(
            () => {},
          )
          await animate(
            picture.current,
            [
              {
                left: `${source.left + source.width / 2}px`,
                top: `${source.top + source.height / 2}px`,
                width: `${source.width}px`,
                height: `${source.height}px`,
                padding: '8px',
                borderRadius: '18px',
                boxShadow: '0 8px 28px #0002',
              },
              {
                left: `${target.left + target.width / 2}px`,
                top: `${target.top + target.height / 2}px`,
                width: `${target.width}px`,
                height: `${target.height}px`,
                padding: '0px',
                borderRadius: '50%',
                boxShadow: '0 0 0 #0000',
              },
            ],
            { duration: 420, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' },
          )
        }
      }
      if (!cancelled) callbacks.current.onComplete()
    }
    void play().catch(() => {
      if (!cancelled) callbacks.current.onComplete()
    })
    const resized = () => callbacks.current.onComplete()
    window.addEventListener('resize', resized)
    return () => {
      cancelled = true
      clearTimeout(timer)
      animations.forEach((animation) => animation.cancel())
      window.removeEventListener('resize', resized)
    }
  }, [photo, reducedMotion, destination])

  return (
    <dialog
      ref={dialog}
      className="sample-photo-capture"
      aria-label="サンプル写真の撮影体験"
      data-phase={phase}
      data-reduced-motion={Boolean(reducedMotion)}
      onCancel={(event) => {
        event.preventDefault()
        callbacks.current.onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.stopPropagation()
      }}
    >
      <div ref={backdrop} className="sample-capture-backdrop" />
      <div ref={picture} className="sample-capture-photo">
        {photo ? (
          <img ref={preview} src={photo} alt="撮影を体験するサンプルの料理写真" />
        ) : (
          <Camera size={56} />
        )}
        <div ref={flash} className="sample-capture-flash" aria-hidden="true" />
      </div>
      <div ref={camera} className="sample-capture-camera">
        <button type="button" aria-label="体験をやめる" onClick={onClose}>
          <X size={24} />
        </button>
        <div className="sample-capture-viewfinder" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <p className="sr-only" role="status">
          {phase === 'loading'
            ? 'サンプル写真を読み込んでいます'
            : phase === 'placing'
              ? '撮れた写真を食卓へ'
              : 'サンプル写真で撮影を体験しています'}
        </p>
      </div>
    </dialog>
  )
}
