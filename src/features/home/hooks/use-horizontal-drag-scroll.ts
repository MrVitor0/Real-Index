"use client";

import {
  useEffectEvent,
  useRef,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";

type DragState = {
  active: boolean;
  pointerId: number | null;
  startX: number;
  startScrollLeft: number;
  didDrag: boolean;
  suppressClick: boolean;
};

type DragScrollProps<T extends HTMLElement> = {
  onPointerDown: (event: PointerEvent<T>) => void;
  onPointerMove: (event: PointerEvent<T>) => void;
  onPointerUp: (event: PointerEvent<T>) => void;
  onPointerCancel: (event: PointerEvent<T>) => void;
  onClickCapture: (event: MouseEvent<T>) => void;
  onDragStart: (event: MouseEvent<T>) => void;
};

type UseHorizontalDragScrollResult<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  dragScrollProps: DragScrollProps<T>;
};

export function useHorizontalDragScroll<
  T extends HTMLElement,
>(): UseHorizontalDragScrollResult<T> {
  const ref = useRef<T | null>(null);
  const dragStateRef = useRef<DragState>({
    active: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    didDrag: false,
    suppressClick: false,
  });

  const resetDragState = useEffectEvent(() => {
    dragStateRef.current.active = false;
    dragStateRef.current.pointerId = null;
    dragStateRef.current.startX = 0;
    dragStateRef.current.startScrollLeft = 0;
    dragStateRef.current.didDrag = false;
  });

  const finishDrag = useEffectEvent((pointerId: number) => {
    const node = ref.current;

    if (node?.hasPointerCapture(pointerId)) {
      node.releasePointerCapture(pointerId);
    }

    dragStateRef.current.suppressClick = dragStateRef.current.didDrag;
    resetDragState();
  });

  const handlePointerDown = useEffectEvent((event: PointerEvent<T>) => {
    const node = ref.current;

    if (
      !node ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0) ||
      node.scrollWidth <= node.clientWidth
    ) {
      return;
    }

    dragStateRef.current.active = true;
    dragStateRef.current.pointerId = event.pointerId;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startScrollLeft = node.scrollLeft;
    dragStateRef.current.didDrag = false;
    node.setPointerCapture(event.pointerId);
  });

  const handlePointerMove = useEffectEvent((event: PointerEvent<T>) => {
    const node = ref.current;
    const dragState = dragStateRef.current;

    if (!node || !dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;

    if (!dragState.didDrag && Math.abs(deltaX) > 6) {
      dragState.didDrag = true;
    }

    node.scrollLeft = dragState.startScrollLeft - deltaX;

    if (dragState.didDrag) {
      event.preventDefault();
    }
  });

  const handlePointerUp = useEffectEvent((event: PointerEvent<T>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    finishDrag(event.pointerId);
  });

  const handlePointerCancel = useEffectEvent((event: PointerEvent<T>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    finishDrag(event.pointerId);
  });

  const handleClickCapture = useEffectEvent((event: MouseEvent<T>) => {
    if (!dragStateRef.current.suppressClick) {
      return;
    }

    dragStateRef.current.suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  });

  const handleDragStart = useEffectEvent((event: MouseEvent<T>) => {
    event.preventDefault();
  });

  return {
    ref,
    dragScrollProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onClickCapture: handleClickCapture,
      onDragStart: handleDragStart,
    },
  };
}
