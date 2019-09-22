test('init', () => {
    PioneerDDJSB3.init();
});

test('pressDeck3', () => {
    PioneerDDJSB3.deck3Button();
});

test('pressDeck4', () => {
    PioneerDDJSB3.deck4Button();
});
//Debug[Controller]: DDJ - SB3: t: 5620 ms status 0x90(ch 1, opcode 0x9), ctrl 0x72, val 0x7F
//Debug[Controller]: "deck3button: channel=0, control=114, value=127, status=144, control=[Channel1]"
//Debug[Controller]: DDJ - SB3: t: 5748 ms status 0x90(ch 1, opcode 0x9), ctrl 0x72, val 0x00
//Debug[Controller]: "deck3button: channel=0, control=114, value=0, status=144, control=[Channel1]"
//Debug[Controller]: DDJ - SB3: t: 21678 ms status 0x91(ch 2, opcode 0x9), ctrl 0x72, val 0x7F
//Debug[Controller]: "deck3button: channel=1, control=114, value=127, status=145, control=[Channel2]"
//Debug[Controller]: DDJ - SB3: t: 21754 ms status 0x91(ch 2, opcode 0x9), ctrl 0x72, val 0x00
//Debug[Controller]: "deck3button: channel=1, control=114, value=0, status=145, control=[Channel2]"