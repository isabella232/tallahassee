"use strict";

class DOMStringMapHandler {
  constructor(element) {
    this.$elm = element.$elm;
  }
  ownKeys() {
    return Object.keys(this.$elm[0].attribs).reduce((keys, key) => {
      if (!key.startsWith("data-")) return keys;
      keys.push(getObjectKey(key));
      return keys;
    }, []);
  }
  getOwnPropertyDescriptor(target, prop) {
    const attr = this.getAttribute(prop);
    if (!attr) return;
    return {
      value: attr.value,
      writable: true,
      enumerable: true,
      configurable: true,
    };
  }
  has(target, prop) {
    if (typeof prop === "symbol") return !!target[prop];
    return !!this.getAttribute(prop);
  }
  deleteProperty(target, prop) {
    if (typeof prop === "symbol") return delete target[prop];
    return this.$elm.removeAttr(getAttributeName(prop));
  }
  set(target, prop, value) {
    this.$elm.attr(getAttributeName(prop), value);
    return true;
  }
  get(target, prop) {
    if (typeof prop === "symbol") return target[prop];
    const attr = this.getAttribute(prop);
    if (attr) return attr.value;
  }
  getAttribute(prop) {
    const attr = getAttributeName(prop);
    if (!(attr in this.$elm[0].attribs)) return;
    return {
      attr,
      prop,
      value: this.$elm.attr(attr),
    };
  }
}

module.exports = class DOMStringMap {
  constructor(element) {
    return new Proxy(this, new DOMStringMapHandler(element));
  }
};

function getObjectKey(name) {
  return name.replace(/^data-/, "").replace(/-(\w)/g, (a, b) => b.toUpperCase());
}

function getAttributeName(prop) {
  return "data-" + prop.replace(/[A-Z]/g, (g) => `-${g[0].toLowerCase()}`);
}
