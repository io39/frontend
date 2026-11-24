import type { HassEntities } from "home-assistant-js-websocket";
import type { AreaRegistryEntry } from "../../src/data/area/area_registry";
import type { DeviceRegistryEntry } from "../../src/data/device/device_registry";
import type { EntityRegistryDisplayEntry } from "../../src/data/entity/entity_registry";
import { createMockEntityState, createMockHass } from "./hass";

// Domains a typical home has, with the entities each device exposes.
const DEVICE_KINDS: { domain: string; entities: string[] }[] = [
  { domain: "light", entities: ["light"] },
  { domain: "switch", entities: ["switch", "sensor", "sensor"] },
  { domain: "climate", entities: ["climate", "sensor", "sensor"] },
  { domain: "sensor", entities: ["sensor", "sensor", "binary_sensor"] },
  { domain: "cover", entities: ["cover", "sensor"] },
  { domain: "media_player", entities: ["media_player", "switch"] },
  { domain: "lock", entities: ["lock", "binary_sensor", "sensor"] },
];

/**
 * A deterministic home: `deviceCount` devices spread over `areaCount` areas
 * (every fifth device has no area), plus `looseCount` entities without a
 * device, as created by YAML or helpers.
 */
export const generateHome = (
  areaCount: number,
  deviceCount: number,
  looseCount: number
) => {
  const states: HassEntities = {};
  const entities: Record<string, EntityRegistryDisplayEntry> = {};
  const devices: Record<string, DeviceRegistryEntry> = {};
  const areas: Record<string, AreaRegistryEntry> = {};

  for (let a = 0; a < areaCount; a++) {
    const areaId = `area_${a}`;
    areas[areaId] = { area_id: areaId, name: `Room ${a}` } as AreaRegistryEntry;
  }

  for (let d = 0; d < deviceCount; d++) {
    const kind = DEVICE_KINDS[d % DEVICE_KINDS.length];
    const deviceId = `device_${d}`;
    devices[deviceId] = {
      id: deviceId,
      name: `${kind.domain.replace("_", " ")} ${d}`,
      name_by_user: null,
      area_id: d % 5 === 0 ? null : `area_${d % areaCount}`,
    } as DeviceRegistryEntry;

    kind.entities.forEach((domain, e) => {
      const entityId = `${domain}.device_${d}_${e}`;
      states[entityId] = createMockEntityState(entityId, "on", {
        friendly_name: `${devices[deviceId].name} ${domain} ${e}`,
      });
      entities[entityId] = {
        entity_id: entityId,
        device_id: deviceId,
        name: e === 0 ? undefined : `${domain} ${e}`,
        has_entity_name: true,
      } as EntityRegistryDisplayEntry;
    });
  }

  const looseDomains = ["sensor", "switch", "light", "input_boolean"];
  for (let i = 0; i < looseCount; i++) {
    const domain = looseDomains[i % looseDomains.length];
    const entityId = `${domain}.loose_${i}`;
    states[entityId] = createMockEntityState(entityId, "on", {
      friendly_name: `Loose ${domain} ${looseCount - i}`,
    });
  }

  return createMockHass(states, { entities, devices, areas });
};
