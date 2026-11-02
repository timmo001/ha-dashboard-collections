import { CollectionSectionStrategy } from "./collection-section-strategy";
import type {
  CollectionCardConfig,
  HomeAssistant,
  LovelaceCardConfig,
} from "./types";

interface GridCardConfig {
  type: "grid";
  columns: number;
  square: boolean;
  cards: LovelaceCardConfig[];
}

interface LovelaceCardElement extends HTMLElement {
  hass?: HomeAssistant;
}

/**
 * The section's cards as built-in cards, so the collection renders anywhere a
 * card can: headings in a vertical stack, with each run of tiles in a two
 * column grid, as a sections view lays them out.
 */
const makeStack = (cards: LovelaceCardConfig[]) => {
  const stack: (LovelaceCardConfig | GridCardConfig)[] = [];
  let tiles: LovelaceCardConfig[] = [];

  const flushTiles = () => {
    if (tiles.length > 0) {
      stack.push({ type: "grid", columns: 2, square: false, cards: tiles });
      tiles = [];
    }
  };

  for (const card of cards) {
    if (card.type === "tile") {
      tiles.push(card);
    } else {
      flushTiles();
      stack.push(card);
    }
  }

  flushTiles();

  return { type: "vertical-stack", cards: stack };
};

/** A collection section as a card, for views that aren't sections views. */
export class CollectionCard extends HTMLElement {
  private _config?: CollectionCardConfig;
  private _hass?: HomeAssistant;
  private _card?: LovelaceCardElement;
  private _cardKey?: string;
  private _cardCount = 1;

  public static getStubConfig(hass: HomeAssistant): CollectionCardConfig {
    const stub = CollectionSectionStrategy.getStubConfig(hass);

    return { ...stub, type: "custom:dashboard-collections-card" };
  }

  public setConfig(config: CollectionCardConfig) {
    this._config = config;
    void this._update();
  }

  public set hass(hass: HomeAssistant) {
    this._hass = hass;
    void this._update();
  }

  public getCardSize() {
    return this._cardCount;
  }

  public getGridOptions() {
    return { columns: "full" };
  }

  private async _update() {
    const config = this._config;
    const hass = this._hass;

    if (!config || !hass) {
      return;
    }

    const section = await CollectionSectionStrategy.generate(
      { ...config, type: "custom:collection" },
      hass,
    );

    if (config !== this._config || hass !== this._hass) {
      return;
    }

    const cards = section.cards ?? [];
    const stack = makeStack(cards);
    const key = JSON.stringify(stack);

    if (key !== this._cardKey) {
      const helpers = await window.loadCardHelpers?.();

      if (!helpers || config !== this._config || hass !== this._hass) {
        return;
      }

      this._cardKey = key;
      this._cardCount = cards.length;
      this._card = helpers.createCardElement(stack);
      this.replaceChildren(this._card);
    }

    if (this._card) {
      this._card.hass = hass;
    }
  }
}

customElements.define("dashboard-collections-card", CollectionCard);

declare global {
  interface HTMLElementTagNameMap {
    "dashboard-collections-card": CollectionCard;
  }
}
