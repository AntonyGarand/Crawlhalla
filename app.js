let args = process.argv.slice(2);
let namedArgs = [];

args.filter(value => value.indexOf('=') !== -1).forEach((value, key) => {
    let newKey = value.slice(0, value.indexOf('='));
    let newVal = value.slice(newKey.length + 1);
    namedArgs[newKey] = newVal;
    delete args[key];
});

const startPage = namedArgs['startPage'] ? namedArgs['startpage'] : 1;
const endPage = namedArgs['endPage'] ? namedArgs['endPage '] : 100;
const region = namedArgs['region'] ? namedArgs['region '] : 'all';
const mode = namedArgs['mode'] ? namedArgs['mode '] : '1v1';
