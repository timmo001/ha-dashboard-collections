import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { getCollectionEntities } from "./collection-filter";
import {
  editorItemGroupStyles,
  eventIndex,
  renderEditorItemRow,
} from "./editor-item-group";
import { applyMatch, MDI_DELETE_PATH, MDI_PLUS_PATH } from "./filters-editor";
import "./filters-editor";
import { type LocalizeFunc, setupLocalize, type TranslationKey } from "./localize";
import type {
  CollectionConfig,
  CollectionMatch,
  CollectionsDashboardStrategyConfig,
  HomeAssistant,
} from "./types";

const MDI_PENCIL_PATH =
  "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";

const MDI_DRAG_PATH = "M21,11H3V9H21V11M21,13H3V15H21V13Z";

const DEFAULT_COLLECTION_ICON = "mdi:view-grid";

type DialogElement = HTMLElement & { width?: string };

type CollectionDetails = Pick<
  CollectionConfig,
  "title" | "icon" | "show_icon_and_title" | "path"
>;

type CollectionFormSchema =
  | { name: "title"; required: true; selector: { text: Record<string, never> } }
  | { name: "icon"; selector: { icon: Record<string, never> } }
  | { name: "show_icon_and_title"; selector: { boolean: Record<string, never> } }
  | { name: "path"; selector: { text: Record<string, never> } };

const COLLECTION_SCHEMA: CollectionFormSchema[] = [
  { name: "title", required: true, selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "show_icon_and_title", selector: { boolean: {} } },
  { name: "path", selector: { text: {} } },
];

const LABEL_KEYS: Record<CollectionFormSchema["name"], TranslationKey> = {
  title: "editor.collection_title",
  icon: "editor.collection_icon",
  show_icon_and_title: "editor.collection_show_icon_and_title",
  path: "editor.collection_path",
};

const HELPER_KEYS: Partial<Record<CollectionFormSchema["name"], TranslationKey>> = {
  show_icon_and_title: "editor.collection_show_icon_and_title_helper",
  path: "editor.collection_path_helper",
};

const VALID_PATH = /^[a-zA-Z0-9_-]+$/;

const INTEGER = /^[0-9]+$/;

/** Same rules as Home Assistant's view editor. Numbers are view indexes. */
export const isValidViewPath = (path: string) =>
  VALID_PATH.test(path) && !INTEGER.test(path);

