import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { getCollectionEntities } from "./collection-filter";
import { eventIndex } from "./editor-item-group";
import { setupLocalize, type TranslationKey } from "./localize";
import type {
  CollectionFilter,
  CollectionMatch,
  HeadingCardConfig,
  HomeAssistant,
} from "./types";

export const MDI_DELETE_PATH =
  "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";

export const MDI_PLUS_PATH = "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z";

type FilterListKey = Exclude<keyof CollectionFilter, "name">;

type FilterSelector =
  | {
      select: {
        multiple: true;
        custom_value: true;
        mode: "dropdown";
        sort: true;
        options: string[];
      };
    }
  | { area: { multiple: true } }
  | { floor: { multiple: true } }
  | { label: { multiple: true } }
  | { text: Record<string, never> };

interface FilterFormSchema {
  name: keyof CollectionFilter;
  selector: FilterSelector;
}

const LABEL_KEYS: Record<keyof CollectionFilter, TranslationKey> = {
  domain: "editor.filter_domain",
  device_class: "editor.filter_device_class",
  integration: "editor.filter_integration",
  area: "editor.filter_area",
  floor: "editor.filter_floor",
  label: "editor.filter_label",
  name: "editor.filter_name",
};

const LIST_KEYS: FilterListKey[] = [
  "domain",
  "device_class",
  "integration",
  "area",
  "floor",
  "label",
];

const OPTIONS_SCHEMA = [
  { name: "include_diagnostic", selector: { boolean: {} } },
];

const uniqueSorted = (values: (string | undefined)[]) =>
  [...new Set(values.filter((value): value is string => Boolean(value)))].sort();

const selectSelector = (options: string[]): FilterSelector => ({
  select: {
    multiple: true,
    custom_value: true,
    mode: "dropdown",
    sort: true,
    options,
  },
});

/** Lists in the form, so single values written in YAML still show. */
const toFormData = (filter: CollectionFilter): CollectionFilter => {
  const data: CollectionFilter = { ...filter };

  for (const key of LIST_KEYS) {
    const value = filter[key];

    if (value !== undefined) {
      data[key] = [value].flat();
    }
  }

  return data;
};

const cleanFilter = (filter: CollectionFilter): CollectionFilter => {
  const cleaned: CollectionFilter = {};

  for (const key of LIST_KEYS) {
    const values = [filter[key] ?? []].flat();

    if (values.length > 0) {
      cleaned[key] = values;
    }
  }

  if (filter.name?.trim()) {
    cleaned.name = filter.name;
  }

  return cleaned;
};

export interface CardEditorElement extends HTMLElement {
  hass?: HomeAssistant;
  setConfig: (config: HeadingCardConfig) => void;
}

interface CardConstructor {
  getConfigElement?: () => Promise<CardEditorElement>;
}

const loadCardConstructor = async (
  type: string,
): Promise<CardConstructor | undefined> => {
  if (!window.loadCardHelpers) {
    return undefined;
  }

  const helpers = await window.loadCardHelpers();

  return helpers.createCardElement({ type }).constructor;
};

/**
 * Home Assistant loads `ha-form`, `ha-sortable` and the selectors on demand.
 * Loading the tile card editor pulls them in when the strategy editor opens
 * before anything else has.
 */
export const loadEditorElements = async () => {
  if (customElements.get("ha-form") && customElements.get("ha-sortable")) {
    return;
  }

  const tileCard = await loadCardConstructor("tile");

  await tileCard?.getConfigElement?.();
};

/** Home Assistant's heading card editor. */
export const loadHeadingCardEditor = async () => {
  const headingCard = await loadCardConstructor("heading");

  return headingCard?.getConfigElement?.();
};

/** Applies an edited `CollectionMatch` to a collection or section config. */
export const applyMatch = <T extends CollectionMatch>(
  config: T,
  match: CollectionMatch,
): T => {
  const updated: T = { ...config, ...match };

  if (!match.include_diagnostic) {
    delete updated.include_diagnostic;
  }

  return updated;
};

/**
 * Edits a collection's filters and whether diagnostic entities are included.
 * Shared by the dashboard editor and the section strategy editor. Fires
 * `value-changed` with the new `CollectionMatch`.
 */
