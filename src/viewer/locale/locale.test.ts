// @vitest-environment jsdom

import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LocaleProvider,
  LOCALE_STORAGE_KEY,
  resolveInitialLocale,
  translateMessage,
  useLocale,
  type Locale,
} from "./index.js";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const setNavigatorLanguage = (language: string): void => {
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: language,
  });
};

function Probe(): React.JSX.Element {
  const { locale, setLocale, t } = useLocale();
  return React.createElement(
    "div",
    null,
    React.createElement("p", { "data-testid": "locale" }, locale),
    React.createElement("button", { type: "button", onClick: () => setLocale("ja") }, t("save")),
    React.createElement(
      "select",
      {
        value: locale,
        onChange: (event: React.ChangeEvent<HTMLSelectElement>) => setLocale(event.target.value as Locale),
      },
      React.createElement("option", { value: "en" }, "English"),
      React.createElement("option", { value: "ja" }, "日本語"),
    ),
  );
}

describe("locale", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    window.localStorage.clear();
    setNavigatorLanguage("en-US");
    document.documentElement.lang = "";
    container = document.createElement("div");
    document.body.append(container);
    root = null;
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it("selects English by default", () => {
    expect(resolveInitialLocale()).toBe("en");
  });

  it("selects English by default even when navigator.language is Japanese", () => {
    setNavigatorLanguage("ja-JP");
    expect(resolveInitialLocale()).toBe("en");
  });

  it("prefers localStorage over navigator.language", () => {
    setNavigatorLanguage("ja-JP");
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    expect(resolveInitialLocale()).toBe("en");
  });

  it("ignores invalid localStorage values without crashing", () => {
    setNavigatorLanguage("ja-JP");
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    expect(resolveInitialLocale()).toBe("en");
  });

  it("falls back to English when the selected locale has no message", () => {
    expect(
      translateMessage("ja", "save", {
        en: { save: "Save" },
        ja: {},
      }),
    ).toBe("Save");
  });

  it("updates text, localStorage, and html lang when the language changes", () => {
    act(() => {
      root = createRoot(container);
      root.render(React.createElement(LocaleProvider, null, React.createElement(Probe)));
    });

    const button = container.querySelector("button");
    const locale = container.querySelector('[data-testid="locale"]');
    expect(button?.textContent).toBe("Save");
    expect(locale?.textContent).toBe("en");
    expect(document.documentElement.lang).toBe("en");

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(button?.textContent).toBe("保存");
    expect(locale?.textContent).toBe("ja");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ja");
    expect(document.documentElement.lang).toBe("ja");
  });
});
