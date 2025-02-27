"use strict";

const { Event } = require("./Events");
const { DOCUMENT_NODE } = require("./nodeTypes");
const cheerio = require("cheerio");
const Comment = require("./Comment");
const DocumentFragment = require("./DocumentFragment");
const DOMImplementation = require("./DOMImplementation");
const elementFactory = require("./elementFactory");
const HTMLCollection = require("./HTMLCollection");
const Location = require("./Location");
const Node = require("./Node");
const NodeList = require("./NodeList");

const kCookieJar = Symbol.for("cookieJar");
const kDollar = Symbol.for("$");
const loadedSymbol = Symbol.for("loaded");
const locationSymbol = Symbol.for("location");
const referrerSymbol = Symbol.for("referrer");
const fullscreenElementSymbol = Symbol.for("fullscreenElement");

module.exports = class Document extends Node {
  constructor(source, cookieJar) {
    const $ = cheerio.load(source.text || "", {decodeEntities: false});
    super(null, $.root());
    this[locationSymbol] = source.location || new Location(this, source.url);
    this[referrerSymbol] = source.referrer || "";
    this[kDollar] = $;
    this[kCookieJar] = cookieJar;
    this[loadedSymbol] = [];
    this[fullscreenElementSymbol] = null;
  }
  get $() {
    return this[kDollar];
  }
  get documentElement() {
    return this._getElement(this[kDollar]("html"));
  }
  get location() {
    return this[locationSymbol];
  }
  get referrer() {
    return this[referrerSymbol];
  }
  get textContent() {
    return null;
  }
  get head() {
    return this._getElement(this[kDollar]("head"));
  }
  get body() {
    return this._getElement(this[kDollar]("body"));
  }
  get firstElementChild() {
    return this.documentElement;
  }
  get fullscreenElement() {
    return this[fullscreenElementSymbol];
  }
  get cookie() {
    return this[kCookieJar].getCookies({
      path: this.location.pathname,
      script: true,
      domain: this.location.hostname,
      secure: this.location.protocol === "https:",
    }).toValueString();
  }
  set cookie(value) {
    this[kCookieJar].setCookie(value);
  }
  get title() {
    return this._getElement(this[kDollar]("head > title")).textContent;
  }
  set title(value) {
    this._getElement(this[kDollar]("head > title")).textContent = value;
  }
  get nodeType() {
    return DOCUMENT_NODE;
  }
  get forms() {
    return this.documentElement.getElementsByTagName("form");
  }
  get implementation() {
    return new DOMImplementation(this);
  }
  contains(el) {
    return this.documentElement.contains(el);
  }
  createDocumentFragment() {
    return new DocumentFragment(this);
  }
  createElement(elementTagName) {
    const element = elementFactory(this, this.$(`<${elementTagName}></${elementTagName}>`));
    this[loadedSymbol].push(element);
    return element;
  }
  createElementNS(namespaceURI, elementTagName) {
    return this.createElement(elementTagName);
  }
  createTextNode(text) {
    return {
      textContent: text,
    };
  }
  createComment(data) {
    return new Comment(null, this[kDollar](`<!--${data}-->`));
  }
  dispatchEvent(event) {
    if (event?.type === "fullscreenchange") {
      if (!event.target) return;

      if (this[fullscreenElementSymbol] === null) {
        this[fullscreenElementSymbol] = event.target;
      } else if (this[fullscreenElementSymbol] === event.target) {
        this[fullscreenElementSymbol] = null;
      }

      this._emitter.emit("fullscreenchange", event);
    } else {
      this._emitter.emit(event.type, event);
    }
  }
  exitFullscreen() {
    const fullscreenchangeEvent = new Event("fullscreenchange");
    fullscreenchangeEvent.target = this[fullscreenElementSymbol];

    this.dispatchEvent(fullscreenchangeEvent);
  }
  getElementById(id) {
    const selector = ("#" + id).replace(/\./g, "\\."); // eslint-disable-line
    const $idElm = this[kDollar](selector).eq(0);
    if ($idElm && $idElm.length) return this._getElement($idElm);
    return null;
  }
  getElementsByTagName(name) {
    return this.documentElement.getElementsByTagName(name);
  }
  getElementsByClassName(classNames) {
    return this.documentElement.getElementsByClassName(classNames);
  }
  getElementsByName(name) {
    return new HTMLCollection(this.documentElement, `[name="${name}"],#${name}`, {attributes: true});
  }
  importNode(element, deep) {
    if (element instanceof DocumentFragment) {
      return new DocumentFragment(this, deep && element);
    }

    return element.cloneNode(deep);
  }
  querySelector(selector) {
    const elements = this.$(selector);
    if (!elements.length) return null;
    return this._getElement(elements.eq(0));
  }
  querySelectorAll(selectors) {
    return new NodeList(this.documentElement, selectors, {disconnected: true});
  }
  _getElement($elm) {
    const $ = this[kDollar];
    if ($elm === $) return this;
    if ($elm.nodeType) $elm = $($elm);
    if (!$elm.length) return;

    const loaded = this[loadedSymbol];
    let mockElement = loaded.find((mockedElm) => mockedElm.$elm[0] === $elm[0]);
    if (mockElement) {
      return mockElement;
    }

    mockElement = elementFactory(this, $elm);

    loaded.push(mockElement);
    return mockElement;
  }
};
