import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import MODULE_DEFINITIONS from '../generated/module-definitions.json';
import { cn } from '../lib/utils';
import { selectActiveModules, useThemeStore } from '../stores/theme-store';
import { BaseModuleConfig } from '../types/starship.types';

interface ModuleItem {
  id: string;
  name: string;
  isCustom?: boolean;
}

function SortableItem({
  item,
  isSelected,
  onSelect,
  onToggle,
}: {
  item: ModuleItem;
  isSelected: boolean;
  onSelect: (name: string) => void;
  onToggle: (name: string, enabled: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(item.name)}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-md border p-3 shadow-sm transition-colors',
        isSelected
          ? 'border-blue-500 bg-gray-800 ring-1 ring-blue-500'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600',
        isDragging && 'z-50 bg-gray-700 opacity-50 ring-2 ring-blue-500',
      )}
    >
      <button
        {...listeners}
        {...attributes}
        className="cursor-grab text-gray-500 hover:text-gray-300 focus:outline-none active:cursor-grabbing"
        aria-label="Drag handle"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={18} />
      </button>

      <input
        type="checkbox"
        checked={true}
        onChange={(e) => {
          e.stopPropagation();
          onToggle(item.name, e.target.checked);
        }}
        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500"
      />

      <span
        className={cn(
          'select-none font-mono text-sm',
          isSelected ? 'text-blue-400' : 'text-gray-200',
        )}
      >
        {item.name}
        {item.isCustom && (
          <span className="ml-2 rounded-full bg-purple-900/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
            CUSTOM
          </span>
        )}
      </span>

      <div className="ml-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item.name);
          }}
          className="text-xs text-gray-400 hover:text-blue-400"
        >
          Configure
        </button>
      </div>
    </div>
  );
}

export function ModuleList({ className }: { className?: string }) {
  const { currentTheme, updateConfig, selectedModule, setSelectedModule } =
    useThemeStore();
  const activeModulesStore = useThemeStore(selectActiveModules);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const allModules = useMemo(() => {
    const customModules: ModuleItem[] = Object.keys(
      currentTheme.config.custom || {},
    ).map((id) => ({
      id,
      name: id,
      isCustom: true,
    }));

    const predefinedModules: ModuleItem[] = MODULE_DEFINITIONS.map((def) => ({
      id: def.name,
      name: def.name,
    }));

    return [...predefinedModules, ...customModules];
  }, [currentTheme.config.custom]);

  const filteredActiveModules = useMemo(() => {
    if (!searchTerm) return activeModulesStore;
    const term = searchTerm.toLowerCase();
    return activeModulesStore.filter((m) =>
      m.name.toLowerCase().includes(term),
    );
  }, [activeModulesStore, searchTerm]);

  const inactiveModules = useMemo(() => {
    const activeNames = new Set(activeModulesStore.map((m) => m.name));
    const inactive = allModules.filter((def) => !activeNames.has(def.id));
    if (!searchTerm) return inactive;
    const term = searchTerm.toLowerCase();
    return inactive.filter((m) => m.name.toLowerCase().includes(term));
  }, [activeModulesStore, allModules, searchTerm]);

  const handleToggle = (name: string, enable: boolean) => {
    let newFormat = currentTheme.config.format || '';
    if (enable) {
      newFormat += `$${name}`;
    } else {
      const regex = new RegExp(`\\$${name}\\b`, 'g');
      newFormat = newFormat.replace(regex, '');
    }

    const existingModuleConfig =
      (currentTheme.config[name] as BaseModuleConfig) || {};

    updateConfig({
      format: newFormat,
      [name]: { ...existingModuleConfig, disabled: !enable },
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = activeModulesStore.findIndex((m) => m.id === active.id);
      const newIndex = activeModulesStore.findIndex((m) => m.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newModules = arrayMove(activeModulesStore, oldIndex, newIndex);
        const newFormat = newModules.map((m) => `$${m.name}`).join('');
        updateConfig({ format: newFormat });
      }
    }
  };

  const activeItem = useMemo(
    () => activeModulesStore.find((m) => m.id === activeId),
    [activeId, activeModulesStore],
  );

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Search modules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-gray-800/50 py-2 pl-10 pr-10 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Active Modules
          </h2>
          <span className="text-xs text-gray-500">
            {activeModulesStore.length} enabled
          </span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredActiveModules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {filteredActiveModules.map((module) => (
                <SortableItem
                  key={module.id}
                  item={module}
                  isSelected={selectedModule === module.name}
                  onSelect={setSelectedModule}
                  onToggle={handleToggle}
                />
              ))}

              {filteredActiveModules.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-700 py-8 text-center text-gray-500">
                  {searchTerm
                    ? 'No matching active modules'
                    : 'No modules active'}
                </div>
              )}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem ? (
              <div className="group flex items-center gap-3 rounded-md border border-blue-500 bg-gray-700 p-3 opacity-90 shadow-lg">
                <button className="cursor-grabbing text-gray-300">
                  <GripVertical size={18} />
                </button>
                <span className="font-medium text-white">
                  {activeItem.name}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {(inactiveModules.length > 0 || searchTerm) && (
        <div className="flex flex-col gap-3 border-t border-gray-800 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Disabled Modules
            </h2>
            <span className="text-xs text-gray-600">
              {inactiveModules.length} found
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {inactiveModules.map((module) => (
              <div
                key={module.id}
                onClick={() => setSelectedModule(module.name)}
                className={cn(
                  'group flex cursor-pointer items-center gap-3 rounded-md border p-3 opacity-60 shadow-sm transition-colors hover:opacity-100',
                  selectedModule === module.name
                    ? 'border-gray-500 bg-gray-800'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600',
                )}
              >
                <div className="w-[18px]" />
                <input
                  type="checkbox"
                  checked={false}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggle(module.name, e.target.checked);
                  }}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                />
                <span className="select-none font-mono text-sm text-gray-400">
                  {module.name}
                </span>
                <div className="ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModule(module.name);
                    }}
                    className="text-xs text-gray-500 hover:text-blue-400"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}

            {inactiveModules.length === 0 && searchTerm && (
              <div className="py-4 text-center text-xs text-gray-500">
                No matching disabled modules
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
