const menu = document.querySelector('#contents-dialog')
document
  .querySelectorAll('[data-open-contents]')
  .forEach((button) => button.addEventListener('click', () => menu.showModal()))
document.querySelector('[data-close-contents]')?.addEventListener('click', () => menu.close())
menu?.addEventListener('click', (event) => {
  if (event.target === menu) menu.close()
})

const filters = document.querySelectorAll('[data-filter]')
filters.forEach((button) =>
  button.addEventListener('click', () => {
    const value = button.dataset.filter
    filters.forEach((other) => other.setAttribute('aria-pressed', String(other === button)))
    let count = 0
    document.querySelectorAll('[data-category]').forEach((card) => {
      card.hidden = value !== 'all' && card.dataset.category !== value
      if (!card.hidden) count++
    })
    const status = document.querySelector('[data-filter-status]')
    if (status) status.textContent = `${count}篇のものがたり`
  }),
)

const progress = document.querySelector('[data-reading-progress]')
if (progress) {
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`
  }
  addEventListener('scroll', update, { passive: true })
  addEventListener('resize', update)
  update()
}
