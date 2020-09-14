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

function clamp(val, min, max) {
    if (val < min) {
        return min;
    } else if (val > max) {
        return max;
    } else {
        return val;
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

function labDistance(col1, col2) {
    return Math.hypot(col1.lab.l - col2.lab.l,
                      col1.lab.a - col2.lab.a,
                      col1.lab.b - col2.lab.b);
}

// returns a new RGB color using the given RGB values, and, if present, the given ANSI index
function newColor(r, g, b, idx, lab) {
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

    col.hsv = hsvFromColor(col);
    col.ish = col.hsv.ish;

    if (lab) {
        col.lab = lab;
    } else {
        col.lab = labFromColor(col);
    }

    return col;
}

function hsvFromColor(col) {
    var max = Math.max(col.r, col.g, col.b);
    var min = Math.min(col.r, col.g, col.b);
    var d = max - min;
    var s = (max === 0 ? 0 : d / max);
    var v = max / 255;
    var h;

    switch (max) {
        case min:
            h = 0;
            break;
        case col.r:
            h = (col.g - col.b) + d * (col.g < col.b ? 6 : 0);
            h /= 6 * d;
            break;
        case col.g:
            h = (col.b - col.r) + d * 2;
            h /= 6 * d;
            break;
        case col.b:
            h = (col.r - col.g) + d * 4;
            h /= 6 * d;
            break;
    }

    var ish;

    if (s < 0.1) {
        ish = "greyish";
    } else if (v < 0.1) {
        ish = "blackish";
    } else {
        if (h < 0.1) {
            ish = "reddish";
        } else if (h < 0.233) {
            ish = "yellowish";
        } else if (h < 0.433) {
            ish = "greenish";
        } else if (h < 0.566) {
            ish = "cyanish";
        } else if (h < 0.766) {
            ish = "blueish";
        } else if (h < 0.9) {
            ish = "magentaish";
        } else {
            ish = "reddish";
        }
    }

    return {
        h: h,
        s: s,
        v: v,
        ish: ish
    };
}

// consts used in the CIELAB conversion
const sigma  = (6 / 29);
const sigma2 = Math.pow(6 / 29, 2);
const sigma3 = Math.pow(6 / 29, 3);

// XXX: this function contains a matrix multiplication that i pulled out into slow math! i didn't
// necessarily care about speed here, just that i didn't want to pull in a dependency to do quick
// matrix math >_> (or to do the conversion for me, e.g. chroma-js)
function labFromColor(col) {
    function xyzFromColor(col) {
        // apply gamma-expansion
        function gamma(u) {
            if (u <= 0.04045) {
                return u / 12.92;
            } else {
                let val = (u + 0.055) / 1.055;
                return Math.pow(val, 2.4);
            }
        }

        let r = gamma(col.r / 255);
        let g = gamma(col.g / 255);
        let b = gamma(col.b / 255);

        return {
            x: (0.42139080 * r) + (0.35758434 * g) + (0.18048079 * b),
            y: (0.21263901 * r) + (0.71516868 * g) + (0.07219232 * b),
            z: (0.01933082 * r) + (0.11919478 * g) + (0.95053215 * b)
        };
    }

    function labFromXyz(xyz) {
        function f(t) {
            if (t > sigma3) {
                return Math.pow(t, 1/3);
            } else {
                return (t / (3 * sigma2)) + (4 / 29);
            }
        }

        let normX = f(xyz.x / 0.9505);
        let normY = f(xyz.y);
        let normZ = f(xyz.z / 1.0890);

        return {
            l: (116 * normY) - 16,
            a: 500 * (normX - normY),
            b: 200 * (normY - normZ)
        };
    }

    return labFromXyz(xyzFromColor(col));
}

function colorFromLab(lab) {
    function xyzFromLab(lab) {
        function f(t) {
            if (t > sigma) {
                return Math.pow(t, 3);
            } else {
                return 3 * sigma2 * (t - (4/29));
            }
        }

        let lTerm = (lab.l + 16) / 116;

        return {
            x: 0.9505 * f(lTerm + (lab.a / 500)),
            y:          f(lTerm),
            z: 1.0890 * f(lTerm + (lab.b / 200))
        };
    }

    function colorFromXyz(xyz) {
        function gamma(u) {
            if (u <= 0.0031308) {
                return u / 12.92;
            } else {
                let val = (u + 0.055) / 1.055;
                return Math.pow(val, 2.4);
            }
        }

        let linearR =  (xyz.x * 3.24096994) - (xyz.y * 1.53738318) - (xyz.z * 0.49861076);
        let linearG = -(xyz.x * 0.96924364) + (xyz.y * 1.87596750) + (xyz.z * 0.04155506);
        let linearB =  (xyz.x * 0.05563008) - (xyz.y * 0.20397696) + (xyz.z * 1.05697151);

        let r = clamp(Math.round(gamma(linearR) * 255), 0, 255);
        let g = clamp(Math.round(gamma(linearG) * 255), 0, 255);
        let b = clamp(Math.round(gamma(linearB) * 255), 0, 255);

        return newColor(r, g, b, undefined, lab);
    }

    return colorFromXyz(xyzFromLab(lab));
}
