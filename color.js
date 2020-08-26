function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function randomColor() {
    let r = getRandomInt(256).toString(16).padStart(2, '0').toUpperCase();
    let g = getRandomInt(256).toString(16).padStart(2, '0').toUpperCase();
    let b = getRandomInt(256).toString(16).padStart(2, '0').toUpperCase();
    return `#${r}${g}${b}`
}

document.getElementById('rando').addEventListener('click', function(ev) {
    let col1 = randomColor();
    let col2 = randomColor();

    document.documentElement.style.setProperty('--color-1', col1);
    document.documentElement.style.setProperty('--color-2', col2);

    document.getElementById('col1').innerHTML = col1;
    document.getElementById('col2').innerHTML = col2;
});
