// <site-submenu> — shared submenu that behaves like tabs (spec:
// backend/md/site/submenu.md). Shows one child <article data-tab="Label"> at a
// time; articles with data-group="Group" get a second level: a row of groups
// and below it the tabs of the selected group.
//
//   <site-submenu label="Talouden artikkelit">
//     <article id="a" data-tab="First" data-group="Tulos">…</article>
//     <article id="b" data-tab="Second" data-group="Kulut">…</article>
//   </site-submenu>
//
// Markup: <nav> with semantic lists (<ul role="tablist">, <li role="presentation">,
// <a role="tab" href="#id">), so the links work without scripts too.
// The URL hash selects the tab: #<article-id> or the id of any element inside
// an article, so share links and search results open the right tab (and group).
// Choosing a tab writes #<article-id> to the URL and dispatches 'tab-change' { id }.
//
// Many tabs: when the selected group (or a submenu without groups) has more
// tabs than the attribute `list-after` (default 8), the tabs are shown as a
// link list in two columns instead of one scrolling row.

import { escapeHtml } from '../functions/format.js';

// Arrow keys, Home and End move between the tabs of one row (WAI-ARIA tabs
// pattern); in the link list the up and down arrows move too.
const STEPS = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 };
const LIST_AFTER = 8;

class SiteSubmenu extends HTMLElement {
  connectedCallback() {
    if (this.nav) return;
    this.articles = [...this.querySelectorAll(':scope > article[data-tab]')];
    this.groups = [...new Set(this.articles.map((a) => a.dataset.group).filter(Boolean))];
    // Last viewed article of each group, so switching groups returns there.
    this.lastInGroup = new Map();

    const label = escapeHtml(this.getAttribute('label') || 'Artikkelit');
    this.nav = document.createElement('nav');
    this.nav.className = 'submenu';
    this.nav.setAttribute('aria-label', this.getAttribute('label') || 'Artikkelit');
    this.nav.innerHTML =
      (this.groups.length ? `<ul class="submenu__groups" role="tablist" aria-label="${label}: aiheet"></ul>` : '') +
      `<ul class="submenu__tabs" role="tablist" aria-label="${label}"></ul>`;
    this.groupList = this.nav.querySelector('.submenu__groups');
    this.tabList = this.nav.querySelector('.submenu__tabs');

    this.groupLinks = this.groups.map((group, i) => {
      const first = this.articles.find((a) => a.dataset.group === group);
      const link = this.createTab(`${this.id || 'submenu'}-group-${i}`, group, first.id);
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.select(this.lastInGroup.get(group) || first.id, { updateUrl: true });
      });
      this.groupList.append(link.parentElement);
      return link;
    });

    this.tabLinks = this.articles.map((article) => {
      const link = this.createTab(`${article.id}-tab`, article.dataset.tab, article.id);
      link.setAttribute('aria-controls', article.id);
      article.setAttribute('role', 'tabpanel');
      article.setAttribute('aria-labelledby', link.id);
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.select(article.id, { updateUrl: true });
      });
      this.tabList.append(link.parentElement);
      return link;
    });

    this.groupList?.addEventListener('keydown', (e) => this.onKey(e, this.groupLinks.filter((l) => !l.hidden)));
    this.tabList.addEventListener('keydown', (e) => this.onKey(e, this.tabLinks.filter((l) => !l.parentElement.hidden)));

    this.prepend(this.nav);
    this.select(this.fromHash() || this.articles[0]?.id);
    window.addEventListener('hashchange', () => {
      const id = this.fromHash();
      if (id) this.select(id);
    });
  }

  createTab(id, text, target) {
    const li = document.createElement('li');
    li.setAttribute('role', 'presentation');
    const link = document.createElement('a');
    link.id = id;
    link.href = `#${target}`;
    link.setAttribute('role', 'tab');
    link.textContent = text;
    li.append(link);
    return link;
  }

  onKey(e, links) {
    const i = links.indexOf(document.activeElement);
    if (i < 0) return;
    let next;
    const vertical = e.key === 'ArrowDown' || e.key === 'ArrowUp';
    if (vertical && !e.currentTarget.classList.contains('submenu__tabs--list')) return;
    if (e.key in STEPS) next = links[(i + STEPS[e.key] + links.length) % links.length];
    else if (e.key === 'Home') next = links[0];
    else if (e.key === 'End') next = links.at(-1);
    else return;
    e.preventDefault();
    next.click();
    // The clicked link may be a group whose click selects an article: focus
    // the link that is selected in the same row.
    (links.find((l) => l.getAttribute('aria-selected') === 'true') || next).focus();
  }

  // A row for a few tabs, a two-column link list for many. The list fills the
  // left column first, so the order reads from top to bottom.
  layoutTabs() {
    const visible = this.tabLinks.filter((l) => !l.parentElement.hidden).length;
    const limit = Number(this.getAttribute('list-after')) || LIST_AFTER;
    const list = visible > limit;
    this.tabList.classList.toggle('submenu__tabs--list', list);
    this.tabList.setAttribute('aria-orientation', list ? 'vertical' : 'horizontal');
    this.tabList.style.setProperty('--submenu-rows', list ? String(Math.ceil(visible / 2)) : '');
  }

  get selected() {
    return this.current;
  }

  // Article that contains the element named by the URL hash.
  fromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    return target ? this.articles.find((a) => a.contains(target))?.id ?? null : null;
  }

  select(id, { updateUrl = false } = {}) {
    const selected = this.articles.find((a) => a.id === id);
    if (!selected) return;
    const group = selected.dataset.group;
    if (group) this.lastInGroup.set(group, id);

    this.groupLinks.forEach((link, i) => {
      const on = this.groups[i] === group;
      link.setAttribute('aria-selected', String(on));
      link.tabIndex = on ? 0 : -1;
    });
    this.articles.forEach((article, i) => {
      const on = article === selected;
      const link = this.tabLinks[i];
      article.hidden = !on;
      // Only the tabs of the selected group are shown.
      link.parentElement.hidden = Boolean(group) && article.dataset.group !== group;
      link.setAttribute('aria-selected', String(on));
      link.tabIndex = on ? 0 : -1;
    });
    this.layoutTabs();
    if (updateUrl) {
      const url = new URL(location.href);
      url.hash = id;
      history.replaceState(null, '', url);
    }
    if (id !== this.current) {
      this.current = id;
      this.dispatchEvent(new CustomEvent('tab-change', { detail: { id } }));
    }
  }
}

customElements.define('site-submenu', SiteSubmenu);
