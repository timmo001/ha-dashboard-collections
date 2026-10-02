import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { applyMatch } from "./filters-editor";
import "./filters-editor";
import type {
  CollectionMatch,
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
        .value=${this._config}
        @value-changed=${this._matchChanged}
      ></dashboard-collections-filters-editor>
    `;
  }

  private _matchChanged = (ev: CustomEvent<{ value: CollectionMatch }>) => {
    if (!this._config) {
      return;
    }

    this._config = applyMatch(this._config, ev.detail.value);
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
