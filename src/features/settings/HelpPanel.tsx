import { Pet } from '../../ui/art/GameArt'
import { stageOf } from '../../app/game/browserGame'
import type { GameState } from '../../app/game/browserGame'

export function HelpPanel({ state }: { state: GameState }) {
  const activeSpecies = state.activeId ?? 'komugi'
  const active = state.companions.find((entry) => entry.id === state.activeId)
  const activeStage = stageOf(active?.xp ?? 0)
  return (
    <div className="help-sheet">
      <Pet species={activeSpecies} stage={activeStage} mood="happy" />
      <h3>なかまのお世話</h3>
      <p>
        このひろばには食べることが好きな生き物が集まります。自分で作った料理を分けて育てましょう。
      </p>
      <ol>
        <li>
          ごはんをあげる<span>料理の写真を記録すると経験値が増えます。</span>
        </li>
        <li>
          成長させる<span>経験値がたまると姿が変わります。成長は全部で5段階です。</span>
        </li>
        <li>
          なかまを増やす
          <span>わんぱくに育つとお客さんが来ます。ごはんをあげると仲間になります。</span>
        </li>
        <li>
          レシピカードを集める
          <span>
            初めて記録した料理のカードとコインを獲得できます。未獲得のカードでもレシピを確認できます。
          </span>
        </li>
      </ol>
      <p>同じ料理を続けてあげると獲得経験値が減ります。</p>
    </div>
  )
}
