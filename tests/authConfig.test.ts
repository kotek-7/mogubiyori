import { describe, expect, it } from 'vitest'
import { readRuntimeConfig } from '../src/features/auth/auth'

const cloud = {
  VITE_GAME_MODE: 'cloud',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
}

describe('runtime storage mode', () => {
  it('defaults to local play only when cloud mode has not been requested', () => {
    expect(readRuntimeConfig({})).toEqual({ mode: 'local' })
    expect(readRuntimeConfig({ VITE_GAME_MODE: 'local' })).toEqual({ mode: 'local' })
  })

  it('retains an explicitly configured cloud service', () => {
    expect(readRuntimeConfig(cloud)).toEqual({
      mode: 'cloud',
      url: cloud.VITE_SUPABASE_URL,
      publishableKey: cloud.VITE_SUPABASE_PUBLISHABLE_KEY,
    })
    expect(
      readRuntimeConfig({ ...cloud, VITE_SUPABASE_URL: 'http://127.0.0.1:54321' }),
    ).toMatchObject({
      mode: 'cloud',
      url: 'http://127.0.0.1:54321',
    })
  })

  it.each([
    { VITE_SUPABASE_URL: undefined },
    { VITE_SUPABASE_URL: 42 },
    { VITE_SUPABASE_URL: '' },
    { VITE_SUPABASE_URL: 'https://' },
    { VITE_SUPABASE_URL: 'https://bad host' },
    { VITE_SUPABASE_URL: 'http://example.supabase.co' },
    { VITE_SUPABASE_URL: 'http://127.0.0.1:not-a-port' },
    { VITE_SUPABASE_URL: 'http://127.0.0.1.attacker.example:54321' },
    { VITE_SUPABASE_PUBLISHABLE_KEY: undefined },
    { VITE_SUPABASE_PUBLISHABLE_KEY: '' },
    { VITE_SUPABASE_PUBLISHABLE_KEY: '  ' },
    { VITE_SUPABASE_PUBLISHABLE_KEY: true },
  ])('rejects invalid cloud config instead of silently starting local play: %j', (invalid) => {
    expect(() => readRuntimeConfig({ ...cloud, ...invalid })).toThrow('Cloud mode requires')
  })

  it.each(['', 'auto', 'cluod', false])('rejects an unknown mode %s', (mode) => {
    expect(() => readRuntimeConfig({ ...cloud, VITE_GAME_MODE: mode })).toThrow('VITE_GAME_MODE')
  })
})
