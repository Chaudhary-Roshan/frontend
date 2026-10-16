import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import RouteProgressBar from './RouteProgressBar';
import NetworkStatusBanner from './NetworkStatusBanner';
import PWAUpdateToast from './PWAUpdateToast';
import MobileBottomNav from './MobileBottomNav';
import ScrollToTop from './ScrollToTop';
import { PageSkeleton } from './AppShellSkeleton';

/**
 * AppShell: The persistent application architecture that wraps the entire app.
 * Maintains persistent navigation, offline status, update notifications,
 * top progress bar, and mobile bottom navigation without re-mounting.
 */
const AppShell = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-16 sm:pb-0 relative selection:bg-indigo-500 selection:text-white">
      {/* Scroll Restorer */}
      <ScrollToTop />

      {/* Top Instant Route Progress Bar */}
      <RouteProgressBar />

      {/* Offline Status Detector */}
      <NetworkStatusBanner />

      {/* PWA Update Ready Toast */}
      <PWAUpdateToast />

      {/* Persistent Shell Header */}
      <Navbar />

      {/* Dynamic Shell Body with Suspense Fallback */}
      <main className="flex-1 w-full focus:outline-none" tabIndex={-1}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Persistent Shell Footer */}
      <Footer />

      {/* Native-style Mobile Bottom App Tab Bar */}
      <MobileBottomNav />
    </div>
  );
};

export default AppShell;
