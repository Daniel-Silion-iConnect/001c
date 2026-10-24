// Apply the responsive default once; subsequent toggles stay under user control.
export function createDisclosureCard(title, id) {
  const card = document.createElement('details');
  card.id = id;
  card.className = 'card';
  card.open = window.matchMedia('(min-width: 900px)').matches;
  const summary = document.createElement('summary');
  summary.textContent = title;
  const content = document.createElement('div');
  content.className = 'card-content';
  card.append(summary, content);
  return { element: card, content };
}
