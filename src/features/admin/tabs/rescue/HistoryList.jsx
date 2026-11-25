import React, { useState } from 'react';
import { EmptyState } from '../../components/PanelBits';
import HistoryCaseCard from './HistoryCaseCard';
import { HISTORY_FILTERS } from './rescueHelpers';

export default function HistoryList({ items, business, onChanged }) {
  const [filter, setFilter] = useState('all');

  if (items.length === 0) return <EmptyState title="Todavía no hay casos cerrados" />;

  const matchesFilter = (item, f) => {
    if (f === 'all') return true;
    if (f === 'dismissed') return item.status === 'dismissed';
    return item.status !== 'dismissed' && item.outcome === f;
  };

  const filtered = items.filter(item => matchesFilter(item, filter));

  return (
    <div className="space-y-4">
      {items.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {HISTORY_FILTERS.map(f => {
            const count = f.id === 'all' ? items.length : items.filter(i => matchesFilter(i, f.id)).length;
            if (f.id !== 'all' && count === 0) return null;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={`font-mono text-[11px] uppercase tracking-wider px-2.5 py-1.5 border cursor-pointer transition-colors ${active
                  ? 'bg-ink text-paper border-ink font-bold'
                  : 'bg-paper text-muted border-line-gray hover:border-ink hover:text-ink'
                  }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="No hay casos con este resultado" />
      ) : (
        <div className="space-y-3.5">
          {filtered.map(item => (
            <HistoryCaseCard key={item.id} item={item} business={business} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}
