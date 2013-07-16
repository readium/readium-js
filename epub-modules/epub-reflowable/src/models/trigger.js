define(['require', 'module', 'jquery', 'underscore', 'backbone'], function (require, module, $, _, Backbone) {

    var Trigger = function (domNode) {
        var $el = $(domNode);
        this.action = $el.attr("action");
        this.ref = $el.attr("ref");
        this.event = $el.attr("ev:event");
        this.observer = $el.attr("ev:observer");
        this.ref = $el.attr("ref");
    };

    Trigger.prototype.subscribe = function (dom) {
        var selector = "#" + this.observer;
        var that = this;
        $(selector, dom).on(this.event, function () {
            that.execute(dom);
        });
    };

    Trigger.prototype.execute = function (dom) {
        var $target = $("#" + this.ref, dom);
        switch (this.action) {
            case "show":
                $target.css("visibility", "visible");
                break;
            case "hide":
                $target.css("visibility", "hidden");
                break;
            case "play":
                $target[0].currentTime = 0;
                $target[0].play();
                break;
            case "pause":
                $target[0].pause();
                break;
            case "resume":
                $target[0].play();
                break;
            case "mute":
                $target[0].muted = true;
                break;
            case "unmute":
                $target[0].muted = false;
                break;
            default:
                console.log("do not no how to handle trigger " + this.action);
        }
    };
    return Trigger;
});