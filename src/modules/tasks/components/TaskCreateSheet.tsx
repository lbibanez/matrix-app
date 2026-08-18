import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, Repeat as RepeatIcon, Trash2, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { taskService } from '../services/taskService';
import { useAuth } from '../../../core/auth/AuthContext';
import { type RecurrenceRule, type Task } from '../../../core/db/dexie';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, isToday,
} from 'date-fns';

interface TaskCreateSheetProps {
  isOpen: boolean;
  onClose: (savedTask?: any) => void;
  defaultDate?: Date;
  editTask?: Task;
}

// ─── Mini Calendar Picker Sheet ───────────────────────────────────────────────
function CalendarPicker({
  isOpen,
  value,
  onChange,
  hasTime,
  timeLabel,
  onAddTime,
  onRemoveTime,
  onDone,
  onClose,
}: {
  isOpen: boolean;
  value: Date;
  onChange: (d: Date) => void;
  hasTime: boolean;
  timeLabel: string | null;
  onAddTime: () => void;
  onRemoveTime: () => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const [viewMonth, setViewMonth] = useState(value);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth)),
    end: endOfWeek(endOfMonth(viewMonth)),
  });

  return (
    <>
      <div className={`mx-overlay${isOpen ? ' mx-overlay--open' : ''}`} style={{ zIndex: 40 }} onClick={onClose} />
      <div className={`mx-sheet${isOpen ? ' mx-sheet--open' : ''}`} style={{ zIndex: 41, maxHeight: '80%' }}>
        <div className="mx-sheet-handle" />
        <div style={{ padding: '14px 22px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 18, fontWeight: 650, letterSpacing: '-0.02em' }}>Date &amp; Time</span>
            <button onClick={onDone} style={{ background: 'none', color: '#1F5A37', fontWeight: 650, fontSize: 15 }}>Done</button>
          </div>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontWeight: 620, fontSize: 15 }}>
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <span style={{ display: 'flex', gap: 4 }}>
              <button className="mx-small-btn" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
                <ChevronLeft size={16} />
              </button>
              <button className="mx-small-btn" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
                <ChevronRight size={16} />
              </button>
            </span>
          </div>

          {/* Weekday labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 4 }}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} style={{ fontSize: 10, color: '#9A9D9A', fontWeight: 650, paddingBottom: 4 }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {days.map((day, i) => {
              const isSel = isSameDay(day, value);
              const isCurMonth = isSameMonth(day, viewMonth);
              const isDayToday = isToday(day);

              let cls = 'mx-day';
              if (!isCurMonth && !isSel) cls += ' mx-day--muted';
              if (isDayToday && !isSel) cls += ' mx-day--today';
              if (isSel) cls += ' mx-day--selected';

              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => { onChange(day); setViewMonth(day); }}
                  style={{ height: 38, borderRadius: 11 }}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Add/Remove Time row */}
          <div style={{ borderTop: '1px solid #EFF1EE', marginTop: 18, paddingTop: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: hasTime ? '#1F5A37' : '#9CA3AF' }} />
              <span style={{ fontSize: 14, color: '#171717' }}>Time</span>
            </div>
            {hasTime ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={onAddTime}
                  style={{ background: '#EEF5F0', color: '#1F5A37', border: '1px solid #D8E8DD', borderRadius: 10, padding: '6px 12px', fontSize: 13, fontWeight: 620 }}
                >
                  {timeLabel}
                </button>
                <button onClick={onRemoveTime} style={{ background: 'none', color: '#9CA3AF' }}>
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={onAddTime}
                style={{ background: 'none', color: '#1F5A37', fontWeight: 650, fontSize: 13 }}
              >
                + Add time
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Scroll Wheel Column ──────────────────────────────────────────────────────
function WheelColumn({
  items,
  selectedIndex,
  onChange,
}: {
  items: string[];
  selectedIndex: number;
  onChange: (idx: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const itemH = 44;
  const isScrolling = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  // Scroll to selected on mount/change
  useEffect(() => {
    if (ref.current && !isScrolling.current) {
      ref.current.scrollTop = selectedIndex * itemH;
    }
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    isScrolling.current = true;
    const idx = Math.round(ref.current.scrollTop / itemH);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (clamped !== selectedIndex) onChange(clamped);
    // Reset flag after scroll settles
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => { isScrolling.current = false; }, 150);
  }, [items.length, selectedIndex, onChange]);

  return (
    <div style={{ position: 'relative', flex: 1, height: 176 }}>
      {/* Selection highlight band */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        height: itemH, transform: 'translateY(-50%)',
        background: '#EEF5F0', borderRadius: 12, pointerEvents: 'none', zIndex: 1,
      }} />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="no-scrollbar"
        style={{
          height: '100%',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
        }}
      >
        {/* Top padding — two invisible items */}
        <div style={{ height: itemH * 2, flexShrink: 0 }} />

        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => {
              onChange(i);
              ref.current!.scrollTo({ top: i * itemH, behavior: 'smooth' });
            }}
            style={{
              height: itemH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              scrollSnapAlign: 'center',
              fontSize: 20,
              fontWeight: i === selectedIndex ? 650 : 400,
              color: i === selectedIndex ? '#1F5A37' : '#9CA3AF',
              transition: 'color 0.2s, font-weight 0.2s',
              cursor: 'pointer',
              userSelect: 'none',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {item}
          </div>
        ))}

        {/* Bottom padding */}
        <div style={{ height: itemH * 2, flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ─── Time Picker Sheet ────────────────────────────────────────────────────────
function TimePicker({
  isOpen,
  hour,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
  onDone,
  onClose,
}: {
  isOpen: boolean;
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  onPeriodChange: (p: 'AM' | 'PM') => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  const periods = ['AM', 'PM'];

  const hourIdx = hour - 1; // hour is 1-12
  const minIdx = Math.min(Math.round(minute / 5), 11);
  const perIdx = period === 'AM' ? 0 : 1;

  return (
    <>
      <div className={`mx-overlay${isOpen ? ' mx-overlay--open' : ''}`} style={{ zIndex: 40 }} onClick={onClose} />
      <div className={`mx-sheet${isOpen ? ' mx-sheet--open' : ''}`} style={{ zIndex: 41 }}>
        <div className="mx-sheet-handle" />
        <div style={{ padding: '14px 22px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 650, letterSpacing: '-0.02em' }}>Set time</span>
            <button onClick={onDone} style={{ background: 'none', color: '#1F5A37', fontWeight: 650, fontSize: 15 }}>Done</button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <WheelColumn
              items={hours}
              selectedIndex={hourIdx}
              onChange={i => onHourChange(i + 1)}
            />
            <div style={{ fontSize: 22, fontWeight: 650, color: '#171717', flexShrink: 0, paddingBottom: 2 }}>:</div>
            <WheelColumn
              items={minutes}
              selectedIndex={minIdx}
              onChange={i => onMinuteChange(i * 5)}
            />
            <WheelColumn
              items={periods}
              selectedIndex={perIdx}
              onChange={i => onPeriodChange(i === 0 ? 'AM' : 'PM')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Repeat Picker Sheet ──────────────────────────────────────────────────────
function RepeatPicker({
  isOpen,
  value,
  onChange,
  onDone,
  onClose,
}: {
  isOpen: boolean;
  value: RecurrenceRule | null;
  onChange: (v: RecurrenceRule | null) => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const [isCustom, setIsCustom] = useState(false);
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('weeks');

  useEffect(() => {
    if (!isOpen) setIsCustom(false);
  }, [isOpen]);

  const options: { label: string; rule: RecurrenceRule | null; isCustomTrigger?: boolean }[] = [
    { label: 'Does not repeat', rule: null },
    { label: 'Every day', rule: { type: 'daily' } },
    { label: 'Every week', rule: { type: 'weekly' } },
    { label: 'Every month', rule: { type: 'monthly' } },
    { label: 'Every year', rule: { type: 'yearly' } },
    { label: 'Custom...', rule: { type: 'custom' }, isCustomTrigger: true },
  ];

  // Helper to check if a predefined option matches the current value
  const isSelected = (rule: RecurrenceRule | null, isCustomTrigger?: boolean) => {
    if (isCustomTrigger) return isCustom || value?.type === 'custom';
    if (!rule && !value) return true;
    if (rule && value && rule.type === value.type && value.type !== 'custom') return true;
    return false;
  };

  const handleSelect = (opt: typeof options[0]) => {
    if (opt.isCustomTrigger) {
      setIsCustom(true);
      onChange({ type: 'custom', interval: customInterval, unit: customUnit });
    } else {
      setIsCustom(false);
      onChange(opt.rule);
      onDone(); // auto close for standard options
    }
  };

  // When custom values change
  const applyCustom = (interval: number, unit: 'days' | 'weeks' | 'months' | 'years') => {
    setCustomInterval(interval);
    setCustomUnit(unit);
    onChange({ type: 'custom', interval, unit });
  };

  return (
    <>
      <div className={`mx-overlay${isOpen ? ' mx-overlay--open' : ''}`} style={{ zIndex: 40 }} onClick={onClose} />
      <div className={`mx-sheet${isOpen ? ' mx-sheet--open' : ''}`} style={{ zIndex: 41 }}>
        <div className="mx-sheet-handle" />
        <div style={{ padding: '14px 22px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 650, letterSpacing: '-0.02em' }}>Repeat</span>
            <button onClick={onDone} style={{ background: 'none', color: '#1F5A37', fontWeight: 650, fontSize: 15 }}>Done</button>
          </div>

          {!isCustom ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 0', borderBottom: i < options.length - 1 ? '1px solid #F0F1EF' : 'none',
                    background: 'none', color: isSelected(opt.rule, opt.isCustomTrigger) ? '#1F5A37' : '#171717',
                    fontWeight: isSelected(opt.rule, opt.isCustomTrigger) ? 650 : 400,
                    fontSize: 16, textAlign: 'left'
                  }}
                >
                  {opt.label}
                  {isSelected(opt.rule, opt.isCustomTrigger) && <Check size={18} strokeWidth={3} />}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: '10px 0' }}>
              <div style={{ marginBottom: 20 }}>
                <button onClick={() => setIsCustom(false)} style={{ background: 'none', color: '#6B7280', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ChevronLeft size={16} /> Back
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 18 }}>
                <span>Repeat every</span>
                <input
                  type="number"
                  min={1}
                  value={customInterval}
                  onChange={e => applyCustom(parseInt(e.target.value) || 1, customUnit)}
                  style={{
                    width: 60, padding: '8px', border: '1px solid #E5E7EB', borderRadius: 12,
                    textAlign: 'center', fontSize: 18, background: '#F8F8F5', color: '#171717', outline: 'none'
                  }}
                />
                <select
                  value={customUnit}
                  onChange={e => applyCustom(customInterval, e.target.value as any)}
                  style={{
                    flex: 1, padding: '10px', border: '1px solid #E5E7EB', borderRadius: 12,
                    fontSize: 16, background: '#F8F8F5', color: '#171717', outline: 'none', WebkitAppearance: 'none'
                  }}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Create Sheet ────────────────────────────────────────────────────────
export function TaskCreateSheet({ isOpen, onClose, defaultDate, editTask }: TaskCreateSheetProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showChecklist, setShowChecklist] = useState(false);
  const [subtaskTitles, setSubtaskTitles] = useState<string[]>([]);

  // Date state
  const [hasDate, setHasDate] = useState(false);
  const [chosenDate, setChosenDate] = useState<Date>(new Date());
  const [showCalPicker, setShowCalPicker] = useState(false);

  // Time state
  const [hasTime, setHasTime] = useState(false);
  const [hour, setHour] = useState(9);      // 1–12
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Repeat state
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 120);

      if (editTask) {
        // Pre-populate from existing task
        setTitle(editTask.title);
        setDescription(editTask.description || '');
        setRecurrence(editTask.recurrence_rule || null);

        if (editTask.subtasks && editTask.subtasks.length > 0) {
          setShowChecklist(true);
          setSubtaskTitles(editTask.subtasks.map(st => st.title));
        } else {
          setShowChecklist(false);
          setSubtaskTitles([]);
        }

        if (editTask.due_date) {
          const d = new Date(editTask.due_date);
          setChosenDate(d);
          setHasDate(true);
          if (!editTask.all_day) {
            setHasTime(true);
            let rawHour = d.getHours();
            const rawMinute = d.getMinutes();
            const p: 'AM' | 'PM' = rawHour >= 12 ? 'PM' : 'AM';
            if (rawHour === 0) rawHour = 12;
            else if (rawHour > 12) rawHour -= 12;
            setHour(rawHour);
            setMinute(rawMinute);
            setPeriod(p);
          } else {
            setHasTime(false);
          }
        } else {
          setHasDate(false);
          setHasTime(false);
        }
      } else {
        // New task defaults
        if (defaultDate) {
          setChosenDate(defaultDate);
          setHasDate(true);
        } else {
          setChosenDate(new Date());
          setHasDate(false);
        }
      }
    } else {
      setTitle(''); setDescription('');
      setShowChecklist(false); setSubtaskTitles([]);
      setHasDate(false); setHasTime(false);
      setRecurrence(null);
      setShowCalPicker(false); setShowTimePicker(false); setShowRepeatPicker(false);
    }
  }, [isOpen, defaultDate, editTask]);

  const handleSave = async () => {
    if (!title.trim() || !user) return;
    setIsSubmitting(true);
    try {
      let isoDateStr: string | undefined;
      if (hasDate || hasTime) {
        const d = new Date(chosenDate);
        if (hasTime) {
          let h = hour;
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          d.setHours(h, minute, 0, 0);
        } else {
          d.setHours(0, 0, 0, 0);
        }
        isoDateStr = d.toISOString();
      }

      if (editTask) {
        // ── Edit mode ──────────────────────────────────────────────────────
        await taskService.updateTask(editTask.id, {
          title: title.trim(),
          description: description.trim(),
          due_date: isoDateStr ?? null,
          all_day: !hasTime,
          recurrence_rule: recurrence || null,
        });
        // Update subtasks: replace the whole subtask list
        if (showChecklist) {
          const newSubtasks = subtaskTitles
            .filter(t => t.trim())
            .map((t, i) => ({
              // Reuse existing subtask ID if available, otherwise new
              id: editTask.subtasks?.[i]?.id ?? crypto.randomUUID(),
              title: t.trim(),
              completed: editTask.subtasks?.[i]?.completed ?? false,
            }));
          await taskService.updateTask(editTask.id, { subtasks: newSubtasks });
        } else {
          await taskService.updateTask(editTask.id, { subtasks: [] });
        }
        onClose(); // edit doesn't navigate anywhere
      } else {
        // ── Create mode ────────────────────────────────────────────────────
        const task = await taskService.createTask(user.id, title.trim(), {
          description: description.trim(),
          dueDate: isoDateStr,
          allDay: !hasTime,
          recurrenceRule: recurrence || undefined,
        });
        if (showChecklist) {
          for (const st of subtaskTitles) {
            if (st.trim()) await taskService.addSubtask(task.id, st.trim());
          }
        }
        onClose(task);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save task: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Label for date button
  const dateLabel = hasDate ? format(chosenDate, 'MMM d') : null;
  const timeLabel = hasTime ? `${hour}:${String(minute).padStart(2, '0')} ${period}` : null;
  let repeatLabel = null;
  if (recurrence) {
    if (recurrence.type === 'custom') {
      repeatLabel = `Every ${recurrence.interval} ${recurrence.unit}`;
    } else {
      repeatLabel = recurrence.type.charAt(0).toUpperCase() + recurrence.type.slice(1);
    }
  }

  return (
    <>
      {/* Main overlay */}
      <div
        className={`mx-overlay${isOpen && !showCalPicker && !showTimePicker && !showRepeatPicker ? ' mx-overlay--open' : ''}`}
        onClick={() => onClose()}
      />

      {/* Main sheet */}
      <div className={`mx-sheet${isOpen ? ' mx-sheet--open' : ''}`}>
        <div className="mx-sheet-handle" />
        <div style={{ padding: '14px 22px 32px' }}>
          <div style={{ fontSize: 20, fontWeight: 650, letterSpacing: '-0.02em', marginBottom: 18 }}>
            {editTask ? 'Edit task' : 'New task'}
          </div>

          <input
            ref={titleInputRef}
            type="text"
            placeholder="New task"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
            style={{ width: '100%', border: 0, outline: 0, background: 'transparent', color: '#171717', fontSize: 18, padding: '8px 0' }}
          />

          <textarea
            placeholder="Add details"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', border: 0, outline: 0, resize: 'none', background: 'transparent', color: '#171717', fontSize: 14, padding: '8px 0', minHeight: 56 }}
          />

          {/* Pill badges for chosen date/time/repeat */}
          {(hasDate || hasTime || recurrence) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {hasDate && (
                <div className="mx-detail-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0, paddingLeft: 10, overflow: 'hidden' }}>
                  <button
                    onClick={() => setShowCalPicker(true)}
                    style={{ background: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1F5A37', padding: '7px 0' }}
                  >
                    <CalendarIcon size={12} /> {dateLabel}
                  </button>
                  <button
                    onClick={() => { setHasDate(false); setHasTime(false); }}
                    style={{ background: 'none', color: '#1F5A37', opacity: 0.6, display: 'flex', alignItems: 'center', padding: '7px 8px', transition: 'opacity 0.15s' }}
                    title="Remove date"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              )}
              {hasTime && (
                <div className="mx-detail-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0, paddingLeft: 10, overflow: 'hidden' }}>
                  <button
                    onClick={() => setShowTimePicker(true)}
                    style={{ background: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1F5A37', padding: '7px 0' }}
                  >
                    <Clock size={12} /> {timeLabel}
                  </button>
                  <button
                    onClick={() => setHasTime(false)}
                    style={{ background: 'none', color: '#1F5A37', opacity: 0.6, display: 'flex', alignItems: 'center', padding: '7px 8px', transition: 'opacity 0.15s' }}
                    title="Remove time"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              )}
              {recurrence && (
                <div className="mx-detail-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0, paddingLeft: 10, overflow: 'hidden' }}>
                  <button
                    onClick={() => setShowRepeatPicker(true)}
                    style={{ background: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1F5A37', padding: '7px 0' }}
                  >
                    <RepeatIcon size={12} /> {repeatLabel}
                  </button>
                  <button
                    onClick={() => setRecurrence(null)}
                    style={{ background: 'none', color: '#1F5A37', opacity: 0.6, display: 'flex', alignItems: 'center', padding: '7px 8px', transition: 'opacity 0.15s' }}
                    title="Remove repeat"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          {showChecklist && (
            <div style={{ paddingTop: 16, borderTop: '1px solid #EFF1EE', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 650, marginBottom: 9 }}>Checklist</div>
              {subtaskTitles.map((st, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: '1px solid #F5F5F3' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid #A4AAA5', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={st}
                    placeholder="New item"
                    onChange={e => {
                      const n = [...subtaskTitles];
                      n[i] = e.target.value;
                      setSubtaskTitles(n);
                    }}
                    style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 14 }}
                    autoFocus={i === subtaskTitles.length - 1}
                  />
                  <button onClick={() => setSubtaskTitles(subtaskTitles.filter((_, idx) => idx !== i))} style={{ color: '#C58B8B', background: 'none' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, borderTop: '1px solid #EFF1EE', marginTop: 10, paddingTop: 13 }}>
            <button
              className="mx-action"
              title="Checklist"
              onClick={() => { setShowChecklist(true); setSubtaskTitles(p => [...p, '']); }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>☷</span>
            </button>

            <button
              className="mx-action"
              title="Date & Time"
              onClick={() => setShowCalPicker(true)}
              style={{ background: (hasDate || hasTime) ? '#1F5A37' : undefined, color: (hasDate || hasTime) ? '#fff' : undefined }}
            >
              <CalendarIcon size={18} />
            </button>

            <button
              className="mx-action"
              title="Repeat"
              onClick={() => setShowRepeatPicker(true)}
              style={{ background: recurrence ? '#1F5A37' : undefined, color: recurrence ? '#fff' : undefined }}
            >
              <RepeatIcon size={18} />
            </button>

            <button
              className="mx-save-btn"
              onClick={handleSave}
              disabled={!title.trim() || isSubmitting}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Picker Sub-Sheet */}
      <CalendarPicker
        isOpen={showCalPicker}
        value={chosenDate}
        onChange={d => { setChosenDate(d); setHasDate(true); }}
        hasTime={hasTime}
        timeLabel={hasTime ? `${hour}:${String(minute).padStart(2, '0')} ${period}` : null}
        onAddTime={() => { setShowCalPicker(false); setShowTimePicker(true); }}
        onRemoveTime={() => setHasTime(false)}
        onDone={() => setShowCalPicker(false)}
        onClose={() => setShowCalPicker(false)}
      />

      {/* Time Picker Sub-Sheet */}
      <TimePicker
        isOpen={showTimePicker}
        hour={hour}
        minute={minute}
        period={period}
        onHourChange={setHour}
        onMinuteChange={setMinute}
        onPeriodChange={setPeriod}
        onDone={() => { setHasTime(true); setShowCalPicker(true); setShowTimePicker(false); }}
        onClose={() => { setShowCalPicker(true); setShowTimePicker(false); }}
      />

      {/* Repeat Picker Sub-Sheet */}
      <RepeatPicker
        isOpen={showRepeatPicker}
        value={recurrence}
        onChange={setRecurrence}
        onDone={() => setShowRepeatPicker(false)}
        onClose={() => setShowRepeatPicker(false)}
      />
    </>
  );
}
