export interface HassEntity {
  entity_id: string;
  last_changed?: string;
  last_updated?: string;
  state: string;
  attributes: {
    device_class?: string;
    friendly_name?: string;
    unit_of_measurement?: string;
  };
}

export interface EntityRegistryEntry {
  entity_id: string;
  device_id: string | null;
  area_id?: string | null;
  hidden?: boolean;
  name?: string | null;
}

export interface DeviceRegistryEntry {
  id: string;
  area_id?: string | null;
  name_by_user?: string | null;
  name?: string | null;
}

export interface AreaRegistryEntry {
  area_id: string;
  floor_id?: string | null;
  icon?: string | null;
  name: string;
}

export interface FloorRegistryEntry {
  floor_id: string;
  icon?: string | null;
  name: string;
}

export interface HomeAssistant {
  areas?: Record<string, AreaRegistryEntry>;
  entities?: Record<string, EntityRegistryEntry>;
  devices?: Record<string, DeviceRegistryEntry>;
  floors?: Record<string, FloorRegistryEntry>;
  locale?: {
    language?: string;
  };
  states: Record<string, HassEntity>;
}

export interface LovelaceCardConfig {
  type: string;
  content?: string;
}

export interface LovelaceSectionConfig {
  type?: string;
  column_span?: number;
  cards?: LovelaceCardConfig[];
}

export interface LovelaceStrategySectionConfig {
  strategy: CollectionSectionStrategyConfig;
  column_span?: number;
}

export interface LovelaceViewConfig {
  type?: string;
  title?: string;
  path?: string;
  icon?: string;
  max_columns?: number;
  sections?: (LovelaceSectionConfig | LovelaceStrategySectionConfig)[];
}

export interface LovelaceDashboardConfig {
  views: LovelaceViewConfig[];
}

export interface CollectionSectionStrategyConfig {
  type: "custom:collection";
}

export interface CollectionConfig {
  title: string;
  icon?: string;
}

export interface CollectionsDashboardStrategyConfig {
  type: "custom:collections";
  collections?: CollectionConfig[];
}
