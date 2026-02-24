import React from "react";
import { Route } from "react-router-dom";
import { LocalAdminDashboard } from "../../pages/admin/local-admin/LocalAdminDashboard";
import { SuperAdminDashboard } from "../../pages/admin/super-admin/SuperAdminDashboard";
import { ShippingConfig } from "../../pages/admin/super-admin/components/ShippingConfig";
import { ProtectedRoute } from "../../components/layout/ProtectedRoute";

export const AdminRoutes = () => [
  <Route
    key="local-admin"
    path="/admin-wilayah/*"
    element={
      <ProtectedRoute allowedRoles={["LOCAL_ADMIN"]}>
        <LocalAdminDashboard onBack={() => window.history.back()} />
      </ProtectedRoute>
    }
  />,
  <Route
    key="super-admin"
    path="/super-admin/*"
    element={
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
        <SuperAdminDashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="ship-config"
    path="/admin/shipping-config"
    element={
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
        <ShippingConfig
          theme={{
            bg: "bg-white",
            text: "text-slate-900",
            subText: "text-slate-400",
            border: "border-slate-100",
            card: "bg-white",
          }}
        />
      </ProtectedRoute>
    }
  />,
];
