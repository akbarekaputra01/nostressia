# Nostressia Frontend Test Inventory

Checklist of exported functions, components, and flows with test coverage.

## API Modules (`src/api/**`)
- [x] `src/api/client.js` (client instance, `apiOrigin`, `unwrapResponse`) — `src/__tests__/apiClientAuth.test.js`, `src/__tests__/exportSmoke.test.js`
- [x] `src/api/config.js` (`BASE_URL`) — `src/__tests__/exportSmoke.test.js`
- [x] `src/api/request.js` (`parseJsonResponse`) — `src/__tests__/request.test.js`
- [x] `src/api/forecastApi.js` (`fetchGlobalForecast`, `fetchForecastGlobal`) — `src/__tests__/exportSmoke.test.js`
- [x] `src/api/diaryApi.js` (`createDiary`, `getMyDiaries`, `getDiaryById`, `updateDiary`) — `src/__tests__/exportSmoke.test.js`
- [x] `src/api/motivationApi.js` (`getAllMotivations`, `createMotivation`, `deleteMotivation`) — `src/__tests__/exportSmoke.test.js`
- [x] `src/api/tipsApi.js` (all CRUD helpers) — `src/__tests__/exportSmoke.test.js`
- [x] `src/api/profilePicture.js` (`requestProfilePictureSas`, `uploadProfilePictureToAzure`, `saveProfilePictureUrl`, `validateProfilePictureFile`) — `src/__tests__/exportSmoke.test.js`
- [x] `src/api/stressLevelsApi.js` (`addStressLog`, `restoreStressLog`, `getMyStressLogs`, `getStressEligibility`) — `src/__tests__/exportSmoke.test.js`

## Utils (`src/utils/**`)
- [x] `src/utils/auth.js` (token storage + migration helpers) — `src/__tests__/authStorage.test.js`, `src/__tests__/exportSmoke.test.js`
- [x] `src/utils/avatar.js` (`DEFAULT_AVATAR`, `resolveAvatarUrl`) — `src/__tests__/avatar.test.js`
- [x] `src/utils/notificationService.js` (notification helpers) — `src/__tests__/notificationService.test.js`
- [x] `src/utils/storage.js` (storage wrapper + legacy migration) — `src/__tests__/storage.test.js`
- [x] `src/utils/streak.js` (`getTodayKey`, `hasLoggedToday`, `resolveDisplayedStreak`) — `src/__tests__/streak.test.js`

## Router (`src/router/**`)
- [x] `src/router/index.jsx` (`ProtectedRoute`, `PublicRoute`, `AdminProtectedRoute`, `AdminPublicRoute`, `AppRouter`) — `src/__tests__/routerGuards.test.jsx`, `src/__tests__/exportSmoke.test.js`

## Components (`src/components/**`)
- [x] `src/components/Navbar.jsx` — `src/__tests__/exportSmoke.test.js`
- [x] `src/components/Footer.jsx` — `src/__tests__/exportSmoke.test.js`
- [x] `src/components/PageMeta.jsx` — `src/__tests__/pageMeta.test.jsx`

## Pages (`src/pages/**`)
- [x] `src/pages/Login/Login.jsx` (login + signup flip, OTP, forgot password) — `src/__tests__/loginSignup.test.jsx`
- [x] `src/pages/Admin/AdminLogin.jsx` — `src/__tests__/adminAuthFlow.test.js`
- [x] `src/pages/Admin/AdminPage.jsx` — `src/__tests__/exportSmoke.test.js`
- [x] `src/pages/Dashboard/Dashboard.jsx` — `src/__tests__/dashboardScroll.test.jsx`
- [x] `src/pages/Profile/Profile.jsx` — `src/__tests__/profilePasswordFlow.test.jsx`, `src/__tests__/profileUpdate.test.jsx`
- [x] `src/pages/Diary/Diary.jsx` — `src/__tests__/exportSmoke.test.js`
- [x] `src/pages/Motivation/Motivation.jsx` — `src/__tests__/exportSmoke.test.js`
- [x] `src/pages/Tips/Tips.jsx` — `src/__tests__/exportSmoke.test.js`
- [x] `src/pages/Analytics/Analytics.jsx` — `src/__tests__/exportSmoke.test.js`
- [x] `src/pages/LandingPage/LandingPage.jsx` — `src/__tests__/exportSmoke.test.js`
- [x] `src/pages/NotFound/NotFound.jsx` — `src/__tests__/exportSmoke.test.js`

## Feature Flows (cross-module)
- [x] Auth token storage + guards — `src/__tests__/authStorage.test.js`, `src/__tests__/routerGuards.test.jsx`
- [x] Admin login + authorized admin fetch — `src/__tests__/adminAuthFlow.test.js`
- [x] Signup flip-card + validation + API call — `src/__tests__/loginSignup.test.jsx`
- [x] Change password gating (verify current password first) — `src/__tests__/profilePasswordFlow.test.jsx`
- [x] Notification settings + reminder scheduling call — `src/__tests__/profileUpdate.test.jsx` (settings payload), `src/__tests__/exportSmoke.test.js`
- [x] Profile birthday/gender updates — `src/__tests__/profileUpdate.test.jsx`
- [x] Stress prediction form scrollability — `src/__tests__/dashboardScroll.test.jsx`
