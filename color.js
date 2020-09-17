//  mkcolor - a vim color scheme randomizer/previewer
//  Copyright (C) 2020 QuietMisdreavus

//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published
//  by the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.

//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

class InvalidColorsError extends Error {
    constructor() {
        super();
    }
}

// returns the minimum contrast ratio requested by the user
function getContrastLimit() {
    if (document.getElementById('v-hi-con').checked) {
        return 7;
    } else if (document.getElementById('hi-con').checked) {
        return 4.5;
    } else if (document.getElementById('lo-con').checked) {
        return 3;
    } else {
        return 0;
    }
}

// returns a function which evaluates a contrast ratio for the "line number background contrast"
// requested by the user
function getUIFrameCheck() {
    if (document.getElementById('ui-lo').checked) {
        return function(cr) { return cr < 3; }
    } else if (document.getElementById('ui-hi').checked) {
        return function(cr) { return cr > 4.5; }
    } else {
        return function(cr) { return true; }
    }
}

function isDistinct(col1, col2) {
    let cr = contrastRatio(col1, col2);
    let dist = labDistance(col1, col2);

    return (cr > 1.1 && dist > 20);
}

function isHilightDistinct(col1, col2) {
    let cr = contrastRatio(col1, col2);
    let dist = labDistance(col1, col2);

    return (cr > 1.008 && dist > 10);
}

function tweakColor(col) {
    let newCol = col;
    const reps = Math.round(Math.random() * 10) + 5;

    for (var i = 0; i < reps; i++) {
        // deep-copy the LAB numbers so we don't modify the original color object
        let lab = {
            l: newCol.lab.l,
            a: newCol.lab.a,
            b: newCol.lab.b
        };
        let val = (Math.random() * 20) - 10;
        switch (getRandomInt(3)) {
            case 0:
                lab.l = clamp(lab.l + val, 0, 100);
                break;
            case 1:
                lab.a = clamp(lab.a + val, -128, 128);
                break;
            case 2:
                lab.b = clamp(lab.b + val, -128, 128);
                break;
        }

        newCol = colorFromLab(lab);
    }

    return newCol;
}

// the color classes that can be generated only by comparing their contrast ratio against the
// background color
var colorNames = ['identifier', 'constant', 'type', 'statement', 'preproc', 'special', 'title'];

// generates a color and adds it to the given colors object using the given name
function addColor(colors, name, useAnsi, limit, fgDistinct) {
    let tryAgain = true;
    let attempts = 0;

    while (tryAgain) {
        if (++attempts > 5000) {
            reportInvalidScheme(colors.bg);
            throw new InvalidColorsError;
        }

        colors[name] = randomColor(useAnsi);

        tryAgain = false;

        if (contrastRatio(colors.bg, colors[name]) < limit) {
            tryAgain = true;
            continue;
        }

        if (fgDistinct) {
            if (!isDistinct(colors[name], colors.fg)) {
                tryAgain = true;
                continue;
            }

            for (let col of colorNames) {
                if (col in colors && col !== name) {
                    if (!isDistinct(colors[name], colors[col])) {
                        tryAgain = true;
                        break;
                    }
                }
            }
        }
    }
}

var spellColorNames = {
    spellbad: 'reddish',
    spellcap: false,
    spellrare: false,
    spelllocal: false
};

function addSpellColor(colors, name, useAnsi, limit) {
    let tryAgain = true;
    let attempts = 0;

    while (tryAgain) {
        colors[name] = randomColor(useAnsi);

        // check the color family of the color before incrementing attempts, because it can take a
        // few tries just to get the right kind of color out
        if (spellColorNames[name]) {
            if (colors[name].ish !== spellColorNames[name]) {
                continue;
            }
        }

        if (++attempts > 5000) {
            reportInvalidScheme(colors.bg);
            throw new InvalidColorsError;
        }

        if (contrastRatio(colors[name], colors.bg) < limit) {
            continue;
        }

        tryAgain = false;
        for (let sp in spellColorNames) {
            if (sp === name) {
                continue;
            }
            if (!(sp in colors)) {
                continue;
            }

            if (!isDistinct(colors[name], colors[sp])) {
                // if the new color isn't distinct from an already-existing spell color, grab a new
                // one
                tryAgain = true;
                break;
            }
            if (spellColorNames[sp] && colors[name].ish == spellColorNames[sp]) {
                // if the new color is the same color family as a color that was forced into one
                // (e.g. SpellBad and "reddish"), grab a new one
                tryAgain = true;
                break;
            }
        }
    }
}

var bgColorNames = ['cursorline', 'visual', 'incsearch', 'search', 'matchparen', 'diffdelete', 'diffchange', 'difftext', 'diffadd'];

