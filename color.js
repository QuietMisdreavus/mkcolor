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
function getLineNrCheck() {
    if (document.getElementById('linenr-lo').checked) {
        return function(cr) { return cr < 3; }
    } else if (document.getElementById('linenr-hi').checked) {
        return function(cr) { return cr > 4.5; }
    } else {
        return function(cr) { return true; }
    }
}

// the color classes that can be generated only by comparing their contrast ratio against the
// background color
var colorNames = ['identifier', 'constant', 'type', 'statement', 'preproc', 'special'];

// generates a color and adds it to the given colors object using the given name
function addColor(colors, name, useAnsi, limit, fgDistinct) {
    let tryAgain = true;
    let attempts = 0;

    while (tryAgain) {
        if (++attempts > 1000) {
            throw new InvalidColorsError;
        }

        colors[name] = randomColor(useAnsi);

        tryAgain = false;

        if (contrastRatio(colors.bg, colors[name]) < limit) {
            tryAgain = true;
            continue;
        }

        if (fgDistinct) {
            if (contrastRatio(colors[name], colors.fg) < 1.1) {
                tryAgain = true;
                continue;
            }

            for (let col of colorNames) {
                if (col in colors && col !== name) {
                    if (contrastRatio(colors[name], colors[col]) < 1.1) {
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

        if (++attempts > 1000) {
            throw new InvalidColorsError;
        }

        if (contrastRatio(colors[name], colors.bg) < limit) {
            continue;
        }

        tryAgain = false;
        for (let sp in spellColorNames) {
            if (sp !== name && colors[sp] && colors[name].ish == colors[sp].ish) {
                tryAgain = true;
                break;
            }
        }
    }
}

var bgColorNames = ['cursorline', 'visual', 'incsearch', 'search', 'matchparen'];

// generates a new color and compares it against the colors in `colorNames` to ensure it meets the
// given contrast ratio threshold
function addBgColor(colors, name, useAnsi, limit, bgDistinct) {
    let tryAgain = true;
    let attempts = 0;

    while (tryAgain) {
        if (++attempts > 1000) {
            throw new InvalidColorsError;
        }

        colors[name] = randomColor(useAnsi);

        if (bgDistinct && contrastRatio(colors[name], colors.bg) < 1.1) {
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

// reads the settings from the page, then generates a new set of colors and returns the collection
// object
function randomColorSet() {
    try {
        let limit = getContrastLimit();
        let lineNrValid = getLineNrCheck();
        let useAnsi = document.getElementById('use-ansi').checked === true;
        let bgDistinct = document.getElementById('bg-distinct').checked === true;
        let fgDistinct = document.getElementById('fg-distinct').checked === true;
        let colors = {};
        colors.bg = randomColor(useAnsi);
        colors.fg = randomColor(useAnsi);
        let attempts = 0;

        while (contrastRatio(colors.bg, colors.fg) < limit) {
            if (++attempts > 10) {
                // if it takes too long to find a color with enough contrast, start over with a new
                // background
                attempts = 0;
                colors.bg = randomColor(useAnsi);
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

        for (let name in spellColorNames) {
            addSpellColor(colors, name, useAnsi, limit);
        }

        colors.lineNrBG = randomColor(useAnsi);
        colors.lineNrFG = randomColor(useAnsi);
        let goodLineNr = false;
        attempts = 0;

        while (!goodLineNr) {
            if (!lineNrValid(contrastRatio(colors.bg, colors.lineNrBG))) {
                colors.lineNrBG = randomColor(useAnsi);
            } else if (contrastRatio(colors.lineNrBG, colors.lineNrFG) < limit) {
                if (++attempts > 10) {
                    attempts = 0;
                    colors.lineNrBG = randomColor(useAnsi);
                } else {
                    colors.lineNrFG = randomColor(useAnsi);
                }
            } else {
                goodLineNr = true;
            }
        }

        colors.cursor = randomColor(useAnsi);
        while (contrastRatio(colors.bg, colors.cursor) < limit) {
            colors.cursor = randomColor(useAnsi);
        }

        for (let bg of bgColorNames) {
            addBgColor(colors, bg, useAnsi, limit, bgDistinct);
        }

        if (document.getElementById('cursorcolumn-same').checked === true) {
            colors.cursorcolumn = colors.cursorline;
        } else {
            addBgColor(colors, 'cursorcolumn', useAnsi, limit, bgDistinct);
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

// when the user clicks the "change colors" button, generate a new color set and change the CSS
// variables to display it on the page
document.getElementById('rando').addEventListener('click', function(ev) {
    let cols = randomColorSet();

    let cssVars = document.documentElement.style;
    cssVars.setProperty('--color-bg', cols.bg.hex);
    cssVars.setProperty('--color-fg', cols.fg.hex);
    cssVars.setProperty('--color-comment', cols.comment.hex);

    document.getElementById('ratio').innerHTML = cols.baseContrast.toFixed(2);

    document.getElementById('bg-col').innerHTML = cols.bg.text;
    document.getElementById('fg-col').innerHTML = cols.fg.text;
    document.getElementById('comment-col').innerHTML = cols.comment.text;

    for (let name of colorNames) {
        cssVars.setProperty(`--color-${name}`, cols[name].hex);
        document.getElementById(`${name}-col`).innerHTML = cols[name].text;
    }

    for (let name in spellColorNames) {
        cssVars.setProperty(`--color-${name}`, cols[name].hex);
        document.getElementById(`${name}-col`).innerHTML = cols[name].text;
    }

    cssVars.setProperty('--color-linenr-bg', cols.lineNrBG.hex);
    cssVars.setProperty('--color-linenr-fg', cols.lineNrFG.hex);
    document.getElementById('linenr-bg-col').innerHTML = cols.lineNrBG.text;
    document.getElementById('linenr-fg-col').innerHTML = cols.lineNrFG.text;

    cssVars.setProperty('--color-cursor', cols.cursor.hex);
    document.getElementById('cursor-col').innerHTML = cols.cursor.text;

    for (let name of bgColorNames) {
        cssVars.setProperty(`--color-${name}`, cols[name].hex);
        document.getElementById(`${name}-col`).innerHTML = cols[name].text;
    }

    cssVars.setProperty('--color-cursorcolumn', cols.cursorcolumn.hex);
    document.getElementById('cursorcolumn-col').innerHTML = cols.cursorcolumn.text;
});
