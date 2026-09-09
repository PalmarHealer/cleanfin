/**
 * Jellyfin Enhancement: Media specs
 *
 * Rewrites the Video / Audio / Subtitle track dropdowns on detail pages into
 * one consistent, readable form:
 *
 *   6 Mbps AVC MPEG-4 - 1080p - H264 - SDR              ->  Full HD (1080p)
 *   tvp-sherlock-s01e01-br-1080p - H264 - SDR           ->  Full HD (1080p)
 *   5.1 AC3 @ 640 kbps - German - Dolby Digital - Std.  ->  Deutsch · Dolby Digital 5.1
 *   German - Dolby Digital Plus + Dolby Atmos - 5.1     ->  Deutsch · Dolby Atmos 5.1
 *   Commentary - German - DVDSUB                        ->  Deutsch · Commentary · Bild
 *   German Forced - Standard - Erzwungen - SUBRIP       ->  Deutsch · Forced
 *
 * Labels are built from the structured MediaStreams the API already returned,
 * not by parsing the rendered text: `option.value` carries the stream index,
 * which maps straight onto a stream. Regex is used for one job only — deciding
 * whether an embedded stream Title carries meaning ("Commentary", "Forced",
 * "SDH") or is release-group noise to be dropped.
 */
(function () {
    'use strict';

    var SEP = ' · ';

    /* ---------- language ---------- */

    var LANGUAGES = {
        deu: 'Deutsch', ger: 'Deutsch', de: 'Deutsch',
        eng: 'Englisch', en: 'Englisch',
        fra: 'Französisch', fre: 'Französisch', fr: 'Französisch',
        spa: 'Spanisch', es: 'Spanisch',
        ita: 'Italienisch', it: 'Italienisch',
        nld: 'Niederländisch', dut: 'Niederländisch', nl: 'Niederländisch',
        por: 'Portugiesisch', pt: 'Portugiesisch',
        pol: 'Polnisch', pl: 'Polnisch',
        rus: 'Russisch', ru: 'Russisch',
        tur: 'Türkisch', tr: 'Türkisch',
        jpn: 'Japanisch', ja: 'Japanisch',
        kor: 'Koreanisch', ko: 'Koreanisch',
        zho: 'Chinesisch', chi: 'Chinesisch', zh: 'Chinesisch',
        ara: 'Arabisch', ar: 'Arabisch',
        ces: 'Tschechisch', cze: 'Tschechisch',
        dan: 'Dänisch', fin: 'Finnisch', swe: 'Schwedisch',
        nor: 'Norwegisch', nob: 'Norwegisch',
        hun: 'Ungarisch', ell: 'Griechisch', gre: 'Griechisch',
        heb: 'Hebräisch', hin: 'Hindi', tha: 'Thai',
        ukr: 'Ukrainisch', ron: 'Rumänisch', rum: 'Rumänisch',
        bul: 'Bulgarisch', hrv: 'Kroatisch', srp: 'Serbisch',
        slk: 'Slowakisch', slo: 'Slowakisch', slv: 'Slowenisch',
        vie: 'Vietnamesisch', ind: 'Indonesisch', msa: 'Malaiisch',
        mul: 'Mehrsprachig', und: ''
    };

    function languageName(code) {
        if (!code) return '';
        var key = String(code).toLowerCase();
        if (Object.prototype.hasOwnProperty.call(LANGUAGES, key)) return LANGUAGES[key];
        try {
            var dn = new Intl.DisplayNames(['de'], { type: 'language' });
            var name = dn.of(key);
            if (name && name.toLowerCase() !== key) return name;
        } catch (e) { /* Intl may not know the code */ }
        return key.toUpperCase();
    }

    /* ---------- video ---------- */

    // Mapped on width, not height: letterboxed scope prints are shorter than
    // their class suggests (1920x816 is still 1080p, not 576p).
    function resolutionName(stream) {
        var w = stream.Width || 0;
        var h = stream.Height || 0;
        if (!w && !h) return '';
        if (!w) w = Math.round(h * 16 / 9);

        if (w >= 7000) return 'UHD 8K (4320p)';
        if (w >= 3400) return 'UHD 4K (2160p)';
        if (w >= 2400) return 'QHD (1440p)';
        if (w >= 1700) return 'Full HD (1080p)';
        if (w >= 1200) return 'HD (720p)';
        if (w >= 900)  return 'SD (576p)';
        return 'SD (480p)';
    }

    /* ---------- audio ---------- */

    function audioFormat(stream) {
        var codec = String(stream.Codec || '').toLowerCase();
        var profile = String(stream.Profile || '');

        if (/atmos/i.test(profile)) return 'Dolby Atmos';
        if (/dts[-\s]?x/i.test(profile)) return 'DTS:X';

        switch (codec) {
            case 'truehd': return 'Dolby TrueHD';
            case 'eac3':   return 'Dolby Digital Plus';
            case 'ac3':    return 'Dolby Digital';
            case 'dts':
                if (/ma\b|master/i.test(profile)) return 'DTS-HD MA';
                if (/hra|high.?res/i.test(profile)) return 'DTS-HD HR';
                return 'DTS';
            case 'aac':    return 'AAC';
            case 'flac':   return 'FLAC';
            case 'opus':   return 'Opus';
            case 'vorbis': return 'Vorbis';
            case 'mp3':    return 'MP3';
            case 'mp2':    return 'MP2';
            case 'pcm':
            case 'pcm_s16le':
            case 'pcm_s24le': return 'PCM';
            default: return codec ? codec.toUpperCase() : '';
        }
    }

    function channelName(stream) {
        var layout = String(stream.ChannelLayout || '').toLowerCase();
        if (layout === 'mono') return '1.0';
        if (layout === 'stereo') return '2.0';
        if (/^\d(\.\d)?$/.test(layout)) return layout;

        var n = stream.Channels || 0;
        if (n === 1) return '1.0';
        if (n === 2) return '2.0';
        if (n === 6) return '5.1';
        if (n === 8) return '7.1';
        return n ? n + 'ch' : '';
    }

    /* ---------- subtitles ---------- */

    // Bitmap subtitles are pre-rendered images: they cannot follow the user's
    // subtitle styling and may force the server to transcode, so they are the
    // one format worth surfacing. Text formats stay unlabelled.
    var BITMAP_CODECS = /^(dvdsub|dvd_subtitle|vobsub|pgssub|pgs|hdmv_pgs_subtitle|dvbsub|dvb_subtitle|xsub)$/i;

    function isBitmapSubtitle(stream) {
        return BITMAP_CODECS.test(String(stream.Codec || ''));
    }

    /* ---------- stream title: meaning vs. noise ---------- */

    var MARKERS = [
        { re: /\b(commentary|kommentar(e|spur)?|audiokommentar)\b/i, label: 'Commentary' },
        { re: /\b(forced|erzwungen|forcé)\b/i,                  label: 'Forced' },
        { re: /\b(sdh|cc|hearing[\s-]?impaired|hörgeschädigt|gehörlose)\b/i, label: 'SDH' },
        { re: /\b(karaoke|songs?|lyrics|signs?)\b/i,                 label: 'Signs & Songs' }
    ];

    // Titles that only say "this is the normal track". A track without a
    // Forced marker already is the full one, so the word adds nothing —
    // and left in, it reads as a stray lowercase label ("Deutsch · komplett").
    var REDUNDANT = /^(komplett|kompletto?|complete|full|voll|vollständig|standard|default|normal|main|haupt|regular|dialogue|dialog)$/i;

    // Titles that only restate technical data, or are a release/file name.
    var NOISE = [
        /^\s*\d+(\.\d+)?\s*(k|m)?bps\b/i,        // "6 Mbps ..."
        /\b(avc|hevc|h\.?26[45]|mpeg-?[24]|xvid|divx|vp9|av1)\b/i,
        /\b(ac3|eac3|dts|aac|flac|truehd|opus|mp3)\b/i,
        /\b\d\.\d\b/,                             // "5.1"
        /\b(4k|2160p|1080[pi]|720p|576[pi]|480[pi])\b/i,
        /\b(bluray|blu-ray|bdrip|brrip|web-?dl|webrip|hdtv|dvdrip|remux)\b/i,
        /-(?:[a-z0-9]+)$/i,                       // trailing release group
        /^[a-z0-9]+(?:[.\-_][a-z0-9]+){3,}$/i     // dotted/dashed file name
    ];

    function markersFrom(stream) {
        var out = [];
        var title = stream.Title || '';

        // Only meaningful for subtitles. Jellyfin also reports IsForced on
        // default audio tracks, where it means "default", not "forced".
        if (stream.IsForced && stream.Type === 'Subtitle') out.push('Forced');

        for (var i = 0; i < MARKERS.length; i++) {
            if (MARKERS[i].re.test(title) && out.indexOf(MARKERS[i].label) === -1) {
                out.push(MARKERS[i].label);
            }
        }
        return out;
    }

    /* ---------- regional variants ---------- */

    // English names of the languages we translate, so a title that merely
    // repeats the language can be recognised as redundant.
    var ENGLISH_NAMES = {
        deu: 'german', ger: 'german', eng: 'english', fra: 'french', fre: 'french',
        spa: 'spanish', ita: 'italian', nld: 'dutch', dut: 'dutch', por: 'portuguese',
        pol: 'polish', rus: 'russian', tur: 'turkish', jpn: 'japanese', kor: 'korean',
        zho: 'chinese', chi: 'chinese', ara: 'arabic', ces: 'czech', cze: 'czech',
        dan: 'danish', fin: 'finnish', swe: 'swedish', nor: 'norwegian', nob: 'norwegian',
        hun: 'hungarian', ell: 'greek', gre: 'greek', heb: 'hebrew', hin: 'hindi',
        tha: 'thai', ukr: 'ukrainian', ron: 'romanian', rum: 'romanian', bul: 'bulgarian',
        hrv: 'croatian', srp: 'serbian', slk: 'slovak', slo: 'slovak', slv: 'slovenian',
        vie: 'vietnamese', ind: 'indonesian', msa: 'malay', cat: 'catalan'
    };

    var QUALIFIERS = {
        'european': 'Europa',
        'brazilian': 'Brasilien',
        'latin american': 'Lateinamerika',
        'latin': 'Lateinamerika',
        'castilian': 'Kastilisch',
        'canadian': 'Kanada',
        'mexican': 'Mexiko',
        'simplified': 'vereinfacht',
        'traditional': 'traditionell',
        'mandarin': 'Mandarin',
        'cantonese': 'Kantonesisch'
    };

    function englishName(code) {
        var key = String(code || '').toLowerCase();
        if (ENGLISH_NAMES[key]) return ENGLISH_NAMES[key];
        try {
            var n = new Intl.DisplayNames(['en'], { type: 'language' }).of(key);
            if (n && n.toLowerCase() !== key) return n.toLowerCase();
        } catch (e) { /* unknown code */ }
        return '';
    }

    // "European Spanish" -> "Europa", "Dutch" -> "" (pure repetition),
    // "Brazilian Portuguese" -> "Brasilien".
    function regionalQualifier(stream) {
        var title = String(stream.Title || '').trim().toLowerCase();
        var name = englishName(stream.Language);
        if (!title || !name || title.indexOf(name) === -1) return null;

        var rest = title.replace(name, '').replace(/[()\-,]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!rest) return '';                       // title was just the language

        // Whatever is left may be a marker ("German Forced", "German SDH")
        // rather than a region; those belong to markersFrom(), not here.
        for (var i = 0; i < MARKERS.length; i++) {
            if (MARKERS[i].re.test(rest)) return '';
        }

        if (QUALIFIERS[rest]) return QUALIFIERS[rest];
        return rest.charAt(0).toUpperCase() + rest.slice(1);
    }

    // A title is kept as free text only when it says something the structured
    // fields do not, and does not look like a release name.
    function meaningfulTitle(stream) {
        var title = String(stream.Title || '').trim();
        if (!title || title.length > 40) return '';

        if (REDUNDANT.test(title)) return '';
        for (var i = 0; i < MARKERS.length; i++) if (MARKERS[i].re.test(title)) return '';
        for (var j = 0; j < NOISE.length; j++) if (NOISE[j].test(title)) return '';

        // A title that just repeats the language adds nothing; one that narrows
        // it ("European Spanish") is kept as a parenthesised qualifier, because
        // dropping it would merge genuinely different tracks during dedupe.
        // Handled by languagePart(), which folds it into the language name.
        if (regionalQualifier(stream) !== null) return '';

        var lang = languageName(stream.Language);
        if (lang && title.toLowerCase() === lang.toLowerCase()) return '';

        // Embedded titles are often all-lowercase; match the rest of the label.
        return title.charAt(0).toUpperCase() + title.slice(1);
    }

    // "Spanisch (Europa)" rather than "Spanisch · Europa".
    function languagePart(stream) {
        var name = languageName(stream.Language);
        var qualifier = regionalQualifier(stream);
        if (!name) return qualifier || '';
        return qualifier ? name + ' (' + qualifier + ')' : name;
    }

    /* ---------- label builders ---------- */

    function join(parts) {
        return parts.filter(function (p) { return p; }).join(SEP);
    }

    function videoLabel(stream) {
        return join([resolutionName(stream)]) || 'Video';
    }

    function audioLabel(stream) {
        var format = audioFormat(stream);
        var channels = channelName(stream);
        var spec = format && channels ? format + ' ' + channels : (format || channels);
        return join([languagePart(stream), meaningfulTitle(stream)]
            .concat(markersFrom(stream))
            .concat([spec])) || 'Audio';
    }

    function subtitleLabel(stream) {
        return join([languagePart(stream), meaningfulTitle(stream)]
            .concat(markersFrom(stream))
            .concat([isBitmapSubtitle(stream) ? 'Bild' : ''])) || 'Untertitel';
    }

    /* ---------- applying it to the page ---------- */

    var LABEL_FOR = {
        Video:    videoLabel,
        Audio:    audioLabel,
        Subtitle: subtitleLabel
    };

    var KIND = [
        { cls: 'selectVideo',     type: 'Video' },
        { cls: 'selectAudio',     type: 'Audio' },
        { cls: 'selectSubtitles', type: 'Subtitle' }
    ];

    function streamMap(streams) {
        var map = {};
        (streams || []).forEach(function (s) { map[s.Index] = s; });
        return map;
    }

    function applyToSelect(select, kind, map) {
        var seen = {};
        var drop = [];

        Array.prototype.forEach.call(select.options, function (opt) {
            var stream = map[parseInt(opt.value, 10)];
            if (!stream || stream.Type !== kind.type) return;   // e.g. the "Aus" entry

            var label = LABEL_FOR[kind.type](stream);
            if (opt.textContent !== label) opt.textContent = label;

            // Collapse tracks that end up identical (KPop Demon Hunters ships 53
            // subtitle streams, many of them the same language and format).
            if (seen[label] && !opt.selected) drop.push(opt);
            else seen[label] = true;
        });

        drop.forEach(function (o) { o.remove(); });
        return drop.length;
    }

    function decorate(page, item) {
        (item.MediaSources || []).forEach(function (source) {
            var map = streamMap(source.MediaStreams);
            KIND.forEach(function (kind) {
                Array.prototype.forEach.call(page.querySelectorAll('select.' + kind.cls), function (select) {
                    if (select.dataset.cfSpecs === source.Id) return;
                    var before = select.options.length;
                    applyToSelect(select, kind, map);
                    // only claim the select once it actually matched this source
                    if (select.options.length !== before || before > 0) select.dataset.cfSpecs = source.Id;
                });
            });
        });
    }

    function currentItemId() {
        var m = window.location.hash.match(/[?&]id=([a-f0-9]{32})/i);
        return m ? m[1] : null;
    }

    var lastRun = '';

    function run() {
        var api = window.ApiClient;
        if (!api || !api.getCurrentUserId || !api.getCurrentUserId()) return;

        var id = currentItemId();
        if (!id) return;

        var page = document.querySelector('.itemDetailPage:not(.hide)');
        if (!page) return;

        var pending = page.querySelector('select.selectAudio, select.selectVideo, select.selectSubtitles');
        if (!pending) return;

        var key = id + ':' + page.querySelectorAll('select.detailTrackSelect').length;
        if (key === lastRun) return;
        lastRun = key;

        api.getItem(api.getCurrentUserId(), id).then(function (item) {
            decorate(page, item);
        }, function () { lastRun = ''; });
    }

    /* ---------- applying it in the video player ---------- */

    // The player's Audio / Untertitel menus are actionsheets whose entries carry
    // the stream index in data-id, so the same labels apply. Only sheets opened
    // from those two buttons are touched, never every actionsheet: the playback
    // speed menu uses bare integers as data-id too ("1", "2", "3", "4"), and a
    // structural guess would happily rename "2x" into an audio track.

    var ARM_MS     = 3000;      // how long a track button's click keeps watching
    var MAP_TTL_MS = 5000;      // refetch window, so a new episode is picked up

    var osdMap = null;          // { map: <index -> stream>, at: <ms> }
    var osdFetching = false;

    // NowPlayingItem carries MediaStreams for the source actually playing, so
    // this is one request rather than a session lookup plus an item lookup.
    function refreshOsdMap() {
        var api = window.ApiClient;
        if (osdFetching || !api || !api.deviceId || !api.getJSON) return;

        osdFetching = true;
        api.getJSON(api.getUrl('Sessions', { DeviceId: api.deviceId() })).then(function (sessions) {
            osdFetching = false;
            for (var i = 0; i < (sessions || []).length; i++) {
                var playing = sessions[i].NowPlayingItem;
                if (playing && playing.MediaStreams) {
                    osdMap = { map: streamMap(playing.MediaStreams), at: Date.now() };
                    return;
                }
            }
        }, function () { osdFetching = false; });
    }

    function isChecked(item) {
        var icon = item.querySelector('.actionsheetMenuItemIcon');
        return !!icon && icon.style.visibility !== 'hidden';
    }

    function applyToSheet(sheet, type, map) {
        var seen = {};
        var drop = [];

        Array.prototype.forEach.call(sheet.querySelectorAll('.actionSheetMenuItem'), function (item) {
            var id = item.getAttribute('data-id');
            if (!/^\d+$/.test(id)) return;              // "Aus" (-1), "secondarysubtitle"

            var stream = map[parseInt(id, 10)];
            if (!stream || stream.Type !== type) return;

            var text = item.querySelector('.actionSheetItemText');
            if (!text) return;

            var label = LABEL_FOR[type](stream);
            if (text.textContent !== label) text.textContent = label;

            if (seen[label] && !isChecked(item)) drop.push(item);
            else seen[label] = true;
        });

        drop.forEach(function (i) { i.remove(); });
    }

    function decorateSheet(sheet, type) {
        if (!osdMap) return false;                   // session lookup still in flight
        applyToSheet(sheet, type, osdMap.map);
        return true;
    }

    // Sheets are appended into a .dialogContainer rather than straight onto the
    // body, so the subtree has to be watched — but only while a click is armed,
    // instead of keeping an observer on the whole document for the session.
    function watchForSheet(type) {
        var done = false;
        var observer = new MutationObserver(function (records) {
            records.forEach(function (record) {
                Array.prototype.forEach.call(record.addedNodes, function (node) {
                    if (done || node.nodeType !== 1) return;

                    var sheet = node.classList.contains('actionSheet')
                        ? node
                        : node.querySelector && node.querySelector('.actionSheet');
                    if (!sheet) return;

                    if (decorateSheet(sheet, type)) {
                        done = true;
                        observer.disconnect();
                        return;
                    }

                    // The map has not landed yet; keep trying while it is armed.
                    var retry = setInterval(function () {
                        if (done || !document.contains(sheet)) { clearInterval(retry); return; }
                        if (decorateSheet(sheet, type)) { done = true; clearInterval(retry); }
                    }, 50);
                    setTimeout(function () { clearInterval(retry); }, ARM_MS);
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(function () { observer.disconnect(); }, ARM_MS);
    }

    document.addEventListener('click', function (e) {
        var target = e.target;
        if (!target || !target.closest) return;

        var btn = target.closest('.btnSubtitles, .btnAudio');
        if (!btn) return;

        if (!osdMap || Date.now() - osdMap.at > MAP_TTL_MS) refreshOsdMap();
        watchForSheet(btn.classList.contains('btnAudio') ? 'Audio' : 'Subtitle');
    }, true);

    // Jellyfin rebuilds the selects asynchronously and reuses detail pages, so
    // poll rather than trying to catch a single render event.
    setInterval(function () {
        run();

        // Keep the player's stream map warm, so opening a track menu relabels it
        // in the same frame instead of flashing the raw Jellyfin text first.
        if (!document.querySelector('video')) osdMap = null;
        else if (!osdMap || Date.now() - osdMap.at > MAP_TTL_MS) refreshOsdMap();
    }, 300);
    window.addEventListener('hashchange', function () { lastRun = ''; });
})();
