var PioneerDDJSB3 = {};
//var PioneerDDJSB3 = {};

///////////////////////////////////////////////////////////////
//                       USER OPTIONS                        //
///////////////////////////////////////////////////////////////

// If true, vinyl mode will be enabled when Mixxx starts.
PioneerDDJSB3.vinylModeOnStartup = false;

// If true, the vinyl button activates slip. Vinyl mode is then activated by using shift.
// Allows toggling slip faster, but is counterintuitive.
PioneerDDJSB3.invertVinylSlipButton = false;

// If true, pressing shift + cue will play the track in reverse and enable slip mode,
// which can be used like a censor effect. If false, pressing shift + cue jumps to
// the beginning of the track and stops playback.
PioneerDDJSB3.reverseRollOnShiftCue = false;

// Sets the jogwheels sensivity. 1 is default, 2 is twice as sensitive, 0.5 is half as sensitive.
PioneerDDJSB3.jogwheelSensivity = 1.0;

// Sets how much more sensitive the jogwheels get when holding shift.
// Set to 1 to disable jogwheel sensitivity increase when holding shift.
PioneerDDJSB3.jogwheelShiftMultiplier = 100;

// If true Level-Meter shows VU-Master left & right. If false shows level of active deck.
PioneerDDJSB3.showVumeterMaster = false;

// If true VU-Level twinkle if AutoDJ is ON.
PioneerDDJSB3.twinkleVumeterAutodjOn = true;

// If true, releasing browser knob jumps forward to jumpPreviewPosition.
PioneerDDJSB3.jumpPreviewEnabled = true;
// Position in the track to jump to. 0 is the beginning of the track and 1 is the end.
PioneerDDJSB3.jumpPreviewPosition = 0.5;

PioneerDDJSB3.looprollIntervals = [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8];

/*
    Pioneer DDJ-SB3 mapping for Mixxx
    Copyright (c) 2019 Dancephy LLC (javier@dancephy.com), licensed under GPL version 3 or later
    Copyright (c) 2017 Be (be.0@gmx.com), licensed under GPL version 2 or later
    Copyright (c) 2014-2015 various contributors, licensed under MIT license

    Contributors and change log:
    - Be (be.0@gmx.com): update effects and autoloop mode for Mixxx 2.1, fix level meter scaling,
      remove LED flickering when pressing shift, start porting to Components
    - Michael Stahl (DG3NEC): original DDJ-SB2 mapping for Mixxx 2.0
    - Joan Ardiaca Jové (joan.ardiaca@gmail.com): Pioneer DDJ-SB mapping for Mixxx 2.0
    - wingcom (wwingcomm@gmail.com): start of Pioneer DDJ-SB mapping
      https://github.com/wingcom/Mixxx-Pioneer-DDJ-SB
    - Hilton Rudham: Pioneer DDJ-SR mapping
      https://github.com/hrudham/Mixxx-Pioneer-DDJ-SR

    GPL license notice for current version:
    This program is free software; you can redistribute it and/or modify it under the terms of the
    GNU General Public License as published by the Free Software Foundation; either version 2
    of the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See
    the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with this program; if
    not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.


    MIT License for earlier versions:
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software
    and associated documentation files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or
    substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
    BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    TODO:
      - bug when touching jog wheel for first time in vinyl mode
*/

///////////////////////////////////////////////////////////////
//               INIT, SHUTDOWN & GLOBAL HELPER              //
///////////////////////////////////////////////////////////////
PioneerDDJSB3.trackLoadedSends = {};


PioneerDDJSB3.trackLoaded = function(value, group, control) {
    var deckIndex = PioneerDDJSB3.channelGroups[group];

    if (value) {
        midi.sendShortMsg(0x96, 0x46 + deckIndex, 0x7F);
    } else {
        PioneerDDJSB3.trackLoadedSends[group] = false;
        midi.sendShortMsg(0x96, 0x46 + deckIndex, 0x0);
    }
}

// When unloading a deck, it should pass 0 for BPM
PioneerDDJSB3.updateBPM = function(bpm, group, control) {
    var bpmValue = Math.round(bpm * 100);
    var bpmBits = bpmValue.toString(2).split("");

    var bpmBitsPadded = [];

    var offset = 16 - bpmBits.length;
    
    for (var i=0; i<16; i++) {
        if (i < offset) {
            bpmBitsPadded[i] = '0';
        } else {
            bpmBitsPadded[i] = bpmBits[i - offset]
        }
    }

    var bytes = [];

    for (var i=0; i<4; i++) {
        var mbyte = 0;

        for (var j=0; j<4; j++) {
            var bitIndex = (i * 4) + j;
            var bit = parseInt(bpmBitsPadded[bitIndex]);
            mbyte = mbyte | (bit << (3 - j));
        }

        bytes[i] = mbyte;
    }

    var deckIndex = PioneerDDJSB3.channelGroups[group];
    var deckByte = 0x11 + deckIndex;


    var sysexMessage = [0xF0, 0x00, 0x20, 0x04, 0x7F, deckByte, 0x00, 0x04, 0x00, bytes[0], bytes[1], 0x07, bytes[2], bytes[3], 0xF7];
    midi.sendSysexMsg(sysexMessage, sysexMessage.length);

    if (!PioneerDDJSB3.trackLoadedSends[group] && bpm > 0) {
        PioneerDDJSB3.trackLoadedSends[group] = true;
        midi.sendShortMsg(0x96, 0x46 + deckIndex, 0x7F);
    }
};

PioneerDDJSB3.longButtonPress = false;

PioneerDDJSB3.flasher = {};

PioneerDDJSB3.flasher.functions = [];

PioneerDDJSB3.flasher.init = function() {
    var flag = true;

    PioneerDDJSB3.flasher.timer = engine.beginTimer(500, function() {
        flag = !flag;

        for (var i = 0; i < PioneerDDJSB3.flasher.functions.length; i++) {
            PioneerDDJSB3.flasher.functions[i](flag);
        }
    });
};

PioneerDDJSB3.flasher.shutdown = function() {
    engine.stopTimer(PioneerDDJSB3.flasher.timer);
};

PioneerDDJSB3.flasher.addFunction = function(fn) {
    PioneerDDJSB3.flasher.functions.push(fn);
};

PioneerDDJSB3.flasher.removeFunction = function (fn) {
    PioneerDDJSB3.flasher.functions = _.filter(PioneerDDJSB3.flasher.functions, function(f) {
        return fn !== f;
    });
};

PioneerDDJSB3.midiOutputBeatLeds = [0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67];

PioneerDDJSB3.scratchSettings = {
    'alpha': 1.0 / 8,
    'beta': 1.0 / 8 / 32,
    'jogResolution': 720,
    'vinylSpeed': 33 + 1 / 3,
    'safeScratchTimeout': 20
};

PioneerDDJSB3.channelGroups = {
    '[Channel1]': 0x00,
    '[Channel2]': 0x01,
    '[Channel3]': 0x02,
    '[Channel4]': 0x03
};

PioneerDDJSB3.samplerGroups = {
    '[Sampler1]': { channels: ['[Channel1]', '[Channel3]'], ledNumber: 0x00, },
    '[Sampler2]': { channels: ['[Channel1]', '[Channel3]'], ledNumber: 0x01, },
    '[Sampler3]': { channels: ['[Channel1]', '[Channel3]'], ledNumber: 0x02, },
    '[Sampler4]': { channels: ['[Channel1]', '[Channel3]'], ledNumber: 0x03, },
    '[Sampler5]': { channels: ['[Channel2]', '[Channel4]'], ledNumber: 0x00, },
    '[Sampler6]': { channels: ['[Channel2]', '[Channel4]'], ledNumber: 0x01, },
    '[Sampler7]': { channels: ['[Channel2]', '[Channel4]'], ledNumber: 0x02, },
    '[Sampler8]': { channels: ['[Channel2]', '[Channel4]'], ledNumber: 0x03, },
};

PioneerDDJSB3.ledGroups = {
    'hotCue': 0x00,
    'fxFade': 0x10,
    'padScratch': 0x20,
    'sampler': 0x30,
    'roll': 0x50,
};

PioneerDDJSB3.nonPadLeds = {
    'headphoneCue': 0x54,
    'shiftHeadphoneCue': 0x68,
    'cue': 0x0C,
    'shiftCue': 0x48,
    'keyLock': 0x1A,
    'shiftKeyLock': 0x60,
    'play': 0x0B,
    'shiftPlay': 0x47,
    'vinyl': 0x17,
    'shiftVinyl': 0x4E,
    'sync': 0x58,
    'shiftSync': 0x5C,
    'autoLoop': 0x14,
    'shiftAutoLoop': 0x50,
};

