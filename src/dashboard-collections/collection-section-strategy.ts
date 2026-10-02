import { ReactiveElement } from "lit";
import { customElement } from "lit/decorators.js";
import {
  type CollectionEntity,
  getCollectionEntities,
} from "./collection-filter";
import { loadEditorElements } from "./filters-editor";
import { setupLocalize } from "./localize";
import "./section-editor";
import { makeSectionHeading } from "./section-heading";
import type {
  CollectionSectionStrategyConfig,
  HomeAssistant,
  LovelaceCardConfig,
  LovelaceSectionConfig,
} from "./types";

const isInScope = (
  config: CollectionSectionStrategyConfig,
  entity: CollectionEntity,
) => {
  if (config.area === null) {
    return !entity.areaId;
  }

  if (config.floor === null) {
    return Boolean(entity.areaId) && !entity.floorId;
  }

  if (config.floor !== undefined) {
    return entity.floorId === config.floor;
  }

  return true;
};

const makeTiles = (entities: CollectionEntity[]): LovelaceCardConfig[] =>
  entities.map((entity) => ({ type: "tile", entity: entity.entityId }));

@customElement("ll-strategy-section-collection")
export class CollectionSectionStrategy extends ReactiveElement {
  public static async getConfigElement() {
    await loadEditorElements();

    return document.createElement("dashboard-collections-section-editor");
  }

  public static async generate(
    config: CollectionSectionStrategyConfig,
    hass: HomeAssistant,
  ): Promise<LovelaceSectionConfig> {
    const localize = setupLocalize(hass);

    const entities = getCollectionEntities(hass, config).filter(
      (entity) => isInScope(config, entity),
    );

    const isScoped = config.floor !== undefined || config.area === null;

    if (entities.length === 0) {
      return {
        type: "grid",
        disabled: isScoped,
        cards: [{ type: "markdown", content: localize("section.empty") }],
      };
    }

    const cards: LovelaceCardConfig[] = [];
    const heading = makeSectionHeading(localize, hass, config);

    if (heading) {
      cards.push(heading);
    }

    if (config.area === null) {
      cards.push(...makeTiles(entities));

      return { type: "grid", cards };
    }

    for (const area of Object.values(hass.areas ?? {})) {
      const areaEntities = entities.filter(
        (entity) => entity.areaId === area.area_id,
      );

      if (areaEntities.length > 0) {
        cards.push(
          { type: "heading", heading: area.name, heading_style: "subtitle" },
          ...makeTiles(areaEntities),
        );
      }
    }

    const noAreaEntities = entities.filter((entity) => !entity.areaId);

    if (noAreaEntities.length > 0) {
      cards.push(
        {
          type: "heading",
          heading: localize("section.no_area"),
          heading_style: "subtitle",
        },
        ...makeTiles(noAreaEntities),
      );
    }

    return { type: "grid", cards };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ll-strategy-section-collection": CollectionSectionStrategy;
  }
}
