"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { en, type Translations } from "./en"
import { id } from "./id"

export type Locale = "en" | "id"

const STORAGE_KEY = "vestai-locale"
const DEFAULT_LOCALE: Locale = "en"

const translations: Record<Locale, Translations> = { en, id }

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
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved === "en" || saved === "id") {
      setLocaleState(saved)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === "id" ? "id" : "en"
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
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