PioneerDDJSB3.channelsToPadNumber = {
    '[Channel1]': 1,
    '[Channel2]': 2,
    '[Channel3]': 3,
    '[Channel4]': 4
};

PioneerDDJSB3.channelsToEffectUnitNumber = {
    '[Channel1]': 1,
    '[Channel2]': 2,
    '[Channel3]': 1,
    '[Channel4]': 2
};

PioneerDDJSB3.init = function (id) {
    PioneerDDJSB3.shiftPressed = false;

    PioneerDDJSB3.chFaderStart = [
        null,
        null
    ];

    PioneerDDJSB3.scratchMode = [false, false, false, false];

    PioneerDDJSB3.valueVuMeter = {
        '[Channel1]_current': 0,
        '[Channel2]_current': 0,
        '[Channel3]_current': 0,
        '[Channel4]_current': 0,
        '[Channel1]_enabled': 1,
        '[Channel2]_enabled': 1,
        '[Channel3]_enabled': 1,
        '[Channel4]_enabled': 1,
    };

    PioneerDDJSB3.deck = [];
    PioneerDDJSB3.deck[1] = new PioneerDDJSB3.Deck(1);
    PioneerDDJSB3.deck[2] = new PioneerDDJSB3.Deck(2);
    PioneerDDJSB3.deck[3] = new PioneerDDJSB3.Deck(3);
    PioneerDDJSB3.deck[4] = new PioneerDDJSB3.Deck(4);

    PioneerDDJSB3.effectUnit = [];
    PioneerDDJSB3.effectUnit[1] = new PioneerDDJSB3.EffectUnit(1);
    PioneerDDJSB3.effectUnit[2] = new PioneerDDJSB3.EffectUnit(2);

    PioneerDDJSB3.padForDeck = [];
    PioneerDDJSB3.padForDeck[1] = new PioneerDDJSB3.Pad(1);
    PioneerDDJSB3.padForDeck[2] = new PioneerDDJSB3.Pad(2);
    PioneerDDJSB3.padForDeck[3] = new PioneerDDJSB3.Pad(3);
    PioneerDDJSB3.padForDeck[4] = new PioneerDDJSB3.Pad(4);

    PioneerDDJSB3.bindNonDeckControlConnections(false);
    PioneerDDJSB3.initDeck('[Channel1]');
    PioneerDDJSB3.initDeck('[Channel2]');
    PioneerDDJSB3.initDeck('[Channel3]');
    PioneerDDJSB3.initDeck('[Channel4]');

    if (PioneerDDJSB3.twinkleVumeterAutodjOn) {
        PioneerDDJSB3.vu_meter_timer = engine.beginTimer(100, "PioneerDDJSB3.vuMeterTwinkle()");
    }

    var initSysBytes = [0xF0, 0x00, 0x20, 0x7F, 0x03, 0x01, 0xF7];
    midi.sendSysexMsg(initSysBytes, initSysBytes.length);

    // request the positions of the knobs and faders from the controller
    midi.sendShortMsg(0x9B, 0x09, 0x7f);

    PioneerDDJSB3.flasher.init();
    PioneerDDJSB3.initFlashingPadLedControl();
};

PioneerDDJSB3.shiftListeners = [];

PioneerDDJSB3.Deck = function (deckNumber) {
    var theDeck = this;
    this.group = '[Channel' + deckNumber + ']';

    this.shiftButton = function (channel, control, value, status, group) {
        if (value > 0) {
            theDeck.shift();
            PioneerDDJSB3.shiftPressed = true;
            PioneerDDJSB3.chFaderStart[deckNumber] = null;
            PioneerDDJSB3.headphoneLevel.shift();
            for (var i = 0; i < PioneerDDJSB3.shiftListeners.length; i++) {
                PioneerDDJSB3.shiftListeners[i](group, true);
            }
        } else {
            theDeck.unshift();
            PioneerDDJSB3.shiftPressed = false;
            PioneerDDJSB3.headphoneLevel.unshift();
            for (var i = 0; i < PioneerDDJSB3.shiftListeners.length; i++) {
                PioneerDDJSB3.shiftListeners[i](group, false);
            }
        }
    };
    var playButton = this.playButton = new components.PlayButton({
        midi: [0x90 + deckNumber - 1, 0x0B],
        shiftOffset: 60,
        shiftControl: true,
        sendShifted: true,
        connect: function() {
            this.connections[0] = engine.makeConnection(this.group, 'play_indicator', this.output);
            this.connections[1] = engine.makeConnection(this.group, 'track_loaded', this.output);
        },
        flashLed: function(active) {
            playButton.send(playButton.outValueScale(active));
        },
        output: function(value, group, control) {
            playButton[control] = value;

            if (playButton.track_loaded) {
                if (playButton.play_indicator) {
                    PioneerDDJSB3.flasher.removeFunction(playButton.flashLed);
                    playButton.send(playButton.outValueScale(true));
                } else {
                    PioneerDDJSB3.flasher.addFunction(playButton.flashLed);
                }
            } else {
                PioneerDDJSB3.flasher.removeFunction(playButton.flashLed);
                playButton.send(playButton.outValueScale(false));
            }
        }
    });

    this.cueButton = new components.CueButton({
        midi: [0x90 + deckNumber - 1, 0x0C],
        shiftOffset: 60,
        shiftControl: true,
        sendShifted: true,
        reverseRollOnShift: PioneerDDJSB3.reverseRollOnShiftCue,
    });

    this.syncButton = new components.SyncButton({
        midi: [0x90 + deckNumber - 1, 0x58],
        shiftOffset: 4,
        shiftControl: true,
        sendShifted: true,
    });

    var effectUnitNumber = deckNumber;
    if (deckNumber > 2) {
        effectUnitNumber -= 2;
    }

    this.gainKnob = new components.Pot({
        unshift: function () {
            this.group = '[Channel' + deckNumber + ']';
            this.inKey = 'pregain';
            this.disconnect();
            this.connect();
        },
        shift: function () {
            var focusedEffect = engine.getValue('[EffectRack1_EffectUnit' + effectUnitNumber + ']', 'focused_effect');
            this.group = '[EffectRack1_EffectUnit' + effectUnitNumber + '_Effect' + focusedEffect + ']';
            this.inKey = 'parameter1';
            this.disconnect();
            this.connect();
        },
    });

    this.eqKnob = [];
    for (var k = 1; k <= 3; k++) {
        this.eqKnob[k] = new components.Pot({
            number: k,
            unshift: function () {
                this.group = '[EqualizerRack1_[Channel' + deckNumber + ']_Effect1]';
                this.inKey = 'parameter' + this.number;
                this.disconnect();
                this.connect();
            },
            shift: function () {
                var focusedEffect = engine.getValue('[EffectRack1_EffectUnit' + effectUnitNumber + ']', 'focused_effect');
                this.group = '[EffectRack1_EffectUnit' + effectUnitNumber + '_Effect' + focusedEffect + ']';
                this.inKey = 'parameter' + (5 - this.number);
                this.disconnect();
                this.connect();
            },
        });
    }

    this.quickEffectKnob = new components.Pot({
        unshift: function () {
            this.group = '[QuickEffectRack1_[Channel' + deckNumber + ']]';
            this.inKey = 'super1';
            this.disconnect();
            this.connect();
        },
        shift: function () {
            var focusedEffect = engine.getValue('[EffectRack1_EffectUnit' + effectUnitNumber + ']', 'focused_effect');
            this.group = '[EffectRack1_EffectUnit' + effectUnitNumber + '_Effect' + focusedEffect + ']';
            this.inKey = 'parameter5';
            this.disconnect();
            this.connect();
        },
    });

    this.tempoFader = new components.Pot({
        inKey: 'rate',
    });

    this.forEachComponent(function (c) {
        if (c.group === undefined) {
            c.group = theDeck.group;
            c.connect();
            c.trigger();
        }
    });

    this.loadConnection = engine.makeConnection("[Channel" + deckNumber + "]", 'track_loaded', PioneerDDJSB3.trackLoaded);
    this.bpmConnection = engine.makeConnection("[Channel" + deckNumber + "]", 'bpm', PioneerDDJSB3.updateBPM);

    engine.setValue("[Channel" + deckNumber + "]", "rate_dir", 1);
};
PioneerDDJSB3.Deck.prototype = components.ComponentContainer.prototype;