// generates a new color and compares it against the colors in `colorNames` to ensure it meets the
// given contrast ratio threshold
function addBgColor(colors, name, useAnsi, limit, bgDistinct, bgDistinctAll) {
    let tryAgain = true;
    let attempts = 0;

    while (tryAgain) {
        if (++attempts > 5000) {
            reportInvalidScheme(colors.bg);
            throw new InvalidColorsError;
        }

        colors[name] = randomColor(useAnsi);

        if (bgDistinct && !isHilightDistinct(colors[name], colors.bg)) {
            continue;
        }

        tryAgain = false;
        for (let fg of colorNames) {
            if (contrastRatio(colors[name], colors[fg]) < limit) {
                tryAgain = true;
                break;
            }
        }

        if (bgDistinctAll) {
            if (tryAgain) { continue; }

            for (let bg of bgColorNames) {
                if (!(bg in colors) || bg == name) { continue; }

                if (!isHilightDistinct(colors[name], colors[bg])) {
                    tryAgain = true;
                    break;
                }
            }
        }
    }
}

var bgTweakColors = ['tablinefill'];

function addBgTweakColor(colors, name, useAnsi, limit, bgDistinct, bgDistinctAll, uiTweak) {
    if (!uiTweak) {
        addBgColor(colors, name, useAnsi, limit, bgDistinct, bgDistinctAll);
        return;
    }

    let tryAgain = true;
    let attempts = 0;

    while (tryAgain) {
        if (++attempts > 5000) {
            reportInvalidScheme(colors.bg);
            throw new InvalidColorsError;
        }

        colors[name] = tweakColor(colors.bg);

        if (bgDistinct && !isHilightDistinct(colors[name], colors.bg)) {
            continue;
        }

        tryAgain = false;
        for (let fg of colorNames) {
            if (contrastRatio(colors[name], colors[fg]) < limit) {
                tryAgain = true;
                break;
            }
        }
    }
}

var uiColorNames = ['linenr', 'statusline', 'tabline', 'tablinesel', 'folded'];

function addUiColor(colors, name, useAnsi, limit, uiFrameValid, uiTweak) {
    function makeBg(colors, uiTweak, useAnsi) {
        if (uiTweak) {
            return tweakColor(colors.bg);
        } else {
            return randomColor(useAnsi);
        }
    }

    let bgName = `${name}-bg`;
    let fgName = `${name}-fg`;

    colors[bgName] = makeBg(colors, uiTweak, useAnsi);
    colors[fgName] = randomColor(useAnsi);
    let tryAgain = true;
    let attempts = 0;

    while (tryAgain) {
        if (!uiFrameValid(contrastRatio(colors.bg, colors[bgName]))) {
            colors[bgName] = makeBg(colors, uiTweak, useAnsi);
        } else if (contrastRatio(colors[bgName], colors[fgName]) < limit) {
            if (++attempts > 500) {
                attempts = 0;
                colors[bgName] = makeBg(colors, uiTweak, useAnsi);
            } else {
                colors[fgName] = randomColor(useAnsi);
            }
        } else {
            tryAgain = false;
        }
    }
}

var bgForceSettings = {
    'cursorcolumn': 'cursorline'
};

var uiForceSettings = {
    'foldcolumn': 'linenr',
    'signcolumn': 'foldcolumn'
};

