#!/bin/bash

node ./compile-xml.js

cp lodash.mixxx.js ~/.mixxx/controllers
cp midi-components-0.0.js ~/.mixxx/controllers
cp Pioneer-DDJ-SB3-scripts.js ~/.mixxx/controllers
cp Pioneer-DDJ-SB3.midi.xml ~/.mixxx/controllers
