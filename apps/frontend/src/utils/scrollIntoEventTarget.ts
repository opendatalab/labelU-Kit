const EXTRA_SPACE = 10;

/**
 * 获取元素距离滚动容器顶部的距离
 * @param element
 * @param container
 * @returns
 */
function getOffsetTopOfElement(element: HTMLElement, container: HTMLElement) {
  let offsetTop = element.offsetTop;
  let parent = element.offsetParent as HTMLElement | null;

  while (parent !== container && parent) {
    offsetTop += parent.offsetTop;
    parent = parent.offsetParent as HTMLElement;
  }

  return offsetTop;
}

/**
 * 自动滚动到事件触发的元素
 * @param e event
 * @param delegateTag tag name of the element to be scrolled to
 * @param overflowWrapperSelector overflow wrapper selector
 * @returns
 */
export default function scrollIntoEventTarget(
  e: React.MouseEvent,
  delegateTag: string | undefined,
  overflowWrapperSelector?: string,
) {
  if (!e) {
    return;
  }

  let target = e.target as HTMLElement;
  const wrapper = overflowWrapperSelector ? document.querySelector(overflowWrapperSelector) : document.body;

  if (!wrapper) {
    return;
  }

  if (delegateTag) {
    while (target.tagName !== delegateTag.toUpperCase()) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      target = target.parentElement!;

      if (target.tagName === 'BODY') {
        break;
      }
    }
  }

  const targetHeight = target.clientHeight;
  // 元素距离页面底部的距离不变，target重新渲染了，在setTimeout会丢失其dom引用，所以在重新渲染前获取其距离。
  const distanceFromContainerBottom = wrapper.scrollHeight - getOffsetTopOfElement(target, wrapper as HTMLElement);

  setTimeout(() => {
    const newTop =
      wrapper.scrollHeight - distanceFromContainerBottom - wrapper.clientHeight + targetHeight + EXTRA_SPACE;
    // 如果元素在视口内，不需要滚动
    if (wrapper.scrollTop >= newTop) {
      return;
    }

    wrapper.scrollTo({
      left: 0,
      /**
       * 将元素居中在滚动容器中间
       * 元素距离滚动容器顶部的新距离为：wrapper.scrollHeight - distanceFromContainerBottom
       * 滚动容器的高度为：wrapper.clientHeight
       **/
      top: newTop,
      behavior: 'auto',
    });
  });
}
