function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function luminance(r, g, b) {
    function lumVal(v) {
        let frac = v / 255;

        if (frac <= 0.03928) {
            return frac / 12.92;
        } else {
            return Math.pow(((frac+0.055)/1.055), 2.4);
        }
    }

    let rVal = lumVal(r);
    let gVal = lumVal(g);
    let bVal = lumVal(b);

    return (rVal * 0.2126) + (gVal * 0.7152) + (bVal * 0.0722);
}

function contrastRatio(r1, g1, b1, r2, g2, b2) {
    let lum1 = luminance(r1, g1, b1);
    let lum2 = luminance(r2, g2, b2);

    let darker = Math.min(lum1, lum2);
    let lighter = Math.max(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
}

function randomColor() {
    let r = getRandomInt(256);
    let g = getRandomInt(256);
    let b = getRandomInt(256);
    let rStr = r.toString(16).padStart(2, '0').toUpperCase();
    let gStr = g.toString(16).padStart(2, '0').toUpperCase();
    let bStr = b.toString(16).padStart(2, '0').toUpperCase();
    return [`#${rStr}${gStr}${bStr}`, r, g, b];
}

document.getElementById('rando').addEventListener('click', function(ev) {
    let col1 = randomColor();
    let col2 = randomColor();

    document.documentElement.style.setProperty('--color-1', col1[0]);
    document.documentElement.style.setProperty('--color-2', col2[0]);

    let contrast = contrastRatio(col1[1], col1[2], col1[3], col2[1], col2[2], col2[3]);
    document.getElementById('ratio').innerHTML = contrast.toFixed(2);

    document.getElementById('col1').innerHTML = col1[0];
    document.getElementById('col2').innerHTML = col2[0];
});
