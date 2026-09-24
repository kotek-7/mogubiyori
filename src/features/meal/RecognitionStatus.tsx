export function RecognitionStatus({ pending, message }: { pending: boolean; message: string }) {
  if (!message) return null
  return (
    <div className={`meal-recognition-status${pending ? ' is-pending' : ''}`} role="status">
      {pending && (
        <span className="meal-recognition-label">
          料理を見ています
          <span className="meal-recognition-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </span>
      )}
      <span>{message}</span>
    </div>
  )
}
