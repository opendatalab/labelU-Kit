/**
 * 自动滚动到事件触发的元素
 **/
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

  const rect = target.getBoundingClientRect();
  const bottom = wrapper.scrollHeight - wrapper.scrollTop - rect.bottom;

  setTimeout(() => {
    wrapper.scrollTo({
      left: 0,
      top: wrapper.scrollHeight - bottom - wrapper.clientHeight,
      behavior: 'smooth',
    });
  });
}
