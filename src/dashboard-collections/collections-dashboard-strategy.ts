import { ReactiveElement } from "lit";
import { customElement } from "lit/decorators.js";
import { getCollectionEntities } from "./collection-filter";
import { type LocalizeFunc, setupLocalize } from "./localize";
import type {
  CollectionConfig,
  CollectionSectionStrategyConfig,
  CollectionsDashboardStrategyConfig,
  HomeAssistant,
  LovelaceDashboardConfig,
  LovelaceSectionConfig,
  LovelaceStrategySectionConfig,
  LovelaceViewConfig,
} from "./types";

const COLUMN_SPAN = 3;

const makeEmptySection = (content: string): LovelaceSectionConfig => ({
  type: "grid",
  column_span: COLUMN_SPAN,
  cards: [{ type: "markdown", content }],
});

/**
 * One section per floor with matching entities, then areas without a floor,
 * then entities without an area.
 */
const buildCollectionSections = (
  localize: LocalizeFunc,
  hass: HomeAssistant,
  collection: CollectionConfig,
): (LovelaceSectionConfig | LovelaceStrategySectionConfig)[] => {
  const filters = collection.filters ?? [];
  const entities = getCollectionEntities(hass, filters);

  if (entities.length === 0) {
    return [makeEmptySection(localize("section.empty"))];
  }

  const scopes: Pick<CollectionSectionStrategyConfig, "floor" | "area">[] =
    Object.values(hass.floors ?? {})
      .filter((floor) =>
        entities.some((entity) => entity.floorId === floor.floor_id),
      )
      .map((floor) => ({ floor: floor.floor_id }));

  if (entities.some((entity) => entity.areaId && !entity.floorId)) {
    scopes.push({ floor: null });
  }

  if (entities.some((entity) => !entity.areaId)) {
    scopes.push({ area: null });
  }

  return scopes.map((scope) => ({
    column_span: COLUMN_SPAN,
    strategy: { type: "custom:collection", filters, ...scope },
  }));
};

const makeViewPath = (title: string, index: number, usedPaths: Set<string>) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const path =
    slug && !usedPaths.has(slug) ? slug : `collection-${index + 1}`;

  usedPaths.add(path);

  return path;
};

@customElement("ll-strategy-dashboard-collections")
export class CollectionsDashboardStrategy extends ReactiveElement {
  public static async generate(
    config: CollectionsDashboardStrategyConfig,
    hass: HomeAssistant,
  ): Promise<LovelaceDashboardConfig> {
    const localize = setupLocalize(hass);
    const collections = config.collections ?? [];

    if (collections.length === 0) {
      return {
        views: [
          {
            type: "sections",
            title: localize("view.empty_title"),
            sections: [makeEmptySection(localize("view.empty_content"))],
          },
        ],
      };
    }

    const usedPaths = new Set<string>();

    return {
      views: collections.map(
        (collection, index): LovelaceViewConfig => ({
          type: "sections",
          title: collection.title,
          path: makeViewPath(collection.title, index, usedPaths),
          icon: collection.icon,
          max_columns: COLUMN_SPAN,
          sections: buildCollectionSections(localize, hass, collection),
        }),
      ),
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
