function _extends() {
  _extends = Object.assign
    ? Object.assign.bind()
    : function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
  return _extends.apply(this, arguments);
}
const { useState } = window.React;
const { Icon } = window.Blueprint.Core;
const SELECTOR_ID = "[id^='block-input']";
const EL_ID = "inserts_btns";
const api = {
  findBlockAndItsParentBlockByUid(uid) {
    return window.roamAlphaAPI
      .q(
        `
        [
           :find (pull ?e [*]) (pull ?p [*])
           :where
            [?e :block/uid "${uid}"]
            [?e :block/parents ?p]
        ]
    `
      )
      .pop();
  },
  insert(params) {
    const newUid = window.roamAlphaAPI.util.generateUID();
    window.roamAlphaAPI.createBlock({
      location: {
        "parent-uid": params.parentId,
        order: params.order
      },
      block: {
        string: "",
        uid: newUid
      }
    });
    return newUid;
  }
};
let prevIdStr = "";

/**
 * The +/- buttons live inside `.controls`, which is a child of
 * `.rm-block-main.rm-block__self`. Read that ancestor's real height and expose it
 * via a CSS variable so `#inserts_btns` renders exactly as tall as it.
 */
const syncBtnsHeight = (el) => {
  const mainEl = el.closest(".rm-block-main.rm-block__self");
  if (!mainEl) {
    el.style.removeProperty("--inserts-btns-height");
    return;
  }
  const height = mainEl.getBoundingClientRect().height;
  if (height > 0) {
    el.style.setProperty("--inserts-btns-height", `${height}px`);
  }
};

function PlusIcon(props) {
  const [isMouseInside, setMouseInside] = useState(false);
  const mouseEnter = () => {
    setMouseInside(true);
  };
  const mouseLeave = () => {
    setMouseInside(false);
  };
  return /*#__PURE__*/ React.createElement(
    Icon,
    _extends({}, props, {
      onMouseEnter: mouseEnter,
      onMouseLeave: mouseLeave,
      icon: isMouseInside ? props.icon : "small-minus"
    })
  );
}
const insertBtns = (parentEl, idStr) => {
  if (!parentEl) return;
  const el = document.createElement("div");
  el.id = EL_ID;
  parentEl.appendChild(el);
  // Keep the plugin's height in sync with the closest
  // `.rm-block-main.rm-block__self` ancestor so the +/- buttons line up with it.
  syncBtnsHeight(el);
  const id = idStr.substr(-9);
  const [block, parentBlock] = api.findBlockAndItsParentBlockByUid(id) || [];
  if (!block) {
    return;
  }
  const focusOnDom = (targetEl) => {
    if (!targetEl) {
      return;
    }
    targetEl.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
    const clickEl = targetEl.querySelector(SELECTOR_ID);
    "mouseover mousedown mouseup click".split(" ").forEach((type) => {
      clickEl.dispatchEvent(
        new MouseEvent(type, {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
        })
      );
    });
  };
  const insertOnTop = () => {
    const uid = api.insert({
      parentId: parentBlock.uid,
      order: block.order
    });
    setTimeout(() => {
      focusOnDom(parentEl.closest(".roam-block-container").previousSibling);
    }, 100);
  };
  const insertUnderBottom = () => {
    const uid = api.insert({
      parentId: parentBlock.uid,
      order: block.order + 1
    });
    setTimeout(() => {
      focusOnDom(parentEl.closest(".roam-block-container").nextElementSibling);
    }, 100);
  };
    ReactDOM.render(
    /*#__PURE__*/ React.createElement(
    React.Fragment,
    null,
      /*#__PURE__*/ React.createElement(PlusIcon, {
      icon: "small-plus",
      size: 12,
      onClick: insertOnTop
    }),
      /*#__PURE__*/ React.createElement("span", {
      className: "place"
    }),
      /*#__PURE__*/ React.createElement(PlusIcon, {
      icon: "small-plus",
      size: 12,
      onClick: insertUnderBottom
    })
  ),
    el
  );
  // React replaces the placeholder, so re-apply the measured height afterwards.
  syncBtnsHeight(el);
};
const removeBtns = () => {
  const target = document.querySelector(`#${EL_ID}`);
  if (!target) {
    return;
  }
  target.parentElement.removeChild(target);
};
let resizeObserver = null;
const observeBtnsHeight = (el) => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (typeof ResizeObserver === "undefined" || !el) {
    return;
  }
  const mainEl = el.closest(".rm-block-main.rm-block__self");
  if (!mainEl) {
    return;
  }
  resizeObserver = new ResizeObserver(() => syncBtnsHeight(el));
  resizeObserver.observe(mainEl);
};
const onMouseOver = (e) => {
  let el = e.target.closest(".roam-block-container");
  if (!el) {
    return;
  }
  if (el) {
    const idEl = el.querySelector(SELECTOR_ID);
    const id = idEl.getAttribute("id");
    if (prevIdStr !== id) {
      removeBtns();
      prevIdStr = id;
      insertBtns(el.querySelector(".controls"), id);
      observeBtnsHeight(document.querySelector(`#${EL_ID}`));
    }
  }
};
export default {
  onload: () => {
    document.addEventListener("mousemove", onMouseOver);
  },
  onunload: () => {
    document.removeEventListener("mousemove", onMouseOver);
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    prevIdStr = "";
    removeBtns();
  }
};
