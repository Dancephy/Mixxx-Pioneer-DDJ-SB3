var midi = {

    sendShortMsg: function (a, b, c) {
        console.log("a " + a + "b " + b + "c " + c);
    },

    sendSysexMsg: function(msg, length) {
      console.log(msg.map(byte => "0x" + byte.toString(16).padStart(2, "0")).join(" "));
    }
};

module.exports = midi;
