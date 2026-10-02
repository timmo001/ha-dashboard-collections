import { ReactiveElement } from "lit";
import { customElement } from "lit/decorators.js";
import { setupLocalize } from "./localize";
import type {
  CollectionConfig,
  CollectionsDashboardStrategyConfig,
  HomeAssistant,
  LovelaceDashboardConfig,
  LovelaceViewConfig,
} from "./types";

const buildCollectionView = (
  collection: CollectionConfig,
  index: number,
): LovelaceViewConfig => ({
  type: "sections",
  title: collection.title,
  path: `collection-${index}`,
  icon: collection.icon,
  max_columns: 2,
  sections: [{ strategy: { type: "custom:collection" } }],
});

@customElement("ll-strategy-dashboard-collections")
export class CollectionsDashboardStrategy extends ReactiveElement {
  public static async generate(
    config: CollectionsDashboardStrategyConfig,
    hass: HomeAssistant,
  ): Promise<LovelaceDashboardConfig> {
    const collections = config.collections ?? [];

    if (collections.length > 0) {
      return { views: collections.map(buildCollectionView) };
    }

    const localize = setupLocalize(hass);

    return {
      views: [
        {
          type: "sections",
          title: localize("view.empty_title"),
          sections: [
            {
              type: "grid",
              cards: [
                {
                  type: "markdown",
                  content: localize("view.empty_content"),
                },
              ],
            },
          ],
        },
      ],
    };
  }

  /**
   * Suggested title/icon when adding a dashboard from the Home Assistant UI
   * (`loadDashboardStrategyWithCreateSuggestions` in the frontend).
   */
  public static getCreateSuggestions(hass: HomeAssistant) {
    const localize = setupLocalize(hass);

    return {
      title: localize("dashboard.suggested_title"),
      icon: "mdi:view-grid-plus",
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ll-strategy-dashboard-collections": CollectionsDashboardStrategy;
  }
}
