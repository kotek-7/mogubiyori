import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus } from 'lucide-react'
import { resizePhoto } from '../meal/photo'
import { TutorialGuide } from './TutorialGuide'
import { CameraCapture } from '../meal/CameraCapture'
import { SamplePhotoCapture } from '../meal/SamplePhotoCapture'

export type TutorialFirstPhotoPhase = 'cooking' | 'loading' | 'photo'
type TutorialPhoto = { src: string; sample: boolean }

export function TutorialFirstPhoto({
  onSubmit,
  onPhaseChange,
}: {
  onSubmit: (photo: string) => void
  onPhaseChange: (phase: TutorialFirstPhotoPhase) => void
}) {
  const [phase, setPhase] = useState<TutorialFirstPhotoPhase>('cooking')
  const [photo, setPhoto] = useState<TutorialPhoto | null>(null)
  const [samplePlayback, setSamplePlayback] = useState<{ previous: TutorialPhoto | null } | null>(
    null,
  )
  const [error, setError] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const library = useRef<HTMLInputElement>(null)
  const entry = useRef<HTMLButtonElement>(null)
  const preview = useRef<HTMLDivElement>(null)
  const sampleDestination = useRef<HTMLImageElement>(null)
  const request = useRef(0)
  const submitted = useRef(false)
  const loading = phase === 'loading'
  const busy = loading || Boolean(samplePlayback)

  useEffect(
    () => () => {
      request.current += 1
    },
    [],
  )
  useEffect(() => {
    if (phase === 'photo') preview.current?.focus({ preventScroll: true })
    else if (phase === 'cooking' && error) entry.current?.focus({ preventScroll: true })
  }, [phase, error])

  function changePhase(next: TutorialFirstPhotoPhase) {
    setPhase(next)
    onPhaseChange(next)
  }

  async function selectPhoto(file: File) {
    const currentRequest = ++request.current
    setSamplePlayback(null)
    setError('')
    changePhase('loading')
    try {
      const src = await resizePhoto(file)
      if (currentRequest !== request.current) return
      setPhoto({ src, sample: false })
      changePhase('photo')
    } catch (cause) {
      if (currentRequest !== request.current) return
      setError(cause instanceof Error ? cause.message : '写真を読み込めませんでした。')
      changePhase(photo ? 'photo' : 'cooking')
    }
  }

  function useSample() {
    if (samplePlayback) return
    request.current += 1
    setError('')
    setSamplePlayback({ previous: photo })
    setPhoto({ src: `${import.meta.env.BASE_URL}art/tutorial/sample-curry.jpg`, sample: true })
    changePhase('photo')
  }

  function finishSample() {
    setSamplePlayback(null)
    requestAnimationFrame(() => preview.current?.focus({ preventScroll: true }))
  }

  function cancelSample() {
    if (!samplePlayback) return
    request.current += 1
    setPhoto(samplePlayback.previous)
    changePhase(samplePlayback.previous ? 'photo' : 'cooking')
    setSamplePlayback(null)
    requestAnimationFrame(() => {
      ;(preview.current ?? entry.current)?.focus({ preventScroll: true })
    })
  }

  function submit() {
    if (!photo || busy || submitted.current) return
    submitted.current = true
    onSubmit(photo.src)
  }

  const fileInput = (
    <input
      ref={library}
      type="file"
      hidden
      tabIndex={-1}
      accept="image/jpeg,image/png,image/webp"
      aria-label="撮影済みの料理写真"
      disabled={busy}
      onChange={(event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (file) void selectPhoto(file)
      }}
    />
  )

  return (
    <div className="tutorial-recipe-lab tutorial-first-photo" data-phase={phase}>
      {fileInput}
      {!photo && !loading ? (
        <button
          ref={entry}
          type="button"
          className="tutorial-first-photo-preview tutorial-first-photo-entry"
          aria-label="今日の料理を一枚"
          aria-haspopup="dialog"
          onClick={() => setCameraOpen(true)}
        >
          <Camera size={42} strokeWidth={1.5} aria-hidden="true" />
          <strong>今日の料理を一枚</strong>
          <span>タップして撮影</span>
        </button>
      ) : (
        <div
          ref={preview}
          className="tutorial-first-photo-preview"
          role="group"
          aria-label={photo ? '選んだ写真の確認' : '最初の料理写真'}
          aria-busy={busy}
          tabIndex={-1}
        >
          {photo?.sample ? (
            <div className={`tutorial-first-photo-plate${samplePlayback ? ' is-arriving' : ''}`}>
              <img ref={sampleDestination} src={photo.src} alt="サンプルのカレー写真" />
            </div>
          ) : photo ? (
            <img src={photo.src} alt="選んだ料理の写真" />
          ) : (
            <span className="tutorial-first-photo-placeholder">
              <Camera size={42} strokeWidth={1.5} aria-hidden="true" />
              <span>今日の料理を一枚</span>
            </span>
          )}
          {loading && (
            <span className="tutorial-first-photo-loading" role="status">
              写真を読み込んでいます
            </span>
          )}
          {photo?.sample && !loading && (
            <span className="tutorial-first-photo-sample">サンプル写真</span>
          )}
          <button
            type="button"
            className="tutorial-first-photo-retake"
            aria-label="料理の写真を撮り直す"
            aria-haspopup="dialog"
            disabled={busy}
            onClick={() => setCameraOpen(true)}
          >
            <Camera size={16} aria-hidden="true" />
            撮り直す
          </button>
        </div>
      )}
      <div className="tutorial-first-photo-options">
        <button type="button" onClick={() => library.current?.click()} disabled={busy}>
          <ImagePlus size={18} aria-hidden="true" />
          <span>{photo ? '写真を選び直す' : '撮った写真を選ぶ'}</span>
        </button>
        <button
          type="button"
          aria-label="サンプル写真を使う"
          onClick={useSample}
          disabled={Boolean(samplePlayback)}
        >
          <img
            src={`${import.meta.env.BASE_URL}art/tutorial/sample-curry.jpg`}
            alt="カレーのサンプル写真"
          />
          <span>サンプル写真を使う</span>
        </button>
      </div>
      <TutorialGuide
        action={
          photo || loading
            ? {
                label: loading ? '読み込み中' : 'この写真でごはんをあげる',
                onClick: submit,
                disabled: busy,
              }
            : undefined
        }
      >
        {photo
          ? 'この写真で、なかまにごはんをあげてみましょう。'
          : '大きな枠をタップして撮影しましょう。撮った写真やサンプルでも試せます。'}
      </TutorialGuide>
      {error && (
        <p className="error-message tutorial-first-photo-error" role="alert">
          {error}
        </p>
      )}
      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            setCameraOpen(false)
            void selectPhoto(file)
          }}
          onClose={() => setCameraOpen(false)}
          onChoosePhoto={() => {
            setCameraOpen(false)
            library.current?.click()
          }}
        />
      )}
      {samplePlayback && photo && (
        <SamplePhotoCapture
          photo={photo.src}
          destination={sampleDestination}
          onComplete={finishSample}
          onClose={cancelSample}
        />
      )}
    </div>
  )
}
