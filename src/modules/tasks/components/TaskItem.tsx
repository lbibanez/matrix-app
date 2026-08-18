import { useState, useRef, useEffect } from 'react';
import { type Task } from '../../../core/db/dexie';
import { taskService } from '../services/taskService';
import { Clock, Repeat, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskDetail } from '../context/TaskDetailContext';
import { useScrollContainer } from '../../../core/lib/ScrollContext';

interface TaskItemProps {
  task: Task;
  isOverdue?: boolean;
  isHighlighted?: boolean;
}

export function TaskItem({ task, isOverdue = false, isHighlighted = false }: TaskItemProps) {
  const { openTask } = useTaskDetail();
  const [isToggling, setIsToggling] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const isCompleted = task.status === 'completed';
  const itemRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainer = useScrollContainer();

  // ─── Scroll-to-highlight ─────────────────────────────────────────────────
  useEffect(() => {
    if (isHighlighted && itemRef.current && scrollContainer.current) {
      setTimeout(() => {
        const el = itemRef.current!;
        const container = scrollContainer.current!;
        const elTop = el.getBoundingClientRect().top;
        const containerTop = container.getBoundingClientRect().top;
        const targetScrollTop =
          container.scrollTop + (elTop - containerTop) - container.clientHeight / 2 + el.offsetHeight / 2;
        container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }, 100);
    }
  }, [isHighlighted, scrollContainer]);

  // ─── Swipe-to-delete ─────────────────────────────────────────────────────
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDeleting, setSwipeDeleting] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const didSwipeRef = useRef(false); // prevents tap firing after a swipe

  const handlePointerDown = (e: React.PointerEvent) => {
    if (exiting || swipeDeleting) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isHorizontalRef.current = null;
    didSwipeRef.current = false;
    // Don't capture pointer here, otherwise it swallows normal click events
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (exiting || swipeDeleting) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    // Determine scroll direction intent on first significant move
    if (isHorizontalRef.current === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
    }

    if (!isHorizontalRef.current) return; // let scroll handle vertical
    if (dx >= 0) return; // only leftward swipe

    if (!isSwiping) {
      setIsSwiping(true);
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (err) {}
    }
    setSwipeX(dx);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isSwiping) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
    }
    if (!isSwiping) return;
    const wrapperWidth = wrapperRef.current?.offsetWidth ?? 300;
    const THRESHOLD = wrapperWidth * 0.4;

    if (swipeX < -THRESHOLD) {
      // Crossed threshold — delete
      didSwipeRef.current = true;
      setSwipeDeleting(true);
      setSwipeX(-wrapperWidth - 20); // slide fully off
      setTimeout(async () => {
        try {
          await taskService.deleteTask(task.id);
        } catch (err) {
          console.error(err);
          setSwipeDeleting(false);
          setSwipeX(0);
        }
      }, 300);
    } else {
      // Snap back
      setSwipeX(0);
      setIsSwiping(false);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (isSwiping) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
    }
    setSwipeX(0);
    setIsSwiping(false);
  };

  // ─── Complete toggle ──────────────────────────────────────────────────────
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (isCompleted) {
        await taskService.updateTask(task.id, { status: 'pending' });
      } else {
        setJustCompleted(true);
        setTimeout(() => {
          setExiting(true);
          setTimeout(async () => {
            try {
              await taskService.completeTask(task.id);
            } catch (err) {
              console.error(err);
              setJustCompleted(false);
              setExiting(false);
            }
          }, 350);
        }, 380);
      }
    } catch (err) {
      console.error(err);
      setJustCompleted(false);
      setExiting(false);
    } finally {
      setIsToggling(false);
    }
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const formattedTime = (task.due_date && !task.all_day) ? format(new Date(task.due_date), 'h:mm a') : null;

  // Opacity of the delete icon — show progressively as card slides
  const wrapperWidth = wrapperRef.current?.offsetWidth ?? 300;
  const swipeProgress = Math.min(Math.abs(swipeX) / (wrapperWidth * 0.4), 1);

  return (
    <div
      ref={wrapperRef}
      className="mx-task-swipe-wrapper"
      style={{
        // Collapse height out of DOM after swipe-delete completes
        maxHeight: exiting ? 0 : 200,
        overflow: (exiting || swipeDeleting) ? 'hidden' : 'hidden',
        marginBottom: exiting ? 0 : undefined,
        transition: exiting
          ? 'max-height 0.4s ease 0.1s, margin 0.4s ease 0.1s'
          : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Red delete background */}
      <div className="mx-task-delete-bg" style={{ opacity: swipeProgress }}>
        <Trash2 size={22} strokeWidth={2} />
      </div>

      {/* Task card */}
      <div
        ref={itemRef}
        onClick={() => {
          if (didSwipeRef.current || isSwiping || swipeDeleting) return;
          if (!justCompleted) openTask(task.id);
        }}
        className={`mx-task${isCompleted ? ' is-done' : ''}${isHighlighted ? ' mx-task--highlight' : ''}`}
        data-swiping={isSwiping ? 'true' : 'false'}
        style={{
          // Swipe translation
          transform: swipeDeleting
            ? `translateX(${swipeX}px)`
            : isSwiping
            ? `translateX(${swipeX}px)`
            : exiting
            ? 'scale(0.95) translateY(-6px)'
            : undefined,
          transition: swipeDeleting
            ? 'transform 0.3s ease, opacity 0.3s ease'
            : isSwiping
            ? 'none' // no transition while actively dragging
            : exiting
            ? 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            : swipeX === 0 && !isSwiping
            ? 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' // snap-back
            : undefined,
          opacity: exiting || swipeDeleting ? 0 : 1,
          pointerEvents: (exiting || swipeDeleting) ? 'none' : undefined,
          willChange: isSwiping ? 'transform' : undefined,
        }}
      >
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`mx-check${(isCompleted || justCompleted) ? ' mx-check--done' : isOverdue ? ' mx-check--overdue' : ''}`}
          aria-label={isCompleted ? 'Mark incomplete' : 'Complete task'}
          style={{
            transform: justCompleted ? 'scale(1.25)' : 'scale(1)',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s, border-color 0.25s',
          }}
        >
          <Check className="mx-check-icon" strokeWidth={3} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 520,
            lineHeight: 1.35,
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? '#8A8E91' : '#171717',
            transition: 'color 0.3s, text-decoration 0.3s',
          }}>
            {task.title}
          </div>

          {(formattedTime || totalSubtasks > 0 || task.recurrence_rule || task.all_day) && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 7,
              marginTop: 5,
              fontSize: 12,
              color: (isOverdue && !isCompleted) ? '#A95757' : '#6B7280',
            }}>
              {task.all_day && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>All day</span>
              )}
              {formattedTime && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Clock style={{ width: 13, height: 13 }} /> {formattedTime}
                </span>
              )}
              {totalSubtasks > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {completedSubtasks}/{totalSubtasks} subtasks
                </span>
              )}
              {task.recurrence_rule && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#1F5A37' }}>
                  <Repeat style={{ width: 13, height: 13 }} /> Repeats
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
