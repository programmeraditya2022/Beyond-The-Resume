import { useSyncExternalStore } from 'react'
import { getSnapshot, subscribe } from '../store/interviewStore.js'

export function useInterviewStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
