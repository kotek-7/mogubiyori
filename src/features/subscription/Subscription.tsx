import { useState } from 'react'
import { BookOpen, Check, Crown } from 'lucide-react'
import { useGameSession } from '../../app/game/useGameSession'
import { getSubscriptionPlan } from '../../../shared/game/subscription'
import type { SubscriptionPlan } from '../../../shared/game/subscription'
import { recipes } from '../../../shared/content/recipes'

export function SubscriptionSettings() {
  const { state, execute, busy } = useGameSession()
  const plan = getSubscriptionPlan(state)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function changePlan(next: SubscriptionPlan) {
    setError('')
    setMessage('')
    try {
      await execute({ type: 'setSubscriptionPlan', plan: next })
      setMessage(
        next === 'premium' ? '有料プランに切り替えました。' : '無料プランに切り替えました。',
      )
    } catch {
      setError('プランを変更できませんでした。もう一度お試しください。')
    }
  }
  return (
    <section className="subscription-settings" aria-label="会員プラン">
      <div className="subscription-heading">
        <Crown size={23} aria-hidden="true" />
        <div>
          <h3>もぐ日和プラス</h3>
          <p>毎日のごはんを、もっと自由に。</p>
        </div>
      </div>
      <p className="subscription-current" role="status">
        現在のプラン：<strong>{plan === 'premium' ? '有料プラン' : '無料プラン'}</strong>
      </p>
      <div className="subscription-table-wrap">
        <table className="subscription-table">
          <caption className="sr-only">無料プランと有料プランの特典</caption>
          <thead>
            <tr>
              <th scope="col">特典</th>
              <th scope="col">無料</th>
              <th scope="col">有料</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">栄養レポート</th>
              <td>直近3日分</td>
              <td>全期間</td>
            </tr>
            <tr>
              <th scope="row">ごはん記録</th>
              <td>1日1回</td>
              <td>1日何回でも</td>
            </tr>
            <tr>
              <th scope="row">レシピ</th>
              <td>定番30品</td>
              <td>全{recipes.length}品</td>
            </tr>
            <tr>
              <th scope="row">広告</th>
              <td>あり</td>
              <td>なし</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="subscription-note">
        無料のレポートは今日を含む3日分です。プランを変更しても記録は消えず、有料に戻すと全期間を見られます。
      </p>
      <div className="subscription-switch" role="group" aria-label="プランの切り替え">
        <button
          type="button"
          className="secondary-button"
          disabled={busy || plan === 'free'}
          onClick={() => void changePlan('free')}
        >
          {plan === 'free' ? (
            <>
              <Check size={16} />
              無料プランを利用中
            </>
          ) : (
            '無料プランに切り替える'
          )}
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={busy || plan === 'premium'}
          onClick={() => void changePlan('premium')}
        >
          {plan === 'premium' ? (
            <>
              <Check size={16} />
              有料プランを利用中
            </>
          ) : (
            '有料プランに切り替える'
          )}
        </button>
      </div>
      <p className="subscription-note">おためしのプラン切り替えです。料金は発生しません。</p>
      {message && (
        <p className="subscription-message" role="status">
          {message}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}

export function SubscriptionPrompt({ reason }: { reason?: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <aside className="subscription-prompt" aria-label="有料プランのご案内">
      <p>
        <Crown size={18} aria-hidden="true" />
        {reason ?? 'もぐ日和プラスで、もっと楽しめます。'}
      </p>
      <button
        type="button"
        className="meal-report-link"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'プランを閉じる' : 'プランを見る'}
      </button>
      {expanded && <SubscriptionSettings />}
    </aside>
  )
}

export function PlanAdvertisement({ onOpenRecipes }: { onOpenRecipes: () => void }) {
  const { state } = useGameSession()
  if (getSubscriptionPlan(state) === 'premium') return null
  return (
    <aside className="plan-advertisement" aria-label="広告">
      <span className="plan-advertisement-label">広告・サンプル</span>
      <BookOpen size={25} aria-hidden="true" />
      <div>
        <strong>今日の献立に、小さなヒント。</strong>
        <p>もぐ日和の料理カードで、次につくる一品を。</p>
      </div>
      <button type="button" onClick={onOpenRecipes}>
        料理カードを見る
      </button>
    </aside>
  )
}
