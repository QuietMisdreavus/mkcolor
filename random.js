//  mkcolor - a vim color scheme randomizer/previewer
//  Written in 2020 by QuietMisdreavus <victoria@quietmisdreavus.net>

//  To the extent possible under law, the author(s) have dedicated all copyright
//  and related and neighboring rights to this software to the public domain
//  worldwide. This software is distributed without any warranty.

//  You should have received a copy of the CC0 Public Domain Dedication along
//  with this software. If not, see
//  <http://creativecommons.org/publicdomain/zero/1.0/>.

// return a random integer from 0 to the given number (inclusive of 0, exclusive of the max)
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
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
