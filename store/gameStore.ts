'use client'
import { create } from 'zustand'
import type { Player } from '@/lib/data/players'

export type Toto = '1' | 'X' | '2'

export interface Prediction {
  toto: Toto | null
  uitslag: string | null
  tokens: number | null
}

export type NedOpp = 'NED' | 'OPP'

export interface OranjeAnswer {
  q1: NedOpp | null
  q2: NedOpp | null
  q3: NedOpp | null
  q4: NedOpp | null
  q5: string | null
  q6: string | null
  q7: string | null
  q8: string | null
  q9: string | null
}

export interface KnockoutSlot {
  country: string | null
  tok: number
}

// p0–p10 = 11 regular, t0–t3 = 4 talents, k0–k19 = scratchpad
export const REGULAR_SLOTS = Array.from({ length: 11 }, (_, i) => `p${i}`)
export const TALENT_SLOTS = Array.from({ length: 4 }, (_, i) => `t${i}`)
export const ALL_SLOTS = [...REGULAR_SLOTS, ...TALENT_SLOTS]
export const SCRATCHPAD_SLOTS = Array.from({ length: 20 }, (_, i) => `k${i}`)

type PredictionsMap = Record<number, Prediction>
type OranjeMap = Record<number, OranjeAnswer>
export type KnockoutPicks = Record<string, KnockoutSlot>
export type FantasySquad = Record<string, Player | null>
export type Scratchpad = Record<string, Player | null>

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface GameState {
  onboardingOpen: boolean
  setOnboardingOpen: (v: boolean) => void

  saveStatus: SaveStatus
  setSaveStatus: (s: SaveStatus) => void
  predictions: PredictionsMap
  setPrediction: (matchId: number, pred: Partial<Prediction>) => void
  initPredictions: (preds: PredictionsMap) => void

  oranjeVoorspelling: OranjeMap
  setOranjeAnswer: (matchId: number, answer: Partial<OranjeAnswer>) => void
  initOranjeVoorspelling: (data: OranjeMap) => void

  knockoutPicks: KnockoutPicks
  setKnockoutSlot: (key: string, slot: Partial<KnockoutSlot>) => void
  clearKnockoutSlot: (key: string) => void
  initKnockoutPicks: (data: KnockoutPicks) => void

  fantasySquad: FantasySquad
  teamName: string
  activeInfoSlot: string | null
  setFantasyPlayer: (slotKey: string, player: Player | null) => void
  setTeamName: (name: string) => void
  setActiveInfoSlot: (slotKey: string | null) => void
  initFantasy: (squad: FantasySquad, teamName: string) => void

  scratchpad: Scratchpad
  setScratchpadPlayer: (key: string, player: Player | null) => void
  initScratchpad: (data: Scratchpad) => void
}

export const useGameStore = create<GameState>((set) => ({
  onboardingOpen: false,
  setOnboardingOpen: (v) => set({ onboardingOpen: v }),

  saveStatus: 'idle',
  setSaveStatus: (s) => set({ saveStatus: s }),

  predictions: {},
  setPrediction: (matchId, pred) =>
    set((s) => ({
      predictions: {
        ...s.predictions,
        [matchId]: Object.assign(
          { toto: null, uitslag: null, tokens: null },
          s.predictions[matchId],
          pred,
        ),
      },
    })),
  initPredictions: (preds) => set({ predictions: preds }),

  oranjeVoorspelling: {},
  setOranjeAnswer: (matchId, answer) =>
    set((s) => ({
      oranjeVoorspelling: {
        ...s.oranjeVoorspelling,
        [matchId]: Object.assign(
          { q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null, q8: null, q9: null },
          s.oranjeVoorspelling[matchId],
          answer,
        ),
      },
    })),
  initOranjeVoorspelling: (data) => set({ oranjeVoorspelling: data }),

  knockoutPicks: {},
  setKnockoutSlot: (key, slot) =>
    set((s) => ({
      knockoutPicks: {
        ...s.knockoutPicks,
        [key]: Object.assign({ country: null, tok: 2 }, s.knockoutPicks[key], slot),
      },
    })),
  clearKnockoutSlot: (key) =>
    set((s) => {
      const next = { ...s.knockoutPicks }
      delete next[key]
      return { knockoutPicks: next }
    }),
  initKnockoutPicks: (data) => set({ knockoutPicks: data }),

  fantasySquad: {},
  teamName: '',
  activeInfoSlot: null,
  setFantasyPlayer: (slotKey, player) =>
    set((s) => ({ fantasySquad: { ...s.fantasySquad, [slotKey]: player } })),
  setTeamName: (name) => set({ teamName: name }),
  setActiveInfoSlot: (slotKey) =>
    set((s) => ({ activeInfoSlot: s.activeInfoSlot === slotKey ? null : slotKey })),
  initFantasy: (squad, teamName) => set({ fantasySquad: squad, teamName }),

  scratchpad: {},
  setScratchpadPlayer: (key, player) =>
    set((s) => ({ scratchpad: { ...s.scratchpad, [key]: player } })),
  initScratchpad: (data) => set({ scratchpad: data }),
}))
