// Placeholder photos for the Gallery page (files in frontend/public/gallery-samples/).
// They show only while the Gallery has no published photos, or if the backend can't be reached.
// Once real photos are added from the admin Gallery tab, they disappear automatically.
// To switch them off entirely, set SHOW_SAMPLE_PHOTOS to false.
export const SHOW_SAMPLE_PHOTOS = true;

const s = (n) => `/gallery-samples/photo-${String(n).padStart(2, '0')}.jpg`;
const MUN = 'Model United Nations', DEB = 'Parliamentary Debates', YP = 'Yuva Sansad', IA = 'Innovation Assembly';

const rows = [
  [1, 'behind-the-scenes', MUN, 2026, 'The Hall of Flags before the opening session', 'A vaulted hall lined with national flags'],
  [2, 'behind-the-scenes', MUN, 2026, 'Delegates arriving under the flags', 'Delegates walking through a hall of flags'],
  [3, 'committee', YP, 2026, 'Drafting a bill, Lok Sabha simulation', 'Students working on laptops at desks with an Indian flag behind'],
  [4, 'committee', YP, 2026, 'The opposition bench prepares a rebuttal', 'Students discussing papers around a desk'],
  [5, 'behind-the-scenes', YP, 2026, 'Final edits on a policy brief', 'Students reviewing documents together'],
  [6, 'committee', IA, 2026, 'A pitch on the main stage', 'A founder presenting on a stage in front of large screens'],
  [7, 'committee', IA, 2026, 'The founder takes investor questions', 'A presenter on stage facing an audience'],
  [8, 'ceremonies', IA, 2026, 'Growth charts, live on the big screen', 'A conference hall with charts on large displays'],
  [9, 'behind-the-scenes', YP, 2025, 'Parliament at dusk: the study visit', 'The Indian Parliament building at sunset'],
  [10, 'behind-the-scenes', YP, 2025, 'Sansad Bhavan, evening light', 'The Parliament building with gardens in front'],
  [11, 'committee', MUN, 2025, 'General Assembly in session', 'Delegates seated at curved desks in a large assembly hall'],
  [12, 'committee', MUN, 2025, 'Bloc negotiations on the floor', 'Delegates in conversation in an assembly hall'],
  [13, 'committee', MUN, 2025, 'Moments before the vote', 'Rows of delegates in a conference hall'],
  [14, 'committee', MUN, 2025, 'Crisis Committee: the peacekeeping scenario', 'Uniformed officers gathered around a map table'],
  [15, 'committee', MUN, 2025, 'Crisis Committee: mapping the response', 'Officers discussing a map outdoors'],
  [16, 'committee', MUN, 2025, 'Crisis Committee: consensus reached', 'A group of officers around a table'],
  [17, 'behind-the-scenes', DEB, 2025, 'Science diplomacy workshop', 'Students around a holographic display'],
  [18, 'behind-the-scenes', DEB, 2025, 'Evidence before argument', 'Students studying a model of a heart'],
  [19, 'behind-the-scenes', DEB, 2025, 'Climate action field day', 'Young people planting saplings near wind turbines'],
  [20, 'behind-the-scenes', DEB, 2025, 'Data before the debate', 'Students using a drone and tablet outdoors'],
  [21, 'behind-the-scenes', MUN, 2025, 'WHO committee prep: reading the scans', 'Researchers looking at brain scans on monitors'],
  [22, 'ceremonies', MUN, 2025, 'The opening film', 'A glowing digital Earth surrounded by robotic arms'],
  [23, 'ceremonies', MUN, 2025, 'The crisis map goes live', 'A night globe marked with conflict zones'],
  [24, 'ceremonies', MUN, 2025, 'ECOSOC briefing: the undersea internet', 'Glowing data cables on the sea floor'],
];

// spread near-identical frames apart (step through the rows 7 at a time)
const mixed = rows.map((_, i) => rows[(i * 7) % rows.length]);
export const SAMPLE_GALLERY = mixed.map(([n, section, eventName, year, caption, altText]) => ({
  _id: `s${n}`, url: s(n), section, eventName, year, caption: `${caption} (sample photo)`, altText,
}));
