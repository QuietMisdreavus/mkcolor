// return a random integer from 0 to the given number (inclusive of 0, exclusive of the max)
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

class InvalidColorsError extends Error {
    constructor() {
        super();
    }
}

// calculate the Relative Luminance of the given RGB color
function luminance(col) {
    function lumVal(v) {
        let frac = v / 255;

        if (frac <= 0.03928) {
            return frac / 12.92;
        } else {
            return Math.pow(((frac+0.055)/1.055), 2.4);
        }
    }

    let rVal = lumVal(col.r);
    let gVal = lumVal(col.g);
    let bVal = lumVal(col.b);

    return (rVal * 0.2126) + (gVal * 0.7152) + (bVal * 0.0722);
}

// calculate the Contrast Ratio of the given RGB colors
function contrastRatio(col1, col2) {
    let lum1 = luminance(col1);
    let lum2 = luminance(col2);

    let darker = Math.min(lum1, lum2);
    let lighter = Math.max(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
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

// returns a new RGB color using the given RGB values, and, if present, the given ANSI index
function newColor(r, g, b, idx) {
    let col = { r: r, g: g, b: b };
    let rStr = col.r.toString(16).padStart(2, '0').toUpperCase();
    let gStr = col.g.toString(16).padStart(2, '0').toUpperCase();
    let bStr = col.b.toString(16).padStart(2, '0').toUpperCase();
    col.hex = `#${rStr}${gStr}${bStr}`;
    col.text = `#${rStr}${gStr}${bStr}`;

    if (idx) {
        col.idx = idx;
        col.text += ` (ANSI ${idx})`;
    }

    return col;
}

// returns a random RGB color value, based on whether the user has requested to use ANSI terminal
// colors or not
function randomColor(useAnsi) {
    if (useAnsi) {
        return randomAnsiColor();
    } else {
        return randomRgbColor();
    }
}

// generates a random 24-bit RGB color
function randomRgbColor() {
    return newColor(getRandomInt(256), getRandomInt(256), getRandomInt(256));
}

// generates an RGB color object from the given ANSI color index
function getAnsiColor(ansi) {
    if (ansi < 16 || ansi > 255) return undefined;

    if (ansi > 231) {
        const s = (ansi - 232) * 10 + 8
        return newColor(s, s, s, ansi);
    }

    const n = ansi - 16
    let b = n % 6
    let g = (n - b) / 6 % 6
    let r = (n - b - g * 6) / 36 % 6
    b = b ? b * 40 + 55 : 0
    r = r ? r * 40 + 55 : 0
    g = g ? g * 40 + 55 : 0

    return newColor(r, g, b, ansi);
}

// generates a random color from the palette of 256-color ANSI terminal colors
function randomAnsiColor() {
    let idx = 0;

    while (idx < 16) { idx = getRandomInt(256); }

    return getAnsiColor(idx);
}

// the color classes that can be generated only by comparing their contrast ratio against the
// background color
var colorNames = ['identifier', 'constant', 'type', 'statement', 'preproc', 'special'];

// generates a color and adds it to the given colors object using the given name
function addColor(colors, name, useAnsi, limit) {
    colors[name] = randomColor(useAnsi);

    while (contrastRatio(colors.bg, colors[name]) < limit) {
        colors[name] = randomColor(useAnsi);
    }
}

var bgColorNames = ['cursorline', 'visual', 'incsearch', 'search'];

// generates a new color and compares it against the colors in `colorNames` to ensure it meets the
// given contrast ratio threshold
function addBgColor(colors, name, useAnsi, limit) {
    let tryAgain = true;
    let attempts = 0;

    while (tryAgain) {
        if (++attempts > 100) {
            throw new InvalidColorsError;
        }

        colors[name] = randomColor(useAnsi);

        if (contrastRatio(colors[name], colors.bg) < 1.1) {
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
            addColor(colors, name, useAnsi, limit);
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
            addBgColor(colors, bg, useAnsi, limit);
        }

        if (document.getElementById('cursorcolumn-same').checked === true) {
            colors.cursorcolumn = colors.cursorline;
        } else {
            addBgColor(colors, 'cursorcolumn', useAnsi, limit);
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
