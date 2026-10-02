const en = {
  // Create-dashboard dialog default title (`getCreateSuggestions`)
  "dashboard.suggested_title": "Collections",

  // Placeholder view when no collections are configured
  "view.empty_title": "Collections",
  "view.empty_content":
    "No collections yet. Edit this dashboard to add one.",
};

export type TranslationKey = keyof typeof en;

export type LocalizeFunc = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

/**
 * Additional language tables can be added here. Each table only needs to
 * include the keys that differ from English; missing keys fall back to `en`.
 *
 * Example:
 *   const de: Partial<Record<TranslationKey, string>> = {
 *     "view.empty_title": "Sammlungen",
 *   };
 *   const languages: Record<string, Partial<Record<TranslationKey, string>>> = { de };
 */
const languages: Record<string, Partial<Record<TranslationKey, string>>> = {};

export const setupLocalize = (
  hass?: { locale?: { language?: string } },
): LocalizeFunc => {
  const lang = hass?.locale?.language || "en";
  const baseLang = lang.split("-")[0];

  return (key, params) => {
    let result =
      languages[lang]?.[key] ?? languages[baseLang]?.[key] ?? en[key];

    if (params) {
      for (const [param, value] of Object.entries(params)) {
        result = result.replace(`{${param}}`, String(value));
      }
    }

    return result;
  };
};
