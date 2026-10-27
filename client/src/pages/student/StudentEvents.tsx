import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StudentEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents({
        search: search.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        dateFilter,
        status: 'published'
      });
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  // Distinct categories
  const categories = [
    'all',
    'Academic & Research',
    'Technology & Innovation',
    'Career & Placement',
    'Cultural & Arts',
    'Sports & Athletics',
    'Workshop & Seminar'
  ];

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Campus Events Calendar
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Official academic symposia, distinguished colloquia, student competitions, and institutional lectures.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 280px' }}>
          <input
            type="text"
            placeholder="Search by title, venue, or organizer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ height: '38px', fontSize: '0.84375rem' }}
          />
          <button type="submit" className="btn btn-secondary" style={{ height: '38px', padding: '0 14px' }}>
            Search
          </button>
        </form>

        {/* Categories & Date Filter */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="input-field"
            style={{ height: '38px', width: 'auto', minWidth: '170px', fontSize: '0.84375rem' }}
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Disciplines' : c}
              </option>
            ))}
          </select>

          <div style={{ display: 'inline-flex', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              onClick={() => setDateFilter('upcoming')}
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '0.78125rem',
                fontWeight: 600,
                backgroundColor: dateFilter === 'upcoming' ? 'var(--dark-base)' : 'var(--bg-surface)',
                color: dateFilter === 'upcoming' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              Upcoming
            </button>
            <button
              onClick={() => setDateFilter('past')}
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '0.78125rem',
                fontWeight: 600,
                backgroundColor: dateFilter === 'past' ? 'var(--dark-base)' : 'var(--bg-surface)',
                color: dateFilter === 'past' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              Concluded
            </button>
            <button
              onClick={() => setDateFilter('all')}
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '0.78125rem',
                fontWeight: 600,
                backgroundColor: dateFilter === 'all' ? 'var(--dark-base)' : 'var(--bg-surface)',
                color: dateFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Events Listing */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Retrieving academic schedule...
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No events match your search criteria"
          description="Try broadening your category filter or search keywords."
          actionText="Clear Filters"
          onAction={() => { setCategory('all'); setSearch(''); setDateFilter('all'); }}
        />
      ) : (
        <div style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          overflow: 'hidden'
        }}>
          {events.map((evt, index) => {
            const seatsRemaining = Math.max(0, evt.max_participants - (evt.registered_count || 0));
            return (
              <div
                key={evt.id}
                style={{
                  padding: '28px',
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 180px',
                  alignItems: 'center',
                  gap: '24px',
                  borderBottom: index < events.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  backgroundColor: evt.is_user_registered ? 'var(--bg-secondary-light)' : 'transparent'
                }}
              >
                {/* Date & Category Box */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-base)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {evt.category}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {evt.date}
                  </div>
                  <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                    {evt.start_time} - {evt.end_time}
                  </div>
                </div>

                {/* Event Core Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '1.1875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <Link to={`/student/events/${evt.id}`} style={{ color: 'inherit' }}>
                        {evt.title}
                      </Link>
                    </h2>
                    {evt.is_user_registered && (
                      <span className="badge badge-registered">
                        Registered
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '10px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {evt.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Venue:</strong> {evt.venue}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Organizer:</strong> {evt.organizer_name}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Department:</strong> {evt.department}
                    </div>
                  </div>
                </div>

                {/* Registration & Capacity State */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seat Allocation</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: seatsRemaining <= 10 ? 'var(--status-error-text)' : 'var(--text-primary)' }}>
                      {evt.registered_count} / {evt.max_participants} ({seatsRemaining} open)
                    </div>
                  </div>

                  <Link
                    to={`/student/events/${evt.id}`}
                    className={evt.is_user_registered ? 'btn btn-outline' : 'btn btn-primary'}
                    style={{ height: '36px', fontSize: '0.8125rem' }}
                  >
                    {evt.is_user_registered ? 'View Your Pass' : 'View Details & Register'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
