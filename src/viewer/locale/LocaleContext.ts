import React from "react";

import { messages, type MessageKey } from "./messages.js";

export type Locale = "en" | "ja";

export const LOCALE_STORAGE_KEY = "doc-repo.locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export const isLocale = (value: unknown): value is Locale => value === "en" || value === "ja";

export const resolveNavigatorLocale = (language: string | undefined): Locale => {
  if (language?.toLowerCase() === "ja" || language?.toLowerCase().startsWith("ja-")) {
    return "ja";
  }
  return "en";
};

export const resolveInitialLocale = (): Locale => {
  if (typeof window !== "undefined") {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(storedLocale)) {
      return storedLocale;
    }
  }

  return "en";
};

export const translateMessage = (
  locale: Locale,
  key: MessageKey,
  catalog: Record<Locale, Partial<Record<MessageKey, string>>> = messages,
): string => {
  return catalog[locale][key] ?? catalog.en[key] ?? key;
};

const updateDocumentLang = (locale: Locale): void => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
};

export function LocaleProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [locale, setLocaleState] = React.useState<Locale>(() => resolveInitialLocale());

  React.useEffect(() => {
    updateDocumentLang(locale);
  }, [locale]);

  const setLocale = React.useCallback((nextLocale: Locale): void => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
    updateDocumentLang(nextLocale);
  }, []);

  const t = React.useCallback(
    (key: MessageKey): string => {
      return translateMessage(locale, key);
    },
    [locale],
  );

  const value = React.useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return React.createElement(LocaleContext.Provider, { value }, children);
}

export const useLocale = (): LocaleContextValue => {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider.");
  }
  return context;
};
