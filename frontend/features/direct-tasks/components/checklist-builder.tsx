"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  WfmTable,
  WfmTableBody,
  WfmTableCell,
  WfmTableHead,
  WfmTableHeader,
  WfmTableRow
} from "@/components/workforce/atlas";
import { ChecklistTemplatePicker } from "@/features/direct-tasks/components/checklist-template-picker";
import { CHECKLIST_ITEM_TYPE_LABELS } from "@/features/direct-tasks/create/create-direct-task-labels";
import type { CreateDirectTaskFormValues } from "@/features/direct-tasks/create/create-direct-task-schema";
import { checklistItemTypes } from "@/features/direct-tasks/create/create-direct-task-schema";

type Item = CreateDirectTaskFormValues["checklist"][number];

type Props = {
  items: Item[];
  options: CreateDirectTaskFormValues["options"];
  onItemsChange: (items: Item[]) => void;
  onOptionsChange: (options: CreateDirectTaskFormValues["options"]) => void;
  /** عند التضمين داخل بطاقة النموذج الرئيسية — يُخفى العنوان ويُوسَّع الجدول */
  embedded?: boolean;
};

function SortableRow({
  item,
  onChange,
  onDuplicate,
  onRemove,
  allowReorder
}: {
  item: Item;
  onChange: (item: Item) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  allowReorder: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: !allowReorder });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <WfmTableRow ref={setNodeRef} style={style}>
      <WfmTableCell className="w-8">
        {allowReorder ? (
          <button type="button" className="cursor-grab text-atlas-muted" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
      </WfmTableCell>
      <WfmTableCell className="min-w-[12rem]">
        <Input
          value={item.label}
          onChange={(e) => onChange({ ...item, label: e.target.value })}
          className="h-9 text-sm"
          placeholder="اسم البند"
        />
      </WfmTableCell>
      <WfmTableCell className="min-w-[9rem]">
        <select
          className="atlas-input h-9 w-full text-sm"
          value={item.itemType}
          onChange={(e) => onChange({ ...item, itemType: e.target.value as Item["itemType"] })}
        >
          {checklistItemTypes.map((t) => (
            <option key={t} value={t}>
              {CHECKLIST_ITEM_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </WfmTableCell>
      <WfmTableCell className="text-center">
        <input
          type="checkbox"
          checked={item.isRequired}
          onChange={(e) => onChange({ ...item, isRequired: e.target.checked })}
          className="h-4 w-4 rounded border-atlas-rule"
        />
      </WfmTableCell>
      <WfmTableCell>
        <div className="flex gap-1">
          <button type="button" onClick={onDuplicate} className="rounded p-1 text-atlas-muted hover:text-atlas-brand">
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" onClick={onRemove} className="rounded p-1 text-atlas-muted hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </WfmTableCell>
    </WfmTableRow>
  );
}

export function ChecklistBuilder({ items, options, onItemsChange, onOptionsChange, embedded = false }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addItem = () => {
    onItemsChange([
      ...items,
      {
        id: crypto.randomUUID(),
        label: "بند جديد",
        itemType: "checkbox",
        isRequired: false,
        sortOrder: items.length
      }
    ]);
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!options.allowChecklistReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({ ...item, sortOrder: idx }));
    onItemsChange(next);
  };

  return (
    <div className={embedded ? "space-y-4" : "space-y-4"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!embedded ? (
          <h3 className="text-sm font-bold text-atlas-ink dark:text-zinc-100">قائمة التحقق</h3>
        ) : null}
        <div className={`flex flex-wrap gap-2 ${embedded ? "w-full justify-between sm:justify-end" : ""}`}>
          <ChecklistTemplatePicker
            onApply={(templateItems) =>
              onItemsChange(
                templateItems.map((t, i) => ({
                  id: crypto.randomUUID(),
                  label: t.label,
                  itemType: t.itemType as Item["itemType"],
                  isRequired: t.isRequired,
                  sortOrder: i
                }))
              )
            }
          />
          <button type="button" onClick={addItem} className="atlas-btn-secondary inline-flex items-center gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            بند جديد
          </button>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <WfmTable className="min-w-[36rem]">
          <WfmTableHeader>
            <WfmTableRow>
              <WfmTableHead className="w-10" />
              <WfmTableHead className="min-w-[12rem]">اسم البند</WfmTableHead>
              <WfmTableHead className="min-w-[9rem]">نوع البند</WfmTableHead>
              <WfmTableHead className="w-20 text-center">إلزامي</WfmTableHead>
              <WfmTableHead className="w-24">إجراءات</WfmTableHead>
            </WfmTableRow>
          </WfmTableHeader>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <WfmTableBody>
                {items.length === 0 ? (
                  <WfmTableRow>
                    <WfmTableCell colSpan={5} className="py-10 text-center text-sm text-atlas-muted">
                      لا توجد بنود — أضف بنداً أو اختر قالباً جاهزاً
                    </WfmTableCell>
                  </WfmTableRow>
                ) : (
                  items.map((item) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      allowReorder={options.allowChecklistReorder ?? true}
                      onChange={(next) => onItemsChange(items.map((i) => (i.id === item.id ? next : i)))}
                      onDuplicate={() =>
                        onItemsChange([
                          ...items,
                          { ...item, id: crypto.randomUUID(), sortOrder: items.length }
                        ])
                      }
                      onRemove={() => onItemsChange(items.filter((i) => i.id !== item.id))}
                    />
                  ))
                )}
              </WfmTableBody>
            </SortableContext>
          </DndContext>
        </WfmTable>
      </div>

      <div className="rounded-lg border border-atlas-rule bg-atlas-canvas/40 p-4 dark:border-zinc-700">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>السماح بإعادة ترتيب البنود أثناء التنفيذ</span>
          <Switch
            checked={options.allowChecklistReorder ?? true}
            onCheckedChange={(v) => onOptionsChange({ ...options, allowChecklistReorder: v })}
          />
        </label>
      </div>
    </div>
  );
}
