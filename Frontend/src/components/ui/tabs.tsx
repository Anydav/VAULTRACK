interface Tab<K extends string> {
  key: K;
  label: string;
}

interface TabsProps<K extends string> {
  tabs: readonly Tab<K>[];
  active: K;
  onChange: (key: K) => void;
}

export function Tabs<K extends string>({ tabs, active, onChange }: TabsProps<K>) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
            active === tab.key
              ? "border-text text-text"
              : "border-transparent text-gray-400 hover:text-text"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
