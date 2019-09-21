var engine = {
    log: function (message) {
        console.log(message);
    },
    softTakeover: function (group, name, set) {
        console.log("Group " + group + " Name " + name + " Set " + set);
    },
    softTakeoverIgnoreNextValue: function (group, name) {
        console.log("Group " + group + " Name " + name);
    },
    makeConnection: function (group, name, callback) {
        console.log("Group " + group + " Name " + name);

    },
    connectControl: function (group, name, callback, disconnect) {
        console.log("Group " + group + " Name " + name + " Callback " + callback + " Disconnect " + disconnect);
    },
    beginTimer: function (interval, timerCallback) {
        console.log("interval " + interval + " timerCallback " + timerCallback);
    },
    trigger: function (group, name) {
        console.log("Group " + group + " Name " + name);
    },
    setValue: function (group, name, value) {
        console.log("Group " + group + " Name " + name);
        console.log("Value " + value);
    }
};

module.exports = engine;