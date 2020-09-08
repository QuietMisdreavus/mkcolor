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
