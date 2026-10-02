const en = {
  // Create-dashboard dialog default title (`getCreateSuggestions`)
  "dashboard.suggested_title": "Collections",

  // Placeholder view when no collections are configured
  "view.empty_title": "Collections",
  "view.empty_content":
    "No collections yet. Edit this dashboard to add one.",

  // Collection sections
  "section.areas": "Areas",
  "section.other_areas": "Other areas",
  "section.no_area": "No area",
  "section.empty": "No entities match this collection.",

  // Editors
  "editor.back": "Back",
  "editor.no_collections": "No collections yet.",
  "editor.new_collection": "New collection",
  "editor.collection_add": "Add collection",
  "editor.collection_edit": "Edit collection",
  "editor.collection_remove": "Remove collection",
  "editor.collection_move_up": "Move up",
  "editor.collection_move_down": "Move down",
  "editor.collection_title": "Title",
  "editor.collection_icon": "Icon",
  "editor.collection_show_icon_and_title": "Show icon and title",
  "editor.collection_show_icon_and_title_helper": "Show both icon and text title.",
  "editor.collection_path": "URL",
  "editor.collection_path_helper":
    "This value will become part of the URL path to open this view. Leave empty to use the title.",
  "editor.collection_path_invalid":
    "Use only letters, numbers, hyphens and underscores, and not only numbers.",
  "editor.filters_helper":
    "An entity is shown when it matches any filter. Within a filter, every field you set must match.",
  "editor.filter_title": "Filter {number}",
  "editor.filter_add": "Add filter",
  "editor.filter_remove": "Remove filter",
  "editor.filter_domain": "Domains",
  "editor.filter_device_class": "Device classes",
  "editor.filter_integration": "Integrations",
  "editor.filter_area": "Areas",
  "editor.filter_floor": "Floors",
  "editor.filter_label": "Labels",
  "editor.filter_name": "Name contains",
  "editor.matching_entities": "Matching entities: {count}",
  "editor.include_diagnostic": "Include diagnostic and configuration entities",
  "editor.include_diagnostic_helper":
    "Many integrations mark battery and signal sensors as diagnostic.",
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
