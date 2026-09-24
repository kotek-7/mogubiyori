import { Bell, BookOpen, Check, ChevronRight, Coins, Flame, Utensils } from 'lucide-react'
import { Pet, GatheringScene } from '../../GameArt'
import { MoguMark } from '../../GameMotifs'
import { PlayGuide } from '../../PlayGuide'
import {
  fedToday,
  hungerOf,
  growthProgress,
  species,
  stageOf,
  stageName,
  streakOf,
} from '../../game'
import { useGameSession } from '../useGameSession'
import { useGameUi } from '../gameUi'

export function RoomPage() {
  const { state } = useGameSession()
  const {
    setDialog,
    petting,
    setPetting,
    openMeal,
    showFriends,
    showGrowthGuide,
    dismissHomeGuide,
    growthButton,
    openProfile,
    showMealGuide,
    feedButton,
    startTutorial,
  } = useGameUi()
  const hunger = hungerOf(state),
    stage = stageOf(state.xp),
    streak = streakOf(state),
    dailyFed = fedToday(state)
  const fed = hunger === 96
  const { progress: growth, remaining: nextGrowth } = growthProgress(state.xp)
  return (
    <>
      <div className="play-greeting">
        <div>
          <span className="play-location">カヤ村・下のかまど</span>
          <h1>ごはんのひろば</h1>
        </div>
        <button className="play-streak" onClick={() => setDialog({ type: 'streak' })}>
          <Flame size={17} fill="currentColor" />
          <strong>{streak}</strong>日連続
          <ChevronRight size={13} />
        </button>
      </div>
      <section
        data-growth-stage={stage}
        className={`play-world ${state.visitors.length ? 'with-visitors' : ''} theme-${state.equipped.room}`}
        aria-label={`${state.name}のひろば。${fed ? 'おなかいっぱい' : 'ごはんを待っています'}`}
      >
        <GatheringScene className="play-scenery" variant={state.equipped.room} />
        <div className="play-world-top">
          <span className="play-condition">
            <Utensils size={13} />
            {fed ? '満腹' : hunger <= 8 ? '空腹' : 'ごはん待ち'}
          </span>
          <button
            aria-label="ごはんのお知らせ"
            onClick={() => setDialog({ type: 'letters' })}
            className={!dailyFed && state.reminder === 'eager' ? 'has-reminder' : undefined}
          >
            <Bell size={19} />
            {!dailyFed && <i />}
          </button>
        </div>
        <button
          className={`play-pet ${petting ? 'is-petted' : ''}`}
          aria-label={`${state.name}をなでる`}
          onClick={() => setPetting(true)}
        >
          <Pet
            species={state.activeId!}
            stage={stage}
            mood={petting || fed ? 'happy' : 'hungry'}
            hat={state.equipped.hat}
          />
          {petting && <span className="pet-heart">♥</span>}
        </button>
        {state.visitors.length > 0 && (
          <div className="play-guests">
            <span>お客さん {state.visitors.length}</span>
            <div>
              {state.visitors.map((id) => (
                <button
                  key={id}
                  onClick={() => openMeal({ targetId: id })}
                  aria-label={`お客さんの${species.find((s) => s.id === id)!.name}にごはんをあげる`}
                >
                  <Pet species={id} stage={0} mood="hungry" />
                  <span>{species.find((s) => s.id === id)!.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <button className="play-friend-count" onClick={showFriends}>
          <span>
            {state.companions.slice(0, 3).map((friend) => (
              <Pet
                key={friend.id}
                species={friend.id}
                stage={stageOf(friend.xp)}
                mood="happy"
                portrait
              />
            ))}
          </span>
          なかま {state.companions.length}/{species.length}
          <ChevronRight size={13} />
        </button>
      </section>
      <section className="play-care" aria-label="今日のごはん">
        <div className="play-care-growth">
          {showGrowthGuide && (
            <PlayGuide id="home-growth-guide" onDismiss={dismissHomeGuide}>
              ごはんで経験値が増えました。ここで{state.name}の成長を確認できます。
            </PlayGuide>
          )}
          <button
            ref={growthButton}
            className={`play-growth${showGrowthGuide ? ' is-guide-target' : ''}`}
            aria-describedby={showGrowthGuide ? 'home-growth-guide-text' : undefined}
            onClick={openProfile}
          >
            <span className="play-name">
              <strong>{state.name}</strong>
              <small>
                {stageName(stage)} · {stage + 1}/5
              </small>
              <ChevronRight size={14} />
            </span>
            <span
              className="play-growth-track"
              role="progressbar"
              aria-label="成長"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(growth)}
            >
              <i style={{ width: `${growth}%` }} />
            </span>
            <span className="play-next">
              {stage === 4 ? 'すべての姿を発見' : `次の成長まで ${nextGrowth} XP`}
            </span>
          </button>
        </div>
        <div className="play-care-feed">
          {showMealGuide && (
            <PlayGuide id="home-meal-guide" onDismiss={dismissHomeGuide}>
              {state.name}がごはんを待っています。自分で作った料理をここから記録しましょう。
            </PlayGuide>
          )}
          <button
            ref={feedButton}
            className={`primary-button play-feed${showMealGuide ? ' is-guide-target' : ''}`}
            aria-describedby={showMealGuide ? 'home-meal-guide-text' : undefined}
            onClick={() => openMeal()}
          >
            <MoguMark />
            {fed ? 'もう一度あげる' : 'ごはんをあげる'}
          </button>
        </div>
        <div className="play-today">
          <span>
            {dailyFed ? (
              <>
                <Check size={13} />
                今日のごはん 記録済み
              </>
            ) : (
              <>今日のごはん 未記録</>
            )}
          </span>
        </div>
      </section>
      <div className="play-rewards">
        <span>
          <Coins size={14} />
          ログイン +20
          <Check size={12} />
        </span>
        <button onClick={() => setDialog({ type: 'streak' })}>
          <Flame size={14} />
          {streak < 3 ? '3日連続で +30' : '7日ごとに +100'}
          <ChevronRight size={12} />
        </button>
      </div>
      {state.tutorial.status === 'paused' && (
        <button className="tutorial-resume" onClick={startTutorial}>
          <BookOpen size={16} />
          チュートリアルを続ける
          <ChevronRight size={14} />
        </button>
      )}
    </>
  )
}
