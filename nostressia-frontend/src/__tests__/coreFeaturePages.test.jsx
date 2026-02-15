import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Analytics from "../pages/Analytics/Analytics";
import Dashboard from "../pages/Dashboard/Dashboard";
import Diary from "../pages/Diary/Diary";
import Motivation from "../pages/Motivation/Motivation";
import Tips from "../pages/Tips/Tips";
import { ThemeProvider } from "../theme/ThemeProvider";

vi.mock("../services/analyticsService", () => ({
  getAnalyticsSummary: vi.fn().mockResolvedValue({
    streak: 3,
    stressLogsCount: 2,
    diaryCount: 4,
  }),
}));

vi.mock("../services/bookmarkService", () => ({
  addBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
  getMyBookmarks: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/diaryService", () => ({
  createDiary: vi.fn().mockResolvedValue({
    diaryId: 1,
    title: "Test Diary",
    note: "Testing",
    emoji: "😄",
    font: "Manrope",
    date: "2024-01-01",
  }),
  getMyDiaries: vi.fn().mockResolvedValue([
    {
      diaryId: 24,
      title: "First Entry",
      note: "Entry content",
      emoji: "😊",
      font: "Manrope",
      date: "2024-01-05",
    },
  ]),
  updateDiary: vi.fn().mockResolvedValue({
    diaryId: 1,
    title: "Updated Diary",
    note: "Updated",
    emoji: "😄",
    font: "Manrope",
    date: "2024-01-01",
  }),
}));

vi.mock("../services/motivationService", () => ({
  getMotivations: vi.fn().mockResolvedValue([
    {
      motivationId: 1,
      quote: "Keep going!",
      authorName: "Team",
    },
    {
      motivationId: 2,
      quote: "Small steps every day.",
      authorName: "Coach",
    },
  ]),
}));

vi.mock("../services/stressService", () => ({
  addStressLog: vi.fn().mockResolvedValue({ stressLevelId: 1 }),
  getGlobalForecast: vi.fn().mockResolvedValue({
    forecast: {
      forecastDate: "2024-01-06",
      chancePercent: 20,
      threshold: 0.5,
      predictionBinary: 0,
      predictionLabel: "Low",
      modelType: "global_markov",
    },
    eligibility: {
      eligible: true,
      streak: 5,
      requiredStreak: 7,
      restoreUsed: 1,
      restoreRemaining: 2,
      restoreLimit: 3,
      missing: 0,
      note: "Eligible",
    },
  }),
  getMyStressLogs: vi.fn().mockResolvedValue([
    {
      date: "2024-01-06",
      stressLevel: 1,
      emoji: 4,
      createdAt: "2024-01-06T08:00:00Z",
    },
  ]),
  getStressEligibility: vi.fn().mockResolvedValue({
    eligible: true,
    streak: 5,
    requiredStreak: 7,
    restoreUsed: 1,
    restoreRemaining: 2,
    restoreLimit: 3,
    missing: 0,
    note: "Eligible",
  }),
  predictCurrentStress: vi.fn().mockResolvedValue({
    result: "Low",
    message: "Test",
  }),
  restoreStressLog: vi.fn().mockResolvedValue({ stressLevelId: 2 }),
}));

vi.mock("../services/tipsService", () => ({
  getTipCategories: vi.fn().mockResolvedValue([
    {
      tipCategoryId: 1,
      categoryName: "Focus Boost",
    },
    {
      tipCategoryId: 2,
      categoryName: "Mind & Body",
    },
  ]),
  getTipsByCategory: vi.fn().mockResolvedValue([
    {
      detail: "Try a 25-minute focus sprint.",
    },
    {
      detail: "Silence notifications for 30 minutes.",
    },
  ]),
}));

vi.mock("../utils/auth", () => ({
  AUTH_SCOPE: { USER: "user", ADMIN: "admin" },
  readAuthToken: vi.fn().mockReturnValue("token"),
  clearAuthToken: vi.fn(),
}));

vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue(document.createElement("canvas")),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => <div>Line</div>,
  CartesianGrid: () => <div>Grid</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  Tooltip: () => <div>Tooltip</div>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useOutletContext: () => ({
      user: { name: "Example User", avatar: "", streak: 5 },
    }),
  };
});

const renderWithProviders = (ui) =>
  render(
    <MemoryRouter>
      <ThemeProvider>{ui}</ThemeProvider>
    </MemoryRouter>,
  );

describe("Core feature pages", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    window.IntersectionObserver = class {
      observe() { }
      unobserve() { }
      disconnect() { }
    };
  });

  it("renders the dashboard experience", async () => {
    renderWithProviders(<Dashboard />);

    expect(
      await screen.findByRole("heading", { name: /today's stress prediction/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/last 7 days trend/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fill stress prediction data/i })).toBeInTheDocument();
    expect(screen.getByText(/restore streak/i)).toBeInTheDocument();
    expect(screen.getByText(/3-day forecast/i)).toBeInTheDocument();
    expect(screen.getByText(/daily wisdom/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new quote/i })).toBeInTheDocument();
    expect(await screen.findByText(/keep going!/i)).toBeInTheDocument();
  });

  it("renders the analytics dashboard highlights", async () => {
    renderWithProviders(<Analytics />);

    expect(await screen.findByRole("heading", { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /daily/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /weekly/i })).toBeInTheDocument();
    expect(screen.getByText(/stress trend/i)).toBeInTheDocument();
    expect(screen.getByText(/mood trend/i)).toBeInTheDocument();
    expect(await screen.findByText(/analytics highlights/i)).toBeInTheDocument();
    expect(screen.getByText(/stress logs/i)).toBeInTheDocument();
    expect(screen.getByText(/diary entries/i)).toBeInTheDocument();
    expect(screen.getByText(/current streak/i)).toBeInTheDocument();
    expect(screen.getByText(/most common stress/i)).toBeInTheDocument();
    expect(screen.getByText(/most common mood/i)).toBeInTheDocument();
    expect(screen.getByText(/average stress level/i)).toBeInTheDocument();
  });

  it("renders the motivation hub sections", async () => {
    renderWithProviders(<Motivation />);

    expect(await screen.findByRole("heading", { name: /motivation hub/i })).toBeInTheDocument();
    expect(screen.getByText(/today's quote/i)).toBeInTheDocument();
    expect(screen.getByText(/featured motivation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new quote/i })).toBeInTheDocument();
    expect(screen.getByText(/motivation collection/i)).toBeInTheDocument();
    const motivations = await screen.findAllByText(/small steps every day/i, {}, { timeout: 3000 });
    expect(motivations.length).toBeGreaterThan(0);

    // Check for at least one share button
    const shareButtons = screen.getAllByRole("button", { name: /share/i });
    expect(shareButtons.length).toBeGreaterThan(0);
  });

  it("renders the tips overview and details", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Tips />);

    expect(await screen.findByRole("heading", { name: /^tips$/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/find topics/i)).toBeInTheDocument();

    const categoryCard = await screen.findByRole("heading", { name: /focus boost/i });
    const tipsBadges = screen.getAllByText(/2 tips/i);
    expect(tipsBadges[0]).toBeInTheDocument();

    await user.click(categoryCard);

    expect(await screen.findByRole("heading", { name: /focus boost/i })).toBeInTheDocument();
    expect(screen.getByText(/try a 25-minute focus sprint/i)).toBeInTheDocument();
    expect(screen.getByText(/silence notifications/i)).toBeInTheDocument();
  });

  it("renders the diary experience", async () => {
    renderWithProviders(<Diary />);

    expect(
      screen.getByRole("heading", { name: /diary nostressia/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/write your story today/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/title\.{3}/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/dear diary/i)).toBeInTheDocument();
    expect(await screen.findByText(/your memories/i, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText(/first entry/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();

    expect(screen.getByText(/first entry/i)).toBeInTheDocument();
  });
});
