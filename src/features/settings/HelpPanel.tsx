import { Pet } from '../../ui/art/GameArt'
import { stageOf } from '../../app/game/browserGame'
import type { GameState } from '../../app/game/browserGame'
import type { Page } from '../../app/gameUi'

export function HelpPanel({
  state,
  onNavigate,
}: {
  state: GameState
  onNavigate: (page: Page) => void
}) {
  const activeSpecies = state.activeId ?? 'komugi'
  const active = state.companions.find((entry) => entry.id === state.activeId)
  const activeStage = stageOf(active?.xp ?? 0)
  return (
    <div className="help-sheet">
      <Pet species={activeSpecies} stage={activeStage} mood="happy" />
      <h3>作ったごはんを振り返る</h3>
      <p>
        下の「記録」では、作った料理を日付と写真で見返せます。料理を開くと、食材や量を直したり、今日のごはんをほかのもぐに分けたりできます。
      </p>
      <p>
        「レポート」では7日間の自炊日数、点数のグラフ、食べたものの変化を確認できます。点数は主食・おかず・野菜のそろい具合の目安です。
      </p>
      <div className="help-record-links">
        <button className="quiet-button" onClick={() => onNavigate('album')}>
          記録を見る
        </button>
        <button className="quiet-button" onClick={() => onNavigate('reports')}>
          レポートを見る
        </button>
      </div>
      <h3>なかまのおせわ</h3>
      <p>
        このひろばには食べることが好きな生き物が集まります。自分で作った料理を分けて育てましょう。
      </p>
      <ol>
        <li>
          ごはんをあげる<span>料理の写真を記録すると経験値（XP）が増えます。</span>
        </li>
        <li>
          成長させる<span>経験値がたまると姿が変わります。成長は全部で5段階です。</span>
        </li>
        <li>
          なかまをふやす
          <span>わんぱくに育つとお客さんが来ます。ごはんをあげるとなかまになります。</span>
        </li>
        <li>
          料理カードを集める
          <span>
            初めての料理を記録すると、料理カードとコインを獲得できます。未獲得のカードでもレシピを確認できます。
          </span>
        </li>
      </ol>
      <p>同じ料理を続けてあげると獲得経験値が減ります。</p>
      <h3>なかまとふれあう</h3>
      <p>
        なかまをタップするとつつけます。指を滑らせるとなでられ、左右にこするとくすぐれます。
        長押しすると寄り添い、上にはじくと跳ねます。マウスでも同じように遊べます。
      </p>
    </div>
  )
}
