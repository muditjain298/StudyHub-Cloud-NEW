const guides = [
  {
    title: 'What you can do here',
    points: [
      'Keep your study files and learning links together in one account.',
      'Arrange material by section, subject, chapter, or topic using folders.',
      'Use the dashboard cards or the sidebar to jump straight to any study section.',
    ],
  },
  {
    title: 'Notes',
    points: [
      'Keep class notes, reference documents, and reading material in one place.',
      'Create folders for subjects, units, or chapters to keep related files together.',
      'Open a resource from the list to see its file details and actions.',
    ],
  },
  {
    title: 'Video Links',
    points: [
      'Save educational video links next to the rest of your subject material.',
      'Use folders to group lectures, playlists, or topic-wise resources.',
      'Open a saved link whenever you are ready to continue studying.',
    ],
  },
  {
    title: 'Question Banks',
    points: [
      'Organize practice sets, revision questions, and previous-year papers.',
      'Group questions by course, subject, or exam topic.',
      'Keep practice material separate from notes, but still easy to find in one place.',
    ],
  },
  {
    title: 'Sharing Study Material',
    points: [
      'Share a single file or folder when classmates need specific material.',
      'Tap the share action on the resource, then copy the generated link.',
      'Only share material you have permission to distribute.',
    ],
  },
  {
    title: 'How to Use Notezyy',
    points: [
      'Sign in and choose a section from a dashboard card or the sidebar.',
      'Open a folder to browse its contents, or create a new folder from the available actions.',
      'Add a file or video link from the section controls and place it in the right folder.',
      'Select a saved resource to open it, and use its share action to send it to someone.',
      'Use the Premium Library for curated content if your account has access.',
    ],
  },
  {
    title: 'Premium Content',
    points: [
      'Browse curated notes, video links, question banks, reports, and PPTs in the Premium Library.',
      'Premium materials are arranged by section and grouped into folders for easy browsing.',
      'A premium account is required to open protected resources. The dashboard shows an upgrade option when access is not active.',
      'Premium content is curated and managed by the administrator.',
    ],
  },
];

export default function UsageGuide() {
  return (
    <div className="space-y-6">
      {guides.map((guide) => (
        <section key={guide.title}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{guide.title}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600 dark:text-gray-300">
            {guide.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}