/**
 * AdminAccess.jsx
 *
 * Admin-only page at /admin/access
 * Lists all users from the profiles table with their premium status.
 * Premium status comes from the premiumAccess table (rowId = user ID).
 * Grant / remove goes through premiumService.setUserPremium.
 *
 * Real security: Appwrite Console permissions (label: admin).
 */

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Users,
  Crown,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { tablesDB, appwriteConfig } from '../lib/appwrite';
import { Query } from 'appwrite';
import premiumService from '../features/premium/premiumService';

const PAGE_SIZE = 50;

function AdminAccess() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // UI guard only. Real protection is Appwrite permissions.
  const isAdmin =
    user?.$id === appwriteConfig.adminUserId ||
    user?.prefs?.role === 'admin' ||
    user?.labels?.includes('admin');

  const [profiles, setProfiles] = useState([]);
  const [premiumIds, setPremiumIds] = useState(new Set());
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(null); // profile.$id being updated

  // ── Load profiles + premium access rows ────────────────
  const loadProfiles = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [profileRes, accessRes] = await Promise.all([
        tablesDB.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.profileCollectionId,
          queries: [Query.limit(PAGE_SIZE), Query.orderDesc('$createdAt')],
        }),
        tablesDB.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.premiumAccessCollectionId,
          queries: [Query.limit(100)],
        }),
      ]);

      // premiumAccess rowId = user ID
      setPremiumIds(new Set(accessRes.rows.map((row) => row.$id)));
      setProfiles(profileRes.rows);
      setFiltered(profileRes.rows);
    } catch (error) {
      console.error('[AdminAccess] loadProfiles error:', error);
      toast.error(error?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // ── Search filter ──────────────────────────────────────
  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      setFiltered(profiles);
      return;
    }
    setFiltered(
      profiles.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          (p.$id || '').toLowerCase().includes(q)
      )
    );
  }, [searchTerm, profiles]);

  // ── Toggle premium ─────────────────────────────────────
  const togglePremium = async (profile, newValue) => {
    if (!isAdmin) {
      toast.error('Only admin can change premium access.');
      return;
    }

    setUpdating(profile.$id);
    try {
      // profile.$id must equal the Appwrite Auth user ID
      await premiumService.setUserPremium(profile.$id, newValue);

      setPremiumIds((prev) => {
        const next = new Set(prev);
        if (newValue) next.add(profile.$id);
        else next.delete(profile.$id);
        return next;
      });

      toast.success(
        newValue
          ? `Premium granted to ${profile.name || profile.email}.`
          : `Premium revoked from ${profile.name || profile.email}.`
      );
    } catch (error) {
      console.error('[AdminAccess] togglePremium error:', error);
      toast.error(error?.message || 'Failed to update access.');
    } finally {
      setUpdating(null);
    }
  };

  // ── Redirect if not admin ──────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-20 text-center">
        <ShieldOff className="h-12 w-12 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          This page is restricted to administrators.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  const premiumCount = profiles.filter((p) => premiumIds.has(p.$id)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Panel
        </button>

        <div className="flex items-center gap-2 text-purple-500">
          <Users className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.18em]">
            Admin
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          User Access Management
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Grant or remove premium access for any registered user.
          {!loading && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <Crown className="h-3 w-3" />
              {premiumCount} premium user{premiumCount !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          id="admin-access-search"
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email or user ID…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* User list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No users matched your search.' : 'No profiles found.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((profile) => {
              const isPremium = premiumIds.has(profile.$id);
              const isUpdating = updating === profile.$id;
              const isCurrentAdmin = profile.$id === appwriteConfig.adminUserId;

              return (
                <div
                  key={profile.$id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* User info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 uppercase">
                        {(profile.name || profile.email || '?').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {profile.name || 'No name'}
                          {isCurrentAdmin && (
                            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {profile.email || profile.$id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isPremium
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {isPremium ? (
                        <>
                          <Crown className="h-3 w-3" /> Premium
                        </>
                      ) : (
                        'Standard'
                      )}
                    </span>

                    {/* Skip action buttons for the admin row itself */}
                    {!isCurrentAdmin && (
                      isUpdating ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : isPremium ? (
                        <button
                          type="button"
                          id={`revoke-premium-${profile.$id}`}
                          onClick={() => togglePremium(profile, false)}
                          className="flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          Remove access
                        </button>
                      ) : (
                        <button
                          type="button"
                          id={`grant-premium-${profile.$id}`}
                          onClick={() => togglePremium(profile, true)}
                          className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Give access
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Showing {filtered.length} of {profiles.length} registered users.
        Reload to refresh the list.
      </p>
    </div>
  );
}

export default AdminAccess;