PioneerDDJSB3.Pad = function(padNumber) {
    var _this = this;

    this.padNumber = padNumber;

    this.slicerButtons = [];

    for (var i = 1; i <= PioneerDDJSB3.midiOutputBeatLeds.length; i++) {
        (function(beat) {
            _this.slicerButtons[beat] = function(channel, control, value, status) {
                if (_this.slicer) {
                    _this.slicer.buttons[beat](channel, control, value, status);
                }
            }
        })(i);
    }

    // Change BeatJump leds when shifted
    PioneerDDJSB3.shiftListeners.push(function(group, isShifted) {
        if (PioneerDDJSB3.channelsToPadNumber[group] === padNumber) {
            if (isShifted) {
                for (var i = 0; i < 8; i++) {
                    midi.sendShortMsg(0x97 + padNumber - 1, 0x40 + i, 0x7F);
                }
            } else {
                midi.sendShortMsg(0x97 + padNumber - 1, 0x40, 0x0);
                midi.sendShortMsg(0x97 + padNumber - 1, 0x41, 0x0);
                midi.sendShortMsg(0x97 + padNumber - 1, 0x42, 0x7F);
                midi.sendShortMsg(0x97 + padNumber - 1, 0x43, 0x7F);
                midi.sendShortMsg(0x97 + padNumber - 1, 0x44, 0x0);
                midi.sendShortMsg(0x97 + padNumber - 1, 0x45, 0x0);
                midi.sendShortMsg(0x97 + padNumber - 1, 0x46, 0x0);
                midi.sendShortMsg(0x97 + padNumber - 1, 0x47, 0x0);
            }
        }
    });
};

PioneerDDJSB3.Pad.prototype.setModeActive = function(activeMode) {
    midi.sendShortMsg(0x90 + this.padNumber - 1, 0x1B, activeMode === 0x1B ? 0x7F : 0x0);
    midi.sendShortMsg(0x90 + this.padNumber - 1, 0x1E, activeMode === 0x1E ? 0x7F : 0x0);
    midi.sendShortMsg(0x90 + this.padNumber - 1, 0x20, activeMode === 0x20 ? 0x7F : 0x0);
    midi.sendShortMsg(0x90 + this.padNumber - 1, 0x22, activeMode === 0x22 ? 0x7F : 0x0);
    midi.sendShortMsg(0x90 + this.padNumber - 1, 0x69, activeMode === 0x69 ? 0x7F : 0x0);
    midi.sendShortMsg(0x90 + this.padNumber - 1, 0x6B, activeMode === 0x6B ? 0x7F : 0x0);
    midi.sendShortMsg(0x90 + this.padNumber - 1, 0x6D, activeMode === 0x6D ? 0x7F : 0x0);
    midi.sendShortMsg(0x90 + this.padNumber - 1, 0x6E, activeMode === 0x6E ? 0x7F : 0x0);
};

PioneerDDJSB3.Pad.prototype.clearSlicer = function() {
    if (this.slicer) {
        this.slicer.shutdown();
        this.slicer = null;
    }
};

PioneerDDJSB3.Pad.prototype.hotcueMode = function(channel, control, value, status, group) {
    if (value) {
        this.setModeActive(0x1B);
        this.clearSlicer();
    }
};

PioneerDDJSB3.Pad.prototype.beatJumpMode = function(channel, control, value, status, group) {
    if (value) {
        this.setModeActive(0x69);
        this.clearSlicer();

        // Let jump pad led on
        midi.sendShortMsg(0x97 + this.padNumber - 1, 0x42, 0x7F);
        midi.sendShortMsg(0x97 + this.padNumber - 1, 0x43, 0x7F);
    }
};

PioneerDDJSB3.Pad.prototype.fxFadeMode = function(channel, control, value, status, group) {
    if (value) {
        this.setModeActive(0x1E);
        this.clearSlicer();
    }
}

PioneerDDJSB3.Pad.prototype.rollMode = function(channel, control, value, status, group) {
    if (value) {
        this.setModeActive(0x6B);
        this.clearSlicer();
    }
}

PioneerDDJSB3.Pad.prototype.padScratchMode = function(channel, control, value, status, group) {
    if (value) {
        this.setModeActive(0x20);
        this.clearSlicer();
    }
}

PioneerDDJSB3.Pad.prototype.slicerMode = function(channel, control, value, status, group) {
    if (value) {
        this.setModeActive(0x6D);

        if (!this.slicer) {
            var group = '[Channel' + this.padNumber + ']';
            var midiOutputOp = 0x97 + this.padNumber - 1;

            this.slicer = new PioneerDDJSB3.Slicer(group, midiOutputOp, PioneerDDJSB3.midiOutputBeatLeds);
        }
    }
};

PioneerDDJSB3.Pad.prototype.samplerMode = function(channel, control, value, status, group) {
    if (value) {
        this.setModeActive(0x22);
        this.clearSlicer();
    }
};

PioneerDDJSB3.Pad.prototype.transMode = function(channel, control, value, status, group) {
    if (value) {
        this.setModeActive(0x6E);
        this.clearSlicer();
    }
};

PioneerDDJSB3.Pad.prototype.beatJumpMultiply = function(channel, control, value, status, group) {
    var size = engine.getValue(group, 'beatjump_size');
    engine.setValue(group, 'beatjump_size', size * 2.0);
};

PioneerDDJSB3.Pad.prototype.beatJumpDivide = function(channel, control, value, status, group) {
    var size = engine.getValue(group, 'beatjump_size');
    engine.setValue(group, 'beatjump_size', size / 2.0);
};

PioneerDDJSB3.shutdown = function () {
    // turn off button LEDs
    var skip = [0x72, 0x1B, 0x69, 0x1E, 0x6B, 0x20, 0x6D, 0x22, 0x6F, 0x70, 0x75];
    for (var channel = 0; channel <= 10; channel++) {
        for (var control = 0; control <= 127; control++) {
            // skip deck toggle buttons and pad mode buttons
            if (skip.indexOf(control) > -1) {
                continue;
            }
            midi.sendShortMsg(0x90 + channel, control, 0);
        }
    }


    // switch to decks 1 and 2 to turn off deck indication lights
    midi.sendShortMsg(0x90, 0x72, 0x7f);
    midi.sendShortMsg(0x91, 0x72, 0x7f);

    // turn off level meters
    for (channel = 0; channel <= 3; channel++) {
        midi.sendShortMsg(0xB0 + channel, 2, 0);
    }

    PioneerDDJSB3.flasher.shutdown();
};

PioneerDDJSB3.longButtonPressWait = function () {
    engine.stopTimer(PioneerDDJSB3.longButtonPressTimer);
    PioneerDDJSB3.longButtonPress = true;
};

///////////////////////////////////////////////////////////////
//                      VU - Meter                           //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.blinkAutodjState = 0; // new for DDJ-SB2

PioneerDDJSB3.vuMeterTwinkle = function () {
    if (engine.getValue("[AutoDJ]", "enabled")) {
        PioneerDDJSB3.blinkAutodjState = PioneerDDJSB3.blinkAutodjState + 1;
        if (PioneerDDJSB3.blinkAutodjState > 3) {
            PioneerDDJSB3.blinkAutodjState = 0;
        }
        if (PioneerDDJSB3.blinkAutodjState === 0) {
            PioneerDDJSB3.valueVuMeter['[Channel1]_enabled'] = 0;
            PioneerDDJSB3.valueVuMeter['[Channel3]_enabled'] = 0;
            PioneerDDJSB3.valueVuMeter['[Channel2]_enabled'] = 0;
            PioneerDDJSB3.valueVuMeter['[Channel4]_enabled'] = 0;
        }
        if (PioneerDDJSB3.blinkAutodjState === 1) {
            PioneerDDJSB3.valueVuMeter['[Channel1]_enabled'] = 1;
            PioneerDDJSB3.valueVuMeter['[Channel3]_enabled'] = 1;
            PioneerDDJSB3.valueVuMeter['[Channel2]_enabled'] = 0;
            PioneerDDJSB3.valueVuMeter['[Channel4]_enabled'] = 0;
        }
        if (PioneerDDJSB3.blinkAutodjState === 2) {
            PioneerDDJSB3.valueVuMeter['[Channel1]_enabled'] = 1;
            PioneerDDJSB3.valueVuMeter['[Channel3]_enabled'] = 1;
            PioneerDDJSB3.valueVuMeter['[Channel2]_enabled'] = 1;
            PioneerDDJSB3.valueVuMeter['[Channel4]_enabled'] = 1;
        }
        if (PioneerDDJSB3.blinkAutodjState === 3) {
            PioneerDDJSB3.valueVuMeter['[Channel1]_enabled'] = 0;
            PioneerDDJSB3.valueVuMeter['[Channel3]_enabled'] = 0;
            PioneerDDJSB3.valueVuMeter['[Channel2]_enabled'] = 1;
            PioneerDDJSB3.valueVuMeter['[Channel4]_enabled'] = 1;
        }
    } else {
        PioneerDDJSB3.valueVuMeter['[Channel1]_enabled'] = 1;
        PioneerDDJSB3.valueVuMeter['[Channel3]_enabled'] = 1;
        PioneerDDJSB3.valueVuMeter['[Channel2]_enabled'] = 1;
        PioneerDDJSB3.valueVuMeter['[Channel4]_enabled'] = 1;
    }
};


