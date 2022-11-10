const Xml = require('xmlbuilder');

const proto = {
  // eslint-disable-next-line no-use-before-define
  constructor: h,
};

Object.defineProperty(proto, 'toXml', {
  value(options) {
    const root = Xml.create(this.name, this.attributes);
    // eslint-disable-next-line no-use-before-define
    addChildren.call(root, this.childNodes);

    function addChildren(child) {
      const parent = this;
      if (Array.isArray(child)) {
        child.forEach(addChildren, parent);
      } else if (typeof child === 'string') {
        parent.text(child);
      } else if (child instanceof Object) {
        if (child.name) {
          const node = parent.element(child.name, child.attributes);
          addChildren.call(node, child.childNodes);
        }
      }
    }

    return root.toString(options);
  },
  writable: true,
  configurable: true,
  enumerable: false,
});

function h(name, attr, children) {
  const obj = Object.create(proto);

  if (Array.isArray(attr) && !children) {
    // eslint-disable-next-line no-param-reassign
    children = attr;
    // eslint-disable-next-line no-param-reassign
    attr = {};
  }

  obj.name = name;
  obj.attributes = attr;
  obj.childNodes = children;
  return obj;
}

export default h;
