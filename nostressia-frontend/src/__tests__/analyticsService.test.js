import client from "../api/client";
import { sendWeeklyReport } from "../services/analyticsService";

vi.mock("../api/client", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("analyticsService", () => {
  it("calls weekly report endpoint and returns parsed payload", async () => {
    client.post.mockResolvedValue({
      data: {
        success: true,
        message: "Weekly report sent",
        data: {
          email: "user@example.com",
          report: { streak: 5 },
        },
        errors: null,
        meta: null,
      },
    });

    const result = await sendWeeklyReport();

    expect(client.post).toHaveBeenCalledWith("/analytics/weekly-report");
    expect(result.email).toBe("user@example.com");
    expect(result.report.streak).toBe(5);
  });
});
