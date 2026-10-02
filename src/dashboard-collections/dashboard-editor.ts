import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { getCollectionEntities } from "./collection-filter";
import {
  editorItemGroupStyles,
  eventIndex,
  renderEditorItemRow,
} from "./editor-item-group";
import { applyMatch, MDI_DELETE_PATH, MDI_PLUS_PATH } from "./filters-editor";
import "./filters-editor";
import { type LocalizeFunc, setupLocalize } from "./localize";
import type {
  CollectionConfig,
  CollectionMatch,
  CollectionsDashboardStrategyConfig,
  HomeAssistant,
} from "./types";

const MDI_PENCIL_PATH =
  "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";

const MDI_ARROW_UP_PATH =
  "M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z";

const MDI_ARROW_DOWN_PATH =
  "M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z";

const DEFAULT_COLLECTION_ICON = "mdi:view-grid";

type DialogElement = HTMLElement & { width?: string };

interface CollectionFormSchema {
  name: "title" | "icon";
  required?: boolean;
  selector: { text: Record<string, never> } | { icon: Record<string, never> };
}

const COLLECTION_SCHEMA: CollectionFormSchema[] = [
  { name: "title", required: true, selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
];

@customElement("dashboard-collections-strategy-editor")
export class DashboardCollectionsStrategyEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: CollectionsDashboardStrategyConfig;

  @state() private _editingIndex?: number;

  private _dialog?: { element: DialogElement; width?: string };

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
          : collections.map((collection, index) =>
              this._renderCollectionRow(localize, collection, index, collections.length),
            )}
        <ha-button appearance="filled" size="s" @click=${this._addCollection}>
          <ha-svg-icon .path=${MDI_PLUS_PATH} slot="start"></ha-svg-icon>
          ${localize("editor.collection_add")}
        </ha-button>
      </div>
    `;
  }

  private _renderCollectionRow(
    localize: LocalizeFunc,
    collection: CollectionConfig,
    index: number,
    count: number,
  ) {
    return renderEditorItemRow({
      icon: html`<ha-icon icon=${collection.icon || DEFAULT_COLLECTION_ICON}></ha-icon>`,
      primary: collection.title,
      secondary: localize("editor.matching_entities", {
        count: this.hass
          ? getCollectionEntities(this.hass, collection).length
          : 0,
      }),
      actions: html`
        <ha-icon-button
          .label=${localize("editor.collection_move_up")}
          .path=${MDI_ARROW_UP_PATH}
          .disabled=${index === 0}
          data-index=${index}
          @click=${this._moveUp}
        ></ha-icon-button>
        <ha-icon-button
          .label=${localize("editor.collection_move_down")}
          .path=${MDI_ARROW_DOWN_PATH}
          .disabled=${index === count - 1}
          data-index=${index}
          @click=${this._moveDown}
        ></ha-icon-button>
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
          .data=${{ title: collection.title, icon: collection.icon }}
          .schema=${COLLECTION_SCHEMA}
          .computeLabel=${(item: CollectionFormSchema) =>
            localize(item.name === "title" ? "editor.collection_title" : "editor.collection_icon")}
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

  private _moveUp = (ev: Event) => {
    this._move(eventIndex(ev), -1);
  };

  private _moveDown = (ev: Event) => {
    this._move(eventIndex(ev), 1);
  };

  private _move(index: number, offset: -1 | 1) {
    const collections = [...(this._config?.collections ?? [])];
    const [moved] = collections.splice(index, 1);

    collections.splice(index + offset, 0, moved);
    this._updateCollections(collections);
  }

  private _collectionDetailsChanged = (
    ev: CustomEvent<{ value: Pick<CollectionConfig, "title" | "icon"> }>,
  ) => {
    ev.stopPropagation();

    const { title, icon } = ev.detail.value;

    this._updateEditingCollection((collection) => ({
      ...collection,
      title: title ?? "",
      icon: icon || undefined,
    }));
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
