import { describe, expect, it } from "vitest";

import {
  createMarketplaceRedemptionResult,
  deleteRandomRewardId,
  deleteRandomRewardSlug,
  isDeleteRandomReward,
  pickDeleteRandomOutcome,
} from "./reward-effects";

describe("marketplace reward effects", () => {
  it("identifica o reward delete-random por id ou slug", () => {
    expect(
      isDeleteRandomReward({ id: deleteRandomRewardId, slug: "legacy-slug" }),
    ).toBe(true);
    expect(
      isDeleteRandomReward({
        id: "reward-custom",
        slug: deleteRandomRewardSlug,
      }),
    ).toBe(true);
    expect(isDeleteRandomReward({ id: "reward-custom", slug: "outro" })).toBe(
      false,
    );
  });

  it("seleciona o resultado usando as faixas de peso", () => {
    expect(pickDeleteRandomOutcome(0).key).toBe("phrase");
    expect(pickDeleteRandomOutcome(34).key).toBe("component");
    expect(pickDeleteRandomOutcome(62).key).toBe("market");
    expect(pickDeleteRandomOutcome(80).key).toBe("user");
    expect(pickDeleteRandomOutcome(92).key).toBe("ranking");
    expect(pickDeleteRandomOutcome(98).key).toBe("database");
  });

  it("cria payload persistivel apenas para o reward especial", () => {
    const result = createMarketplaceRedemptionResult({
      id: deleteRandomRewardId,
      slug: deleteRandomRewardSlug,
    });

    expect(result).toMatchObject({
      kind: "delete-random",
      outcome: expect.objectContaining({ key: expect.any(String) }),
    });
    expect(result?.segments).toHaveLength(6);
    expect(
      createMarketplaceRedemptionResult({ id: "reward-custom", slug: "outro" }),
    ).toBeNull();
  });
});
