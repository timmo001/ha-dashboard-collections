import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  applyMatch,
  type CardEditorElement,
  loadHeadingCardEditor,
} from "./filters-editor";
import "./filters-editor";
import { setupLocalize } from "./localize";
import { makeScopeHeading } from "./section-heading";
import type {
  CollectionMatch,
  CollectionSectionStrategyConfig,
  HeadingCardConfig,
  HomeAssistant,
  SectionHeadingConfig,
} from "./types";

const HEADING_SCHEMA = [{ name: "show_heading", selector: { boolean: {} } }];

@customElement("dashboard-collections-section-editor")
export class DashboardCollectionsSectionEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: CollectionSectionStrategyConfig;

  @state() private _headingEditor?: CardEditorElement;

  public setConfig(config: CollectionSectionStrategyConfig) {
    this._config = config;
  }

  protected firstUpdated() {
    if (this.hass) {
      void loadHeadingCardEditor().then((editor) => {
        this._headingEditor = editor;
      });
    }
  }

  protected updated() {
    if (this._headingEditor && this._config?.heading) {
      this._headingEditor.hass = this.hass;
      this._headingEditor.setConfig({ ...this._config.heading, type: "heading" });
    }
  }

  protected render() {
    if (!this._config) {
      return nothing;
    }

    const localize = setupLocalize(this.hass);

    return html`
      <ha-expansion-panel outlined .header=${localize("editor.heading")}>
        <div class="heading">
          <ha-form
            .hass=${this.hass}
            .data=${{ show_heading: Boolean(this._config.heading) }}
            .schema=${HEADING_SCHEMA}
            .computeLabel=${() => localize("editor.show_heading")}
            .computeHelper=${() => localize("editor.show_heading_helper")}
            @value-changed=${this._showHeadingChanged}
          ></ha-form>
          ${this._config.heading
            ? html`<div @config-changed=${this._headingChanged}>
                ${this._headingEditor}
              </div>`
            : nothing}
        </div>
      </ha-expansion-panel>
      <dashboard-collections-filters-editor
        .hass=${this.hass}
        .value=${this._config}
        @value-changed=${this._matchChanged}
      ></dashboard-collections-filters-editor>
    `;
  }

  private _showHeadingChanged = (
    ev: CustomEvent<{ value: { show_heading?: boolean } }>,
  ) => {
    ev.stopPropagation();

    if (!this._config) {
      return;
    }

    if (!ev.detail.value.show_heading) {
      this._setHeading(undefined);

      return;
    }

    const localize = setupLocalize(this.hass);

    const scopeHeading =
      this.hass && makeScopeHeading(localize, this.hass, this._config);

    this._setHeading(
      scopeHeading
        ? toSectionHeading(scopeHeading)
        : { heading: localize("section.default_heading") },
    );
  };

  private _headingChanged = (ev: CustomEvent<{ config: HeadingCardConfig }>) => {
    // The heading editor's config is not the section config.
    ev.stopPropagation();
    this._setHeading(toSectionHeading(ev.detail.config));
  };

  private _setHeading(heading: SectionHeadingConfig | undefined) {
    if (!this._config) {
      return;
    }

    const config: CollectionSectionStrategyConfig = { ...this._config, heading };

    if (!heading) {
      delete config.heading;
    }

    this._emit(config);
  }

  private _matchChanged = (ev: CustomEvent<{ value: CollectionMatch }>) => {
    if (this._config) {
      this._emit(applyMatch(this._config, ev.detail.value));
    }
  };

  private _emit(config: CollectionSectionStrategyConfig) {
    this._config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    ha-expansion-panel {
      display: block;
      --expansion-panel-content-padding: 0;
    }

    .heading {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
    }
  `;
}

const toSectionHeading = ({
  type: _type,
  ...heading
}: HeadingCardConfig): SectionHeadingConfig => heading;

declare global {
  interface HTMLElementTagNameMap {
    "dashboard-collections-section-editor": DashboardCollectionsSectionEditor;
  }
}
