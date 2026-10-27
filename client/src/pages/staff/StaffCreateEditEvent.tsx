import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';

export const StaffCreateEditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic & Research');
  const [posterUrl, setPosterUrl] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [venue, setVenue] = useState('');
  const [department, setDepartment] = useState(user?.profile?.department || 'Computer Science & Engineering');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [registrationStart, setRegistrationStart] = useState(new Date().toISOString().split('T')[0]);
  const [registrationEnd, setRegistrationEnd] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'closed' | 'completed' | 'cancelled'>('published');

  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      setInitialFetchLoading(true);
      api.getEvent(id)
        .then(res => {
          const e = res.event;
          setTitle(e.title);
          setDescription(e.description);
          setCategory(e.category);
          setPosterUrl(e.poster_url || '');
          setDate(e.date);
          setStartTime(e.start_time);
          setEndTime(e.end_time);
          setVenue(e.venue);
          setDepartment(e.department);
          setMaxParticipants(String(e.max_participants));
          setRegistrationStart(e.registration_start);
          setRegistrationEnd(e.registration_end);
          setGuidelines(e.guidelines || '');
          setStatus(e.status);
        })
        .catch(err => setError(err.message || 'Failed to load event'))
        .finally(() => setInitialFetchLoading(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      title,
      description,
      category,
      poster_url: posterUrl || null,
      date,
      start_time: startTime,
      end_time: endTime,
      venue,
      department,
      max_participants: parseInt(maxParticipants, 10) || 100,
      registration_start: registrationStart,
      registration_end: registrationEnd || date,
      guidelines: guidelines || null,
      status
    };

    try {
      if (isEditing && id) {
        await api.updateEvent(id, payload);
      } else {
        await api.createEvent(payload);
      }
      navigate('/staff/events');
    } catch (err: any) {
      setError(err.message || 'Failed to save event.');
    } finally {
      setLoading(false);
    }
  };

  if (initialFetchLoading) {
    return (
      <div style={{ maxWidth: '840px', margin: '40px auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading event specifications...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/staff/events" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          &larr; Back to Events Roster
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
          {isEditing ? 'Modify Event Specifications' : 'Author New Campus Event'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Configure institutional event details, capacity thresholds, and registration guidelines.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--status-error-bg)',
          color: 'var(--status-error-text)',
          border: '1px solid var(--status-error-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.84375rem',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Core Details */}
        <div className="panel" style={{ marginBottom: '24px' }}>
          <div className="panel-header">
            <h2 className="panel-title">1. Event Identification</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required</span>
          </div>

          <div className="input-group">
            <label className="input-label">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Advanced Autonomous Systems Research Colloquium"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Academic Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input-field"
              >
                <option value="Academic & Research">Academic & Research</option>
                <option value="Technology & Innovation">Technology & Innovation</option>
                <option value="Career & Placement">Career & Placement</option>
                <option value="Cultural & Arts">Cultural & Arts</option>
                <option value="Sports & Athletics">Sports & Athletics</option>
                <option value="Workshop & Seminar">Workshop & Seminar</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Event Poster Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://example.com/poster.jpg"
              value={posterUrl}
              onChange={e => setPosterUrl(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Event Description &amp; Abstract</label>
            <textarea
              required
              placeholder="Detailed description of keynote topics, learning objectives, and symposium agenda..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-field"
              style={{ minHeight: '120px' }}
            />
          </div>
        </div>

        {/* Section 2: Date, Time & Venue */}
        <div className="panel" style={{ marginBottom: '24px' }}>
          <div className="panel-header">
            <h2 className="panel-title">2. Schedule &amp; Campus Venue</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Event Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Campus Venue / Hall</label>
            <input
              type="text"
              required
              placeholder="e.g. Great Hall & Quadrangle / Room 302"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Section 3: Capacity & Registration Window */}
        <div className="panel" style={{ marginBottom: '24px' }}>
          <div className="panel-header">
            <h2 className="panel-title">3. Capacity &amp; Registration Thresholds</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Maximum Participants</label>
              <input
                type="number"
                required
                min={1}
                value={maxParticipants}
                onChange={e => setMaxParticipants(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Registration Opens</label>
              <input
                type="date"
                required
                value={registrationStart}
                onChange={e => setRegistrationStart(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Registration Closes</label>
              <input
                type="date"
                required
                value={registrationEnd}
                onChange={e => setRegistrationEnd(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Publication Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="input-field"
              >
                <option value="published">Published (Open to students)</option>
                <option value="draft">Draft (Private to organizer)</option>
                <option value="closed">Closed (Registration suspended)</option>
                <option value="completed">Completed (Concluded session)</option>
                <option value="cancelled">Cancelled (Voided)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Guidelines */}
        <div className="panel" style={{ marginBottom: '28px' }}>
          <div className="panel-header">
            <h2 className="panel-title">4. Guidelines &amp; Participant Instructions</h2>
          </div>

          <div className="input-group">
            <label className="input-label">Instructions for Attendees (Optional)</label>
            <textarea
              placeholder="e.g. Please bring university student ID card. Poster presenters must report 30 minutes prior to session start..."
              value={guidelines}
              onChange={e => setGuidelines(e.target.value)}
              className="input-field"
              style={{ minHeight: '90px' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/staff/events')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ minWidth: '160px' }}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Event Record' : 'Publish Campus Event'}
          </button>
        </div>
      </form>
    </div>
  );
};
