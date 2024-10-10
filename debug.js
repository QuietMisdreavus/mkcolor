//  mkcolor - a vim color scheme randomizer/previewer
//  Written in 2020 by QuietMisdreavus <victoria@quietmisdreavus.net>

//  To the extent possible under law, the author(s) have dedicated all copyright
//  and related and neighboring rights to this software to the public domain
//  worldwide. This software is distributed without any warranty.

//  You should have received a copy of the CC0 Public Domain Dedication along
//  with this software. If not, see
//  <http://creativecommons.org/publicdomain/zero/1.0/>.

function maxContrastRatio(col) {
    let cr = 0;

    for (let r = 0; r < 256; r++) {
        for (let g = 0; g < 256; g++) {
            for (let b = 0; b < 256; b++) {
                let testCol = newColor(r, g, b);
                cr = Math.max(cr, contrastRatio(col, testCol));
            }
        }
    }

    return cr;
}

function setBackground(col) {
    colorScheme.bg = col;
    colorScheme.baseContrast = contrastRatio(colorScheme.bg, colorScheme.fg);

    document.documentElement.style.setProperty('--color-bg', colorScheme.bg.hex);
    document.getElementById('bg-col').innerHTML = colorScheme.bg.text;

    document.getElementById('ratio').innerHTML = colorScheme.baseContrast.toFixed(2);
}

const black = newColor(0, 0, 0);
const white = newColor(0xff, 0xff, 0xff);
const labMidpoint = colorFromLab({ l: 50, a: 0, b: 0 });

function printColor(col) {
    let hsvStr = `hsv: ${col.hsv.h.toFixed(2)}/${col.hsv.s.toFixed(2)}/${col.hsv.v.toFixed(2)}`;
    let labStr = `lab: ${col.lab.l.toFixed(2)}/${col.lab.a.toFixed(2)}/${col.lab.b.toFixed(2)}`;
    let blackStr = `CR against black: ${contrastRatio(col, black)}`;
    let whiteStr = `CR against white: ${contrastRatio(col, white)}`;
    let midStr = `CR against midpoint: ${contrastRatio(col, crMidpoint)}`;
    let midDist = `Distance from midpoint: ${labDistance(col, labMidpoint)}`;
    console.log(`${col.hex}, ${hsvStr}, ${labStr}, ${blackStr}, ${whiteStr}, ${midStr}, ${midDist}`);
}

var invalidBackgrounds = [];
var reportInvalidScheme = function() { };

function enableDebug() {
    reportInvalidScheme = function(bg) {
        invalidBackgrounds.push(bg);
        printColor(bg);
    };
}

function reportInvalid() {
    if (invalidBackgrounds && invalidBackgrounds.length < 5) {
        return;
    }
    console.log(`${invalidBackgrounds.length} colors in set`);

    function average(arr) {
        let sum = arr.reduce(function(a, b) { return a+b; }, 0);
        return sum / arr.length;
    }

    function median(arr) {
        let half = Math.floor(arr.length / 2);

        if (arr.length % 2 == 0) {
            return (arr[half - 1] + arr[half]) / 2;
        } else {
            return arr[half];
        }
    }

    let accum = {
        l: [],
        a: [],
        b: []
    }

    for (let col of invalidBackgrounds) {
        accum.l.push(col.lab.l);
        accum.a.push(col.lab.a);
        accum.b.push(col.lab.b);
    }

    accum.l.sort(function(a,b) { return a-b; });
    accum.a.sort(function(a,b) { return a-b; });
    accum.b.sort(function(a,b) { return a-b; });

    let stats = {
        avg: {
            l: average(accum.l),
            a: average(accum.a),
            b: average(accum.b)
        },

        median: {
            l: median(accum.l),
            a: median(accum.a),
            b: median(accum.b)
        },

        middle: {
            l: (accum.l[0] + accum.l[accum.l.length - 1]) / 2,
            a: (accum.a[0] + accum.a[accum.a.length - 1]) / 2,
            b: (accum.b[0] + accum.b[accum.b.length - 1]) / 2,
        }
    };

    return {
        avg: colorFromLab(stats.avg),
        median: colorFromLab(stats.median),
        middle: colorFromLab(stats.middle)
    };
}
