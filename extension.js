const { useState } = window.React;
const { Icon} = window.Blueprint.Core;
const SELECTOR_ID = "[id^='block-input']"
const EL_ID = "inserts_btns";

const api = {
  findBlockAndItsParentBlockByUid(uid) {
    return window.roamAlphaAPI.q(
      `
        [
           :find (pull ?e [*]) (pull ?p [*])
           :where
            [?e :block/uid "${uid}"]
            [?e :block/parents ?p]
        ]
    `,
    ).pop();
  },
  insert(params) {
    const newUid = window.roamAlphaAPI.util.generateUID();
    window
      .roamAlphaAPI
      .createBlock(
        {
          "location":
          {
            "parent-uid": params.parentId,
            "order": params.order
          },
          "block":
            { "string": "", uid: newUid }
        });
    return newUid;
  }
}
let prevIdStr = ''
function PlusIcon(props) {
  const [isMouseInside, setMouseInside] = useState(false)
  const mouseEnter = () => {
    setMouseInside(true)
  }

  const mouseLeave = () => {
    setMouseInside(false);
  }
  return <Icon {...props}
    onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}
    icon={
      isMouseInside ? props.icon : 'small-minus'
    }
  >
  </Icon>
}
const insertBtns = (parentEl, idStr) => {
  if (!parentEl) return;
  const el = document.createElement("div");
  el.id = EL_ID;
  parentEl.appendChild(el);
  const id = idStr.substr(-9);
  const [block, parentBlock] = api.findBlockAndItsParentBlockByUid(id);
  const focusOnDom = (targetEl) => {
    if(!targetEl){
      return
    }
    targetEl.scrollIntoView(
      { behavior: "smooth", block: "nearest" }
    );
    const clickEl = targetEl.querySelector(SELECTOR_ID);

    'mouseover mousedown mouseup click'.split(' ').forEach(type => {
      clickEl.dispatchEvent(new MouseEvent(type, { view: window, bubbles: true, cancelable: true, buttons: 1 }));
    });
  }
  const insertOnTop = () => {
    const uid = api.insert({
      parentId: parentBlock.uid,
      order: block.order
    })
    setTimeout(() => {

      focusOnDom(parentEl.closest(".roam-block-container").previousSibling)
    }, 100)

  };
  const insertUnderBottom = () => {
    const uid = api.insert({
      parentId: parentBlock.uid,
      order: block.order + 1
    });
    setTimeout(() => {

      focusOnDom(parentEl.closest(".roam-block-container").nextElementSibling);
    }, 100)

  }

  ReactDOM.render(
    <>
      <PlusIcon icon="small-plus" size={12} onClick={insertOnTop} />
      <span className="place" />
      <PlusIcon icon="small-plus" size={12} onClick={insertUnderBottom} />
    </>
    , el);
};

const removeBtns = () => {
  const target = document.querySelector(`#${EL_ID}`);
  if (!target) {
    return
  }
  target.parentElement.removeChild(target);
};
const onMouseOver = (e) => {

  let el = e.target.closest('.roam-block-container');
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
    }
  }
}


export default {
  onload: () => { 
    document.addEventListener("mousemove", onMouseOver);
  },
  onunload: () => { 
    document.removeEventListener("mousemove", onMouseOver);
  }
};
