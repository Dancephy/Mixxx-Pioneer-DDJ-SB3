require('./common-controller-scripts');
const midi = require('./midi');
const engine = require('./engine');
const midicomponents = require('./midi-components-0.0');
const components = midicomponents.components;
global.components = components;
global.midi = midi;
global.engine = engine;