///////////////////////////////////////////////////////////////
//                        AutoDJ                             //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.autodjSkipNext = function (channel, control, value, status, group) {
    if (value === 0) {
        return;
    }
    if (engine.getValue("[AutoDJ]", "enabled")) {
        engine.setValue("[AutoDJ]", "skip_next", true);
    }
};

PioneerDDJSB3.autodjToggle = function (channel, control, value, status, group) {
    if (value === 0) {
        return;
    }
    if (engine.getValue("[AutoDJ]", "enabled")) {
        engine.setValue("[AutoDJ]", "enabled", false);
    } else {
        engine.setValue("[AutoDJ]", "enabled", true);
    }
};


///////////////////////////////////////////////////////////////
//                      CONTROL BINDING                      //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.bindSamplerControlConnections = function (samplerGroup, isUnbinding) {
    engine.makeConnection(samplerGroup, 'duration', PioneerDDJSB3.samplerLedsDuration);
    engine.makeConnection(samplerGroup, 'play', PioneerDDJSB3.samplerLedsPlay);
};

PioneerDDJSB3.bindDeckControlConnections = function (channelGroup, isUnbinding) {
    var i,
        index,
        controlsToFunctions = {
            'pfl': 'PioneerDDJSB3.headphoneCueLed',
            'keylock': 'PioneerDDJSB3.keyLockLed',
            'loop_enabled': 'PioneerDDJSB3.autoLoopLed',
        };

    if (PioneerDDJSB3.invertVinylSlipButton) {
        controlsToFunctions.slip_enabled = 'PioneerDDJSB3.slipLed';
    }

    for (i = 1; i <= 8; i++) {
        controlsToFunctions['hotcue_' + i + '_enabled'] = 'PioneerDDJSB3.hotCueLeds';
    }

    for (index in PioneerDDJSB3.looprollIntervals) {
        controlsToFunctions['beatlooproll_' + PioneerDDJSB3.looprollIntervals[index] + '_activate'] = 'PioneerDDJSB3.beatlooprollLeds';
    }

    script.bindConnections(channelGroup, controlsToFunctions, isUnbinding);
};

PioneerDDJSB3.bindNonDeckControlConnections = function (isUnbinding) {
    var samplerIndex;

    for (samplerIndex = 1; samplerIndex <= 8; samplerIndex++) {
        PioneerDDJSB3.bindSamplerControlConnections('[Sampler' + samplerIndex + ']', isUnbinding);
    }

    if (PioneerDDJSB3.showVumeterMaster) {
        engine.connectControl('[Master]', 'VuMeterL', 'PioneerDDJSB3.VuMeterLeds', isUnbinding);
        engine.connectControl('[Master]', 'VuMeterR', 'PioneerDDJSB3.VuMeterLeds', isUnbinding);
    } else {
        engine.connectControl('[Channel1]', 'VuMeter', 'PioneerDDJSB3.VuMeterLeds', isUnbinding);
        engine.connectControl('[Channel2]', 'VuMeter', 'PioneerDDJSB3.VuMeterLeds', isUnbinding);
        engine.connectControl('[Channel3]', 'VuMeter', 'PioneerDDJSB3.VuMeterLeds', isUnbinding);
        engine.connectControl('[Channel4]', 'VuMeter', 'PioneerDDJSB3.VuMeterLeds', isUnbinding);
    }
};

///////////////////////////////////////////////////////////////
//                       DECK SWITCHING                      //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.deckSwitchTable = {
    '[Channel1]': '[Channel1]',
    '[Channel2]': '[Channel2]',
    '[Channel3]': '[Channel3]',
    '[Channel4]': '[Channel4]'

};

PioneerDDJSB3.deckShiftSwitchTable = {
    '[Channel1]': '[Channel3]',
    '[Channel2]': '[Channel4]',
    '[Channel3]': '[Channel1]',
    '[Channel4]': '[Channel2]'
};

PioneerDDJSB3.deckIndexTable = {
    '[Channel1]': 0,
    '[Channel2]': 1,
    '[Channel3]': 2,
    '[Channel4]': 3
};

PioneerDDJSB3.initDeck = function (group) {
    PioneerDDJSB3.bindDeckControlConnections(group, false);
    PioneerDDJSB3.nonPadLedControl(group, PioneerDDJSB3.nonPadLeds.shiftKeyLock, PioneerDDJSB3.channelGroups[group] > 1);
    PioneerDDJSB3.toggleScratch(null, null, PioneerDDJSB3.vinylModeOnStartup, null, group);
};


///////////////////////////////////////////////////////////////
//            HIGH RESOLUTION MIDI INPUT HANDLERS            //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.highResMSB = {
    '[Channel1]': {},
    '[Channel2]': {},
    '[Channel3]': {},
    '[Channel4]': {}
};

PioneerDDJSB3.deckFaderMSB = function (channel, control, value, status, group) {
    PioneerDDJSB3.highResMSB[group].deckFader = value;
};

PioneerDDJSB3.deckFaderLSB = function (channel, control, value, status, group) {
    var fullValue = (PioneerDDJSB3.highResMSB[group].deckFader << 7) + value;

    if (PioneerDDJSB3.shiftPressed &&
        engine.getValue(group, 'volume') === 0 &&
        fullValue !== 0 &&
        engine.getValue(group, 'play') === 0
    ) {
        PioneerDDJSB3.chFaderStart[channel] = engine.getValue(group, 'playposition');
        engine.setValue(group, 'play', 1);
    } else if (
        PioneerDDJSB3.shiftPressed &&
        engine.getValue(group, 'volume') !== 0 &&
        fullValue === 0 &&
        engine.getValue(group, 'play') === 1 &&
        PioneerDDJSB3.chFaderStart[channel] !== null
    ) {
        engine.setValue(group, 'play', 0);
        engine.setValue(group, 'playposition', PioneerDDJSB3.chFaderStart[channel]);
        PioneerDDJSB3.chFaderStart[channel] = null;
    }
    engine.setValue(group, 'volume', fullValue / 0x3FFF);
};

///////////////////////////////////////////////////////////////
//           SINGLE MESSAGE MIDI INPUT HANDLERS              //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.beatloopRollButtons = function (channel, control, value, status, group) {
    var index = control - 0x50;
    engine.setValue(
        PioneerDDJSB3.deckSwitchTable[group],
        'beatlooproll_' + PioneerDDJSB3.looprollIntervals[index] + '_activate',
        value
    );
};

PioneerDDJSB3.vinylButton = function (channel, control, value, status, group) {
    if (PioneerDDJSB3.invertVinylSlipButton) {
        engine.setValue(group, 'slip_enabled', value / 127);
    } else {
        PioneerDDJSB3.toggleScratch(channel, control, value, status, group);
    }
};

PioneerDDJSB3.slipButton = function (channel, control, value, status, group) {
    if (PioneerDDJSB3.invertVinylSlipButton) {
        PioneerDDJSB3.toggleScratch(channel, control, value, status, group);
    } else {
        engine.setValue(group, 'slip_enabled', value / 127);
    }
};

PioneerDDJSB3.keyLockButton = function (channel, control, value, status, group) {
    if (value) {
        script.toggleControl(group, 'keylock');
    }
};

