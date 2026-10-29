import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const INDIAN_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", flag: "🇮🇳" },
];

// 🛡️ Monkey-patch Node DOM mutation methods to prevent Google Translate from crashing React
export function setupGoogleTranslateDomProtection() {
  if (typeof window === "undefined" || typeof Node === "undefined" || !Node.prototype) return;

  const g = window as any;
  if (g.__bizora_dom_patched) return;
  g.__bizora_dom_patched = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        try {
          return child.parentNode.removeChild(child) as T;
        } catch (_) {}
      }
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        try {
          return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
        } catch (_) {}
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };

  const originalReplaceChild = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
    if (oldChild && oldChild.parentNode !== this) {
      if (oldChild.parentNode) {
        try {
          return oldChild.parentNode.replaceChild(newChild, oldChild) as T;
        } catch (_) {}
      }
      return oldChild;
    }
    return originalReplaceChild.apply(this, [newChild, oldChild]) as T;
  };
}

// Execute immediately upon module import
setupGoogleTranslateDomProtection();

interface LanguageContextType {
  currentLang: string;
  selectedLanguage: Language;
  setLanguage: (code: string) => void;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLang, setCurrentLang] = useState<string>("en");

  useEffect(() => {
    setupGoogleTranslateDomProtection();
    try {
      const saved = localStorage.getItem("bizora-lang");
      if (saved && INDIAN_LANGUAGES.some((l) => l.code === saved)) {
        setCurrentLang(saved);
        applyGoogleTranslate(saved);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const applyGoogleTranslate = (langCode: string) => {
    setupGoogleTranslateDomProtection();

    const val = langCode === "en" ? "" : `/en/${langCode}`;
    const domain = window.location.hostname;
    document.cookie = `googtrans=${val}; path=/; domain=${domain}`;
    document.cookie = `googtrans=${val}; path=/;`;

    if (langCode === "en") {
      const oldCookies = ["googtrans", "googtrans=/en/en"];
      oldCookies.forEach((c) => {
        document.cookie = `${c}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${c}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      });
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement;
      if (combo) {
        combo.value = "en";
        combo.dispatchEvent(new Event("change"));
      }
      return;
    }

    // Trigger google translate select element if initialized
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event("change"));
    } else {
      // Dynamically inject Google Translate script if not present
      if (!document.getElementById("google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);

        (window as any).googleTranslateElementInit = () => {
          new (window as any).google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,hi,mr,gu,ta,te,kn,ml,bn,pa,or,as",
              autoDisplay: false,
            },
            "google_translate_element",
          );

          const checkTimer = setInterval(() => {
            const injectedCombo = document.querySelector(".goog-te-combo") as HTMLSelectElement;
            if (injectedCombo) {
              clearInterval(checkTimer);
              injectedCombo.value = langCode;
              injectedCombo.dispatchEvent(new Event("change"));
            }
          }, 100);
          setTimeout(() => clearInterval(checkTimer), 5000);
        };
      }
    }
  };

  const setLanguage = (code: string) => {
    setCurrentLang(code);
    try {
      localStorage.setItem("bizora-lang", code);
    } catch (e) {}
    applyGoogleTranslate(code);
  };

  const selectedLanguage =
    INDIAN_LANGUAGES.find((l) => l.code === currentLang) || INDIAN_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        selectedLanguage,
        setLanguage,
        languages: INDIAN_LANGUAGES,
      }}
    >
      {children}
      <div id="google_translate_element" className="notranslate" style={{ display: "none" }} />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      currentLang: "en",
      selectedLanguage: INDIAN_LANGUAGES[0],
      setLanguage: (code: string) => {
        setupGoogleTranslateDomProtection();
        try {
          localStorage.setItem("bizora-lang", code);
        } catch (e) {}
        const val = code === "en" ? "" : `/en/${code}`;
        document.cookie = `googtrans=${val}; path=/;`;
        window.location.reload();
      },
      languages: INDIAN_LANGUAGES,
    };
  }
  return ctx;
}
