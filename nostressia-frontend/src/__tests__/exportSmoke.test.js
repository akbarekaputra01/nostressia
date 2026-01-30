import client, { apiOrigin, unwrapResponse } from "../api/client";
import { BASE_URL } from "../api/config";
import { parseJsonResponse } from "../api/request";
import * as forecastApi from "../api/forecastApi";
import * as diaryApi from "../api/diaryApi";
import * as motivationApi from "../api/motivationApi";
import * as tipsApi from "../api/tipsApi";
import * as profilePictureApi from "../api/profilePicture";
import * as stressLevelsApi from "../api/stressLevelsApi";
import * as authUtils from "../utils/auth";
import { DEFAULT_AVATAR, resolveAvatarUrl } from "../utils/avatar";
import * as notificationService from "../utils/notificationService";
import AppRouter, {
  AdminProtectedRoute,
  AdminPublicRoute,
  ProtectedRoute,
  PublicRoute,
} from "../router";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import AdminLogin from "../pages/Admin/AdminLogin";
import AdminPage from "../pages/Admin/AdminPage";
import Analytics from "../pages/Analytics/Analytics";
import Dashboard from "../pages/Dashboard/Dashboard";
import Diary from "../pages/Diary/Diary";
import LandingPage from "../pages/LandingPage/LandingPage";
import Login from "../pages/Login/Login";
import Motivation from "../pages/Motivation/Motivation";
import NotFound from "../pages/NotFound/NotFound";
import Profile from "../pages/Profile/Profile";
import Tips from "../pages/Tips/Tips";

describe("export smoke tests", () => {
  it("exposes API utilities", () => {
    expect(client).toBeTruthy();
    expect(apiOrigin).toBeDefined();
    expect(unwrapResponse).toBeInstanceOf(Function);
    expect(BASE_URL).toBeDefined();
    expect(parseJsonResponse).toBeInstanceOf(Function);
  });

  it("exposes API modules", () => {
    expect(forecastApi.fetchGlobalForecast).toBeInstanceOf(Function);
    expect(forecastApi.fetchForecastGlobal).toBeInstanceOf(Function);
    expect(diaryApi.createDiary).toBeInstanceOf(Function);
    expect(diaryApi.getMyDiaries).toBeInstanceOf(Function);
    expect(diaryApi.getDiaryById).toBeInstanceOf(Function);
    expect(diaryApi.updateDiary).toBeInstanceOf(Function);
    expect(motivationApi.getAllMotivations).toBeInstanceOf(Function);
    expect(motivationApi.createMotivation).toBeInstanceOf(Function);
    expect(motivationApi.deleteMotivation).toBeInstanceOf(Function);
    expect(tipsApi.getTipCategories).toBeInstanceOf(Function);
    expect(tipsApi.createTipCategory).toBeInstanceOf(Function);
    expect(tipsApi.deleteTipCategory).toBeInstanceOf(Function);
    expect(tipsApi.getTips).toBeInstanceOf(Function);
    expect(tipsApi.getTipsByCategory).toBeInstanceOf(Function);
    expect(tipsApi.getTipById).toBeInstanceOf(Function);
    expect(tipsApi.createTip).toBeInstanceOf(Function);
    expect(tipsApi.updateTip).toBeInstanceOf(Function);
    expect(tipsApi.deleteTip).toBeInstanceOf(Function);
    expect(profilePictureApi.requestUploadSas).toBeInstanceOf(Function);
    expect(profilePictureApi.uploadToAzure).toBeInstanceOf(Function);
    expect(profilePictureApi.saveProfilePictureUrl).toBeInstanceOf(Function);
    expect(profilePictureApi.validateProfilePictureFile).toBeInstanceOf(Function);
    expect(stressLevelsApi.addStressLog).toBeInstanceOf(Function);
    expect(stressLevelsApi.restoreStressLog).toBeInstanceOf(Function);
    expect(stressLevelsApi.getMyStressLogs).toBeInstanceOf(Function);
    expect(stressLevelsApi.getStressEligibility).toBeInstanceOf(Function);
  });

  it("exposes utility modules", () => {
    expect(authUtils.readAuthToken).toBeInstanceOf(Function);
    expect(authUtils.persistAuthToken).toBeInstanceOf(Function);
    expect(DEFAULT_AVATAR).toBeDefined();
    expect(resolveAvatarUrl).toBeInstanceOf(Function);
    expect(notificationService.subscribeDailyReminder).toBeInstanceOf(Function);
    expect(notificationService.unsubscribeDailyReminder).toBeInstanceOf(Function);
    expect(notificationService.restoreDailyReminderSubscription).toBeInstanceOf(Function);
  });

  it("exposes router and components", () => {
    expect(AppRouter).toBeInstanceOf(Function);
    expect(AdminProtectedRoute).toBeInstanceOf(Function);
    expect(AdminPublicRoute).toBeInstanceOf(Function);
    expect(ProtectedRoute).toBeInstanceOf(Function);
    expect(PublicRoute).toBeInstanceOf(Function);
    expect(Footer).toBeInstanceOf(Function);
    expect(Navbar).toBeInstanceOf(Function);
  });

  it("exposes page components", () => {
    expect(AdminLogin).toBeInstanceOf(Function);
    expect(AdminPage).toBeInstanceOf(Function);
    expect(Analytics).toBeInstanceOf(Function);
    expect(Dashboard).toBeInstanceOf(Function);
    expect(Diary).toBeInstanceOf(Function);
    expect(LandingPage).toBeInstanceOf(Function);
    expect(Login).toBeInstanceOf(Function);
    expect(Motivation).toBeInstanceOf(Function);
    expect(NotFound).toBeInstanceOf(Function);
    expect(Profile).toBeInstanceOf(Function);
    expect(Tips).toBeInstanceOf(Function);
  });
});
