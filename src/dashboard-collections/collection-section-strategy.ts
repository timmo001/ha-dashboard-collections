import { ReactiveElement } from "lit";
import { customElement } from "lit/decorators.js";
import {
  type CollectionEntity,
  getCollectionEntities,
} from "./collection-filter";
import { type LocalizeFunc, setupLocalize } from "./localize";
import type {
  CollectionSectionStrategyConfig,
  HeadingCardConfig,
  HomeAssistant,
  LovelaceCardConfig,
  LovelaceSectionConfig,
} from "./types";

const FLOOR_ICON = "mdi:floor-plan";

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

const makeSectionHeading = (
  localize: LocalizeFunc,
  hass: HomeAssistant,
  config: CollectionSectionStrategyConfig,
): HeadingCardConfig | undefined => {
  if (config.area === null) {
    return { type: "heading", heading: localize("section.no_area") };
  }

  if (config.floor === undefined) {
    return undefined;
  }

  const areas = Object.values(hass.areas ?? {});

  const floorCount =
    Object.keys(hass.floors ?? {}).length +
    (areas.some((area) => !area.floor_id) ? 1 : 0);

  if (floorCount <= 1) {
    return { type: "heading", heading: localize("section.areas") };
  }

  const floor = config.floor ? hass.floors?.[config.floor] : undefined;

  if (!floor) {
    return { type: "heading", heading: localize("section.other_areas") };
  }

  return {
    type: "heading",
    heading: floor.name,
    icon: floor.icon || FLOOR_ICON,
  };
};

const makeTiles = (entities: CollectionEntity[]): LovelaceCardConfig[] =>
  entities.map((entity) => ({ type: "tile", entity: entity.entityId }));

@customElement("ll-strategy-section-collection")
export class CollectionSectionStrategy extends ReactiveElement {
  public static async generate(
    config: CollectionSectionStrategyConfig,
    hass: HomeAssistant,
  ): Promise<LovelaceSectionConfig> {
    const localize = setupLocalize(hass);

    const entities = getCollectionEntities(hass, config.filters ?? []).filter(
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
