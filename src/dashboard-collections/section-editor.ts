import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./filters-editor";
import type {
  CollectionFilter,
  CollectionSectionStrategyConfig,
  HomeAssistant,
} from "./types";

@customElement("dashboard-collections-section-editor")
export class DashboardCollectionsSectionEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: CollectionSectionStrategyConfig;

  public setConfig(config: CollectionSectionStrategyConfig) {
    this._config = config;
  }

  protected render() {
    if (!this._config) {
      return nothing;
    }

    return html`
      <dashboard-collections-filters-editor
        .hass=${this.hass}
        .filters=${this._config.filters ?? []}
        @value-changed=${this._filtersChanged}
      ></dashboard-collections-filters-editor>
    `;
  }

  private _filtersChanged = (ev: CustomEvent<{ value: CollectionFilter[] }>) => {
    if (!this._config) {
      return;
    }

    this._config = { ...this._config, filters: ev.detail.value };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "dashboard-collections-section-editor": DashboardCollectionsSectionEditor;
  }
}
