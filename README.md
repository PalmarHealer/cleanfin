# CleanFin

A Jellyfin theme built directly on [ElegantFin](https://github.com/lscambo13/ElegantFin) by [lscambo13](https://github.com/lscambo13), with its own neutral grey palette, a set of visual changes, and an optional script bundle for client-side tweaks.

> **About the name:** I originally called it *goodFin*, but renamed it to *CleanFin* — that felt more descriptive of what this theme actually does (and fits the lineage of "*\<adjective\>*Fin" themes).

> **History:** CleanFin used to sit on top of [NeutralFin](https://github.com/KartoffelChipss/NeutralFin) by [KartoffelChipss](https://github.com/KartoffelChipss), which was itself a copy of ElegantFin v25.11.25. NeutralFin stopped receiving updates in November 2025, which pinned CleanFin to a nine-month-old ElegantFin. The chain was therefore cut: CleanFin now imports ElegantFin directly, and the parts of NeutralFin that were still doing visible work (the grey palette and the Media Bar fixes) live in `css/002-upstream-palette.scss` and `css/003-upstream-fixes.scss`.

## Usage

Add the following to your Jellyfin custom CSS:

```css
@import url('https://cdn.jsdelivr.net/gh/PalmarHealer/cleanfin@main/style.min.css');
```

<details>
<summary>Use the unminified version</summary>

```css
@import url('https://cdn.jsdelivr.net/gh/PalmarHealer/cleanfin@main/style.css');
```

</details>

<details>
<summary>For offline use / entire compiled CSS</summary>

The all-in-one build (`style.aio.css` / `style.aio.min.css`) inlines ElegantFin at build time, so CleanFin keeps working if the upstream CDN goes down or you're using Jellyfin offline. It also embeds the Inter font and drops every Google font reference (see [Fonts](#fonts)).

It is therefore large — roughly 1.1 MB against 11 KB for `style.min.css`, almost entirely the two embedded font files. Use it when you want offline capability or zero third-party requests; otherwise `style.min.css` is the lighter choice.

```css
@import url('https://cdn.jsdelivr.net/gh/PalmarHealer/cleanfin@main/style.aio.min.css');
```

Unminified:

```css
@import url('https://cdn.jsdelivr.net/gh/PalmarHealer/cleanfin@main/style.aio.css');
```

</details>

## Fonts

ElegantFin loads Inter from `fonts.googleapis.com`. CleanFin replaces this with
[Inter v4.1](https://github.com/rsms/inter) by Rasmus Andersson, served from
this repo (`fonts/`), so no font files are ever fetched from Google.

What that means per build:

| Build | Requests to Google |
| --- | --- |
| `style.aio.css` / `style.aio.min.css` | **None.** The upstream `@import` is stripped at build time and Inter is embedded as base64. |
| `style.css` / `style.min.css` | One CSS request to `fonts.googleapis.com`. No font files are downloaded — our `@font-face` is declared after the upstream import and therefore wins. |

The remaining request in the non-AIO builds is unavoidable while ElegantFin is
imported over the network: the `@import` sits inside the upstream file, and CSS
has no way to cancel an `@import`. Use the all-in-one build if you need Google
contacted not at all.

> **Note:** ElegantFin also loads *Material Symbols Rounded* from
> `fonts.gstatic.com` for its icon set. Those are left in place — removing them
> would break the icons. Only Inter is self-hosted so far.

## Customizer

Optional snippets you can append to your Jellyfin custom CSS depending on which plugins you use:

### Media Bar plugin without trailers

If you use the Media Bar plugin but have trailers disabled, the volume button becomes useless. Hide it:

```css
.volume-toggle {
  display: none;
}
```

### IntroSkipper plugin

When the IntroSkipper plugin is active, you can tune how long the skip button stays visible:

```css
:root {
    --skip-hide-duration: 8s;
}
```

## Scripts

In addition to the theme, an optional script bundle adds a few client-side enhancements (inline search, profile dropdown, pause spotlight, Quick Connect popup, flat search grid, auto login redirect, description expander, media spec labels, Firefox warning, log suppression).

> **Note:** The scripts are designed as additions to the theme. They work standalone, but several modules (inline search, profile dropdown) create elements that CleanFin styles — without the theme they will look unstyled. For the intended look, load both.

> **Recommended loader:** Use the [Jellyfin JavaScript Injector](https://github.com/n00bcodr/Jellyfin-JavaScript-Injector) plugin to inject the script — it's far more reliable than editing `index.html` by hand and survives Jellyfin updates.

Paste the following into the injector. Each module is **opt-in** — flip the ones you want to `true`. New modules added later default to off, so updates can't silently enable anything.

```js
window.cleanFin = {
  features: {
    suppressBrowserLogs: false,
    firefoxWarning:      false,
    inlineSearch:        false,
    inlineProfile:       false,
    pauseSpotlight:      false,
    quickConnectPopup:   false,
    searchGrid:          false,
    autoRedirect:        false,
    overviewExpander:    false,
    mediaSpecs:          false,
    backdropGuard:       false
  }
};
(function () {
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/PalmarHealer/cleanfin@main/script.min.js';
  document.head.appendChild(s);
})();
```

### Modules

| Flag | What it does |
| --- | --- |
| `suppressBrowserLogs` | Silences `console.log/warn/error/info/debug`. |
| `firefoxWarning` | One-time dismissible notice that Firefox has playback issues. Styled with the theme's own variables. English by default, German when the UI locale is German. |
| `inlineSearch` | Netflix-style expanding search box in the navbar. |
| `inlineProfile` | Quick-action profile dropdown in the header. |
| `pauseSpotlight` | Cinematic overlay with logo/metadata when playback is paused and idle for 10s. |
| `quickConnectPopup` | Turns the profile dropdown's "Quick Connect" entry into an in-page modal. Independent of `inlineProfile`. |
| `searchGrid` | Replaces the search page's per-type sliders with one relevance-sorted grid. |
| `autoRedirect` | Skips the native login page. **Needs configuration — see below.** |
| `overviewExpander` | Animates the description "show more" toggle and stops the text from jumping when it opens. |
| `mediaSpecs` | Rewrites the Video / Audio / Subtitle dropdowns into one readable form and collapses duplicate tracks. Applies on detail pages and in the video player's Audio / Subtitle menus. |
| `backdropGuard` | Hides the Media Bar plugin's slideshow backdrop outside the home screen, so a slow page change shows nothing rather than the previous slide's artwork. |

#### What `mediaSpecs` shows

Track dropdowns are rebuilt from the structured `MediaStreams` data rather than
from the rendered text, so the result is the same regardless of what a release
group wrote into the embedded stream titles:

| Jellyfin | CleanFin |
| --- | --- |
| `6 Mbps AVC MPEG-4 - 1080p - H264 - SDR` | `Full HD (1080p)` |
| `tvp-sherlock-s01e01-br-1080p - H264 - SDR` | `Full HD (1080p)` |
| `5.1 AC3 @ 640 kbps - German - Dolby Digital - Standard` | `Deutsch · Dolby Digital 5.1` |
| `German - Dolby Digital Plus + Dolby Atmos - 5.1` | `Deutsch · Dolby Atmos 5.1` |
| `Commentary - German - DVDSUB` | `Deutsch · Commentary · Bild` |
| `German Forced - Standard - Erzwungen - SUBRIP` | `Deutsch · Forced` |
| `European Spanish - SUBRIP` | `Spanisch (Europa)` |

Notes on the choices:

- **Resolution is derived from width, not height.** A scope print at 1920x816
  is still 1080p; classifying it by height would call it 576p.
- **`Bild` marks bitmap subtitles** (VobSub/PGS). Those cannot follow the
  viewer's subtitle styling and may force the server to transcode, so the
  format is surfaced only when it has a consequence. Text formats stay bare.
- **`Forced` is only applied to subtitles.** Jellyfin also sets `IsForced` on
  default *audio* tracks, where it means "default" instead.
- **Duplicate tracks are collapsed.** One test title ships 53 subtitle
  streams that reduce to 28 distinct entries; the selected track is never
  removed.

The player's own Audio and Untertitel menus are relabelled too. Only the sheets
opened from those two buttons are touched: the playback-speed menu numbers its
entries `1`, `2`, `3`, `4` in the same `data-id` attribute that carries the
stream index, so a sheet matched by shape alone would rename `2x` into an audio
track.

#### Language of `firefoxWarning`

The notice ships English and German strings and picks one from the UI locale,
falling back to English. To force a language:

```js
window.cleanFin = {
  features:       { firefoxWarning: true },
  firefoxWarning: { lang: 'de' }
};
```

#### Configuring `autoRedirect`

On desktop this module redirects the login page to an SSO start URL, which is
specific to your server, so you have to supply it. In the Jellyfin Android app it
instead auto-triggers Quick Connect, which needs no URL.

```js
window.cleanFin = {
  features:     { autoRedirect: true },
  autoRedirect: { ssoUrl: 'https://jellyfin.example.com/sso/OID/start/<provider>' }
};
```

Without `ssoUrl` the desktop redirect stays disabled and the login page is left
untouched, so enabling the flag alone cannot lock you out.

<details>
<summary>Alternative: load via plain HTML <code>&lt;script&gt;</code> tags</summary>

If you can't use the injector plugin and are editing `index.html` (or another HTML host) directly:

```html
<script>
  window.cleanFin = {
    features: {
      suppressBrowserLogs: false,
      firefoxWarning:      false,
      inlineSearch:        false,
      inlineProfile:       false,
      pauseSpotlight:      false,
      quickConnectPopup:   false,
      searchGrid:          false,
      autoRedirect:        false,
      overviewExpander:    false,
      mediaSpecs:          false,
      backdropGuard:       false
    }
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/PalmarHealer/cleanfin@main/script.min.js"></script>
```

The flag block must appear **before** the bundle `<script>` tag.

</details>

## Recommended plugins

These plugins pair well with the theme. None are required, but several of the SCSS rules and the script bundle are designed with them in mind.

- **[Jellyfin JavaScript Injector](https://github.com/n00bcodr/Jellyfin-JavaScript-Injector)** — *soft dependency for the script bundle.* The cleanest way to load `script.min.js`. See the [Scripts](#scripts) section above.
- **[File Transformation](https://github.com/IAmParadox27/jellyfin-plugin-file-transformation)** — Base plugin used by several others below. Install first if you plan to use Home Sections, Media Bar, or Collection Sections.
- **[Home Sections](https://github.com/IAmParadox27/jellyfin-plugin-home-sections)** — Adds customizable home-screen sections. The theme tweaks padding/spacing for these (see `css/330-features-offset.scss`).
- **[Media Bar](https://github.com/IAmParadox27/jellyfin-plugin-media-bar)** — Featured media bar at the top of the home screen. The theme styles its slide dots, arrows, and button container. See the [Customizer](#customizer) section for an option if you run it without trailers.
- **[Collection Sections](https://github.com/IAmParadox27/jellyfin-plugin-collection-sections)** — Adds collection-based home sections.
- **[InPlayerEpisodePreview](https://github.com/Namo2/InPlayerEpisodePreview)** — Hover previews for next/previous episodes inside the player.
- **[Meilisearch](https://github.com/arnesacnussem/jellyfin-plugin-meilisearch)** — Faster, fuzzier search powered by Meilisearch. Works well with the inline search script.

## Structure

- `css/` — Each CSS change lives in its own `.scss` file. Files are prefixed with a number so they concatenate in a defined order. `000-imports.scss` (upstream import), `001-root.scss` (CleanFin variables), `002-upstream-palette.scss` and `003-upstream-fixes.scss` (code derived from NeutralFin) come first; CleanFin's own rules start at `010-`.
- `js/` — Each script lives in its own `.js` file, similarly prefixed for ordering. The bundler derives the feature flag name from the filename (e.g. `010-firefox-warning.js` → `firefoxWarning`).
- `fonts/` — Self-hosted Inter (SIL Open Font License 1.1, see `fonts/LICENSE.txt`).
- `scripts/` — Build helpers. `aio-fonts.js` strips Google's Inter `@font-face` blocks from the all-in-one CSS and inlines our own as base64.
- `style.css` / `style.min.css` / `style.aio.css` / `style.aio.min.css` / `script.js` / `script.min.js` — Built artifacts in the repo root. **Do not edit these by hand** — they are regenerated by the build action.

## Build

A GitHub Action (`.github/workflows/build.yml`) builds both CSS and JS:

- **CSS** — concatenates `css/*.scss` in sorted order and compiles with Dart Sass into `style.css` (expanded) and `style.min.css` (compressed). PostCSS then inlines remote `@import` URLs, `scripts/aio-fonts.js` swaps the Google Inter faces for embedded base64, and esbuild minifies, producing the offline-safe `style.aio.css` / `style.aio.min.css`.
- **JS** — concatenates `js/*.js` in sorted order, wraps each module in a `window.cleanFin.features.<key>` toggle, and produces `script.js` (readable) and `script.min.js` (minified via esbuild).

The action runs on every push that touches `css/**` or `js/**` and commits the rebuilt files back to `main`.

### Updating ElegantFin

The upstream import in `css/000-imports.scss` is pinned to an explicit tag on
purpose. **Do not change it to `@latest`:** jsDelivr resolves
`ElegantFin@latest` to v25.12.31, because tags such as `v26.09.05` contain
leading zeros and are therefore not valid semver, so jsDelivr skips them —
`@latest` would silently pin you to an older release than the pin does.

To bump, change the tag *and* the filename together (the
`build-latest-minified` file is versioned per tag, not globally latest), then
check the [ElegantFin releases](https://github.com/lscambo13/ElegantFin/releases)
for renamed or dropped variables — v26.09.05, for example, removed
`--uiAccentColor` and `--activeColor` and switched the icon font from
`Material Icons Round` to `Material Symbols Rounded`.

To build locally:

```bash
npm install -g sass esbuild postcss-cli postcss-import-url
cat css/*.scss > _bundle.scss
# (workflow does the same concatenation)
sass --style=expanded _bundle.scss style.css
sass --style=compressed _bundle.scss style.min.css
npx postcss style.css --use postcss-import-url -o style.aio.css --no-map
node scripts/aio-fonts.js style.aio.css
esbuild style.aio.css --minify --outfile=style.aio.min.css
# JS bundle: replicate the loop in .github/workflows/build.yml
```

## Credit & License

This theme builds on [ElegantFin](https://github.com/lscambo13/ElegantFin) by lscambo13.

It also carries code derived from [NeutralFin](https://github.com/KartoffelChipss/NeutralFin) by KartoffelChipss — the grey palette in `css/002-upstream-palette.scss` and the Media Bar fixes in `css/003-upstream-fixes.scss` — even though NeutralFin is no longer part of the import chain.

The bundled [Inter](https://github.com/rsms/inter) typeface by Rasmus Andersson is used under the SIL Open Font License 1.1 — see [fonts/LICENSE.txt](fonts/LICENSE.txt).

The theme itself is distributed under the same license as the upstream projects (GNU GPL v2). See [LICENSE](LICENSE).
