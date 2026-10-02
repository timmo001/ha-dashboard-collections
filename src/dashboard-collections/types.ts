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
  device_id?: string | null;
  area_id?: string | null;
  entity_category?: string | null;
  hidden?: boolean;
  labels?: string[];
  name?: string | null;
  platform?: string;
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

/**
 * Home Assistant's heading card. Actions and badges are passed through to
 * Home Assistant as they are.
 */
export interface HeadingCardConfig {
  type: "heading";
  heading?: string;
  heading_style?: "title" | "subtitle";
  icon?: string;
  tap_action?: { action: string };
  badges?: { type?: string; entity?: string }[];
}

export type SectionHeadingConfig = Omit<HeadingCardConfig, "type">;

export interface TileCardConfig {
  type: "tile";
  entity: string;
}

export interface MarkdownCardConfig {
  type: "markdown";
  content: string;
}

export type LovelaceCardConfig =
  | HeadingCardConfig
  | TileCardConfig
  | MarkdownCardConfig;

export interface LovelaceSectionConfig {
  type?: string;
  column_span?: number;
  disabled?: boolean;
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
  show_icon_and_title?: boolean;
  max_columns?: number;
  sections?: (LovelaceSectionConfig | LovelaceStrategySectionConfig)[];
}

export interface LovelaceDashboardConfig {
  views: LovelaceViewConfig[];
}

/**
 * An entity matches a filter when it matches every key that is set. A single
 * value or a list is accepted for the list keys.
 */
export interface CollectionFilter {
  domain?: string | string[];
  device_class?: string | string[];
  integration?: string | string[];
  area?: string | string[];
  floor?: string | string[];
  label?: string | string[];
  name?: string;
}

/**
 * Which entities a collection shows. Diagnostic and configuration entities
 * are left out unless `include_diagnostic` is set.
 */
export interface CollectionMatch {
  filters?: CollectionFilter[];
  include_diagnostic?: boolean;
}

/**
 * Without `floor` or `area`, the section shows every matching entity grouped
 * by area. `floor` limits it to areas on that floor (`null` for areas without
 * a floor), and `area: null` limits it to entities without an area.
 *
 * `heading` replaces the heading at the top of the section.
 */
export interface CollectionSectionStrategyConfig extends CollectionMatch {
  type: "custom:collection";
  heading?: SectionHeadingConfig;
  floor?: string | null;
  area?: null;
}

export interface CollectionConfig extends CollectionMatch {
  title: string;
  icon?: string;
  show_icon_and_title?: boolean;
  path?: string;
}

export interface CollectionsDashboardStrategyConfig {
  type: "custom:collections";
  collections?: CollectionConfig[];
}
