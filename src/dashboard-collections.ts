import "./dashboard-collections/collection-card";
import "./dashboard-collections/collection-section-strategy";
import "./dashboard-collections/collections-dashboard-strategy";
import { setupLocalize } from "./dashboard-collections/localize";

const DOCUMENTATION_URL =
  "https://github.com/timmo001/ha-dashboard-collections#readme";

const localize = setupLocalize();

const STRATEGIES = [
  {
    type: "collections",
    strategyType: "dashboard",
    name: localize("strategy.dashboard.name"),
    description: localize("strategy.dashboard.description"),
  },
  {
    type: "collection",
    strategyType: "section",
    name: localize("strategy.section.name"),
    description: localize("strategy.section.description"),
  },
] as const;

window.customStrategies ??= [];

for (const strategy of STRATEGIES) {
  if (
    !window.customStrategies.some(
      ({ type, strategyType }) =>
        type === strategy.type && strategyType === strategy.strategyType,
    )
  ) {
    window.customStrategies.push({
      ...strategy,
      documentationURL: DOCUMENTATION_URL,
    });
  }
}

window.customCards ??= [];

if (!window.customCards.some(({ type }) => type === "dashboard-collections-card")) {
  window.customCards.push({
    type: "dashboard-collections-card",
    name: localize("card.name"),
    description: localize("card.description"),
    documentationURL: DOCUMENTATION_URL,
  });
}

declare global {
  interface Window {
    customCards?: Array<{
      type: string;
      name?: string;
      description?: string;
      documentationURL?: string;
      preview?: boolean;
    }>;
    customStrategies?: Array<{
      type: string;
      name?: string;
      description?: string;
      documentationURL?: string;
      images?:
        | string
        | {
            dark: string;
            light: string;
          };
      strategyType: "dashboard" | "view" | "section";
    }>;
  }
}