PioneerDDJSB3.shiftKeyLockButton = function (channel, control, value, status, group) {
    if (value) {
        var currentTempoRange = engine.getValue(group, 'rateRange');
        var deckIndex = status - 0x90 + 1;

        PioneerDDJSB3.deck[deckIndex].tempoFader.skipSoftTakeover();

        if (currentTempoRange < 0.081) {
            engine.setValue(group, 'rateRange', 0.16);
        } else if (currentTempoRange < 0.161) {
            engine.setValue(group, 'rateRange', 0.50);
        } else if (currentTempoRange < 0.501) {
            engine.setValue(group, 'rateRange', 1.0);
        } else {
            engine.setValue(group, 'rateRange', 0.08);
        }
    }
};

PioneerDDJSB3.deck1Button = function (channel, control, value, status, group) {
    if (value) {
        midi.sendShortMsg(0xB0, 0x02, 0x0);
        var deck3Deactivate = [0xF0, 0x00, 0x20, 0x7F, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0xF7];
        midi.sendSysexMsg(deck3Deactivate, deck3Deactivate.length);
        PioneerDDJSB3.deck3Active = false;
    }
};

PioneerDDJSB3.deck2Button = function (channel, control, value, status, group) {
    if (value) {
        midi.sendShortMsg(0xB1, 0x02, 0x0);
        var deck4Deactivate = [0xF0, 0x00, 0x20, 0x7F, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0xF7];
        midi.sendSysexMsg(deck4Deactivate, deck4Deactivate.length);
    }
};

PioneerDDJSB3.deck3Button = function (channel, control, value, status, group) {
    if (value) {
        midi.sendShortMsg(0xB2, 0x02, 0x0);
        var deck3Activate = [0xF0, 0x00, 0x20, 0x7F, 0x13, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0xF7];
        midi.sendSysexMsg(deck3Activate, deck3Activate.length);
    }
};

PioneerDDJSB3.deck4Button = function (channel, control, value, status, group) {
    if (value) {
        midi.sendShortMsg(0xB3, 0x02, 0x0);
        var deck4Activate = [0xF0, 0x00, 0x20, 0x7F, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0xF7];
        midi.sendSysexMsg(deck4Activate, deck4Activate.length);
        PioneerDDJSB3.deck4Active = true;
    }
};

PioneerDDJSB3.autoLoopButton = function (channel, control, value, status, group) {
    if (value) {
        if (engine.getValue(group, 'loop_enabled')) {
            engine.setValue(group, 'reloop_toggle', true);
        } else {
            engine.setValue(group, 'beatloop_activate', true);
        }
    }
};

PioneerDDJSB3.reloopButton = function (channel, control, value, status, group) {
    if (value) {
        engine.setValue(group, 'reloop_toggle', true);
    }
};

PioneerDDJSB3.loadButton = function (channel, control, value, status, group) {
    if (value) {
        engine.setValue(group, 'LoadSelectedTrack', 1);
    }
};

///////////////////////////////////////////////////////////////
//                          HEADPHONE                      //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.headphoneCueMaster = false;

PioneerDDJSB3.masterCueButton = function (channel, control, value, status, group) {
    if (value) {
        PioneerDDJSB3.headphoneCueMaster = !PioneerDDJSB3.headphoneCueMaster;
        PioneerDDJSB3.headphoneMasterUpdate();
    }
};

PioneerDDJSB3.headphoneCueButton = function (channel, control, value, status, group) {
    if (value) {
        script.toggleControl(group, 'pfl');
        PioneerDDJSB3.headphoneMasterUpdate();
    }
};

PioneerDDJSB3.headphoneShiftCueButton = function (channel, control, value, status, group) {
    if (value) {
        script.toggleControl(PioneerDDJSB3.deckShiftSwitchTable[group], 'pfl');
        PioneerDDJSB3.headphoneMasterUpdate();
    }
};

PioneerDDJSB3.headphoneMasterUpdate = function() {
    var anyDeckCue = false;
    var masterCue = PioneerDDJSB3.headphoneCueMaster;

    for (var i = 1; i <= 4; i++) {
        if (engine.getValue('[Channel' + i + ']', 'pfl')) {
            anyDeckCue = true;
        }
    }

    if (masterCue) {
        if (anyDeckCue) {
            // 50% master 50% cue
            engine.setValue('[Master]', 'headMix', 0);
        } else {
            // 100% master
            // Check if 1 is all master or all cue
            engine.setValue('[Master]', 'headMix', 1);
        }
    } else {
        // 0% master
        // Check if 1 is all master or all cue
        engine.setValue('[Master]', 'headMix', -1);
    }
};

PioneerDDJSB3.headphoneLevel = new components.Pot({
    unshift: function () {
        this.group = '[Master]';
        this.inKey = 'headGain';
        this.disconnect();
        this.connect();
    },

    shift: function () {
        this.group = '[Master]';
        this.inKey = 'headMix';
        this.disconnect();
        this.connect();
    },

    inValueScale: function(input) {
        // Scale so that:
        // from 0/4 to 3/4 - 500 of input represents 0.0 to 1.0
        // from 3/4 - 500 to 3/4 + 500 represents 1.0
        // from 3/4 + 500 to 4/4 represents 1.0 to 5.0

        var inputMax = (0xFFFF >> 2);
        var inputQuart = Math.round(inputMax / 4);

        var fromInfToZero = (inputQuart * 3) - 500;
        var fromZeroToFive = (inputQuart * 3) + 500;

        if (input < fromInfToZero) {
            return input / fromInfToZero;
        } else if (input > fromZeroToFive) {
            return (input / inputMax) * 5.0;
        } else {
            return 1.0;
        }
    }
});

PioneerDDJSB3.masterGain = new components.Pot({
    unshift: function () {
        this.group = '[Master]';
        this.inKey = 'gain';
        this.disconnect();
        this.connect();
    },

    inValueScale: function(input) {
        // Scale so that:
        // from 0/4 to 3/4 - 500 of input represents 0.0 to 1.0
        // from 3/4 - 500 to 3/4 + 500 represents 1.0
        // from 3/4 + 500 to 4/4 represents 1.0 to 5.0

        var inputMax = (0xFFFF >> 2);
        var inputQuart = Math.round(inputMax / 4);

        var fromInfToZero = (inputQuart * 3) - 500;
        var fromZeroToFive = (inputQuart * 3) + 500;

        if (input < fromInfToZero) {
            return input / fromInfToZero;
        } else if (input > fromZeroToFive) {
            return (input / inputMax) * 5.0;
        } else {
            return 1.0;
        }
    }
});

///////////////////////////////////////////////////////////////
//                          LED HELPERS                      //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.deckConverter = function (group) {
    var index;

    if (typeof group === "string") {
        for (index in PioneerDDJSB3.deckSwitchTable) {
            if (group === PioneerDDJSB3.deckSwitchTable[index]) {
                return PioneerDDJSB3.channelGroups[group];
            }
        }
        return null;
    }
    return group;
};

PioneerDDJSB3.padLedControl = function (deck, groupNumber, shiftGroup, ledNumber, shift, active) {
    var padLedsBaseChannel = 0x97,
        padLedControl = (shiftGroup ? 0x40 : 0x00) + (shift ? 0x08 : 0x00) + groupNumber + ledNumber,
        midiChannelOffset = PioneerDDJSB3.deckConverter(deck);

    if (midiChannelOffset !== null) {
        engine.log("Pad Led: deck: " + deck + " group: " + groupNumber + " led: " + ledNumber + " active: " + !!active);
        midi.sendShortMsg(
            padLedsBaseChannel + midiChannelOffset,
            padLedControl,
            active ? 0x7F : 0x00
        );
    }
};

PioneerDDJSB3.flashingPadLedControl = [];

PioneerDDJSB3.initFlashingPadLedControl = function() {
    PioneerDDJSB3.flasher.addFunction(function(flag) {
        for (var i = 0; i < PioneerDDJSB3.flashingPadLedControl.length; i++) {
            PioneerDDJSB3.padLedControl(
                PioneerDDJSB3.flashingPadLedControl[i].deck,
                PioneerDDJSB3.flashingPadLedControl[i].groupNumber,
                PioneerDDJSB3.flashingPadLedControl[i].shiftGroup,
                PioneerDDJSB3.flashingPadLedControl[i].ledNumber,
                PioneerDDJSB3.flashingPadLedControl[i].shift,
                flag
            );
        }
    });
};

PioneerDDJSB3.startFlashingPadLedControl = function (deck, groupNumber, shiftGroup, ledNumber, shift) {
    PioneerDDJSB3.flashingPadLedControl.push({
        deck: deck,
        groupNumber: groupNumber,
        shiftGroup: shiftGroup,
        ledNumber: ledNumber,
        shift: shift
    });
};

