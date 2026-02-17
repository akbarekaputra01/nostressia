import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config";

const integrationTests = [
  "src/__tests__/loginSignup.test.jsx",
  "src/__tests__/profilePasswordFlow.test.jsx",
  "src/__tests__/profileUpdate.test.jsx",
  "src/__tests__/routerGuards.test.jsx",
  "src/__tests__/coreFeaturePages.test.jsx",
  "src/__tests__/dashboardScroll.test.jsx",
];

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["src/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}"],
      exclude: integrationTests,
    },
  }),
);
