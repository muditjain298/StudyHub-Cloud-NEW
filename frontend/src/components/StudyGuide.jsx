import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, FileText, Link2, Pencil, Presentation, Save, Video, X, Crown, ListChecks } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { appwriteConfig } from '../lib/appwrite';
import guideService from '../features/guide/guideService';

const guideSections = [
  { key: 'overview', title: 'What you can do here', icon: BookOpen },
  { key: 'notes', title: 'Notes', icon: FileText, to: '/notes' },
  { key: 'videos', title: 'Video Links', icon: Video, to: '/videos' },
  { key: 'questions', title: 'Question Banks', icon: ClipboardList, to: '/questions' },
  { key: 'reports', title: 'Reports', icon: FileText, to: '/reports' },
  { key: 'presentations', title: 'PPTs', icon: Presentation, to: '/ppts' },
  { key: 'sharing', title: 'Sharing study material', icon: Link2 },
  { key: 'howToUse', title: 'How to use Notezyy', icon: ListChecks, ordered: true },
  { key: 'premium', title: 'Premium Content', icon: Crown, to: '/premium', featured: true },
];

const defaultGuide = {
  overview: [
    'Keep study files and learning links together in one account instead of searching across chats and devices.',
    'Arrange material by section, subject, chapter, or topic using folders.',
    'Open your dashboard cards or the sidebar to jump directly to a study section.',
  ].join('\n'),
  notes: [
    'Keep class notes, reference documents, and reading material together.',
    'Create folders for subjects, units, or chapters so related files stay grouped.',
    'Open a resource from the list to view its available file details and actions.',
  ].join('\n'),
  videos: [
    'Save educational video links alongside the rest of your subject material.',
    'Use folders to group lectures, playlists, or topic-specific resources.',
    'Open a saved link when you are ready to continue studying.',
  ].join('\n'),
  questions: [
    'Organize practice sets, revision questions, and previous-year papers.',
    'Group question material by course, subject, or exam topic.',
    'Keep practice resources separate from notes while still finding them in one place.',
  ].join('\n'),
  reports: [
    'Keep project reports, lab work, and academic reference documents organized.',
    'Use folders for courses, assignments, or semesters.',
    'Return to saved reports from the dashboard or Reports section.',
  ].join('\n'),
  presentations: [
    'Store lecture slides, class presentations, and revision decks.',
    'Group slide decks by subject, chapter, or project.',
    'Keep presentations close to related notes and question material.',
  ].join('\n'),
  sharing: [
    'Share a selected file or folder when classmates need specific material.',
    'Use the share action on the resource you want to send, then copy its generated link.',
    'Only share material you have permission to distribute.',
  ].join('\n'),
  howToUse: [
    'Sign in and choose a section from a dashboard card or the sidebar.',
    'Open a folder to browse its contents, or use the available actions to create a folder.',
    'Add a file or video link from the section controls and place it in the relevant folder.',
    'Select a saved resource to open it; use its share action when you need to send it to someone.',
    'Use the Premium Library for curated content when your account has access.',
  ].join('\n'),
  premium: [
    'Browse curated notes, video links, question banks, reports, and PPTs in the Premium Library.',
    'Premium materials are arranged by section and can be grouped into folders for easier browsing.',
    'A premium account is required to access protected premium resources; the dashboard shows the upgrade option when access is not active.',
    'Premium content is curated and managed by the administrator.',
  ].join('\n'),
};

function StudyGuide() {
  const { user } = useSelector((state) => state.auth);
  const [editing, setEditing] = useState(false);
  const [guide, setGuide] = useState(defaultGuide);
  const [draft, setDraft] = useState(defaultGuide);
  const [saving, setSaving] = useState(false);
  const isAdmin = Boolean(
    appwriteConfig.adminUserId && user?.$id === appwriteConfig.adminUserId
  );

  useEffect(() => {
    let isActive = true;

    guideService.get()
      .then((row) => {
        if (isActive) {
          let savedContent = {};
          try {
            savedContent = row.content ? JSON.parse(row.content) : {};
          } catch (error) {
            console.warn('Could not parse the saved study guide:', error);
          }

          setGuide({
            ...defaultGuide,
            ...savedContent,
            overview: savedContent.overview || row.uses || defaultGuide.overview,
            howToUse: savedContent.howToUse || row.instructions || defaultGuide.howToUse,
          });
        }
      })
      .catch((error) => {
        if (error.code !== 404) {
          console.warn('Could not load the study guide:', error);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const startEditing = () => {
    setDraft(guide);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(guide);
    setEditing(false);
  };

  const saveGuide = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const saved = Object.fromEntries(
        guideSections.map(({ key }) => [key, draft[key].trim()])
      );
      await guideService.save(saved, user.$id);
      setGuide(saved);
      setEditing(false);
      toast.success('Study guide updated.');
    } catch (error) {
      toast.error(error.message || 'Could not save the study guide.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-700">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Notezyy guide</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Explore your study space</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">What each section is for, how to use it, and what Premium includes.</p>
        </div>
        {isAdmin && !editing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Pencil className="h-4 w-4" /> Edit guide
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={saveGuide} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {guideSections.map(({ key, title }) => (
              <label key={key} className="block rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</span>
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">Enter one point per line.</span>
                <textarea
                  required
                  rows={5}
                  value={draft[key]}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                  className="mt-2 block w-full resize-y rounded border border-gray-300 bg-white p-2 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancelEditing} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
              <X className="h-4 w-4" /> Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save guide'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {guideSections.map(({ key, title, icon: Icon, to, ordered, featured }) => {
            const points = guide[key].split('\n').map((point) => point.trim()).filter(Boolean);
            const List = ordered ? 'ol' : 'ul';

            return (
              <article key={key} className={`rounded-lg border p-5 ${featured ? 'border-indigo-200 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/30' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${featured ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`} />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <List className={`mt-3 space-y-2 pl-5 text-sm leading-relaxed text-gray-600 dark:text-gray-300 ${ordered ? 'list-decimal' : 'list-disc'}`}>
                  {points.map((point, index) => <li key={`${key}-${index}`}>{point}</li>)}
                </List>
                {to && (
                  <a href={to} className="mt-4 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200">
                    Open {title} <span aria-hidden="true" className="ml-1">→</span>
                  </a>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default StudyGuide;