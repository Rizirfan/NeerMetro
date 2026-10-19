import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { JourneyPlannerView } from './components/JourneyPlannerView';
import { LiveMapView } from './components/LiveMapView';
import { StationsView } from './components/StationsView';
import { RoutesView } from './components/RoutesView';
import { TimetableFaresView } from './components/TimetableFaresView';
import { MyTicketsView } from './components/MyTicketsView';
import { BookingTicketModal } from './components/BookingTicketModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { CustomerCareModal } from './components/CustomerCareModal';
import { CancellationRefundModal } from './components/CancellationRefundModal';
import { AlertsBanner } from './components/AlertsBanner';
import { Language, Ferry, Ticket, ServiceAlert, JourneyPlan } from './types';
import { INITIAL_FERRIES, INITIAL_ALERTS } from './data/mockData';
import { gpsSimulator } from './services/gpsSimulator';
import { TriangleAlert, Info } from 'lucide-react';
import { SplashWaveLoader } from './components/SplashWaveLoader';
// NEERMETRO Mobility Suite

/** Boot splash hold time — the wave loader completes exactly in this window. */
const SPLASH_HOLD_MS = 1500;

export function App() {
  const validTabs = ['home', 'plan', 'live-map', 'stations', 'routes', 'timetable', 'tickets', 'alerts'];
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    return validTabs.includes(hash) ? hash : 'home';
  };

  const [currentTab, setCurrentTab] = useState<string>(getInitialTab);
  const [language, setLanguage] = useState<Language>('en');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Boot splash — plays on every launch (browser and installed app alike),
  // then lifts away to reveal the home page.
  const [splashPhase, setSplashPhase] = useState<'in' | 'out' | 'done'>('in');

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setSplashPhase('out'), SPLASH_HOLD_MS);
    const unmountTimer = window.setTimeout(() => setSplashPhase('done'), SPLASH_HOLD_MS + 700);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(unmountTimer);
    };
  }, []);

  // Real-time Fleet Telemetry state
  const [liveFerries, setLiveFerries] = useState<Ferry[]>(INITIAL_FERRIES);

  // Tickets Wallet
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'tkt_init_01',
      bookingRef: 'CM48291',
      originCode: 'KOY',
      destinationCode: 'EGM',
      originName: 'Koyambedu Central Hub',
      destinationName: 'Egmore Station Quay',
      passengerCount: 2,
      fareInr: 70,
      journeyDate: '18 Oct 2026',
      departureTime: '10:20 AM',
      routeCode: 'C1',
      status: 'ACTIVE',
      qrSignature: 'COUMETRO_CM48291_PAX2_SIG_ED25519_VALID',
      createdAt: '10:14 AM',
    },
  ]);

  // Service Alerts
  const [alerts] = useState<ServiceAlert[]>(INITIAL_ALERTS);

  // Journey Search State
  const [searchOrigin, setSearchOrigin] = useState<string>('KOY');
  const [searchDest, setSearchDest] = useState<string>('EGM');
  const [searchRevision, setSearchRevision] = useState<number>(0);
  const [selectedPlanForBooking, setSelectedPlanForBooking] = useState<JourneyPlan | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);
  const [autoStartVoice, setAutoStartVoice] = useState<boolean>(false);
  const [isCustomerCareOpen, setIsCustomerCareOpen] = useState<boolean>(false);
  const [ticketToCancel, setTicketToCancel] = useState<Ticket | null>(null);

  // Subscribe to Live GPS Telemetry Simulator
  useEffect(() => {
    const unsubscribe = gpsSimulator.subscribe((updatedFerries) => {
      setLiveFerries(updatedFerries);
    });
    return () => unsubscribe();
  }, []);

  // History-integrated navigation (so browser / Android back button returns
  // to the previous screen instead of closing the app entirely)
  const navigateToTab = (tab: string) => {
    setCurrentTab(tab);
    if (window.history.state?.tab !== tab) {
      window.history.pushState({ tab }, '', `#${tab}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync currentTab with browser/Android back & forward buttons
  useEffect(() => {
    const root = getInitialTab();
    // Base entry — the floor of the navigation stack.
    window.history.replaceState({ tab: root, guard: true }, '', `#${root}`);
    // Guard entry — when back reaches this, we re-push instead of letting the
    // app close. Without this, the first back-press exits the whole app.
    window.history.pushState({ tab: root }, '', `#${root}`);

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as { tab?: string; guard?: boolean } | null;

      // Reached the bottom of the stack: keep the app open, return home.
      if (!state || state.guard) {
        window.history.pushState({ tab: 'home' }, '', '#home');
        setCurrentTab('home');
        window.scrollTo({ top: 0 });
        return;
      }

      const tab = state.tab || window.location.hash.replace('#', '') || 'home';
      if (validTabs.includes(tab)) {
        setCurrentTab(tab);
        window.scrollTo({ top: 0 });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Accessibility toggle
  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  // Launch Journey Search
  const handleSearchJourneys = (origin: string, destination: string) => {
    setSearchOrigin(origin);
    setSearchDest(destination);
    setSearchRevision((r) => r + 1);
    navigateToTab('plan');
  };

  // Select Plan to Book
  const handleBookPlan = (plan: JourneyPlan) => {
    setSelectedPlanForBooking(plan);
    setIsBookingModalOpen(true);
  };

  // Ticket Generated handler
  const handleTicketGenerated = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  // Cancel Ticket with Instant Refund handler (retains pass with refund reference to avoid passenger panic)
  const handleCancelTicketWithRefund = (ticketId: string, refundDetails: { refundRef: string; refundAmount: number }) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'CANCELLED',
              cancelledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              refundAmountInr: refundDetails.refundAmount,
              refundRef: refundDetails.refundRef,
              refundStatus: 'PROCESSED',
            }
          : t
      )
    );
  };

  // Voice Assistant Action Dispatcher
  const handleVoiceAction = (intent: string, payload?: any) => {
    setIsVoiceAssistantOpen(false);

    if (intent === 'PLAN_JOURNEY') {
      const orig = payload?.origin || 'KOY';
      const dest = payload?.destination || 'EGM';
      setSearchOrigin(orig);
      setSearchDest(dest);
      setSearchRevision((r) => r + 1);
      navigateToTab('plan');
    } else if (intent === 'CUSTOMER_CARE') {
      setIsCustomerCareOpen(true);
    } else if (intent === 'CANCEL_BOOKING') {
      navigateToTab('tickets');
    } else if (intent === 'TRACK_FERRY') {
      navigateToTab('live-map');
    } else if (intent === 'SHOW_TICKET') {
      navigateToTab('tickets');
    } else if (intent === 'NEXT_FERRY') {
      navigateToTab('timetable');
    } else if (intent === 'NEAREST_STATION') {
      navigateToTab('stations');
    } else if (intent === 'FARE_INQUIRY') {
      navigateToTab('timetable');
    } else if (intent === 'SERVICE_ALERTS') {
      navigateToTab('alerts');
    } else if (intent === 'NAVIGATE_TAB') {
      const tab = payload?.tab;
      if (typeof tab === 'string' && validTabs.includes(tab)) navigateToTab(tab);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-content selection:bg-brand-line selection:text-content">
      {/* Top Disruptions / Alert Banner */}
      <AlertsBanner
        alerts={alerts}
        language={language}
        onOpenAlertsView={() => navigateToTab('alerts')}
      />

      {/* Main Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={navigateToTab}
        language={language}
        setLanguage={setLanguage}
        activeAlertCount={alerts.length}
        ticketCount={tickets.filter((t) => t.status === 'ACTIVE').length}
        highContrast={highContrast}
        toggleHighContrast={toggleHighContrast}
        onOpenCustomerCare={() => setIsCustomerCareOpen(true)}
      />

      {/* Passenger Experience */}
      <main className="flex-1 pb-28 lg:pb-8">
        {currentTab === 'home' && (
              <HomeHero
                onSearch={handleSearchJourneys}
                openVoiceAssistant={() => {
                  setAutoStartVoice(true);
                  setIsVoiceAssistantOpen(true);
                }}
                onOpenLiveMap={() => navigateToTab('live-map')}
                language={language}
                liveFerries={liveFerries}
                onOpenTab={(t) => navigateToTab(t)}
                initialOrigin={searchOrigin}
                initialDestination={searchDest}
                onOriginChange={(orig) => setSearchOrigin(orig)}
                onDestinationChange={(dest) => setSearchDest(dest)}
              />
            )}

            {currentTab === 'plan' && (
              <JourneyPlannerView
                key={`planner-${searchOrigin}-${searchDest}-${searchRevision}`}
                initialOrigin={searchOrigin}
                initialDestination={searchDest}
                onOriginChange={(orig) => setSearchOrigin(orig)}
                onDestinationChange={(dest) => setSearchDest(dest)}
                language={language}
                onBookPlan={handleBookPlan}
                onOpenLiveMap={() => navigateToTab('live-map')}
              />
            )}

            {currentTab === 'live-map' && (
              <LiveMapView
                ferries={liveFerries}
                language={language}
                onBookStation={(code) => handleSearchJourneys(code, 'EGM')}
              />
            )}

            {currentTab === 'stations' && (
              <StationsView
                language={language}
                onPlanFromStation={(code) => handleSearchJourneys(code, 'EGM')}
                onViewOnMap={() => navigateToTab('live-map')}
              />
            )}

            {currentTab === 'routes' && (
              <RoutesView
                language={language}
                onSelectRouteStations={(o, d) => handleSearchJourneys(o, d)}
                ferries={liveFerries}
                onOpenLiveMap={() => navigateToTab('live-map')}
              />
            )}

            {currentTab === 'timetable' && (
              <TimetableFaresView
                language={language}
                onBookStations={(o, d) => handleSearchJourneys(o, d)}
              />
            )}

            {currentTab === 'tickets' && (
              <MyTicketsView
                tickets={tickets}
                language={language}
                onCancelTicket={(tkt) => setTicketToCancel(tkt)}
                onOpenCustomerCare={() => setIsCustomerCareOpen(true)}
              />
            )}

            {currentTab === 'alerts' && (
              <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-[32px] font-extrabold text-content tracking-[-1.5px] mb-2">
                  {language === 'en' ? 'Live Service Alerts & Advisories' : 'நேரலை சேவை அறிவிப்புகள்'}
                </h1>
                <p className="text-[14px] text-muted mb-8 leading-relaxed">
                  {language === 'en' ? 'Newest first.' : 'புதியது முதலில்.'}
                </p>
                <div className="space-y-4">
                  {alerts.map((al) => (
                    <div
                      key={al.id}
                      className="bg-surface border border-line rounded-2xl p-6 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-mono">
                          {al.severity !== 'INFO' ? (
                            <TriangleAlert className="w-3 h-3 text-amber-600" />
                          ) : (
                            <Info className="w-3 h-3 text-sky-600" />
                          )}
                          {al.severity === 'CRITICAL'
                            ? (language === 'en' ? 'Critical' : 'முக்கியம்')
                            : al.severity === 'WARNING'
                              ? (language === 'en' ? 'Advisory' : 'எச்சரிக்கை')
                              : (language === 'en' ? 'Notice' : 'தகவல்')}
                          {' • '}
                          {al.affectedRouteCode ||
                            (language === 'en' ? 'All Lines' : 'அனைத்து தடங்கள்')}
                        </span>
                        <span className="text-[11px] font-mono text-muted">{al.timestamp}</span>
                      </div>
                      <h3 className="text-[18px] font-bold text-content">
                        {language === 'en' ? al.titleEn : al.titleTa}
                      </h3>
                      <p className="text-[13px] text-muted mt-2 leading-relaxed">
                        {language === 'en' ? al.descriptionEn : al.descriptionTa}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
      </main>

      {/* Booking Ticket Modal */}
      <BookingTicketModal
        plan={selectedPlanForBooking}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        language={language}
        onTicketGenerated={handleTicketGenerated}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => {
          setIsVoiceAssistantOpen(false);
          setAutoStartVoice(false);
        }}
        autoStartListening={autoStartVoice}
        language={language}
        onExecuteAction={handleVoiceAction}
        onOpenCustomerCare={() => setIsCustomerCareOpen(true)}
      />

      {/* 24/7 Customer Care & Helpline Modal */}
      <CustomerCareModal
        isOpen={isCustomerCareOpen}
        onClose={() => setIsCustomerCareOpen(false)}
        language={language}
        tickets={tickets}
        onOpenCancelForTicket={(tktId) => {
          setIsCustomerCareOpen(false);
          navigateToTab('tickets');
          const tkt = tickets.find((t) => t.id === tktId);
          if (tkt) setTicketToCancel(tkt);
        }}
      />

      {/* Cancellation & Refund Flow Modal */}
      <CancellationRefundModal
        ticket={ticketToCancel}
        isOpen={ticketToCancel !== null}
        onClose={() => setTicketToCancel(null)}
        language={language}
        onConfirmCancellation={handleCancelTicketWithRefund}
        onOpenCustomerCare={() => setIsCustomerCareOpen(true)}
      />

            {/* Floating 3D Assistant Access */}
      <button
        onClick={() => {
          setAutoStartVoice(true);
          setIsVoiceAssistantOpen(true);
        }}
        className="fixed bottom-[84px] lg:bottom-8 right-4 lg:right-8 z-30 group cursor-pointer focus:outline-none touch-manipulation active:scale-95 transition-all duration-300"
        title={language === 'en' ? 'NEERMETRO Voice Assistant' : 'நீர்மெட்ரோ குரல் உதவியாளர்'}
        aria-label={language === 'en' ? 'NEERMETRO Voice Assistant' : 'நீர்மெட்ரோ குரல் உதவியாளர்'}
      >
        <div className="relative flex items-center">
          {/* 3D Orb Button */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-surface via-brand-tint to-brand-tint-2 p-1 border-2 border-brand/30 shadow-[0_10px_25px_rgba(11,100,122,0.3)] group-hover:shadow-[0_12px_30px_rgba(11,100,122,0.45)] group-hover:border-brand transition-all duration-300 flex items-center justify-center">
            {/* Ambient pulse ring */}
            <span className="absolute inset-0 rounded-full bg-brand/20 animate-ping -z-10 group-hover:opacity-100 opacity-60" style={{ animationDuration: '3s' }} />

            {/* Enhanced 3D Logo Icon */}
            <img
              src="/logo/neermetro-3d-mark.png"
              alt="NEERMETRO Assistant"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(11,100,122,0.3)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
          </div>
        </div>
      </button>

      {/* Global Transportation Footer (Exact index.html Styling) */}
      <footer className="bg-surface text-muted border-t border-line mt-16 text-[11px] mb-24 lg:mb-0">
        <div className="max-w-7xl mx-auto px-[6%] py-10 flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 shrink-0">
              <img
                src="/logo/neermetro-3d-mark.png"
                alt="NEERMETRO 3D Logo"
                className="w-full h-full object-contain drop-shadow-sm select-none"
              />
            </div>
            <div>
              <div className="text-[17px] font-extrabold text-content mb-0.5 leading-none">
                NEER<span className="text-brand-text">METRO</span>
              </div>
              <div className="text-[11px] text-muted font-medium">
                {language === 'en'
                  ? 'Chennai Water Metro · Government of Tamil Nadu'
                  : 'சென்னை நீர் மெட்ரோ · தமிழ்நாடு அரசு'}
              </div>
            </div>
          </div>
          </div>

          <div className="flex flex-col sm:items-end justify-center text-[11px] text-muted">
            <div>Chennai, Tamil Nadu · Zero-Emission Electric Waterways</div>
            <div className="text-[10px] text-muted mt-0.5">© 2026 NEERMETRO Chennai. All rights reserved.</div>
          </div>
        </div>
      </footer>
      {/* App Boot Splash — full-screen rising tide */}
      {splashPhase !== 'done' && (
        <div
          className={`fixed inset-0 z-[100] overflow-hidden bg-surface ${
            splashPhase === 'out' ? 'animate-splash-reveal' : ''
          }`}
          aria-hidden={splashPhase === 'out'}
        >
          {/* Rising wave covers the lower half of the screen */}
          <SplashWaveLoader durationMs={SPLASH_HOLD_MS} />

          {/* Brand sits in the calm upper half */}
          <div
            className={`relative z-10 h-full flex flex-col items-center justify-center pb-[34vh] px-8 transition-opacity duration-300 ${
              splashPhase === 'out' ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="animate-splash-logo flex flex-col items-center">
              <img
                src="/logo/neermetro-3d-mark.png"
                alt=""
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_8px_20px_rgba(11,100,122,0.25)]"
              />
              <div className="text-[26px] sm:text-[30px] font-extrabold tracking-tight text-content leading-none mt-4">
                NEER<span className="text-brand-text">METRO</span>
              </div>
              <div className="text-[11px] sm:text-xs text-muted font-medium mt-2 text-center">
                {language === 'en'
                  ? 'Chennai Water Metro · Loading your journey…'
                  : 'சென்னை நீர் மெட்ரோ · உங்கள் பயணம் ஏற்றப்படுகிறது…'}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
