import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { generateDefaultViewConfig } from "../../../../src/panels/lovelace/common/generate-lovelace-config";
import { mockLocalize } from "../../../fixtures/hass";
import { generateHome } from "../../../fixtures/home";

const hashOf = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

// Characterization: pins the exact generated dashboard, including the order
// of every card and entity, so optimizations must not change the output.
describe("generateDefaultViewConfig characterization", () => {
  it("generates the same view for a small home", () => {
    expect(
      generateDefaultViewConfig(generateHome(3, 12, 8), mockLocalize)
    ).toMatchSnapshot();
  });

  it("generates the same view for a medium home", () => {
    expect(
      hashOf(
        generateDefaultViewConfig(generateHome(10, 150, 100), mockLocalize)
      )
    ).toMatchSnapshot();
  });

  it("generates the same view for a large home", () => {
    expect(
      hashOf(
        generateDefaultViewConfig(generateHome(30, 1000, 500), mockLocalize)
      )
    ).toMatchSnapshot();
  });
});
