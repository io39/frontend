import { describe, test } from "vitest";
import { generateDefaultViewConfig } from "../../src/panels/lovelace/common/generate-lovelace-config";
import { mockLocalize } from "../fixtures/hass";
import { generateHome } from "../fixtures/home";

const medium = generateHome(10, 150, 100); // ~470 entities
const large = generateHome(30, 1000, 500); // ~3 000 entities

describe("generateDefaultViewConfig", () => {
  test("medium home (~470 entities)", async ({ bench }) => {
    await bench("medium home (~470 entities)", () => {
      generateDefaultViewConfig(medium, mockLocalize);
    }).run();
  });

  test("large home (~3 000 entities)", async ({ bench }) => {
    await bench("large home (~3 000 entities)", () => {
      generateDefaultViewConfig(large, mockLocalize);
    }).run({ time: 2000, warmupIterations: 5 });
  });
});
