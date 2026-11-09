// Tiny DOM helpers. Text always goes in as text nodes, never as HTML.
const SVG = "http://www.w3.org/2000/svg";

function build(el, attrs, children) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.setAttribute("class", v);
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const h = (tag, attrs, ...children) => build(document.createElement(tag), attrs, children);
export const s = (tag, attrs, ...children) => build(document.createElementNS(SVG, tag), attrs, children);
export const $ = id => document.getElementById(id);
export const clear = el => { while (el.firstChild) el.firstChild.remove(); return el; };
