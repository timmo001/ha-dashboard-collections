import { ReactiveElement } from "lit";
import { customElement } from "lit/decorators.js";
import type {
  CollectionSectionStrategyConfig,
  HomeAssistant,
  LovelaceSectionConfig,
} from "./types";

@customElement("ll-strategy-section-collection")
export class CollectionSectionStrategy extends ReactiveElement {
  public static async generate(
    _config: CollectionSectionStrategyConfig,
    _hass: HomeAssistant,
  ): Promise<LovelaceSectionConfig> {
    return { type: "grid", cards: [] };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ll-strategy-section-collection": CollectionSectionStrategy;
  }
}
