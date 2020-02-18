var midi = {

    sendShortMsg: function (a, b, c) {
        console.log("a " + a + "b " + b + "c " + c);
    },

    sendSysexMsg: function() {
      console.log(arguments);
    }
};

module.exports = midi;
