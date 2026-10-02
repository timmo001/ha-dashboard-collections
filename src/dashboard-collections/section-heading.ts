import type { LocalizeFunc } from "./localize";
import type {
  CollectionSectionStrategyConfig,
  HeadingCardConfig,
  HomeAssistant,
} from "./types";

const FLOOR_ICON = "mdi:floor-plan";

/** The heading a section shows for its floor or area scope, if any. */
export const makeScopeHeading = (
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

/** The section's own heading when set, otherwise its scope heading. */
export const makeSectionHeading = (
  localize: LocalizeFunc,
  hass: HomeAssistant,
  config: CollectionSectionStrategyConfig,
): HeadingCardConfig | undefined =>
  config.heading
    ? { ...config.heading, type: "heading" }
    : makeScopeHeading(localize, hass, config);
