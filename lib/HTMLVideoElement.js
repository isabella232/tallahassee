"use strict";

const Element = require("./Element");

module.exports = class HTMLVideoElement extends Element {
  constructor(document, $elm) {
    super(document, $elm);
  }
  play() {
    return Promise.resolve(undefined);
  }
  pause() {}
  load() {}
  canPlayType() {
    return "maybe";
  }
};