PioneerDDJSB3.stopFlashingPadLedControl = function (deck, groupNumber, shiftGroup, ledNumber, shift) {
    var target = {
        deck: deck,
        groupNumber: groupNumber,
        shiftGroup: shiftGroup,
        ledNumber: ledNumber,
        shift: shift
    };

    PioneerDDJSB3.flashingPadLedControl = _.filter(PioneerDDJSB3.flashingPadLedControl, function(obj) { return _.isEqual(obj, target); });
};

PioneerDDJSB3.nonPadLedControl = function (deck, ledNumber, active) {
    var nonPadLedsBaseChannel = 0x90,
        midiChannelOffset = PioneerDDJSB3.deckConverter(deck);

    if (midiChannelOffset !== null) {
        midi.sendShortMsg(
            nonPadLedsBaseChannel + midiChannelOffset,
            ledNumber,
            active ? 0x7F : 0x00
        );
    }
};


///////////////////////////////////////////////////////////////
//                             LEDS                          //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.headphoneCueLed = function (value, group, control) {
    PioneerDDJSB3.nonPadLedControl(group, PioneerDDJSB3.nonPadLeds.headphoneCue, value);
    PioneerDDJSB3.nonPadLedControl(group, PioneerDDJSB3.nonPadLeds.shiftHeadphoneCue, value);
};

PioneerDDJSB3.keyLockLed = function (value, group, control) {
    PioneerDDJSB3.nonPadLedControl(group, PioneerDDJSB3.nonPadLeds.keyLock, value);
    PioneerDDJSB3.nonPadLedControl(group, PioneerDDJSB3.nonPadLeds.shiftKeyLock, value);
};

PioneerDDJSB3.slipLed = function (value, group, control) {
    PioneerDDJSB3.nonPadLedControl(group, PioneerDDJSB3.nonPadLeds.vinyl, value);
    PioneerDDJSB3.nonPadLedControl(group, PioneerDDJSB3.nonPadLeds.shiftVinyl, value);
};

PioneerDDJSB3.autoLoopLed = function (value, group, control) {
    PioneerDDJSB3.nonPadLedControl(group, PioneerDDJSB3.nonPadLeds.autoLoop, value);
};

PioneerDDJSB3.samplerLedsDuration = function (value, group, control) {
    var sampler = PioneerDDJSB3.samplerGroups[group];

    sampler.loaded = value;

    PioneerDDJSB3.samplerLeds(sampler);
};

PioneerDDJSB3.samplerLedsPlay = function (value, group, control) {
    var sampler = PioneerDDJSB3.samplerGroups[group];

    sampler.playing = value;

    PioneerDDJSB3.samplerLeds(sampler);
}

PioneerDDJSB3.samplerLeds = function (sampler) {
    for (var i = 0; i < sampler.channels.length; i++) {

        if (sampler.playing) {
            PioneerDDJSB3.startFlashingPadLedControl(sampler.channels[i], PioneerDDJSB3.ledGroups.sampler, false, sampler.ledNumber, false);
        } else {
            PioneerDDJSB3.stopFlashingPadLedControl(sampler.channels[i], PioneerDDJSB3.ledGroups.sampler, false, sampler.ledNumber, false);
            PioneerDDJSB3.padLedControl(sampler.channels[i], PioneerDDJSB3.ledGroups.sampler, false, sampler.ledNumber, false, sampler.loaded);
        }
    }
};

PioneerDDJSB3.beatlooprollLeds = function (value, group, control) {
    var index,
        padNum,
        shifted;

    for (index in PioneerDDJSB3.looprollIntervals) {
        if (control === 'beatlooproll_' + PioneerDDJSB3.looprollIntervals[index] + '_activate') {
            padNum = index;
            shifted = false;
            PioneerDDJSB3.padLedControl(group, PioneerDDJSB3.ledGroups.roll, true, padNum, shifted, value);
        }
    }
};

PioneerDDJSB3.hotCueLedStates = {
    '[Channel1]': { states: {}, isShifted: false },
    '[Channel2]': { states: {}, isShifted: false },
    '[Channel3]': { states: {}, isShifted: false },
    '[Channel4]': { states: {}, isShifted: false },
};

PioneerDDJSB3.hotCueLeds = function (value, group, control) {
    var shiftedGroup = false,
        padNum = null,
        hotCueNum;

    for (hotCueNum = 1; hotCueNum <= 8; hotCueNum++) {
        if (control === 'hotcue_' + hotCueNum + '_enabled') {
            padNum = (hotCueNum - 1);

            if (hotCueNum <= 4) {
                PioneerDDJSB3.padLedControl(group, PioneerDDJSB3.ledGroups.hotCue, shiftedGroup, padNum, false, value);
            } else {
                PioneerDDJSB3.hotCueLedStates[group].states[hotCueNum] = value;
                PioneerDDJSB3.updateHotCueLeds();
            }
        }
    }
};

PioneerDDJSB3.shiftListeners.push(function(group, isShifted) {
    PioneerDDJSB3.hotCueLedStates[group].isShifted = isShifted;
    PioneerDDJSB3.updateHotCueLeds();
});

PioneerDDJSB3.updateHotCueLeds = function() {
    var shiftedGroup = false;

    for (var channelIdx = 1; channelIdx <= 4; channelIdx++) {
        var group = '[Channel' + channelIdx + ']';
        var channel = PioneerDDJSB3.hotCueLedStates[group];


        for (var hotCue = 5; hotCue <= 8; hotCue++) {
            var padNum = hotCue - 1;

            if (channel.isShifted && channel.states[hotCue]) {
                PioneerDDJSB3.padLedControl(group, PioneerDDJSB3.ledGroups.hotCue, shiftedGroup, padNum, false, true);
            } else {
                PioneerDDJSB3.padLedControl(group, PioneerDDJSB3.ledGroups.hotCue, shiftedGroup, padNum, false, false);
            }
        }
    }
};

PioneerDDJSB3.VuMeterLeds = function (value, group, control) {
    // The red LED lights up with MIDI values 119 (0x77) and above. That should only light up when
    // the track is clipping.
    if (engine.getValue(group, 'PeakIndicator') === 1) {
        value = 119;
    } else {
        // 117 was determined experimentally so the yellow LED only lights
        // up when the level meter in Mixxx is in the yellow region.
        value = Math.floor(value * 117);
    }

    if (!(PioneerDDJSB3.twinkleVumeterAutodjOn && engine.getValue("[AutoDJ]", "enabled"))) {
        var midiChannel;
        if (PioneerDDJSB3.showVumeterMaster) {
            if (control === 'VuMeterL') {
                midiChannel = 0;
            } else if (control === 'VuMeterR') {
                midiChannel = 1;
            }
            // Send for deck 1 or 2
            midi.sendShortMsg(0xB0 + midiChannel, 2, value);
            // Send for deck 3 or 4
            midi.sendShortMsg(0xB0 + midiChannel + 2, 2, value);
        } else {
            midiChannel = parseInt(group.substring(8, 9) - 1);
            midi.sendShortMsg(0xB0 + midiChannel, 2, value);
        }
    } else {
        if (group == "[Master]") {
            if (control == "VuMeterL") {
                PioneerDDJSB3.valueVuMeter['[Channel1]_current'] = value;
                PioneerDDJSB3.valueVuMeter['[Channel3]_current'] = value;
            } else {
                PioneerDDJSB3.valueVuMeter['[Channel2]_current'] = value;
                PioneerDDJSB3.valueVuMeter['[Channel4]_current'] = value;
            }
        } else {
            PioneerDDJSB3.valueVuMeter[group + '_current'] = value;
        }

        for (var channel = 0; channel < 4; channel++) {
            var midiOut = PioneerDDJSB3.valueVuMeter['[Channel' + (channel + 1) + ']_current'];
            if (PioneerDDJSB3.valueVuMeter['[Channel' + (channel + 1) + ']_enabled']) {
                midiOut = 0;
            }
            if (midiOut < 5 && PioneerDDJSB3.valueVuMeter['[Channel' + (channel + 1) + ']_enabled'] === 0) {
                midiOut = 5;
            }

            midi.sendShortMsg(
                0xB0 + channel,
                2,
                midiOut
            );
        }
    }
};


///////////////////////////////////////////////////////////////
//                          JOGWHEELS                        //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.getJogWheelDelta = function (value) { // O
    // The Wheel control centers on 0x40; find out how much it's moved by.
    return value - 0x40;
};

