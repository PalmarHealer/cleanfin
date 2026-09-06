#!/usr/bin/env node
/*
 * Post-processes the all-in-one CSS so it never contacts Google for Inter and
 * works with no network at all:
 *
 *   1. drops the Inter @font-face blocks that postcss inlined from
 *      fonts.googleapis.com (their src points at fonts.gstatic.com),
 *   2. replaces our own Inter URLs with base64 data: URIs.
 *
 * Material Symbols @font-face blocks are deliberately left alone — removing
 * them would break the icon set.
 */
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
    console.error('usage: aio-fonts.js <style.aio.css>');
    process.exit(1);
}

const fontsDir = path.join(__dirname, '..', 'fonts');
const FONTS = ['InterVariable.woff2', 'InterVariable-Italic.woff2'];

let css = fs.readFileSync(target, 'utf8');

/* --- 1. drop Google's Inter @font-face blocks --- */
function stripGoogleInter(src) {
    let out = '';
    let i = 0;
    let dropped = 0;

    while (i < src.length) {
        const at = src.indexOf('@font-face', i);
        if (at === -1) {
            out += src.slice(i);
            break;
        }

        const open = src.indexOf('{', at);
        if (open === -1) {
            out += src.slice(i);
            break;
        }

        let depth = 0;
        let end = -1;
        for (let j = open; j < src.length; j++) {
            if (src[j] === '{') {
                depth++;
            } else if (src[j] === '}') {
                depth--;
                if (depth === 0) {
                    end = j;
                    break;
                }
            }
        }
        if (end === -1) {
            out += src.slice(i);
            break;
        }

        const block = src.slice(at, end + 1);
        const isGoogle = block.indexOf('fonts.gstatic.com') !== -1;
        const isInter = /font-family\s*:\s*["']?Inter["']?\s*[;}]/i.test(block);

        out += src.slice(i, at);
        if (isGoogle && isInter) {
            dropped++;
        } else {
            out += block;
        }
        i = end + 1;
    }

    return { css: out, dropped: dropped };
}

const stripped = stripGoogleInter(css);
css = stripped.css;

/* --- 2. inline our own Inter files as base64 --- */
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let embedded = 0;
for (const name of FONTS) {
    const fontPath = path.join(fontsDir, name);
    if (!fs.existsSync(fontPath)) {
        console.error('missing font file: ' + fontPath);
        process.exit(1);
    }

    const dataUri = 'data:font/woff2;base64,' + fs.readFileSync(fontPath).toString('base64');
    // match the URL however sass / postcss ended up quoting it
    const re = new RegExp('url\\(\\s*["\']?[^"\')]*' + escapeRegExp(name) + '["\']?\\s*\\)', 'g');

    const before = css;
    css = css.replace(re, 'url("' + dataUri + '")');
    if (css === before) {
        console.error('font URL for ' + name + ' not found in ' + target);
        process.exit(1);
    }
    embedded++;
}

/* --- verify the result really is Google-free for Inter --- */
// Our own comments mention the Google URL, so check the stylesheet without them.
const code = css.replace(/\/\*[\s\S]*?\*\//g, '');

if (/fonts\.googleapis\.com/.test(code)) {
    console.error('fonts.googleapis.com is still referenced after processing');
    process.exit(1);
}
if (/InterVariable\.woff2|InterVariable-Italic\.woff2/.test(code)) {
    console.error('a plain Inter font URL survived; it should have been inlined');
    process.exit(1);
}
// Any surviving gstatic reference must be Material Symbols, never Inter.
const interGstatic = code
    .split('@font-face')
    .slice(1)
    .some(function (b) {
        const block = b.slice(0, b.indexOf('}') + 1);
        return block.indexOf('fonts.gstatic.com') !== -1 &&
            /font-family\s*:\s*["']?Inter["']?\s*[;}]/i.test(block);
    });
if (interGstatic) {
    console.error('an Inter @font-face still points at fonts.gstatic.com');
    process.exit(1);
}

fs.writeFileSync(target, css);
console.log(
    'aio-fonts: dropped ' + stripped.dropped + ' Google Inter @font-face block(s), ' +
    'embedded ' + embedded + ' font file(s)'
);
