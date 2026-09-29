import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AuthPage from './components/auth/AuthPage';
import ClinicSelect from './components/clinic/ClinicSelect';
import AppShell from './components/layout/AppShell';
import PatientsPage from './components/patients/PatientsPage';
import TreatmentPlanPage from './components/treatment/TreatmentPlanPage';
import PricePage from './components/price/PricePage';
import CalendarPage from './components/calendar/CalendarPage';
import FinancePage from './components/finance/FinancePage';
import type { Clinic, Profile } from './types';

export default function App() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (data) setProfile(data as Profile);
      }
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        setProfile(null);
        setClinic(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (data) setProfile(data as Profile);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-gray-800 animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!profile && <Route path="*" element={<AuthPage />} />}

        {profile && !clinic && (
          <Route path="*" element={<ClinicSelect onSelect={setClinic} />} />
        )}

        {profile && clinic && (
          <Route path="/app" element={<AppShell profile={profile} clinic={clinic} />}>
            <Route index element={<Navigate to="patients" replace />} />
            <Route path="patients" element={<PatientsPage clinic={clinic} />} />
            <Route path="treatment" element={<TreatmentPlanPage clinic={clinic} />} />
            <Route path="price" element={<PricePage clinic={clinic} />} />
            <Route path="calendar" element={<CalendarPage clinic={clinic} />} />
            <Route path="finance" element={<FinancePage clinic={clinic} />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}