PioneerDDJSB3.jogRingTick = function (channel, control, value, status, group) {
    PioneerDDJSB3.pitchBendFromJog(group, PioneerDDJSB3.getJogWheelDelta(value));
};

PioneerDDJSB3.jogRingTickShift = function (channel, control, value, status, group) {
    PioneerDDJSB3.pitchBendFromJog(
        PioneerDDJSB3.deckSwitchTable[group],
        PioneerDDJSB3.getJogWheelDelta(value) * PioneerDDJSB3.jogwheelShiftMultiplier
    );
};

PioneerDDJSB3.jogPlatterTick = function (channel, control, value, status, group) {
    var deck = PioneerDDJSB3.channelGroups[PioneerDDJSB3.deckSwitchTable[group]];
    if (PioneerDDJSB3.scratchMode[deck]) {
        engine.scratchTick(deck + 1, PioneerDDJSB3.getJogWheelDelta(value));
    } else {
        PioneerDDJSB3.pitchBendFromJog(PioneerDDJSB3.deckSwitchTable[group], PioneerDDJSB3.getJogWheelDelta(value));
    }
};

PioneerDDJSB3.jogPlatterTickShift = function (channel, control, value, status, group) {
    var deck = PioneerDDJSB3.channelGroups[PioneerDDJSB3.deckSwitchTable[group]];
    if (PioneerDDJSB3.scratchMode[deck]) {
        engine.scratchTick(deck + 1, PioneerDDJSB3.getJogWheelDelta(value));
    } else {
        PioneerDDJSB3.pitchBendFromJog(
            PioneerDDJSB3.deckSwitchTable[group],
            PioneerDDJSB3.getJogWheelDelta(value) * PioneerDDJSB3.jogwheelShiftMultiplier
        );
    }
};

PioneerDDJSB3.jogTouch = function (channel, control, value, status, group) {
    var deck = PioneerDDJSB3.channelGroups[PioneerDDJSB3.deckSwitchTable[group]];

    if (PioneerDDJSB3.scratchMode[deck]) {
        if (value) {
            engine.scratchEnable(
                deck + 1,
                PioneerDDJSB3.scratchSettings.jogResolution,
                PioneerDDJSB3.scratchSettings.vinylSpeed,
                PioneerDDJSB3.scratchSettings.alpha,
                PioneerDDJSB3.scratchSettings.beta,
                true
            );
        } else {
            engine.scratchDisable(deck + 1, true);
        }
    }
};

PioneerDDJSB3.toggleScratch = function (channel, control, value, status, group) {
    var deck = PioneerDDJSB3.channelGroups[group];
    if (value) {
        PioneerDDJSB3.scratchMode[deck] = !PioneerDDJSB3.scratchMode[deck];
        if (!PioneerDDJSB3.invertVinylSlipButton) {
            PioneerDDJSB3.nonPadLedControl(deck, PioneerDDJSB3.nonPadLeds.vinyl, PioneerDDJSB3.scratchMode[deck]);
            PioneerDDJSB3.nonPadLedControl(deck, PioneerDDJSB3.nonPadLeds.shiftVinyl, PioneerDDJSB3.scratchMode[deck]);
        }
        if (!PioneerDDJSB3.scratchMode[deck]) {
            engine.scratchDisable(deck + 1, true);
        }
    }
};

PioneerDDJSB3.pitchBendFromJog = function (channel, movement) {
    var group = (typeof channel === "string" ? channel : '[Channel' + channel + 1 + ']');

    engine.setValue(group, 'jog', movement / 5 * PioneerDDJSB3.jogwheelSensivity);
};


///////////////////////////////////////////////////////////////
//                        ROTARY SELECTOR                    //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.rotarySelectorChanged = false; // new for DDJ-SB2

PioneerDDJSB3.getRotaryDelta = function (value) {
    var delta = 0x40 - Math.abs(0x40 - value),
        isCounterClockwise = value > 0x40;

    if (isCounterClockwise) {
        delta *= -1;
    }
    return delta;
};

PioneerDDJSB3.rotarySelector = function (channel, control, value, status) {
    var delta = PioneerDDJSB3.getRotaryDelta(value);
    engine.setValue('[Playlist]', 'SelectTrackKnob', delta);

    PioneerDDJSB3.rotarySelectorChanged = true;
};

PioneerDDJSB3.shiftedRotarySelector = function (channel, control, value, status) {
    var delta = PioneerDDJSB3.getRotaryDelta(value),
        f = (delta > 0 ? 'SelectNextPlaylist' : 'SelectPrevPlaylist');

    engine.setValue('[Playlist]', f, Math.abs(delta));
};

PioneerDDJSB3.rotarySelectorClick = function (channel, control, value, status) {
    if (PioneerDDJSB3.rotarySelectorChanged === true) {
        if (value) {
            engine.setValue('[PreviewDeck1]', 'LoadSelectedTrackAndPlay', true);
        } else {
            if (PioneerDDJSB3.jumpPreviewEnabled) {
                engine.setValue('[PreviewDeck1]', 'playposition', PioneerDDJSB3.jumpPreviewPosition);
            }
            PioneerDDJSB3.rotarySelectorChanged = false;
        }
    } else {
        if (value) {
            engine.setValue('[PreviewDeck1]', 'stop', 1);
        } else {
            PioneerDDJSB3.rotarySelectorChanged = true;
        }
    }
};

PioneerDDJSB3.rotarySelectorShiftedClick = function (channel, control, value, status) {
    if (value) {
        engine.setValue('[Playlist]', 'ToggleSelectedSidebarItem', 1);
    }
};


///////////////////////////////////////////////////////////////
//                             FX                            //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.EffectUnit = function (unitNumber) {
    var eu = this;
    this.isShifted = false;
    this.group = '[EffectRack1_EffectUnit' + unitNumber + ']';
    engine.setValue(this.group, 'show_focus', 1);

    this.buttonLights = [];

    this.EffectButtonLight = function(buttonNumber) {
        this.isEnabled = false;
        this.isFocused = false;

        this.midi = [0x93 + unitNumber, 0x46 + buttonNumber];
    }

    this.EffectButtonLight.prototype.update = function() {
        if (eu.isShifted) {
            engine.log("isEnabled" + this.isEnabled);
            midi.sendShortMsg(this.midi[0], this.midi[1], (this.isFocused ? 0x7F : 0x0));
        } else {
            midi.sendShortMsg(this.midi[0], this.midi[1], (this.isEnabled ? 0x7F : 0x0));
        }
    };

    for (var i = 1; i <= 3; i++) {
        this.buttonLights[i] = new this.EffectButtonLight(i);
    }

    this.EffectFocusButton = function (buttonNumber) {
        this.buttonNumber = buttonNumber;

        this.group = eu.group;
        this.midi = [0x93 + unitNumber, 0x62 + buttonNumber];

        components.Button.call(this);
    };
    this.EffectFocusButton.prototype = new components.Button({
        input: function (channel, control, value, status) {
            if (value) {
                var focusedEffect = engine.getValue(eu.group, 'focused_effect');

                if (focusedEffect === this.buttonNumber) {
                    engine.setValue(eu.group, 'focused_effect', 0);
                } else {
                    engine.setValue(eu.group, 'focused_effect', this.buttonNumber);
                }
            }
        },
        outKey: 'focused_effect',
        output: function (value, group, control) {
            eu.buttonLights[this.buttonNumber].isFocused = (value === this.buttonNumber) ? true : false;
            eu.buttonLights[this.buttonNumber].update();
        },
        sendShifted: false,
        shiftControl: false,
    });

    this.EffectEnableButton = function (buttonNumber) {
        this.buttonNumber = buttonNumber;

        this.group = '[EffectRack1_EffectUnit' + unitNumber + '_Effect' + buttonNumber + ']';
        this.midi = [0x93 + unitNumber, 0x46 + buttonNumber];

        components.Button.call(this);
    };
    this.EffectEnableButton.prototype = new components.Button({
        input: function (channel, control, value, status) {
            if (value) {
                var effectEnabled = engine.getValue(this.group, 'enabled');

                if (effectEnabled) {
                    engine.setValue(this.group, 'enabled', false);
                } else {
                    engine.setValue(this.group, 'enabled', true);
                }
            }
        },
        outKey: 'enabled',
        output: function (value, group, control) {
            eu.buttonLights[this.buttonNumber].isEnabled = value ? true : false;
            eu.buttonLights[this.buttonNumber].update();
        },
        sendShifted: false,
        shiftControl: false,
    });

    this.button = [];

    for (var i = 1; i <= 3; i++) {
        this.button[i] = new this.EffectEnableButton(i);
        this.button[i + 3] = new this.EffectFocusButton(i);

        var effectGroup = '[EffectRack1_EffectUnit' + unitNumber + '_Effect' + i + ']';
        engine.softTakeover(effectGroup, 'meta', true);
        engine.softTakeover(eu.group, 'mix', true);
    }

    this.knob = new components.Pot({
        unshift: function () {
            this.input = function (channel, control, value, status) {
                value = (this.MSB << 7) + value;

                var focusedEffect = engine.getValue(eu.group, 'focused_effect');
                if (focusedEffect === 0) {
                    engine.setParameter(eu.group, 'mix', value / this.max);
                } else {
                    var effectGroup = '[EffectRack1_EffectUnit' + unitNumber + '_Effect' + focusedEffect + ']';
                    engine.setParameter(effectGroup, 'meta', value / this.max);
                }
            };
        },
    });

    this.knobSoftTakeoverHandler = engine.makeConnection(eu.group, 'focused_effect', function (value, group, control) {
        if (value === 0) {
            engine.softTakeoverIgnoreNextValue(eu.group, 'mix');
        } else {
            var effectGroup = '[EffectRack1_EffectUnit' + unitNumber + '_Effect' + value + ']';
            engine.softTakeoverIgnoreNextValue(effectGroup, 'meta');
        }
    });

    PioneerDDJSB3.shiftListeners.push(function(group, shifted) {
        if (PioneerDDJSB3.channelsToEffectUnitNumber[group] === unitNumber) {
            eu.setShift(shifted);
        }
    });
};

