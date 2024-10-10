//  mkcolor - a vim color scheme randomizer/previewer
//  Written in 2020 by QuietMisdreavus <victoria@quietmisdreavus.net>

//  To the extent possible under law, the author(s) have dedicated all copyright
//  and related and neighboring rights to this software to the public domain
//  worldwide. This software is distributed without any warranty.

//  You should have received a copy of the CC0 Public Domain Dedication along
//  with this software. If not, see
//  <http://creativecommons.org/publicdomain/zero/1.0/>.

function vimGroupName(name) {
    let groupNames = {
        'identifier': 'Identifier',
        'constant': 'Constant',
        'type': 'Type',
        'statement': 'Statement',
        'preproc': 'PreProc',
        'special': 'Special',
        'title': 'Title',
        'modemsg': 'ModeMsg',
        'moremsg': 'MoreMsg',
        'directory': 'Directory',
        'cursorline': 'CursorLine',
        'visual': 'Visual',
        'incsearch': 'IncSearch',
        'search': 'Search',
        'matchparen': 'MatchParen',
        'diffdelete': 'DiffDelete',
        'diffchange': 'DiffChange',
        'difftext': 'DiffText',
        'diffadd': 'DiffAdd',
        'error': 'Error',
        'todo': 'Todo',
        'warningmsg': 'WarningMsg',
        'errormsg': 'ErrorMsg',
        'wildmenu': 'WildMenu',
        'linenr': 'LineNr',
        'cursorlinenr': 'CursorLineNr',
        'statusline': 'StatusLine',
        'tabline': 'TabLine',
        'tablinesel': 'TabLineSel',
        'folded': 'Folded',
        'pmenu': 'Pmenu',
        'pmenusel': 'PmenuSel',
        'nontext': 'NonText',
        'specialkey': 'SpecialKey',
        'foldcolumn': 'FoldColumn',
        'signcolumn': 'SignColumn',
        'statuslinenc': 'StatusLineNC',
        'vertsplit': 'VertSplit',
        'spellbad': 'SpellBad',
        'spellcap': 'SpellCap',
        'spellrare': 'SpellRare',
        'spelllocal': 'SpellLocal',
        'tablinefill': 'TabLineFill',
        'pmenusbar': 'PmenuSbar',
        'pmenuthumb': 'PmenuThumb',
        'cursorcolumn': 'CursorColumn'
    };

    if (groupNames[name]) {
        return groupNames[name];
    } else {
        return name;
    }
}

function renderHighlight(name, fg, bg, style) {
    let line = `hi ${vimGroupName(name)}`;

    if (fg) {
        line += ` guifg=${fg.hex}`;
        if (fg.idx) {
            line += ` ctermfg=${fg.idx}`;
        }
    }

    if (bg) {
        line += ` guibg=${bg.hex}`;
        if (bg.idx) {
            line += ` ctermbg=${bg.idx}`;
        }
    }

    if (style === undefined) {
        style = 'NONE';
    }

    line += ` gui=${style}`;
    let hasIdx = (fg && fg.idx) || (bg && bg.idx);
    if (hasIdx) {
        if (style === 'undercurl') {
            line += ' cterm=underline';
        } else {
            line += ` cterm=${style}`;
        }
    }

    line += '\n';
    return line;
}

function generateDownload(filename, content) {
    let elem = document.createElement('a');
    elem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    elem.setAttribute('download', filename);

    elem.style.display = 'none';
    document.body.appendChild(elem);

    elem.click();

    document.body.removeChild(elem);
}

document.getElementById('download').addEventListener('click', function(ev) {
    let name = prompt("Color scheme name:", "mkcolor");

    if (name === null) {
        return;
    }

    let output = '';

    output += '" This file was generated using mkcolor - https://quietmisdreavus.github.io/mkcolor/\n';
    output += '" To use this color scheme in your Vim configuration, save it to ~/.vim/colors/.\n\n';

    if (colorScheme.bg.lab.l < 50) {
        output += 'set background=dark\n';
    } else {
        output += 'set background=light\n';
    }

    output += 'hi clear\n';
    output += 'syntax reset\n';
    output += `let g:colors_name = "${name}"\n\n`;

    const none = undefined;

    output += renderHighlight('Normal', colorScheme.fg, colorScheme.bg);
    output += renderHighlight('Comment', colorScheme.comment);
    output += renderHighlight('Cursor', colorScheme.cursor, none, 'reverse');

    let boldColors = ['title', 'error', 'statusline', 'tablinesel', 'folded', 'cursorlinenr'];

    let textColors = colorNames.concat(loContrastColors);

    for (let col of textColors) {
        let style = undefined;
        if (boldColors.includes(col)) {
            style = 'bold';
        }

        output += renderHighlight(col, colorScheme[col], none, style);
    }

    output += '\n';

    let bgColors = bgColorNames.concat(Object.keys(bgTweakColors), Object.keys(bgForceSettings));

    for (let col of bgColors) {
        let style = undefined;
        if (boldColors.includes(col)) {
            style = 'bold';
        }

        output += renderHighlight(col, none, colorScheme[col], style);
    }

    output += '\n';

    for (let col in spellColorNames) {
        output += renderHighlight(col, colorScheme[col], none, 'undercurl');
    }

    output += '\n';

    let uiColors = uiColorNames.concat(Object.keys(uiForceSettings));

    for (let name of uiColors) {
        let bgName = `${name}-bg`;
        let fgName = `${name}-fg`;

        let style = undefined;
        if (boldColors.includes(name)) {
            style = 'bold';
        }

        output += renderHighlight(name, colorScheme[fgName], colorScheme[bgName], style);
    }

    generateDownload(`${name}.vim`, output);
});
