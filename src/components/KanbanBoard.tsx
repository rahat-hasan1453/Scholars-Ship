'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Application, ApplicationStatus, DecisionResult } from '@/types';
import { calculateCountdown } from '@/lib/utils';
import { 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  FileText, 
  PartyPopper, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Building2,
  Calendar,
  MoreVertical,
  Check
} from 'lucide-react';

const COLUMNS: { id: ApplicationStatus; title: string; color: string; badgeBg: string }[] = [
  { id: 'Wishlist', title: 'Wishlist', color: 'border-slate-300 text-slate-700', badgeBg: 'bg-slate-100 text-slate-700' },
  { id: 'Preparing', title: 'Preparing', color: 'border-blue-400 text-blue-800', badgeBg: 'bg-blue-100 text-blue-800' },
  { id: 'Submitted', title: 'Submitted', color: 'border-purple-400 text-purple-800', badgeBg: 'bg-purple-100 text-purple-800' },
  { id: 'Under Review', title: 'Under Review', color: 'border-amber-400 text-amber-800', badgeBg: 'bg-amber-100 text-amber-800' },
  { id: 'Decided', title: 'Decided', color: 'border-emerald-500 text-emerald-800', badgeBg: 'bg-emerald-100 text-emerald-800' },
];

export const KanbanBoard: React.FC = () => {
  const { 
    applications, 
    updateApplicationStatus, 
    toggleTaskCompletion, 
    addTaskToApplication, 
    updateApplicationNotes, 
    removeApplication,
    setSelectedScholarship
  } = useApp();

  const [activeTaskAppId, setActiveTaskAppId] = useState<string | null>(null);
  const [newTaskInput, setNewTaskInput] = useState<string>('');
  const [editingNotesAppId, setEditingNotesAppId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');

  // Handle Drag & Drop state
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('text/plain', appId);
    setDraggedAppId(appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      if (targetStatus === 'Decided') {
        updateApplicationStatus(appId, targetStatus, 'Accepted');
      } else {
        updateApplicationStatus(appId, targetStatus);
      }
    }
    setDraggedAppId(null);
  };

  const handleAddTaskSubmit = (appId: string) => {
    if (!newTaskInput.trim()) return;
    addTaskToApplication(appId, newTaskInput);
    setNewTaskInput('');
  };

  const handleSaveNotes = (appId: string) => {
    updateApplicationNotes(appId, noteContent);
    setEditingNotesAppId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Board Summary Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>My Application Tracker</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {applications.length} Active Targets
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Drag cards between columns or use the navigation pills. Manage sub-tasks and milestones for each institution.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Quick tip:</span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            Moving to Decided triggers acceptance celebration 🎉
          </span>
        </div>
      </div>

      {/* 5-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col, colIndex) => {
          const colApps = applications.filter((app) => app.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 min-h-[580px] flex flex-col transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {col.title}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                    {colApps.length}
                  </span>
                </div>
              </div>

              {/* Application Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colApps.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 rounded-xl bg-white/40">
                    <span className="text-xs text-slate-400">No applications in {col.title}</span>
                    <span className="text-[11px] text-slate-400 mt-1">Drag here to update stage</span>
                  </div>
                ) : (
                  colApps.map((app) => {
                    const countdown = calculateCountdown(app.deadline);
                    const completedTasks = app.tasks.filter((t) => t.isCompleted).length;
                    const totalTasks = app.tasks.length;
                    const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3 group"
                      >
                        {/* Provider & Remove */}
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
                            {app.scholarship.provider}
                          </span>
                          <button
                            onClick={() => removeApplication(app.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-0.5"
                            title="Remove Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title */}
                        <h4
                          onClick={() => setSelectedScholarship(app.scholarship)}
                          className="text-xs font-bold text-slate-900 hover:text-indigo-700 cursor-pointer line-clamp-2 leading-snug"
                        >
                          {app.scholarship.title}
                        </h4>

                        {/* Deadline Timer */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100" suppressHydrationWarning>
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{countdown.formatted}</span>
                        </div>

                        {/* Decided Result Toggles (Only on Decided Column) */}
                        {col.id === 'Decided' && (
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500 block">Final Outcome</span>
                            <div className="grid grid-cols-3 gap-1">
                              {(['Accepted', 'Waitlisted', 'Rejected'] as DecisionResult[]).map((res) => {
                                const isCurrent = app.decision === res;
                                return (
                                  <button
                                    key={res}
                                    onClick={() => updateApplicationStatus(app.id, 'Decided', res)}
                                    className={`py-1 text-[10px] font-bold rounded-md transition-all ${
                                      isCurrent
                                        ? res === 'Accepted'
                                          ? 'bg-emerald-600 text-white shadow-2xs'
                                          : res === 'Waitlisted'
                                          ? 'bg-amber-500 text-white shadow-2xs'
                                          : 'bg-red-600 text-white shadow-2xs'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {res}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Sub-tasks Progress Bar & Checklist */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-600">Sub-tasks</span>
                            <span className="text-slate-500 font-medium">
                              {completedTasks}/{totalTasks} ({taskPercentage}%)
                            </span>
                          </div>
                          
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${taskPercentage}%` }}
                            />
                          </div>

                          {/* Task List Accordion */}
                          <div className="pt-1 space-y-1">
                            {app.tasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={() => toggleTaskCompletion(app.id, task.id)}
                                className="flex items-center gap-2 text-xs py-1 px-1 rounded hover:bg-slate-50 cursor-pointer"
                              >
                                {task.isCompleted ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                                <span className={`text-[11px] truncate ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                                  {task.title}
                                </span>
                              </div>
                            ))}

                            {/* Add Task Input */}
                            {activeTaskAppId === app.id ? (
                              <div className="flex items-center gap-1 pt-1.5">
                                <input
                                  type="text"
                                  placeholder="e.g. Order certified transcript"
                                  value={newTaskInput}
                                  onChange={(e) => setNewTaskInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddTaskSubmit(app.id)}
                                  className="flex-1 text-[11px] px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleAddTaskSubmit(app.id)}
                                  className="p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setActiveTaskAppId(app.id)}
                                className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 pt-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Sub-task</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="pt-2 border-t border-slate-100">
                          {editingNotesAppId === app.id ? (
                            <div className="space-y-1">
                              <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Add specific notes, contact emails, essay focus..."
                                rows={3}
                                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                              />
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => setEditingNotesAppId(null)}
                                  className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveNotes(app.id)}
                                  className="px-2.5 py-0.5 text-[10px] bg-indigo-600 text-white font-bold rounded-md"
                                >
                                  Save Notes
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingNotesAppId(app.id);
                                setNoteContent(app.notes || '');
                              }}
                              className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer line-clamp-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100 italic"
                            >
                              {app.notes ? `"${app.notes}"` : '+ Add advisor or essay notes...'}
                            </div>
                          )}
                        </div>

                        {/* Column Switcher Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          {colIndex > 0 ? (
                            <button
                              onClick={() => updateApplicationStatus(app.id, COLUMNS[colIndex - 1].id)}
                              className="flex items-center gap-0.5 text-[11px] text-slate-500 hover:text-slate-900 px-1.5 py-0.5 rounded hover:bg-slate-100"
                              title={`Move to ${COLUMNS[colIndex - 1].title}`}
                            >
                              <ChevronLeft className="w-3 h-3" />
                              <span>Back</span>
                            </button>
                          ) : (
                            <div />
                          )}

                          {colIndex < COLUMNS.length - 1 ? (
                            <button
                              onClick={() => {
                                const nextStatus = COLUMNS[colIndex + 1].id;
                                if (nextStatus === 'Decided') {
                                  updateApplicationStatus(app.id, nextStatus, 'Accepted');
                                } else {
                                  updateApplicationStatus(app.id, nextStatus);
                                }
                              }}
                              className="flex items-center gap-0.5 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100"
                              title={`Advance to ${COLUMNS[colIndex + 1].title}`}
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