PioneerDDJSB3.EffectUnit.prototype.setShift = function(value) {
    this.isShifted = value;
    for (var i = 1; i <= 3; i++) {
        this.buttonLights[i].update();
    }
}

///////////////////////////////////////////////////////////////
//                             SLICER                        //
///////////////////////////////////////////////////////////////

PioneerDDJSB3.Slicer = function(group, midiOutputOp, midiOutputBeatLeds) {
    var _this = this;

    this.group = group;

    this.midiOutputOp = midiOutputOp;
    this.midiOutputBeatLeds = midiOutputBeatLeds;

    this.beatPositions = [];

    this.currentBeat = 0;

    this.latestPlayPosition = 0.0;

    this.connections = [];

    this.buttons = [];

    for (var i = 1; i <= midiOutputBeatLeds.length; i++) {
        (function(beat) {
            _this.buttons[beat] = function(channel, control, value, status) {
                if (value) {
                    var beatPosition = _this.beatPositions[beat - 1];

                    if (beatPosition) {
                        _this.moveToSample(beatPosition.sample);
                    }
                }
            };
        })(i);
    }

    this.calculateBeats();
    this.getFirstBeat();
    this.generateBeatPositions();
    this.midiOuputUpdate();

    this.connections.push(engine.makeConnection(group, 'playposition', function(value, group, control) {
        _this.playPositionChange(value, group, control);
    }));

    this.connections.push(engine.makeConnection(group, 'track_samples', function(value, group, control) {
        _this.calculateBeats();
        _this.getFirstBeat();
        _this.generateBeatPositions();
        _this.midiOuputUpdate();
    }));

    this.connections.push(engine.makeConnection(group, 'bpm', function(value, group, control) {
        _this.calculateBeats();
        _this.generateBeatPositions();
        _this.midiOuputUpdate();
    }));
};

PioneerDDJSB3.Slicer.prototype.PLAY_POSITION_FLOOR = 0;
PioneerDDJSB3.Slicer.prototype.PLAY_POSITION_RANGE = 1 - PioneerDDJSB3.Slicer.prototype.PLAY_POSITION_FLOOR;

PioneerDDJSB3.Slicer.prototype.shutdown = function() {
    for (var i = 0; i < this.midiOutputBeatLeds.length; i++) {
        var ledMidi = this.midiOutputBeatLeds[i];

        if (ledMidi) {
            midi.sendShortMsg(this.midiOutputOp, ledMidi, 0x0);
        }
    }

    for (var i = 0; i < this.connections.length; i++) {
        this.connections[i].disconnect();
    }
}

PioneerDDJSB3.Slicer.prototype.calculateBeats = function() {
    var trackSamplesPerSecond = engine.getValue(this.group, 'track_samplerate');
    this.trackSamples = engine.getValue(this.group, 'track_samples');

    var bpm = engine.getValue(this.group, 'bpm');
    var bps = bpm / 60.0;

    this.samplesPerBeat = (trackSamplesPerSecond * 2) / bps;
    this.positionPerBeat = (this.PLAY_POSITION_RANGE * this.samplesPerBeat) / this.trackSamples;
    this.playPositionDelta = (this.PLAY_POSITION_RANGE * this.samplesPerBeat) / (this.trackSamples * 20);
};

PioneerDDJSB3.Slicer.prototype.generateBeatPositions = function() {
    this.beatPositions = [];

    for (var i = 0; i < this.midiOutputBeatLeds.length; i++) {
        var sample = this.firstBeatSample + (i * this.samplesPerBeat);
        var nextSample = this.firstBeatSample + ((i + 1) * this.samplesPerBeat);

        if (sample < this.trackSamples) {
            var bp = {
                sample: sample,
                positionIn: (this.PLAY_POSITION_RANGE * sample - 1) / this.trackSamples,
                positionOut: (this.PLAY_POSITION_RANGE * nextSample - 1) / this.trackSamples,
            };

            this.beatPositions.push(bp);
        }
    }

};

PioneerDDJSB3.Slicer.prototype.getFirstBeat = function() {
    this.currentBeat = 0;

    var oldCuePosition = engine.getValue(this.group, 'hotcue_8_position');
    var oldQuantize = engine.getValue(this.group, 'quantize');

    this.oldCuePosition = oldCuePosition;

    engine.setValue(this.group, 'quantize', true);
    engine.setValue(this.group, 'hotcue_8_set', true);

    this.firstBeatSample = engine.getValue(this.group, 'hotcue_8_position');

    if (oldCuePosition === -1) {
        engine.setValue(this.group, 'hotcue_8_clear', true);
    } else {
        engine.setValue(this.group, 'hotcue_8_position', oldCuePosition);
    }

    engine.setValue(this.group, 'quantize', oldQuantize);
    engine.setValue(this.group, 'hotcue_8_position', this.firstBeatSample);
};

PioneerDDJSB3.Slicer.prototype.moveToSample = function(sample) {
    var oldCuePosition = engine.getValue(this.group, 'hotcue_8_position');

    engine.setValue(this.group, 'hotcue_8_set', true);
    engine.setValue(this.group, 'hotcue_8_position', sample);
    engine.setValue(this.group, 'hotcue_8_goto', true);

    if (oldCuePosition === -1) {
        engine.setValue(this.group, 'hotcue_8_clear', true);
    } else {
        engine.setValue(this.group, 'hotcue_8_position', oldCuePosition);
    }
};

PioneerDDJSB3.Slicer.prototype.playPositionChange = function(value, group, control) {
    var playPositionDelta = Math.abs(this.latestPlayPosition - value);
    var oldCurrentBeat = this.currentBeat;

    if (playPositionDelta > this.playPositionDelta) {
        this.latestPlayPosition = value;
        var found = false;

        for (var i = 0; i < this.beatPositions.length; i++) {
            var beatPosition = this.beatPositions[i];

            if (value >= beatPosition.positionIn && value < beatPosition.positionOut) {
                this.currentBeat = i;
                found = true;
            }
        }

        if (!found) {
            this.getFirstBeat();
            this.generateBeatPositions();
        }

        if (oldCurrentBeat != this.currentBeat) {
            this.midiOuputUpdate();
        }
    }
};

PioneerDDJSB3.Slicer.prototype.midiOuputUpdate = function() {
    var onLedMidi = this.midiOutputBeatLeds[this.currentBeat];

    for (var i = 0; i < this.midiOutputBeatLeds.length; i++) {
        var ledMidi = this.midiOutputBeatLeds[i];

        if (ledMidi != onLedMidi) {
            midi.sendShortMsg(this.midiOutputOp, ledMidi, 0x0);
        }
    }

    if (onLedMidi === 0 || onLedMidi) {
        midi.sendShortMsg(this.midiOutputOp, onLedMidi, 0x7F);
    }
};

try {
    module.exports = PioneerDDJSB3;

} catch (e) {

}
