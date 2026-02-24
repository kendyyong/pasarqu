import React from "react";
import { Route } from "react-router-dom";

// ✅ PASTIKAN NAMA FILE DI BAWAH INI SESUAI DENGAN YANG ADA DI FOLDER pages/auth/
// Jika nama filenya Login.tsx, gunakan: import { Login } from "../../pages/auth/Login";
// Jika nama filenya AuthPage.tsx, gunakan: import { AuthPage } from "../../pages/auth/AuthPage";

import { AuthPage } from "../../pages/auth/AuthPage";
import { RegisterPage } from "../../pages/auth/RegisterPage";
import { OTPVerificationPage } from "../../pages/auth/OTPVerificationPage";
import { CompleteProfilePage } from "../../pages/auth/CompleteProfilePage";
import { PortalLoginPage } from "../../pages/auth/PortalLoginPage";
import { TermsPage } from "../../pages/legal/Termspage";
import { PrivacyPage } from "../../pages/legal/PrivacyPage";
import { ProtectedRoute } from "../../components/layout/ProtectedRoute";
import {
  MerchantLogin,
  CourierLogin,
  AdminLogin,
  SuperAdminLogin,
} from "../../pages/auth/PartnerLoginPages";

export const AuthRoutes = () => [
  <Route key="login" path="/login" element={<AuthPage />} />,
  <Route key="portal" path="/portal" element={<PortalLoginPage />} />,
  <Route key="register" path="/register" element={<RegisterPage />} />,
  <Route key="otp" path="/verify-otp" element={<OTPVerificationPage />} />,
  <Route key="terms" path="/terms" element={<TermsPage />} />,
  <Route key="privacy" path="/privacy" element={<PrivacyPage />} />,
  <Route
    key="login-master"
    path="/login/master"
    element={<SuperAdminLogin />}
  />,
  <Route key="login-toko" path="/login/toko" element={<MerchantLogin />} />,
  <Route key="login-kurir" path="/login/kurir" element={<CourierLogin />} />,
  <Route
    key="login-admin"
    path="/login/admin-wilayah"
    element={<AdminLogin />}
  />,
  <Route
    key="complete-profile"
    path="/complete-profile"
    element={
      <ProtectedRoute allowedRoles={["CUSTOMER", "SUPER_ADMIN"]}>
        <CompleteProfilePage />
      </ProtectedRoute>
    }
  />,
];
