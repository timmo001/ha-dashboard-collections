import "./dashboard-collections/collection-section-strategy";
import "./dashboard-collections/collections-dashboard-strategy";

window.customStrategies = window.customStrategies || [];

if (
  !window.customStrategies.some(
    (strategy) =>
      strategy.type === "collections" && strategy.strategyType === "dashboard",
  )
) {
  window.customStrategies.push({
    type: "collections",
    name: "Collections",
    description:
      "Filtered collections of entities, such as temperature, humidity or batteries, grouped by area.",
    strategyType: "dashboard",
  });
}

declare global {
  interface Window {
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
