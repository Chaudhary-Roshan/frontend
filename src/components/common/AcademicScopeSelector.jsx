import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, Search, X, CheckSquare, Square, 
  Shield, Filter, Check, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { 
  FACULTY_CATALOG, 
  FACULTIES, 
  ACADEMIC_CATALOG, 
  DEPARTMENTS 
} from '../../utils/academicCatalog';

export default function AcademicScopeSelector({
  eligibilityType = 'all',
  setEligibilityType,
  selectedDepartments = [],
  setSelectedDepartments,
  selectedPrograms = [],
  setSelectedPrograms
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('all');

  // Toggle department and sync its programs
  const toggleDepartment = (dept) => {
    setSelectedDepartments(prev => {
      const exists = prev.includes(dept);
      if (exists) {
        const deptPrograms = ACADEMIC_CATALOG[dept] || [];
        setSelectedPrograms(pPrev => pPrev.filter(p => !deptPrograms.includes(p)));
        return prev.filter(d => d !== dept);
      } else {
        const deptPrograms = ACADEMIC_CATALOG[dept] || [];
        setSelectedPrograms(pPrev => Array.from(new Set([...pPrev, ...deptPrograms])));
        return [...prev, dept];
      }
    });
  };

  const toggleProgram = (prog, dept) => {
    setSelectedPrograms(prev => {
      const exists = prev.includes(prog);
      const next = exists ? prev.filter(p => p !== prog) : [...prev, prog];
      
      // If adding program and department is not yet selected, also add department
      if (!exists && dept && !selectedDepartments.includes(dept)) {
        setSelectedDepartments(dPrev => [...dPrev, dept]);
      }
      return next;
    });
  };

  const selectAllProgramsForDept = (dept) => {
    const deptPrograms = ACADEMIC_CATALOG[dept] || [];
    if (!selectedDepartments.includes(dept)) {
      setSelectedDepartments(prev => [...prev, dept]);
    }
    setSelectedPrograms(prev => Array.from(new Set([...prev, ...deptPrograms])));
  };

  const clearProgramsForDept = (dept) => {
    const deptPrograms = ACADEMIC_CATALOG[dept] || [];
    setSelectedPrograms(prev => prev.filter(p => !deptPrograms.includes(p)));
  };

  // Filter departments and programs based on search query and faculty filter
  const filteredCatalog = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = {};

    Object.entries(FACULTY_CATALOG).forEach(([facultyName, depts]) => {
      if (facultyFilter !== 'all' && facultyFilter !== facultyName) {
        return;
      }

      Object.entries(depts).forEach(([deptName, programs]) => {
        const deptMatches = !query || deptName.toLowerCase().includes(query);
        const matchingPrograms = !query 
          ? programs 
          : programs.filter(p => p.toLowerCase().includes(query));

        // Include department if department name matches or any of its programs match
        if (deptMatches || matchingPrograms.length > 0) {
          result[deptName] = {
            faculty: facultyName,
            programs: programs,
            visiblePrograms: matchingPrograms.length > 0 ? matchingPrograms : programs,
            hasProgramMatch: !deptMatches && matchingPrograms.length > 0
          };
        }
      });
    });

    return result;
  }, [searchQuery, facultyFilter]);

  const filteredDeptNames = Object.keys(filteredCatalog);

  // Quick Action: Select All Visible
  const selectAllVisible = () => {
    const deptsToAdd = [];
    const progsToAdd = [];
    Object.entries(filteredCatalog).forEach(([dName, dInfo]) => {
      deptsToAdd.push(dName);
      progsToAdd.push(...dInfo.visiblePrograms);
    });
    setSelectedDepartments(prev => Array.from(new Set([...prev, ...deptsToAdd])));
    setSelectedPrograms(prev => Array.from(new Set([...prev, ...progsToAdd])));
  };

  // Quick Action: Clear All
  const clearAllSelected = () => {
    setSelectedDepartments([]);
    setSelectedPrograms([]);
  };

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2 p-5 border border-indigo-100 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-slate-50 font-sans">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <GraduationCap size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">Audience Scope & Department Eligibility *</h4>
            <p className="text-[11px] text-slate-500 font-medium">Control whether this event is campus-wide or restricted to specific degree programs.</p>
          </div>
        </div>

        {eligibilityType === 'restricted' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1 shadow-xs">
              <span>🔒 Restricted Scope</span>
              <span>•</span>
              <span>{selectedDepartments.length} Depts / {selectedPrograms.length} Programs</span>
            </span>
          </div>
        )}
      </div>

      {/* RADIO SCOPE PICKER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <label className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition ${
          eligibilityType === 'all'
            ? 'border-indigo-600 bg-white shadow-xs text-slate-900 font-bold'
            : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300'
        }`}>
          <input
            type="radio"
            name="academic_scope_radio"
            checked={eligibilityType === 'all'}
            onChange={() => setEligibilityType('all')}
            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>🌐 Open to All University Students</span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal mt-0.5">Campus-wide discovery & open registration across all 14 faculties.</p>
          </div>
        </label>

        <label className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition ${
          eligibilityType === 'restricted'
            ? 'border-indigo-600 bg-white shadow-xs text-slate-900 font-bold'
            : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300'
        }`}>
          <input
            type="radio"
            name="academic_scope_radio"
            checked={eligibilityType === 'restricted'}
            onChange={() => {
              setEligibilityType('restricted');
              if (selectedDepartments.length === 0) {
                // Default to Department of Information and Communication Engineering
                const defaultDept = "Department of Information and Communication Engineering";
                setSelectedDepartments([defaultDept]);
                const deProgs = ACADEMIC_CATALOG[defaultDept] || [];
                setSelectedPrograms(deProgs.slice(0, 2)); // Cyber & Robotics
              }
            }}
            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>🔒 Department & Program Restricted</span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal mt-0.5">Strictly shown and registerable only by students in designated programs.</p>
          </div>
        </label>
      </div>

      {/* RESTRICTED FILTER & SEARCH INTERFACE */}
      {eligibilityType === 'restricted' && (
        <div className="space-y-4 pt-3 border-t border-indigo-100 animate-in fade-in duration-150">
          
          {/* Policy Banner */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Shield size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="font-bold">Strict University Policy:</strong> Students outside the selected programs will not see this event in their feed and cannot register.
            </p>
          </div>

          {/* SEARCH & FACULTY FILTER CONTROLS */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search departments or degree programs (e.g. Cyber, English, Robotics, BBA)..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Faculty Filter Dropdown */}
              <div className="w-full sm:w-64">
                <div className="relative">
                  <select
                    value={facultyFilter}
                    onChange={(e) => setFacultyFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none truncate"
                  >
                    <option value="all">All 14 Faculties (Full University)</option>
                    {FACULTIES.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quick Filter Actions Bar */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 flex-wrap gap-2">
              <span className="text-slate-500 font-medium">
                Showing <strong className="text-slate-900">{filteredDeptNames.length}</strong> matching departments
                {searchQuery && <span> for "<span className="text-indigo-600 font-bold">{searchQuery}</span>"</span>}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Select All Visible
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={clearAllSelected}
                  className="text-slate-500 hover:text-rose-600 font-bold cursor-pointer"
                >
                  Clear All ({selectedDepartments.length})
                </button>
              </div>
            </div>
          </div>

          {/* DEPARTMENTS & PROGRAMS LIST */}
          {filteredDeptNames.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
              <Search size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No departments or programs match "{searchQuery}"</p>
              <p className="text-[11px] text-slate-400">Try searching for a different degree keyword or switch faculty filter.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setFacultyFilter('all'); }}
                className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredDeptNames.map(deptName => {
                const info = filteredCatalog[deptName];
                const isDeptSelected = selectedDepartments.includes(deptName);
                const selectedInDept = info.programs.filter(p => selectedPrograms.includes(p));

                return (
                  <div
                    key={deptName}
                    className={`p-3.5 rounded-2xl border transition shadow-xs ${
                      isDeptSelected
                        ? 'bg-white border-indigo-300 ring-1 ring-indigo-200'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Department Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDepartment(deptName)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition cursor-pointer ${
                            isDeptSelected
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-300 bg-slate-50 hover:border-indigo-400'
                          }`}
                        >
                          {isDeptSelected ? <Check size={14} strokeWidth={3} /> : null}
                        </button>
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span>{deptName}</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                              {info.faculty.replace('Faculty of ', '')}
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-semibold">
                            {selectedInDept.length} of {info.programs.length} programs selected
                          </span>
                        </div>
                      </div>

                      {/* Department Quick Actions */}
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => selectAllProgramsForDept(deptName)}
                          className="font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => clearProgramsForDept(deptName)}
                          className="font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Program Checkbox Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {info.visiblePrograms.map(prog => {
                        const isChecked = selectedPrograms.includes(prog);
                        return (
                          <label
                            key={prog}
                            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                              isChecked
                                ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-bold'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleProgram(prog, deptName)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                            />
                            <span className="text-[11px] leading-tight select-none">{prog}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
