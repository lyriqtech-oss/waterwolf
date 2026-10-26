import { useState } from 'react';
import { Clock, Search, Trash2 } from 'lucide-react';
import { useHistoryStore } from '../stores/history';
import { useSpacesStore } from '../stores';

export function HistoryPage({ onOpenPage }: { onOpenPage: (url: string) => void }) {
  const { entries, removeVisit, clearSpace } = useHistoryStore();
  const activeSpaceId = useSpacesStore(state => state.activeSpaceId);
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const spaceEntries = entries.filter(entry => entry.spaceId === activeSpaceId);
  const visible = spaceEntries.filter(entry => `${entry.title} ${entry.url}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="page-container history-page">
    <div className="page-intro"><div><h1>History</h1><p>Pages visited in this Space, saved on this device.</p></div></div>
    <div className="history-controls"><label><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search history" aria-label="Search history"/></label>{spaceEntries.length > 0 && <button className="secondary-button" onClick={() => setConfirmClear(true)}><Trash2 size={14}/> Clear this Space</button>}</div>
    {confirmClear && <div className="history-confirm" role="group" aria-label="Confirm clearing history"><p>Delete {spaceEntries.length} history entries from this Space?</p><button className="secondary-button" onClick={() => setConfirmClear(false)}>Cancel</button><button className="primary-button" onClick={() => { clearSpace(activeSpaceId); setConfirmClear(false); }}>Delete history</button></div>}
    <section className="page-section"><div className="section-header"><h2>Recent visits · {spaceEntries.length}</h2></div>{visible.length ? <div className="history-list">{visible.map(entry => <div className="history-row" key={entry.id}><Clock size={16}/><button className="history-open" onClick={() => onOpenPage(entry.url)}><strong>{entry.title}</strong><small>{entry.url}</small></button><time dateTime={entry.visitedAt}>{new Date(entry.visitedAt).toLocaleString()}</time><button className="history-remove" aria-label={`Remove ${entry.title} from history`} title="Remove visit" onClick={() => removeVisit(entry.id)}><Trash2 size={15}/></button></div>)}</div> : <div className="empty-state"><Clock size={26}/><strong>{query ? 'No matching visits' : 'No history yet'}</strong><p>{query ? 'Try another title or address.' : 'Pages you open in this Space will appear here.'}</p></div>}</section>
  </div>;
}
