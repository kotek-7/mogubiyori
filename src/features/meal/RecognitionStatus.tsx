import { LoaderCircle } from 'lucide-react'

export function RecognitionStatus({ pending, message }: { pending: boolean; message: string }) {
  if (!message) return null
  return (
    <div className={`meal-recognition-status${pending ? ' is-pending' : ''}`} role="status">
      {pending && (
        <span className="meal-recognition-spinner" role="progressbar" aria-label="料理を検出中">
          <LoaderCircle size={26} aria-hidden="true" />
        </span>
      )}
      <span>
        {pending && <strong>料理を見ています。</strong>}
        <span>{message}</span>
      </span>
    </div>
  )
}
