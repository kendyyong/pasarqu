import React from "react";
import { Route } from "react-router-dom";
import { MerchantDashboard } from "../../pages/merchant/MerchantDashboard";
import { CourierDashboard } from "../../pages/courier/CourierDashboard";
import { MerchantPromoPage } from "../../pages/merchant/components/MerchantPromoPage";
import { CourierPromoPage } from "../../pages/courier/components/CourierPromoPage";
import { OrderInvoice } from "../../pages/Invoice/OrderInvoice";
import { ProtectedRoute } from "../../components/layout/ProtectedRoute";

export const PartnerRoutes = () => [
  <Route
    key="promo-m"
    path="/merchant-promo"
    element={<MerchantPromoPage />}
  />,
  <Route key="promo-c" path="/promo/kurir" element={<CourierPromoPage />} />,
  <Route
    key="merch-dash"
    path="/merchant-dashboard"
    element={
      <ProtectedRoute allowedRoles={["MERCHANT"]}>
        <MerchantDashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="cour-dash"
    path="/courier-dashboard"
    element={
      <ProtectedRoute allowedRoles={["COURIER"]}>
        <CourierDashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="invoice"
    path="/invoice/:orderId"
    element={
      <ProtectedRoute allowedRoles={["MERCHANT", "SUPER_ADMIN", "LOCAL_ADMIN"]}>
        <OrderInvoice />
      </ProtectedRoute>
    }
  />,
];
