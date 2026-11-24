import type { HassEntity } from "home-assistant-js-websocket";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computeTooltip } from "../../../../src/panels/lovelace/common/compute-tooltip";
import type { HomeAssistant } from "../../../../src/types";

// English strings of the keys computeTooltip uses.
const TRANSLATIONS: Record<string, string> = {
  "ui.panel.lovelace.cards.picture-elements.hold": "Hold:",
  "ui.panel.lovelace.cards.picture-elements.tap": "Tap:",
  "ui.panel.lovelace.cards.picture-elements.navigate_to":
    "Navigate to {location}",
  "ui.panel.lovelace.cards.picture-elements.url": "Open window to {url_path}",
  "ui.panel.lovelace.cards.picture-elements.toggle": "Toggle {name}",
  "ui.panel.lovelace.cards.picture-elements.perform_action":
    "Perform action {name}",
  "ui.panel.lovelace.cards.picture-elements.more_info":
    "Show more info: {name}",
};

// Fake: a small working translation table instead of the real localize.
const fakeLocalize = (key: string, params?: Record<string, unknown>) =>
  (TRANSLATIONS[key] ?? key).replace(/\{(\w+)\}/g, (_, name) =>
    String(params?.[name])
  );

const kitchenLight = { entity_id: "light.kitchen" } as HassEntity;

let localize: ReturnType<typeof vi.fn>;
let formatEntityName: ReturnType<typeof vi.fn>;
let hass: HomeAssistant;

beforeEach(() => {
  // Mock: records calls so the tests can check how localize is used.
  localize = vi.fn(fakeLocalize);
  // Stub: always returns the same friendly name.
  formatEntityName = vi.fn().mockReturnValue("Kitchen light");
  hass = {
    localize,
    formatEntityName,
    states: { "light.kitchen": kitchenLight },
  } as unknown as HomeAssistant;
});

describe("computeTooltip", () => {
  it("returns an empty string when the title is null", () => {
    expect(computeTooltip(hass, { title: null } as any)).toBe("");
  });

  it("returns the configured title", () => {
    expect(
      computeTooltip(hass, { title: "Lights", entity: "light.kitchen" })
    ).toBe("Lights");
    expect(formatEntityName).not.toHaveBeenCalled();
  });

  it("returns the entity name when there are no actions", () => {
    expect(computeTooltip(hass, { entity: "light.kitchen" })).toBe(
      "Kitchen light"
    );
    expect(formatEntityName).toHaveBeenCalledWith(kitchenLight);
    expect(localize).not.toHaveBeenCalled();
  });

  it("falls back to the entity id when the entity does not exist", () => {
    expect(computeTooltip(hass, { entity: "light.missing" })).toBe(
      "light.missing"
    );
    expect(formatEntityName).not.toHaveBeenCalled();
  });

  it("describes a navigate tap action", () => {
    expect(
      computeTooltip(hass, {
        tap_action: { action: "navigate", navigation_path: "/lovelace/1" },
      })
    ).toBe("Tap: Navigate to /lovelace/1");
    expect(localize).toHaveBeenCalledWith(
      "ui.panel.lovelace.cards.picture-elements.navigate_to",
      { location: "/lovelace/1" }
    );
  });

  it("describes a url tap action", () => {
    expect(
      computeTooltip(hass, {
        tap_action: { action: "url", url_path: "https://example.com" },
      })
    ).toBe("Tap: Open window to https://example.com");
  });

  it("describes a toggle tap action with the entity name", () => {
    expect(
      computeTooltip(hass, {
        entity: "light.kitchen",
        tap_action: { action: "toggle" },
      })
    ).toBe("Tap: Toggle Kitchen light");
  });

  it("describes a call-service tap action", () => {
    expect(
      computeTooltip(hass, {
        tap_action: {
          action: "call-service",
          service: "light.turn_on",
        } as any,
      })
    ).toBe("Tap: Perform action light.turn_on");
  });

  it("describes a perform-action tap action", () => {
    expect(
      computeTooltip(hass, {
        tap_action: {
          action: "perform-action",
          perform_action: "light.turn_on",
        },
      })
    ).toBe("Tap: Perform action light.turn_on");
  });

  it("describes a more-info tap action", () => {
    expect(
      computeTooltip(hass, {
        entity: "light.kitchen",
        tap_action: { action: "more-info" },
      })
    ).toBe("Tap: Show more info: Kitchen light");
  });

  it("uses the hold prefix for hold actions", () => {
    expect(
      computeTooltip(hass, {
        entity: "light.kitchen",
        hold_action: { action: "toggle" },
      })
    ).toBe("Hold: Toggle Kitchen light");
    expect(localize).toHaveBeenCalledWith(
      "ui.panel.lovelace.cards.picture-elements.hold"
    );
  });

  it("puts the tap and hold descriptions on separate lines", () => {
    expect(
      computeTooltip(hass, {
        entity: "light.kitchen",
        tap_action: { action: "toggle" },
        hold_action: { action: "navigate", navigation_path: "/energy" },
      })
    ).toBe("Tap: Toggle Kitchen light\nHold: Navigate to /energy");
  });

  it("returns an empty string for a none tap action", () => {
    expect(
      computeTooltip(hass, {
        entity: "light.kitchen",
        tap_action: { action: "none" },
      })
    ).toBe("");
    expect(localize).not.toHaveBeenCalled();
  });
});
