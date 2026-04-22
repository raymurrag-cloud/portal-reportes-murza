import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Portal público
import HomePage           from './components/portal/HomePage.jsx';
import ReportePage        from './components/portal/ReportePage.jsx';
import RegistroPage       from './components/portal/RegistroPage.jsx';
import LoginPage          from './components/portal/LoginPage.jsx';
import EarningsCalendar   from './components/portal/EarningsCalendar.jsx';

// Admin
import AdminLogin           from './components/admin/AdminLogin.jsx';
import AdminReportes        from './components/admin/AdminReportes.jsx';
import AdminEditorReporte   from './components/admin/AdminEditorReporte.jsx';
import AdminLeads           from './components/admin/AdminLeads.jsx';
import AdminSolicitudes     from './components/admin/AdminSolicitudes.jsx';
import AdminProspectos      from './components/admin/AdminProspectos.jsx';
import AdminAnalytics         from './components/admin/AdminAnalytics.jsx';
import AdminVisitantes        from './components/admin/AdminVisitantes.jsx';
import AdminVisitanteDetalle  from './components/admin/AdminVisitanteDetalle.jsx';

function RequireAdmin({ children }) {
  const token = localStorage.getItem('portal_admin_token');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Portal público */}
      <Route path="/"              element={<HomePage />} />
      <Route path="/earnings"      element={<EarningsCalendar />} />
      <Route path="/reporte/:slug" element={<ReportePage />} />
      <Route path="/registro"      element={<RegistroPage />} />
      <Route path="/login"         element={<LoginPage />} />

      {/* Admin */}
      <Route path="/admin/login"   element={<AdminLogin />} />
      <Route path="/admin/reportes" element={<RequireAdmin><AdminReportes /></RequireAdmin>} />
      <Route path="/admin/reportes/nuevo" element={<RequireAdmin><AdminEditorReporte /></RequireAdmin>} />
      <Route path="/admin/reportes/:id"   element={<RequireAdmin><AdminEditorReporte /></RequireAdmin>} />
      <Route path="/admin/leads"        element={<RequireAdmin><AdminLeads /></RequireAdmin>} />
      <Route path="/admin/solicitudes" element={<RequireAdmin><AdminSolicitudes /></RequireAdmin>} />
      <Route path="/admin/prospectos"  element={<RequireAdmin><AdminProspectos /></RequireAdmin>} />
      <Route path="/admin/analytics"          element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
      <Route path="/admin/visitantes"         element={<RequireAdmin><AdminVisitantes /></RequireAdmin>} />
      <Route path="/admin/visitantes/:visitorId" element={<RequireAdmin><AdminVisitanteDetalle /></RequireAdmin>} />
      <Route path="/admin"             element={<Navigate to="/admin/reportes" replace />} />
    </Routes>
  );
}
