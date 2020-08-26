function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

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

function contrastRatio(col1, col2) {
    let lum1 = luminance(col1);
    let lum2 = luminance(col2);

    let darker = Math.min(lum1, lum2);
    let lighter = Math.max(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
}

function randomColor() {
    let col = { r: getRandomInt(256), g: getRandomInt(256), b: getRandomInt(256) };
    let rStr = col.r.toString(16).padStart(2, '0').toUpperCase();
    let gStr = col.g.toString(16).padStart(2, '0').toUpperCase();
    let bStr = col.b.toString(16).padStart(2, '0').toUpperCase();
    col.text = `#${rStr}${gStr}${bStr}`;
    return col;
}

function randomColorPair() {
    return [randomColor(), randomColor()];
}

document.getElementById('rando').addEventListener('click', function(ev) {
    let cols = randomColorPair();

    document.documentElement.style.setProperty('--color-1', cols[0].text);
    document.documentElement.style.setProperty('--color-2', cols[1].text);

    let contrast = contrastRatio(cols[0], cols[1]);
    document.getElementById('ratio').innerHTML = contrast.toFixed(2);

    document.getElementById('col1').innerHTML = cols[0].text;
    document.getElementById('col2').innerHTML = cols[1].text;
});
