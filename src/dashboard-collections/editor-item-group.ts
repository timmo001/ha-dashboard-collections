import { css, html, nothing } from "lit";
import type { TemplateResult } from "lit";

export interface EditorItemRowOptions {
  icon: TemplateResult;
  primary: string;
  secondary?: string;
  actions: TemplateResult;
}

export const eventIndex = (ev: Event) =>
  ev.currentTarget instanceof HTMLElement
    ? Number(ev.currentTarget.dataset.index)
    : -1;

export const renderEditorItemRow = ({
  icon,
  primary,
  secondary,
  actions,
}: EditorItemRowOptions) => html`
  <div class="item-row">
    ${icon}
    <div class="item-content">
      <span class="item-name">${primary}</span>
      ${secondary ? html`<span class="secondary">${secondary}</span>` : nothing}
    </div>
    ${actions}
  </div>
`;

export const editorItemGroupStyles = css`
  .items {
    display: flex;
    flex-direction: column;
    padding: var(--ha-space-3, 12px);
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
  }

  .item-row ha-icon {
    color: var(--state-icon-color, var(--secondary-text-color));
    margin-inline-end: 0;
    flex-shrink: 0;
  }

  .item-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-row ha-icon-button {
    --ha-icon-button-size: 36px;
    color: var(--secondary-text-color);
  }

  .items ha-button {
    align-self: flex-start;
    margin-top: 8px;
  }
`;
