"use client"

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react"
import { en, type Translations } from "./en"
import { id } from "./id"

export type Locale = "en" | "id"

const STORAGE_KEY = "vestai-locale"
const DEFAULT_LOCALE: Locale = "en"

const translations: Record<Locale, Translations> = { en, id }

// Store eksternal kecil di atas localStorage. useSyncExternalStore membuat
// hydration aman (server memakai DEFAULT_LOCALE, klien re-render setelah mount)
// tanpa setState-dalam-effect yang memicu render berantai.
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getLocaleSnapshot(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === "en" || saved === "id" ? saved : DEFAULT_LOCALE
}

function getServerLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE
}

function setStoredLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale)
  listeners.forEach((listener) => listener())
}

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
  dateLocale: string
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: en,
  dateLocale: "en-US",
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getLocaleSnapshot, getServerLocaleSnapshot)

  useEffect(() => {
    document.documentElement.lang = locale === "id" ? "id" : "en"
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setStoredLocale(l)
  }, [])

  return (
    <LanguageContext.Provider value={{
      locale,
      setLocale,
      t: translations[locale],
      dateLocale: locale === "id" ? "id-ID" : "en-US",
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
