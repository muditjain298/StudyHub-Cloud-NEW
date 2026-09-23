import { useState } from 'react';
import { Search, ShieldCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';
import premiumService from '../features/premium/premiumService';

function AdminGrantPremium() {
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const find = async (event) => {
    event.preventDefault(); setLoading(true); setProfile(null);
    try {
      const found = await premiumService.findUser(query.trim());
      setProfile({ ...found, isPremium: Boolean(found.prefs?.isPremium) });
    } catch { toast.error('No profile found. Search by exact email or Appwrite user ID.'); } finally { setLoading(false); }
  };
  const setPremium = async (isPremium) => {
    try {
      const updated = await premiumService.setUserPremium(profile.$id, isPremium);
      setProfile({ ...profile, ...updated, isPremium: Boolean(updated.prefs?.isPremium) }); toast.success(isPremium ? 'Premium granted.' : 'Premium revoked.');
    } catch (error) { toast.error(error.message || 'Could not update profile.'); }
  };
  return <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manual premium access</h2><form onSubmit={find} className="mt-4 flex gap-2"><input required value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Email or Appwrite user ID" className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white" /><button disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><Search className="h-4 w-4" /> Find</button></form>{profile && <div className="mt-5 flex flex-col justify-between gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900 sm:flex-row sm:items-center"><div><p className="font-medium text-gray-900 dark:text-white">{profile.name || profile.email}</p><p className="text-xs text-gray-500">{profile.email || profile.$id}</p><p className="mt-1 text-xs text-purple-400">{profile.prefs?.isPremium ? 'Premium active' : 'Standard account'}</p></div><div className="flex gap-2"><button onClick={() => setPremium(true)} disabled={profile.prefs?.isPremium} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><ShieldCheck className="h-4 w-4" /> Grant</button><button onClick={() => setPremium(false)} disabled={!profile.prefs?.isPremium} className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><ShieldOff className="h-4 w-4" /> Revoke</button></div></div>}</section>;
}

export default AdminGrantPremium;