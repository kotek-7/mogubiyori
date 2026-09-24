/** Pure catalog operations shared by the standalone preview and its tests. */
export function normalizeSearch(value) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .trim()
}
export function selectEntries(
  entries,
  {
    query = '',
    category = '',
    difficulty = '',
    maxMinutes = 0,
    sort = 'default',
    page = 1,
    pageSize = 24,
    labels = {},
  } = {},
) {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean)
  let selected = entries.filter((entry) => {
    if (
      category &&
      category !== (entry.category ?? entry.habitat ?? entry.collection) &&
      category !== entry.kind
    )
      return false
    if (difficulty && entry.difficulty !== Number(difficulty)) return false
    if (maxMinutes && entry.minutes > Number(maxMinutes)) return false
    const searchable = normalizeSearch(
      [
        entry.name,
        entry.description,
        entry.cuisine,
        labels[entry.category ?? entry.habitat ?? entry.collection] ?? '',
        ...(entry.tags ?? []),
        ...(entry.equipment ?? []),
        ...(entry.ingredients ?? []).map((i) => i.name),
        ...(entry.favoriteTags ?? []),
      ].join(' '),
    )
    return tokens.every((token) => searchable.includes(token))
  })
  if (sort === 'time')
    selected = selected.toSorted(
      (a, b) => (a.minutes ?? 0) - (b.minutes ?? 0) || a.id.localeCompare(b.id),
    )
  if (sort === 'name') selected = selected.toSorted((a, b) => a.name.localeCompare(b.name, 'ja'))
  const total = selected.length,
    pages = Math.max(1, Math.ceil(total / pageSize)),
    currentPage = Math.max(1, Math.min(pages, page))
  return {
    entries: selected.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    total,
    pages,
    page: currentPage,
  }
}
