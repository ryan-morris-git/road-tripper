import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDuration } from "../lib/format";
import type { Stop, TripRoute } from "../types";

type StopListProps = {
  stops: Stop[];
  route: TripRoute | null;
  onReorder: (stops: Stop[]) => void;
  onRemove: (id: string) => void;
};

type SortableStopProps = {
  stop: Stop;
  index: number;
  inboundLabel: string;
  onRemove: (id: string) => void;
};

function SortableStop({
  stop,
  index,
  inboundLabel,
  onRemove,
}: SortableStopProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stop.id,
  });

  return (
    <li
      ref={setNodeRef}
      className={isDragging ? "stop-item is-dragging" : "stop-item"}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        className="drag-handle"
        aria-label={`Reorder ${stop.name}`}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>
      <div className="stop-body">
        <p className="stop-name">
          <span className="stop-index">{index + 1}</span>
          {stop.name}
        </p>
        <p className="stop-time">{inboundLabel}</p>
      </div>
      <button
        type="button"
        className="stop-remove"
        onClick={() => onRemove(stop.id)}
      >
        Remove
      </button>
    </li>
  );
}

export function StopList({ stops, route, onReorder, onRemove }: StopListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = stops.findIndex((stop) => stop.id === active.id);
    const newIndex = stops.findIndex((stop) => stop.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorder(arrayMove(stops, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={stops.map((stop) => stop.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="stop-list">
          {stops.map((stop, index) => {
            const inboundLeg = index > 0 ? route?.legs[index - 1] : undefined;
            const inboundLabel =
              index === 0
                ? "Start"
                : inboundLeg
                  ? formatDuration(inboundLeg.durationSeconds)
                  : "—";

            return (
              <SortableStop
                key={stop.id}
                stop={stop}
                index={index}
                inboundLabel={inboundLabel}
                onRemove={onRemove}
              />
            );
          })}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
