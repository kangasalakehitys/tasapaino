// Shared start-up of the Tasapaino subpages: components, municipality name,
// comparison group and lazy rendering of the articles (functions/pages-config.js).
// Articles with `indicator` use the generic indicator article; others get a
// renderer from the page script: custom[id](article, group).

import '../components/site-header.js';
import '../components/site-footer.js';
import '../components/site-submenu.js';
import '../components/share-button.js';
import '../components/pptx-button.js';
import '../components/peer-picker.js';
import { pageById } from './pages-config.js';
import { comparisonGroup, onPeersChange } from './compare.js';
import { onMunicipalityChange } from './municipality.js';
import { lazyArticles } from './article-common.js';
import { renderIndicator } from './indicator-article.js';

export function setNames(name) {
  document.querySelectorAll('[data-kunta-name]').forEach((el) => { el.textContent = name; });
}

export async function setupPage(pageId, custom = {}) {
  const page = pageById(pageId);
  const submenu = document.querySelector('site-submenu');
  let group = await comparisonGroup();
  setNames(group.main.name);
  const renderers = {};
  for (const a of page.articles) {
    if (custom[a.id]) renderers[a.id] = () => custom[a.id](a, group);
    else if (a.indicator) renderers[a.id] = () => renderIndicator(a.id, group, { id: a.indicator, intro: a.intro || [] });
  }
  const lazy = lazyArticles(submenu, renderers);
  const refresh = async () => {
    group = await comparisonGroup();
    setNames(group.main.name);
    lazy.reset();
  };
  onMunicipalityChange(() => {
    // Peers belong to the previous municipality.
    const url = new URL(location.href);
    url.searchParams.delete('verrokit');
    history.replaceState(null, '', url);
    refresh();
  });
  onPeersChange(refresh);
  return { page, get group() { return group; } };
}
