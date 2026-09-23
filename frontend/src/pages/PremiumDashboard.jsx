import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { BarChart2, Book, Crown, FileText, Loader2, PlaySquare, Presentation, Search, Star, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import premiumService from '../features/premium/premiumService';
import PremiumContentViewer from '../components/PremiumContentViewer';

const labels = { note: 'Notes', video: 'Video Links', questionbank: 'Question Banks', ppt: 'PPTs', report: 'Reports' };
const sections = [
  { type: 'all', label: 'All Premium', description: 'Browse every premium resource.', icon: Crown },
  { type: 'note', label: 'Notes', description: 'Premium study notes.', icon: Book },
  { type: 'video', label: 'Video Links', description: 'Curated video lessons.', icon: Video },
  { type: 'questionbank', label: 'Question Banks', description: 'Practice and previous papers.', icon: FileText },
  { type: 'ppt', label: 'PPTs', description: 'Presentation resources.', icon: Presentation },
  { type: 'report', label: 'Reports', description: 'Premium reports and material.', icon: BarChart2 },
];

function PremiumDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [content, setContent] = useState([]);
  const [stars, setStars] = useState(new Set());
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([premiumService.listContent(), premiumService.listStars(user.$id)])
      .then(([items, savedStars]) => { setContent(items); setStars(savedStars); })
      .catch((error) => toast.error(error.message || 'Unable to load premium library.'))
      .finally(() => setLoading(false));
  }, [user.$id]);

  const visible = useMemo(() => content.filter((item) => {
    const matchesSection = activeSection === 'all' || item.type === activeSection;
    return matchesSection && `${item.title} ${labels[item.type] || item.type}`.toLowerCase().includes(search.toLowerCase());
  }), [content, search, activeSection]);
  const toggleStar = async (item) => {
    const starred = stars.has(item.$id);
    try {
      await premiumService.toggleStar(user.$id, item.$id, starred);
      setStars((current) => { const next = new Set(current); starred ? next.delete(item.$id) : next.add(item.$id); return next; });
    } catch (error) { toast.error(error.message || 'Could not update star.'); }
  };
  const openItem = async (item) => {
    try {
      const secure = await premiumService.getSecureView(item.$id);
      setSelected({ ...item, ...secure });
    } catch (error) { toast.error(error.message || 'Could not open this premium item.'); }
  };

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-purple-500"><Crown className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Premium library</span></div><h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Premium Dashboard</h1><p className="mt-2 text-gray-600 dark:text-gray-300">Choose a premium section to explore admin-curated resources.</p></div><label className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search premium content" className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></label></div>
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{sections.map(({ type, label, description, icon: Icon }) => <button key={type} type="button" onClick={() => setActiveSection(type)} className={`min-h-[142px] overflow-hidden rounded-lg p-6 text-left shadow transition-shadow ${activeSection === type ? 'bg-purple-700 text-white ring-2 ring-purple-300' : 'bg-white text-gray-900 hover:shadow-md dark:bg-gray-800 dark:text-white'}`}><Icon className={`h-7 w-7 ${activeSection === type ? 'text-purple-100' : 'text-purple-500'}`} /><h2 className="mt-4 text-lg font-medium">{label}</h2><p className={`mt-2 text-sm ${activeSection === type ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p></button>)}</div>
    <div className="mt-10 flex items-center justify-between"><h2 className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{sections.find((section) => section.type === activeSection)?.label}</h2><span className="text-sm text-gray-500 dark:text-gray-400">{visible.length} item{visible.length === 1 ? '' : 's'}</span></div>
    {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div> : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map((item) => <article key={item.$id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-purple-500">{labels[item.type] || item.type}</p><h2 className="mt-2 font-semibold text-gray-900 dark:text-white">{item.title}</h2></div><button onClick={() => toggleStar(item)} aria-label={stars.has(item.$id) ? 'Unstar content' : 'Star content'} className={stars.has(item.$id) ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}><Star className="h-5 w-5" fill={stars.has(item.$id) ? 'currentColor' : 'none'} /></button></div><button onClick={() => openItem(item)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500">{item.type === 'video' ? <PlaySquare className="h-4 w-4" /> : 'Open securely'}</button></article>)}</div>}
    {!loading && visible.length === 0 && <p className="py-20 text-center text-gray-500">No premium content matches your search.</p>}
    {selected && <PremiumContentViewer content={selected} onClose={() => setSelected(null)} />}
  </div>;
}

export default PremiumDashboard;