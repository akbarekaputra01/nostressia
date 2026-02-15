import { parseApiResponse, apiResponseSchema } from "../api/contracts/apiResponse";
import { userTokenResponseSchema } from "../api/contracts/authSchemas";
import { tipsCategoryListSchema } from "../api/contracts/tipsSchemas";

describe("API contract parsing", () => {
  it("parses auth payload with strict schema", () => {
    const schema = apiResponseSchema(userTokenResponseSchema);

    const parsed = parseApiResponse(schema, {
      success: true,
      message: "ok",
      data: {
        accessToken: "token-123",
        tokenType: "Bearer",
        user: {
          userId: 1,
          name: "Tester",
          username: "tester",
          email: "tester@example.com",
          gender: null,
          userGpa: null,
          avatar: null,
          userDob: null,
          streak: 0,
          diaryCount: 0,
          isVerified: true,
        },
      },
      errors: null,
      meta: null,
    });

    expect(parsed.accessToken).toBe("token-123");
    expect(parsed.user.username).toBe("tester");
  });

  it("throws when API payload shape is invalid", () => {
    const schema = apiResponseSchema(userTokenResponseSchema);

    expect(() =>
      parseApiResponse(schema, {
        success: true,
        message: "ok",
        data: {
          access_token: "legacy",
        },
        errors: null,
        meta: null,
      }),
    ).toThrow();
  });

  it("validates tips category list schema", () => {
    const parsed = tipsCategoryListSchema.parse([
      { tipCategoryId: 10, categoryName: "Sleep" },
      { tipCategoryId: 20, categoryName: "Mindfulness" },
    ]);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].categoryName).toBe("Sleep");
  });
});
