import { useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import type { Phase } from '../types';

interface GanttTimelineProps {
  phases: Phase[];
  onPhaseClick?: (phaseId: string) => void;
  onPhaseUpdate?: (phaseId: string, startDate: string, endDate: string) => void;
}

export default function GanttTimeline({
  phases,
  onPhaseClick,
  onPhaseUpdate,
}: GanttTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!timelineRef.current) return;

    // Prepare data for timeline
    const items = new DataSet(
      phases.map((phase) => ({
        id: phase.id,
        content: phase.name,
        start: new Date(phase.start_date),
        end: new Date(phase.end_date),
        type: 'range',
        className: `phase-${phase.status.toLowerCase()}`,
        title: `${phase.name} - ${phase.type}`,
      }))
    );

    // Configure timeline options
    const options = {
      width: '100%',
      height: '400px',
      margin: {
        item: 10,
        axis: 5,
      },
      editable: {
        updateTime: true,
        updateGroup: false,
        add: false,
        remove: false,
      },
      onMove: (item: any, callback: any) => {
        if (onPhaseUpdate) {
          onPhaseUpdate(
            String(item.id),
            item.start.toISOString(),
            item.end.toISOString()
          );
        }
        callback(item);
      },
    };

    // Create timeline
    const timeline = new Timeline(timelineRef.current, items, options);

    // Add click event listener
    if (onPhaseClick) {
      timeline.on('select', (properties) => {
        if (properties.items.length > 0) {
          onPhaseClick(properties.items[0]);
        }
      });
    }

    timelineInstance.current = timeline;

    // Cleanup on unmount
    return () => {
      timeline.destroy();
    };
  }, [phases, onPhaseClick, onPhaseUpdate]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <style>{`
        .phase-not_started {
          background-color: #e5e7eb;
          border-color: #9ca3af;
        }
        .phase-in_progress {
          background-color: #3b82f6;
          border-color: #2563eb;
          color: white;
        }
        .phase-completed {
          background-color: #10b981;
          border-color: #059669;
          color: white;
        }
        .phase-skipped {
          background-color: #fbbf24;
          border-color: #f59e0b;
        }
        .phase-blocked {
          background-color: #ef4444;
          border-color: #dc2626;
          color: white;
        }
        .vis-timeline {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
        }
        .vis-item {
          border-radius: 0.25rem;
        }
      `}</style>
      <div ref={timelineRef} />
    </div>
  );
}