@customElement("dashboard-collections-strategy-editor")
export class DashboardCollectionsStrategyEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: CollectionsDashboardStrategyConfig;

  @state() private _editingIndex?: number;

  private _dialog?: { element: DialogElement; width?: string };

  private _collectionKeys = new WeakMap<CollectionConfig, string>();

  private _nextCollectionKey = 0;

  public setConfig(config: CollectionsDashboardStrategyConfig) {
    this._config = config;
  }

  connectedCallback() {
    super.connectedCallback();

    // The collection editor needs room for its forms, so widen the dialog.
    let node: Node | null = this.parentNode;

    while (node && !(node instanceof HTMLElement && node.localName === "ha-dialog")) {
      node = node.parentNode ?? (node instanceof ShadowRoot ? node.host : null);
    }

    if (node instanceof HTMLElement) {
      const element: DialogElement = node;

      this._dialog = { element, width: element.width };
      element.width = "medium";
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this._dialog) {
      this._dialog.element.width = this._dialog.width;
      this._dialog = undefined;
    }
  }

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    const localize = setupLocalize(this.hass);
    const collections = this._config.collections ?? [];

    const editing =
      this._editingIndex === undefined ? undefined : collections[this._editingIndex];

    if (editing) {
      return this._renderCollectionEditor(localize, editing);
    }

    return html`
      <div class="items">
        ${collections.length === 0
          ? html`<p class="secondary">${localize("editor.no_collections")}</p>`
          : html`
              <ha-sortable handle-selector=".handle" @item-moved=${this._collectionMoved}>
                <div class="rows">
                  ${repeat(
                    collections,
                    (collection) => this._collectionKey(collection),
                    (collection, index) =>
                      this._renderCollectionRow(localize, collection, index),
                  )}
                </div>
              </ha-sortable>
            `}
        <ha-button appearance="filled" size="s" @click=${this._addCollection}>
          <ha-svg-icon .path=${MDI_PLUS_PATH} slot="start"></ha-svg-icon>
          ${localize("editor.collection_add")}
        </ha-button>
      </div>
    `;
  }

  /** Stable keys so rows keep their DOM when dragged. */
  private _collectionKey(collection: CollectionConfig) {
    let key = this._collectionKeys.get(collection);

    if (!key) {
      key = String(this._nextCollectionKey++);
      this._collectionKeys.set(collection, key);
    }

    return key;
  }

  private _renderCollectionRow(
    localize: LocalizeFunc,
    collection: CollectionConfig,
    index: number,
  ) {
    return renderEditorItemRow({
      icon: html`
        <div class="handle">
          <ha-svg-icon .path=${MDI_DRAG_PATH}></ha-svg-icon>
        </div>
        <ha-icon icon=${collection.icon || DEFAULT_COLLECTION_ICON}></ha-icon>
      `,
      primary: collection.title,
      secondary: localize("editor.matching_entities", {
        count: this.hass
          ? getCollectionEntities(this.hass, collection).length
          : 0,
      }),
      actions: html`
        <ha-icon-button
          .label=${localize("editor.collection_edit")}
          .path=${MDI_PENCIL_PATH}
          data-index=${index}
          @click=${this._editCollection}
        ></ha-icon-button>
        <ha-icon-button
          .label=${localize("editor.collection_remove")}
          .path=${MDI_DELETE_PATH}
          data-index=${index}
          @click=${this._removeCollection}
        ></ha-icon-button>
      `,
    });
  }

  private _renderCollectionEditor(localize: LocalizeFunc, collection: CollectionConfig) {
    return html`
      <div class="sub-editor-header">
        <ha-icon-button-prev
          .label=${localize("editor.back")}
          @click=${this._closeCollectionEditor}
        ></ha-icon-button-prev>
        <span>${localize("editor.collection_edit")}</span>
      </div>
      <div class="sub-editor-content">
        <ha-form
          .hass=${this.hass}
          .data=${{
            title: collection.title,
            icon: collection.icon,
            show_icon_and_title: collection.show_icon_and_title ?? false,
            path: collection.path,
          }}
          .schema=${COLLECTION_SCHEMA}
          .error=${collection.path && !isValidViewPath(collection.path)
            ? { path: localize("editor.collection_path_invalid") }
            : undefined}
          .computeLabel=${(item: CollectionFormSchema) => localize(LABEL_KEYS[item.name])}
          .computeHelper=${(item: CollectionFormSchema) => {
            const key = HELPER_KEYS[item.name];

            return key ? localize(key) : undefined;
          }}
          .computeError=${(error: string) => error}
          @value-changed=${this._collectionDetailsChanged}
        ></ha-form>
        <dashboard-collections-filters-editor
          .hass=${this.hass}
          .value=${collection}
          @value-changed=${this._collectionMatchChanged}
        ></dashboard-collections-filters-editor>
      </div>
    `;
  }

  private _addCollection = () => {
    const collections = this._config?.collections ?? [];

    this._updateCollections([
      ...collections,
      { title: setupLocalize(this.hass)("editor.new_collection"), filters: [] },
    ]);
    this._editingIndex = collections.length;
  };

  private _editCollection = (ev: Event) => {
    this._editingIndex = eventIndex(ev);
  };

  private _closeCollectionEditor = () => {
    this._editingIndex = undefined;
  };

  private _removeCollection = (ev: Event) => {
    const index = eventIndex(ev);

    this._updateCollections(
      (this._config?.collections ?? []).filter(
        (_collection, collectionIndex) => collectionIndex !== index,
      ),
    );
  };

  private _collectionMoved = (
    ev: CustomEvent<{ oldIndex: number; newIndex: number }>,
  ) => {
    ev.stopPropagation();

    const { oldIndex, newIndex } = ev.detail;
    const collections = [...(this._config?.collections ?? [])];
    const [moved] = collections.splice(oldIndex, 1);

    collections.splice(newIndex, 0, moved);
    this._updateCollections(collections);
  };

  private _collectionDetailsChanged = (ev: CustomEvent<{ value: CollectionDetails }>) => {
    ev.stopPropagation();

    const { title, icon, show_icon_and_title, path } = ev.detail.value;

    this._updateEditingCollection((collection) => {
      const updated: CollectionConfig = { ...collection, title: title ?? "" };

      delete updated.icon;
      delete updated.show_icon_and_title;
      delete updated.path;

      if (icon) {
        updated.icon = icon;
      }

      if (show_icon_and_title) {
        updated.show_icon_and_title = true;
      }

      if (path?.trim()) {
        updated.path = path.trim();
      }

      return updated;
    });
  };

  private _collectionMatchChanged = (ev: CustomEvent<{ value: CollectionMatch }>) => {
    this._updateEditingCollection((collection) =>
      applyMatch(collection, ev.detail.value),
    );
  };

  private _updateEditingCollection(
    update: (collection: CollectionConfig) => CollectionConfig,
  ) {
    const index = this._editingIndex;

    if (index === undefined) {
      return;
    }

    this._updateCollections(
      (this._config?.collections ?? []).map((collection, collectionIndex) =>
        collectionIndex === index ? update(collection) : collection,
      ),
    );
  }

  private _updateCollections(collections: CollectionConfig[]) {
    if (!this._config) {
      return;
    }

    this._config = { ...this._config, collections };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  static styles = [
    editorItemGroupStyles,
    css`
      ha-sortable {
        display: block;
      }

      .rows {
        display: flex;
        flex-direction: column;
      }

      .handle {
        display: flex;
        cursor: move; /* fallback if grab cursor is unsupported */
        cursor: grab;
        color: var(--secondary-text-color);
      }

      .handle > * {
        pointer-events: none;
      }

      .secondary {
        color: var(--secondary-text-color);
        font-size: 0.9rem;
      }

      .sub-editor-header {
        display: flex;
        align-items: center;
        font-size: 1.125rem;
      }

      .sub-editor-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding: 12px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "dashboard-collections-strategy-editor": DashboardCollectionsStrategyEditor;
  }
}
