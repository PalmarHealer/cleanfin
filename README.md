# CleanFin

A Jellyfin theme based on [NeutralFin](https://github.com/KartoffelChipss/NeutralFin) by [KartoffelChipss](https://github.com/KartoffelChipss), which is itself based on [ElegantFin](https://github.com/lscambo13/ElegantFin) by [lscambo13](https://github.com/lscambo13). It changes a handful of things in NeutralFin that bothered me and adds an optional script bundle for client-side tweaks.

> **About the name:** I originally called it *goodFin*, but renamed it to *CleanFin* — that felt more descriptive of what this fork actually does (and fits the lineage of "*\<adjective\>*Fin" themes).

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

The all-in-one build (`style.aio.css` / `style.aio.min.css`) inlines the upstream NeutralFin CSS at build time, so the theme keeps working if the NeutralFin CDN goes down or you're using Jellyfin offline.

```css
@import url('https://cdn.jsdelivr.net/gh/PalmarHealer/cleanfin@main/style.aio.min.css');
```

Unminified:

```css
@import url('https://cdn.jsdelivr.net/gh/PalmarHealer/cleanfin@main/style.aio.css');
```

</details>

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

In addition to the theme, an optional script bundle adds a few client-side enhancements (inline search, profile dropdown, pause spotlight, Firefox warning, log suppression).

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
    pauseSpotlight:      false
  }
};
(function () {
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/PalmarHealer/cleanfin@main/script.min.js';
  document.head.appendChild(s);
})();
```

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
      pauseSpotlight:      false
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

- `css/` — Each CSS change lives in its own `.scss` file. Files are prefixed with a number so they concatenate in a defined order (`000-imports.scss` and `001-root.scss` come first).
- `js/` — Each script lives in its own `.js` file, similarly prefixed for ordering. The bundler derives the feature flag name from the filename (e.g. `010-firefox-warning.js` → `firefoxWarning`).
- `style.css` / `style.min.css` / `style.aio.css` / `style.aio.min.css` / `script.js` / `script.min.js` — Built artifacts in the repo root. **Do not edit these by hand** — they are regenerated by the build action.

## Build

A GitHub Action (`.github/workflows/build.yml`) builds both CSS and JS:

- **CSS** — concatenates `css/*.scss` in sorted order and compiles with Dart Sass into `style.css` (expanded) and `style.min.css` (compressed). PostCSS then inlines remote `@import` URLs to produce the offline-safe `style.aio.css` / `style.aio.min.css`.
- **JS** — concatenates `js/*.js` in sorted order, wraps each module in a `window.cleanFin.features.<key>` toggle, and produces `script.js` (readable) and `script.min.js` (minified via esbuild).

The action runs on every push that touches `css/**` or `js/**` and commits the rebuilt files back to `main`.

To build locally:

```bash
npm install -g sass esbuild postcss-cli postcss-import-url
cat css/*.scss > _bundle.scss
# (workflow does the same concatenation)
sass --style=expanded _bundle.scss style.css
sass --style=compressed _bundle.scss style.min.css
npx postcss style.css --use postcss-import-url -o style.aio.css --no-map
esbuild style.aio.css --minify --outfile=style.aio.min.css
# JS bundle: replicate the loop in .github/workflows/build.yml
```

## Credit & License

This theme builds on [NeutralFin](https://github.com/KartoffelChipss/NeutralFin) by KartoffelChipss, which builds on [ElegantFin](https://github.com/lscambo13/ElegantFin) by lscambo13. Distributed under the same license as the upstream projects (GNU GPL v2). See [LICENSE](LICENSE).
