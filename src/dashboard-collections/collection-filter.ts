import type { CollectionFilter, HomeAssistant } from "./types";

export interface CollectionEntity {
  entityId: string;
  areaId?: string;
  floorId?: string;
}

const filterValues = (value: string | string[] | undefined) => {
  const values = value === undefined ? [] : [value].flat();

  return values.length > 0 ? values : undefined;
};

const matchesAny = (
  expected: string[] | undefined,
  actual: string | undefined,
) => !expected || (actual !== undefined && expected.includes(actual));

const matchesFilter = (
  hass: HomeAssistant,
  entity: CollectionEntity,
  filter: CollectionFilter,
) => {
  const domains = filterValues(filter.domain);
  const deviceClasses = filterValues(filter.device_class);
  const integrations = filterValues(filter.integration);
  const areas = filterValues(filter.area);
  const floors = filterValues(filter.floor);
  const labels = filterValues(filter.label);
  const nameTokens = filter.name?.toLowerCase().split(/\s+/).filter(Boolean);

  if (
    !domains &&
    !deviceClasses &&
    !integrations &&
    !areas &&
    !floors &&
    !labels &&
    !nameTokens?.length
  ) {
    return false;
  }

  const state = hass.states[entity.entityId];
  const registryEntry = hass.entities?.[entity.entityId];

  const searchText =
    `${state.attributes.friendly_name ?? ""} ${entity.entityId}`.toLowerCase();

  return (
    matchesAny(domains, entity.entityId.split(".")[0]) &&
    matchesAny(deviceClasses, state.attributes.device_class) &&
    matchesAny(integrations, registryEntry?.platform) &&
    matchesAny(areas, entity.areaId) &&
    matchesAny(floors, entity.floorId) &&
    (!labels ||
      labels.some((label) => registryEntry?.labels?.includes(label))) &&
    (nameTokens ?? []).every((token) => searchText.includes(token))
  );
};

const locateEntity = (
  hass: HomeAssistant,
  entityId: string,
): CollectionEntity => {
  const registryEntry = hass.entities?.[entityId];

  const deviceAreaId = registryEntry?.device_id
    ? hass.devices?.[registryEntry.device_id]?.area_id
    : undefined;

  const areaId = registryEntry?.area_id || deviceAreaId || undefined;

  return {
    entityId,
    areaId,
    floorId: areaId ? hass.areas?.[areaId]?.floor_id || undefined : undefined,
  };
};

/**
 * Visible entities matching any of the filters, sorted by name. Hidden,
 * configuration and diagnostic entities are left out.
 */
export const getCollectionEntities = (
  hass: HomeAssistant,
  filters: CollectionFilter[],
): CollectionEntity[] => {
  if (filters.length === 0) {
    return [];
  }

  return Object.keys(hass.states)
    .filter((entityId) => {
      const registryEntry = hass.entities?.[entityId];

      return !registryEntry?.hidden && !registryEntry?.entity_category;
    })
    .map((entityId) => locateEntity(hass, entityId))
    .filter((entity) =>
      filters.some((filter) => matchesFilter(hass, entity, filter)),
    )
    .sort((a, b) =>
      (hass.states[a.entityId].attributes.friendly_name ?? a.entityId).localeCompare(
        hass.states[b.entityId].attributes.friendly_name ?? b.entityId,
      ),
    );
};