@customElement("dashboard-collections-filters-editor")
export class DashboardCollectionsFiltersEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ attribute: false }) public value: CollectionMatch = {};

  protected render() {
    if (!this.hass) {
      return nothing;
    }

    const localize = setupLocalize(this.hass);
    const schema = this._schema(this.hass);
    const matchCount = getCollectionEntities(this.hass, this.value).length;

    return html`
      <p class="helper">${localize("editor.filters_helper")}</p>
      ${this._filters.map(
        (filter, index) => html`
          <ha-expansion-panel
            outlined
            expanded
            .header=${localize("editor.filter_title", { number: index + 1 })}
          >
            <div class="filter">
              <ha-form
                .hass=${this.hass}
                .data=${toFormData(filter)}
                .schema=${schema}
                .computeLabel=${(item: FilterFormSchema) =>
                  localize(LABEL_KEYS[item.name])}
                data-index=${index}
                @value-changed=${this._filterChanged}
              ></ha-form>
              <ha-button
                appearance="plain"
                variant="danger"
                size="s"
                data-index=${index}
                @click=${this._removeFilter}
              >
                <ha-svg-icon .path=${MDI_DELETE_PATH} slot="start"></ha-svg-icon>
                ${localize("editor.filter_remove")}
              </ha-button>
            </div>
          </ha-expansion-panel>
        `,
      )}
      <div class="footer">
        <ha-button appearance="filled" size="s" @click=${this._addFilter}>
          <ha-svg-icon .path=${MDI_PLUS_PATH} slot="start"></ha-svg-icon>
          ${localize("editor.filter_add")}
        </ha-button>
        <span class="helper">
          ${localize("editor.matching_entities", { count: matchCount })}
        </span>
      </div>
      <ha-form
        .hass=${this.hass}
        .data=${{ include_diagnostic: this.value.include_diagnostic ?? false }}
        .schema=${OPTIONS_SCHEMA}
        .computeLabel=${() => localize("editor.include_diagnostic")}
        .computeHelper=${() => localize("editor.include_diagnostic_helper")}
        @value-changed=${this._optionsChanged}
      ></ha-form>
    `;
  }

  private get _filters() {
    return this.value.filters ?? [];
  }

  private _schema(hass: HomeAssistant): FilterFormSchema[] {
    const states = Object.values(hass.states);

    return [
      {
        name: "domain",
        selector: selectSelector(
          uniqueSorted(states.map((state) => state.entity_id.split(".")[0])),
        ),
      },
      {
        name: "device_class",
        selector: selectSelector(
          uniqueSorted(states.map((state) => state.attributes.device_class)),
        ),
      },
      {
        name: "integration",
        selector: selectSelector(
          uniqueSorted(
            Object.values(hass.entities ?? {}).map((entry) => entry.platform),
          ),
        ),
      },
      { name: "area", selector: { area: { multiple: true } } },
      { name: "floor", selector: { floor: { multiple: true } } },
      { name: "label", selector: { label: { multiple: true } } },
      { name: "name", selector: { text: {} } },
    ];
  }

  private _filterChanged = (ev: CustomEvent<{ value: CollectionFilter }>) => {
    ev.stopPropagation();

    const index = eventIndex(ev);

    this._emit({
      filters: this._filters.map((filter, filterIndex) =>
        filterIndex === index ? cleanFilter(ev.detail.value) : filter,
      ),
    });
  };

  private _addFilter = () => {
    this._emit({ filters: [...this._filters, {}] });
  };

  private _removeFilter = (ev: Event) => {
    const index = eventIndex(ev);

    this._emit({
      filters: this._filters.filter((_filter, filterIndex) => filterIndex !== index),
    });
  };

  private _optionsChanged = (
    ev: CustomEvent<{ value: { include_diagnostic?: boolean } }>,
  ) => {
    ev.stopPropagation();
    this._emit({ include_diagnostic: ev.detail.value.include_diagnostic || undefined });
  };

  private _emit(updates: CollectionMatch) {
    const value: CollectionMatch = { ...this.value, ...updates };

    if (!value.include_diagnostic) {
      delete value.include_diagnostic;
    }

    this.dispatchEvent(new CustomEvent("value-changed", { detail: { value } }));
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .helper {
      margin: 0;
      color: var(--secondary-text-color);
      font-size: 0.9rem;
    }

    ha-expansion-panel {
      display: block;
      --expansion-panel-content-padding: 0;
    }

    .filter {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
    }

    .filter ha-form {
      align-self: stretch;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
  `;
}

declare global {
  interface Window {
    loadCardHelpers?: () => Promise<{
      createCardElement: (config: { type: string }) => HTMLElement & {
        constructor: CardConstructor;
      };
    }>;
  }

  interface HTMLElementTagNameMap {
    "dashboard-collections-filters-editor": DashboardCollectionsFiltersEditor;
  }
}
