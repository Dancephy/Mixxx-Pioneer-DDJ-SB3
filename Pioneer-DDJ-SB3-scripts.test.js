const PioneerDDJSB3 = require('./Pioneer-DDJ-SB3-scripts');
require('./common-controller-scripts');
const midi = require('./midi');
const engine = require('./engine');
global.midi = midi;
global.engine = engine;
test('init', () => {
    PioneerDDJSB3.init();
});