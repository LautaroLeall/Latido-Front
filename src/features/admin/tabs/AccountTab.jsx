import React, { useEffect, useState } from 'react';
import { ShieldCheck, SlidersHorizontal, CreditCard } from 'lucide-react';
import HardButton from '../../../components/ui/HardButton';
import SurveyEditor from './SurveyEditor';
import LogoSection from './account/LogoSection';
import PlanOverviewCard from './account/PlanOverviewCard';
import AccountDetailsForm from './account/AccountDetailsForm';
import UpgradePlansGrid from './account/UpgradePlansGrid';
import ChangePasswordForm from './account/ChangePasswordForm';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';

const SUBTABS = [
  {
    id: 'plan',
    label: 'Plan y datos',
    icon: CreditCard
  },
  {
    id: 'formulario',
    label: 'Preguntas del formulario',
    icon: SlidersHorizontal
  },
  {
    id: 'seguridad',
    label: 'Contraseña',
    icon: ShieldCheck
  }
];

export default function AccountTab({ business, isAdmin, onSaved }) {
  const { user, profile, updatePassword } = useAuth();
  const [subtab, setSubtab] = useState('plan');

  const [supports, setSupports] = useState(null);
  const [counts, setCounts] = useState({ branches: 0, qrTotal: 0, qrActive: 0 });
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingPlan(true);
    Promise.all([
      supabase.rpc('get_my_supports'),
      supabase.from('branches').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
      supabase.from('qr_codes').select('id, active').eq('business_id', business.id),
      supabase.from('plans').select('id, code, name, supports, price_monthly, currency, is_custom, highlighted').eq('active', true).order('sort_order', { ascending: true })
    ])
      .then(([supRes, brRes, qrRes, plRes]) => {
        if (cancelled) return;
        setSupports(supRes.error ? null : supRes.data);
        const qrList = qrRes.data || [];
        setCounts({
          branches: brRes.count ?? 0,
          qrTotal: qrList.length,
          qrActive: qrList.filter(q => q.active).length
        });
        if (!plRes.error) setPlans(plRes.data || []);
        setLoadingPlan(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingPlan(false);
      });
    return () => { cancelled = true; };
  }, [business.id]);

  const upgradePlans = plans.filter(p => p.id !== business.plan_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {SUBTABS.map(({ id, label, icon: Icon }) => (
          <HardButton
            key={id}
            size="sm"
            variant={subtab === id ? 'primary' : 'secondary'}
            onClick={() => setSubtab(id)}
            aria-pressed={subtab === id}
          >
            <Icon size={14} /> {label}
          </HardButton>
        ))}
      </div>

      {subtab === 'plan' && (
        <div className="space-y-6">
          <LogoSection business={business} isAdmin={isAdmin} onSaved={onSaved} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <PlanOverviewCard
              business={business}
              supports={supports}
              counts={counts}
              loadingPlan={loadingPlan}
            />
            <AccountDetailsForm
              business={business}
              profile={profile}
              user={user}
              isAdmin={isAdmin}
              onSaved={onSaved}
            />
          </div>

          <UpgradePlansGrid businessName={business.name} plans={upgradePlans} />
        </div>
      )}

      {subtab === 'formulario' && <SurveyEditor business={business} isAdmin={isAdmin} />}

      {subtab === 'seguridad' && <ChangePasswordForm updatePassword={updatePassword} />}
    </div>
  );
}
