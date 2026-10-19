import React, { useState } from 'react';
import {
  Home,
  Route,
  Radar,
  Bell,
  Globe,
  Calendar,
  X,
  Menu,
  Headset,
  HelpCircle,
  Settings,
  Languages,
  ChevronRight,
  Accessibility,
  MonitorDown,
} from 'lucide-react';
import { FerryIcon, FerryDockIcon, BoardingPassIcon } from './icons';
import { useInstallPrompt } from '../lib/pwa';
import { Language } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  activeAlertCount: number;
  ticketCount: number;
  highContrast: boolean;
  toggleHighContrast: () => void;
  onOpenCustomerCare?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  activeAlertCount,
  ticketCount,
  highContrast,
  toggleHighContrast,
  onOpenCustomerCare,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { canInstall, promptInstall } = useInstallPrompt();

  // Desktop Navigation Items
  const desktopNavItems = [
    { id: 'home', labelEn: 'Home', labelTa: 'முகப்பு' },
    { id: 'plan', labelEn: 'Book & Plan', labelTa: 'திட்டம்' },
    { id: 'live-map', labelEn: 'Live Radar', labelTa: 'நேரலை' },
    { id: 'stations', labelEn: 'Terminals', labelTa: 'முனையங்கள்' },
    { id: 'routes', labelEn: 'Lines', labelTa: 'தடங்கள்' },
    { id: 'timetable', labelEn: 'Fares', labelTa: 'கட்டணம்' },
    { id: 'tickets', labelEn: 'My Passes', labelTa: 'டிக்கெட்', badge: ticketCount },
  ];

  // Mobile Bottom Navigation Bar
  const mobileBottomTabs = [
    { id: 'home', labelEn: 'Home', labelTa: 'முகப்பு', icon: Home },
    { id: 'plan', labelEn: 'Plan', labelTa: 'திட்டம்', icon: Route },
    { id: 'live-map', labelEn: 'Radar', labelTa: 'நேரலை', icon: Radar },
    { id: 'stations', labelEn: 'Terminals', labelTa: 'முனையம்', icon: FerryDockIcon },
    { id: 'tickets', labelEn: 'Passes', labelTa: 'டிக்கெட்', icon: BoardingPassIcon, badge: ticketCount },
  ];

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP NAVBAR (Web App Design System)                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <header className="anim-drop h-[70px] sm:h-[74px] sticky top-0 z-40 bg-surface/96 backdrop-blur-md border-b border-line px-4 sm:px-[6%] flex items-center justify-between text-content max-w-full">
        
        {/* Brandmark Identity */}
        <div className="flex items-center space-x-2.5 shrink-0 min-w-0">
          <button
            onClick={() => handleSelectTab('home')}
            className="focus:outline-none cursor-pointer flex items-center gap-2.5 sm:gap-3 group"
            aria-label="NEERMETRO Home"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img
                src="/logo/neermetro-3d-mark.png"
                alt="NEERMETRO 3D Logo"
                className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(11,100,122,0.24)]"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[20px] sm:text-[22px] font-extrabold tracking-[-0.8px] text-content leading-none">
                NEER<span className="text-brand-text">METRO</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-tight text-muted leading-tight mt-0.5 hidden xs:inline-block">
                {language === 'en' ? 'Chennai Water Metro' : 'சென்னை வாட்டர் மெட்ரோ'}
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-[13px]">
          {desktopNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`relative font-medium transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                  isActive
                    ? 'active-card font-bold'
                    : 'text-muted hover:bg-surface-2 hover:text-content border border-transparent'
                }`}
              >
                <span>{language === 'en' ? item.labelEn : item.labelTa}</span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-brand text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Controls & CTAs */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* 24/7 Helpline & Support (Desktop only) */}
          {onOpenCustomerCare && (
            <button
              onClick={onOpenCustomerCare}
              className="hidden lg:flex px-3 py-1.5 rounded-xl bg-brand-tint hover:bg-brand-tint-2 border border-brand-line text-brand-text text-[12px] font-bold transition-all cursor-pointer items-center space-x-1.5 shadow-2xs touch-manipulation"
              title="24/7 Passenger Helpline & Support"
              aria-label="24/7 Passenger Helpline & Support"
            >
              <Headset className="w-3.5 h-3.5 shrink-0 text-brand-text" />
              <span>{language === 'en' ? 'Support' : 'உதவி'}</span>
            </button>
          )}

          {/* Service Alerts / Notifications (Desktop only) */}
          <button
            onClick={() => handleSelectTab('alerts')}
            className={`hidden lg:flex relative p-2 rounded-xl border text-xs transition-colors cursor-pointer items-center ${
              activeAlertCount > 0
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-surface border-line text-muted hover:text-content'
            }`}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center font-mono">
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Language Switcher (Desktop only) */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-surface border border-line hover:border-inverse text-content text-[11px] font-bold transition-colors cursor-pointer items-center space-x-1"
            title="Switch Language"
            aria-label="Switch Language"
          >
            <Globe className="w-3 h-3 text-brand-text" />
            <span>{language === 'en' ? 'தமிழ்' : 'EN'}</span>
          </button>

          {/* Install as desktop app (only when the browser offers it) */}
          {canInstall && (
            <button
              onClick={() => {
                void promptInstall();
              }}
              className="hidden lg:flex px-3 py-1.5 rounded-xl bg-inverse hover:bg-brand text-white text-[12px] font-bold transition-colors cursor-pointer items-center space-x-1.5 shadow-2xs"
              title="Install NEERMETRO as a desktop app"
              aria-label="Install NEERMETRO as a desktop app"
            >
              <MonitorDown className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Install app' : 'ஆப் நிறுவு'}</span>
            </button>
          )}

          {/* Book Now Primary Button (Desktop) */}
          <button
            onClick={() => handleSelectTab('plan')}
            className="!hidden xl:!inline-flex primary-button !py-2 !px-4 text-[12px]"
          >
            {language === 'en' ? 'Book Journey' : 'பயணப் பதிவு'}
          </button>

          {/* Mobile Navigation Drawer Toggle */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`lg:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
              isMoreMenuOpen
                ? 'bg-inverse text-white border-inverse'
                : 'bg-surface border-line text-content hover:border-inverse'
            }`}
            aria-label="Toggle Menu"
          >
            {isMoreMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. MOBILE SIDE MENU PAGE & BACKDROP                          */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isMoreMenuOpen && (
        <>
          {/* Backdrop Overlay for clean dismissal */}
          <div
            className="fixed inset-0 bg-inverse/40 z-40 lg:hidden"
            onClick={() => setIsMoreMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Full-height side menu page (slides in from the right) */}
          <aside
            className="fixed inset-y-0 right-0 z-50 w-[min(88vw,340px)] bg-surface border-l border-line shadow-[0_0_60px_rgba(17,19,21,0.25)] flex flex-col lg:hidden"
            aria-label="Navigation menu"
          >
            {/* Side page header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <div className="text-lg font-extrabold text-content leading-tight">
                {language === 'en' ? 'Menu' : 'மெனு'}
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-9 h-9 rounded-full border border-line bg-surface flex items-center justify-center text-content hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable menu content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 pb-24">
              {/* ── Help & Support ── */}
              {onOpenCustomerCare && (
                <div>
                  <div className="eyebrow mb-2">
                    {language === 'en' ? 'HELP & SUPPORT' : 'உதவி & ஆதரவு'}
                  </div>
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenCustomerCare();
                    }}
                    className="w-full p-3.5 rounded-xl bg-brand-tint border border-brand-line text-brand-text font-bold text-left transition-all cursor-pointer flex items-center justify-between hover:bg-brand-tint-2"
                  >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <HelpCircle className="w-4 h-4 shrink-0 text-brand-text" />
                    <div className="min-w-0">
                      <span className="truncate block text-xs font-bold text-content">
                        {language === 'en' ? 'Help & Support' : 'உதவி மையம்'}
                      </span>
                      <span className="text-[10px] text-muted font-normal block truncate mt-0.5">
                        {language === 'en' ? '24/7 Helpline · Live Chat · Refunds' : '24/7 உதவி · நேரலை உரை · ரீஃபண்ட்'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </button>
                </div>
              )}

              {/* ── Install App ── */}
              {canInstall && (
                <div>
                  <div className="eyebrow mb-2">
                    {language === 'en' ? 'DESKTOP & MOBILE APP' : 'டெஸ்க்டாப் & மொபைல் ஆப்'}
                  </div>
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      void promptInstall();
                    }}
                    className="w-full p-3.5 rounded-xl bg-inverse text-white font-bold text-left transition-all cursor-pointer flex items-center justify-between hover:bg-brand"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MonitorDown className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <span className="truncate block text-xs font-bold">
                          {language === 'en' ? 'Install as an app' : 'ஆப்பாக நிறுவு'}
                        </span>
                        <span className="text-[10px] text-white/70 font-normal block truncate mt-0.5">
                          {language === 'en'
                            ? 'Launch from your home screen or desktop'
                            : 'ஹோம் ஸ்கிரீன் / டெஸ்க்டாப்பில் இருந்து திற'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
                  </button>
                </div>
              )}

              {/* ── Fares & Timetable ── */}
              <div>
                <div className="eyebrow mb-2">
                  {language === 'en' ? 'FARES & TIMETABLE' : 'கட்டணம் & அட்டவணை'}
                </div>
                <button
                  onClick={() => handleSelectTab('timetable')}
                  className={`w-full p-3.5 rounded-xl border font-bold text-left transition-colors cursor-pointer flex items-center justify-between ${
                    currentTab === 'timetable'
                      ? 'active-card'
                      : 'bg-surface-2 border-line text-content hover:border-brand'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {language === 'en' ? 'Fares & Timetable' : 'கட்டணம் & அட்டவணை'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </button>
              </div>

              {/* ── App Settings ── */}
              <div>
                <div className="eyebrow mb-2 flex items-center gap-1.5">
                  <Settings className="w-3 h-3" />
                  <span>{language === 'en' ? 'APP SETTINGS' : 'செயலி அமைப்புகள்'}</span>
                </div>
                <div className="space-y-2">
                  {/* App Language */}
                  <div className="p-3 rounded-xl bg-surface-2 border border-line">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Languages className="w-4 h-4 shrink-0 text-brand-text" />
                        <span className="text-[12px] font-bold text-content truncate">
                          {language === 'en' ? 'App Language' : 'செயலி மொழி'}
                        </span>
                      </div>
                      <div className="inline-flex rounded-lg bg-surface p-0.5 border border-line shrink-0">
                        {(['en', 'ta'] as Language[]).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                              language === lang
                                ? 'bg-brand text-white'
                                : 'text-muted hover:text-content'
                            }`}
                          >
                            {lang === 'en' ? 'EN' : 'தமிழ்'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <button
                    onClick={() => handleSelectTab('alerts')}
                    className={`w-full p-3 rounded-xl border font-bold text-left transition-colors cursor-pointer flex items-center justify-between ${
                      currentTab === 'alerts'
                        ? 'active-card'
                        : 'bg-surface border-line text-content hover:border-brand'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Bell className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {language === 'en' ? 'Notifications' : 'அறிவிப்புகள்'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        activeAlertCount > 0
                          ? 'bg-amber-500 text-white'
                          : 'bg-surface-2 text-muted border border-line'
                      }`}
                    >
                      {activeAlertCount}
                    </span>
                  </button>

                  {/* Accessibility / High Contrast */}
                  <button
                    onClick={() => toggleHighContrast()}
                    className="w-full p-3 bg-surface border border-line rounded-xl font-bold text-left hover:border-brand cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Accessibility className="w-4 h-4 shrink-0 text-brand-text" />
                      <span className="truncate">
                        {language === 'en' ? 'Accessibility' : 'அணுகல்தன்மை'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-brand-text bg-brand-tint border border-brand-line px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {highContrast ? (language === 'en' ? 'High' : 'அதிக') : (language === 'en' ? 'Standard' : 'இயல்பு')}
                    </span>
                  </button>
                </div>
              </div>

              <div className="text-center pt-1">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-content">
                  <FerryIcon className="w-4 h-4 text-brand-text" />
                  NEER<span className="text-brand-text">METRO</span>
                </span>
                <span className="text-[10px] text-muted font-mono block mt-1.5">
                  {language === 'en'
                    ? 'Chennai Water Metro · Government of Tamil Nadu'
                    : 'சென்னை நீர் மெட்ரோ · தமிழ்நாடு அரசு'}
                </span>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. MINIMAL FLOATING OVAL MOBILE NAVIGATION DOCK              */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-[max(14px,env(safe-area-inset-bottom,14px))] left-1/2 -translate-x-1/2 z-40 pointer-events-none w-auto max-w-[calc(100vw-24px)]">
        <nav
          className="pointer-events-auto bg-surface/96 backdrop-blur-xl border border-line rounded-full p-1.5 shadow-[0_12px_36px_-6px_rgba(17,19,21,0.16),0_4px_16px_rgba(11,100,122,0.08)] flex items-center gap-1"
          aria-label="Mobile Navigation Dock"
        >
          {mobileBottomTabs.map((tab) => {
            const Icon = tab.icon;
            // Terminals tab also lights up when viewing routes or timetable
            const isActive =
              tab.id === 'stations'
                ? currentTab === 'stations' || currentTab === 'routes' || currentTab === 'timetable'
                : currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center rounded-full transition-all duration-150 cursor-pointer min-w-[54px] sm:min-w-[62px] h-11 px-2.5 sm:px-3 relative active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand to-[#06404e] text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-muted hover:text-content hover:bg-surface-2'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.1} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`absolute -top-1 -right-2 px-1 text-[8px] font-mono font-bold rounded-full ${
                        isActive
                          ? 'bg-surface text-brand-text ring-1 ring-brand'
                          : 'bg-brand text-white ring-1 ring-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] tracking-tight leading-none mt-1 ${
                    isActive ? 'font-bold text-white' : 'font-medium'
                  }`}
                >
                  {language === 'en' ? tab.labelEn : tab.labelTa}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