// reads the settings from the page, then generates a new set of colors and returns the collection
// object
function randomColorSet() {
    try {
        let limit = getContrastLimit();
        let uiFrameValid = getUIFrameCheck();
        let useAnsi = document.getElementById('use-ansi').checked === true;
        let bgDistinct = document.getElementById('bg-distinct').checked === true;
        let bgDistinctAll = document.getElementById('bg-distinct-all').checked === true;
        let fgDistinct = document.getElementById('fg-distinct').checked === true;
        let uiTweak = document.getElementById('ui-tweak').checked === true;
        let colors = {};

        function newBg(limit, useAnsi) {
            let midpointRadius = (Math.max(0, limit - 1) / 2);
            let col;
            do {
                col = randomColor(useAnsi);
            } while (contrastRatio(col, crMidpoint) < midpointRadius);
            return col;
        }

        colors.bg = newBg(limit, useAnsi);
        colors.fg = randomColor(useAnsi);
        let attempts = 0;

        while (contrastRatio(colors.bg, colors.fg) < limit) {
            if (++attempts > 500) {
                // if it takes too long to find a color with enough contrast, start over with a new
                // background
                attempts = 0;
                colors.bg = newBg(limit, useAnsi);
            } else {
                colors.fg = randomColor(useAnsi);
            }
        }

        colors.baseContrast = contrastRatio(colors.bg, colors.fg);
        colors.comment = randomColor(useAnsi);

        while (contrastRatio(colors.bg, colors.comment) < limit
            || contrastRatio(colors.bg, colors.comment) > colors.baseContrast) {
            colors.comment = randomColor(useAnsi);
        }

        for (let name of colorNames) {
            addColor(colors, name, useAnsi, limit, fgDistinct);
        }

        if (document.getElementById('spell-red').checked) {
            spellColorNames.spellbad = 'reddish';
        } else {
            spellColorNames.spellbad = false;
        }

        for (let name in spellColorNames) {
            addSpellColor(colors, name, useAnsi, limit);
        }

        for (let name of uiColorNames) {
            addUiColor(colors, name, useAnsi, limit, uiFrameValid, uiTweak);
        }

        colors.cursor = randomColor(useAnsi);
        while (contrastRatio(colors.bg, colors.cursor) < limit) {
            colors.cursor = randomColor(useAnsi);
        }

        for (let bg of bgColorNames) {
            addBgColor(colors, bg, useAnsi, limit, bgDistinct, bgDistinctAll);
        }

        for (let bg of bgTweakColors) {
            addBgTweakColor(colors, bg, useAnsi, limit, bgDistinct, bgDistinctAll, uiTweak);
        }

        for (let name in bgForceSettings) {
            if (document.getElementById(`${name}-same`).checked === true) {
                let orig = bgForceSettings[name];
                colors[name] = colors[orig];
            } else {
                addBgColor(colors, name, useAnsi, limit, bgDistinct, bgDistinctAll);
            }
        }

        for (let name in uiForceSettings) {
            if (document.getElementById(`${name}-same`).checked === true) {
                let orig = uiForceSettings[name];
                colors[`${name}-bg`] = colors[`${orig}-bg`];
                colors[`${name}-fg`] = colors[`${orig}-fg`];
            } else {
                addUiColor(colors, name, useAnsi, limit, uiFrameValid, uiTweak);
            }
        }

        return colors;
    } catch (ex) {
        if (ex instanceof InvalidColorsError) {
            console.log('invalid color set; starting over');
            return randomColorSet();
        } else {
            throw ex;
        }
    }
}

var colorScheme = {};

// when the user clicks the "change colors" button, generate a new color set and change the CSS
// variables to display it on the page
document.getElementById('rando').addEventListener('click', function(ev) {
    colorScheme = randomColorSet();

    let cssVars = document.documentElement.style;
    cssVars.setProperty('--color-bg', colorScheme.bg.hex);
    cssVars.setProperty('--color-fg', colorScheme.fg.hex);
    cssVars.setProperty('--color-comment', colorScheme.comment.hex);

    document.getElementById('ratio').innerHTML = colorScheme.baseContrast.toFixed(2);

    document.getElementById('bg-col').innerHTML = colorScheme.bg.text;
    document.getElementById('fg-col').innerHTML = colorScheme.fg.text;
    document.getElementById('comment-col').innerHTML = colorScheme.comment.text;

    for (let name of colorNames) {
        cssVars.setProperty(`--color-${name}`, colorScheme[name].hex);
        document.getElementById(`${name}-col`).innerHTML = colorScheme[name].text;
    }

    for (let name in spellColorNames) {
        cssVars.setProperty(`--color-${name}`, colorScheme[name].hex);
        document.getElementById(`${name}-col`).innerHTML = colorScheme[name].text;
    }

    for (let name of uiColorNames) {
        let bgName = `${name}-bg`;
        let fgName = `${name}-fg`;

        cssVars.setProperty(`--color-${bgName}`, colorScheme[bgName].hex);
        cssVars.setProperty(`--color-${fgName}`, colorScheme[fgName].hex);
        document.getElementById(`${bgName}-col`).innerHTML = colorScheme[bgName].text;
        document.getElementById(`${fgName}-col`).innerHTML = colorScheme[fgName].text;
    }

    cssVars.setProperty('--color-cursor', colorScheme.cursor.hex);
    document.getElementById('cursor-col').innerHTML = colorScheme.cursor.text;

    for (let name of bgColorNames) {
        cssVars.setProperty(`--color-${name}`, colorScheme[name].hex);
        document.getElementById(`${name}-col`).innerHTML = colorScheme[name].text;
    }

    for (let name of bgTweakColors) {
        cssVars.setProperty(`--color-${name}`, colorScheme[name].hex);
        document.getElementById(`${name}-col`).innerHTML = colorScheme[name].text;
    }

    for (let name in bgForceSettings) {
        cssVars.setProperty(`--color-${name}`, colorScheme[name].hex);
        document.getElementById(`${name}-col`).innerHTML = colorScheme[name].text;
    }

    for (let name in uiForceSettings) {
        let bgName = `${name}-bg`;
        let fgName = `${name}-fg`;

        cssVars.setProperty(`--color-${bgName}`, colorScheme[bgName].hex);
        cssVars.setProperty(`--color-${fgName}`, colorScheme[fgName].hex);
        document.getElementById(`${bgName}-col`).innerHTML = colorScheme[bgName].text;
        document.getElementById(`${fgName}-col`).innerHTML = colorScheme[fgName].text;
    }
});
