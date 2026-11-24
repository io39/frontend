import type { PropertyValues } from "lit";
import { describe, expect, it } from "vitest";
import {
  hasConfigChanged,
  hasConfigOrEntitiesChanged,
  hasConfigOrEntityChanged,
} from "../../../../src/panels/lovelace/common/has-changed";
import type { HomeAssistant } from "../../../../src/types";

const localize = () => "";
const formatEntityState = () => "";
const formatEntityAttributeName = () => "";
const formatEntityAttributeValue = () => "";
const formatEntityName = () => "";
const locale = { language: "en" };
const themes = { theme: "default" };

// Fake: the parts of a hass object that the change checks read.
const createHass = (overrides: Partial<HomeAssistant> = {}): HomeAssistant =>
  ({
    connected: true,
    themes,
    locale,
    localize,
    formatEntityState,
    formatEntityAttributeName,
    formatEntityAttributeValue,
    formatEntityName,
    config: { state: "RUNNING" },
    states: {
      "light.kitchen": { entity_id: "light.kitchen", state: "on" },
      "sensor.power": { entity_id: "sensor.power", state: "120" },
    },
    entities: {
      "sensor.power": { entity_id: "sensor.power", display_precision: 1 },
    },
    ...overrides,
  }) as unknown as HomeAssistant;

const changed = (props: Record<string, unknown>): PropertyValues =>
  new Map(Object.entries(props)) as PropertyValues;

const withState = (hass: HomeAssistant, entityId: string, state: string) =>
  createHass({
    states: {
      ...hass.states,
      [entityId]: { ...hass.states[entityId], state },
    },
  });

describe("hasConfigChanged", () => {
  it("returns true when the config changed", () => {
    expect(hasConfigChanged({}, changed({ _config: {} }))).toBe(true);
  });

  it("returns false when hass did not change", () => {
    expect(hasConfigChanged({}, changed({ other: 1 }))).toBe(false);
  });

  it("returns true on the first hass", () => {
    const element = { hass: createHass() };
    expect(hasConfigChanged(element, changed({ hass: undefined }))).toBe(true);
  });

  it("returns true when the connection state changed", () => {
    const element = { hass: createHass({ connected: false }) };
    expect(hasConfigChanged(element, changed({ hass: createHass() }))).toBe(
      true
    );
  });

  it("returns true when the language changed", () => {
    const element = {
      hass: createHass({ locale: { language: "sk" } as any }),
    };
    expect(hasConfigChanged(element, changed({ hass: createHass() }))).toBe(
      true
    );
  });

  it("returns false when only entity states changed", () => {
    const oldHass = createHass();
    const element = { hass: withState(oldHass, "light.kitchen", "off") };
    expect(hasConfigChanged(element, changed({ hass: oldHass }))).toBe(false);
  });
});

describe("hasConfigOrEntityChanged", () => {
  const config = { entity: "light.kitchen" };

  it("returns true when the config changed", () => {
    expect(hasConfigOrEntityChanged({}, changed({ _config: config }))).toBe(
      true
    );
  });

  it("returns false when hass did not change", () => {
    expect(hasConfigOrEntityChanged({}, changed({ other: 1 }))).toBe(false);
  });

  it("returns true when the card's entity changed", () => {
    const oldHass = createHass();
    const element = {
      _config: config,
      hass: withState(oldHass, "light.kitchen", "off"),
    };
    expect(hasConfigOrEntityChanged(element, changed({ hass: oldHass }))).toBe(
      true
    );
  });

  it("returns false when another entity changed", () => {
    const oldHass = createHass();
    const element = {
      _config: config,
      hass: withState(oldHass, "sensor.power", "80"),
    };
    expect(hasConfigOrEntityChanged(element, changed({ hass: oldHass }))).toBe(
      false
    );
  });

  it("returns true when the display precision changed", () => {
    const oldHass = createHass();
    const element = {
      _config: { entity: "sensor.power" },
      hass: createHass({
        states: oldHass.states,
        entities: {
          "sensor.power": {
            entity_id: "sensor.power",
            display_precision: 2,
          },
        } as any,
      }),
    };
    expect(hasConfigOrEntityChanged(element, changed({ hass: oldHass }))).toBe(
      true
    );
  });
});

describe("hasConfigOrEntitiesChanged", () => {
  const config = {
    entities: [
      "light.kitchen",
      { type: "divider" },
      { entity: "sensor.power" },
    ],
  };

  it("returns true when the config changed", () => {
    expect(hasConfigOrEntitiesChanged({}, changed({ _config: config }))).toBe(
      true
    );
  });

  it("returns false when hass did not change", () => {
    expect(hasConfigOrEntitiesChanged({}, changed({ other: 1 }))).toBe(false);
  });

  it("returns true when one of the entities changed", () => {
    const oldHass = createHass();
    const element = {
      _config: config,
      hass: withState(oldHass, "sensor.power", "80"),
    };
    expect(
      hasConfigOrEntitiesChanged(element, changed({ hass: oldHass }))
    ).toBe(true);
  });

  it("returns false when none of the entities changed", () => {
    const oldHass = createHass();
    const element = {
      _config: config,
      hass: createHass({ states: oldHass.states }),
    };
    expect(
      hasConfigOrEntitiesChanged(element, changed({ hass: oldHass }))
    ).toBe(false);
  });

  it("ignores an entity that is not in the card", () => {
    const oldHass = createHass({
      states: {
        ...createHass().states,
        "switch.fan": { entity_id: "switch.fan", state: "off" },
      } as any,
    });
    const element = {
      _config: config,
      hass: withState(oldHass, "switch.fan", "on"),
    };
    expect(
      hasConfigOrEntitiesChanged(element, changed({ hass: oldHass }))
    ).toBe(false);
  });
});
