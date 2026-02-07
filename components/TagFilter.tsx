/* components/TagFilter.tsx */
"use client";

type TagFilterProps = {
  allTags: string[];
  activeTags: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
};

export default function TagFilter({ allTags, activeTags, onToggle, onClear }: TagFilterProps) {
  if (allTags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="タグフィルター">
      <button
        onClick={onClear}
        className={`px-3 py-1 text-xs rounded-full ${
          activeTags.length === 0 ? "pill--active" : "pill"
        }`}
      >
        全て
      </button>
      {allTags.map((tag) => {
        const active = activeTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            className={`px-3 py-1 text-xs rounded-full ${active ? "pill--active" : "pill"}`}
            aria-pressed={active}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
