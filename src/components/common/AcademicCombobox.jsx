import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  GraduationCap, Search, ChevronDown, Check, X, 
  BookOpen, Building2, Layers
} from 'lucide-react';
import { 
  FACULTY_CATALOG, 
  FACULTIES, 
  ACADEMIC_CATALOG, 
  DEPARTMENTS 
} from '../../utils/academicCatalog';

/**
 * AcademicCombobox:
 * Searchable, linked dropdowns for Department and Degree Program
 * Tailored for dark glassmorphism registration/profile forms.
 */
export default function AcademicCombobox({
  selectedDepartment = '',
  onDepartmentChange,
  selectedProgram = '',
  onProgramChange,
  departmentError = null,
  programError = null,
  required = true,
  disabled = false,
  containerStyle = {}
}) {
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isProgOpen, setIsProgOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const [progSearch, setProgSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('all');

  const deptRef = useRef(null);
  const progRef = useRef(null);
  const deptInputRef = useRef(null);
  const progInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (deptRef.current && !deptRef.current.contains(e.target)) {
        setIsDeptOpen(false);
      }
      if (progRef.current && !progRef.current.contains(e.target)) {
        setIsProgOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Auto focus search inputs when dropdowns open
  useEffect(() => {
    if (isDeptOpen && deptInputRef.current) {
      setTimeout(() => deptInputRef.current?.focus(), 50);
    }
  }, [isDeptOpen]);

  useEffect(() => {
    if (isProgOpen && progInputRef.current) {
      setTimeout(() => progInputRef.current?.focus(), 50);
    }
  }, [isProgOpen]);

  // Map of every department to its faculty
  const deptToFacultyMap = useMemo(() => {
    const map = {};
    Object.entries(FACULTY_CATALOG).forEach(([faculty, depts]) => {
      Object.keys(depts).forEach(dept => {
        map[dept] = faculty;
      });
    });
    return map;
  }, []);

  // Map of every program to its department
  const progToDeptMap = useMemo(() => {
    const map = {};
    Object.entries(ACADEMIC_CATALOG).forEach(([dept, progs]) => {
      progs.forEach(prog => {
        if (!map[prog]) map[prog] = dept;
      });
    });
    return map;
  }, []);

  // Filtered departments based on search query and faculty filter
  const filteredDepartments = useMemo(() => {
    const query = deptSearch.trim().toLowerCase();
    return DEPARTMENTS.filter(dept => {
      const faculty = deptToFacultyMap[dept] || '';
      if (facultyFilter !== 'all' && faculty !== facultyFilter) {
        return false;
      }
      if (!query) return true;
      return (
        dept.toLowerCase().includes(query) ||
        faculty.toLowerCase().includes(query)
      );
    });
  }, [deptSearch, facultyFilter, deptToFacultyMap]);

  // Available programs for the selected department (or all if none selected)
  const availablePrograms = useMemo(() => {
    if (selectedDepartment && ACADEMIC_CATALOG[selectedDepartment]) {
      return ACADEMIC_CATALOG[selectedDepartment];
    }
    // If no department is selected, list all unique programs
    const all = [];
    Object.values(ACADEMIC_CATALOG).forEach(list => all.push(...list));
    return Array.from(new Set(all));
  }, [selectedDepartment]);

  // Filtered programs based on search query
  const filteredPrograms = useMemo(() => {
    const query = progSearch.trim().toLowerCase();
    if (!query) return availablePrograms;
    return availablePrograms.filter(prog => prog.toLowerCase().includes(query));
  }, [progSearch, availablePrograms]);

  const handleSelectDepartment = (dept) => {
    onDepartmentChange?.(dept);
    setIsDeptOpen(false);
    setDeptSearch('');

    // If current program does not belong to the selected department, switch to the first program or clear
    const deptPrograms = ACADEMIC_CATALOG[dept] || [];
    if (deptPrograms.length > 0 && !deptPrograms.includes(selectedProgram)) {
      onProgramChange?.(deptPrograms[0]);
    } else if (deptPrograms.length === 0) {
      onProgramChange?.('');
    }
  };

  const handleSelectProgram = (prog) => {
    onProgramChange?.(prog);
    setIsProgOpen(false);
    setProgSearch('');

    // If no department was selected, or selected department doesn't match this program, auto-set department
    const parentDept = progToDeptMap[prog];
    if (parentDept && parentDept !== selectedDepartment) {
      onDepartmentChange?.(parentDept);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', ...containerStyle }}>
      
      {/* 1. DEPARTMENT SELECTOR */}
      <div ref={deptRef} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <Building2 size={13} style={{ color: '#818cf8' }} />
            <span>Academic Department</span>
            {required && <span style={{ color: '#f87171' }}>*</span>}
          </label>

          {selectedDepartment && deptToFacultyMap[selectedDepartment] && (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#a5b4fc',
              background: 'rgba(99,102,241,0.15)',
              padding: '2px 8px',
              borderRadius: '6px',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {deptToFacultyMap[selectedDepartment].replace('Faculty of ', '')}
            </span>
          )}
        </div>

        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsDeptOpen(prev => !prev);
            setIsProgOpen(false);
          }}
          style={{
            width: '100%',
            padding: '11px 14px',
            boxSizing: 'border-box',
            background: 'rgba(15,23,42,0.85)',
            border: departmentError 
              ? '1.5px solid #ef4444' 
              : isDeptOpen 
                ? '1.5px solid #6366f1' 
                : '1.5px solid rgba(51,65,85,0.9)',
            borderRadius: '11px',
            color: selectedDepartment ? '#fff' : '#64748b',
            fontSize: '13px',
            fontWeight: 500,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: isDeptOpen ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
            <GraduationCap size={16} style={{ color: selectedDepartment ? '#818cf8' : '#64748b', shrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedDepartment || 'Select Department (Searchable)...'}
            </span>
          </div>
          <ChevronDown 
            size={16} 
            style={{ 
              color: '#94a3b8', 
              transition: 'transform 0.2s', 
              transform: isDeptOpen ? 'rotate(180deg)' : 'none',
              shrink: 0
            }} 
          />
        </button>

        {departmentError && (
          <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px' }}>{departmentError}</p>
        )}

        {/* Dropdown Menu */}
        {isDeptOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '14px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(99,102,241,0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            {/* Search Box & Faculty Filter */}
            <div style={{ padding: '10px', borderBottom: '1px solid rgba(51,65,85,0.7)', background: 'rgba(30,41,59,0.5)' }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                <input
                  ref={deptInputRef}
                  type="text"
                  value={deptSearch}
                  onChange={e => setDeptSearch(e.target.value)}
                  placeholder="Search 60+ departments or faculties..."
                  style={{
                    width: '100%',
                    padding: '8px 28px 8px 30px',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    fontWeight: 500
                  }}
                />
                {deptSearch && (
                  <button
                    type="button"
                    onClick={() => setDeptSearch('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Faculty Filter Pill Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={12} style={{ color: '#818cf8', shrink: 0 }} />
                <select
                  value={facultyFilter}
                  onChange={e => setFacultyFilter(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(51,65,85,0.8)',
                    borderRadius: '7px',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    padding: '5px 8px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All 14 Faculties</option>
                  {FACULTIES.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department Items List */}
            <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '6px' }}>
              {filteredDepartments.length === 0 ? (
                <div style={{ padding: '20px 14px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  No departments match "{deptSearch}"
                </div>
              ) : (
                filteredDepartments.map(dept => {
                  const isSelected = selectedDepartment === dept;
                  const faculty = deptToFacultyMap[dept] || '';
                  const progCount = (ACADEMIC_CATALOG[dept] || []).length;

                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleSelectDepartment(dept)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        boxSizing: 'border-box',
                        background: isSelected ? 'rgba(99,102,241,0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: '9px',
                        color: isSelected ? '#a5b4fc' : '#e2e8f0',
                        fontSize: '12.5px',
                        fontWeight: isSelected ? 700 : 500,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        marginBottom: '2px'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(51,65,85,0.4)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dept}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            {faculty.replace('Faculty of ', '')}
                          </span>
                          <span style={{ fontSize: '10px', color: '#475569' }}>•</span>
                          <span style={{ fontSize: '10px', color: '#818cf8' }}>
                            {progCount} degree program{progCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={16} style={{ color: '#818cf8', shrink: 0 }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. DEGREE PROGRAM SELECTOR */}
      <div ref={progRef} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <BookOpen size={13} style={{ color: '#818cf8' }} />
            <span>Degree Program</span>
            {required && <span style={{ color: '#f87171' }}>*</span>}
          </label>

          {selectedDepartment && (
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
              {availablePrograms.length} programs available
            </span>
          )}
        </div>

        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsProgOpen(prev => !prev);
            setIsDeptOpen(false);
          }}
          style={{
            width: '100%',
            padding: '11px 14px',
            boxSizing: 'border-box',
            background: 'rgba(15,23,42,0.85)',
            border: programError 
              ? '1.5px solid #ef4444' 
              : isProgOpen 
                ? '1.5px solid #6366f1' 
                : '1.5px solid rgba(51,65,85,0.9)',
            borderRadius: '11px',
            color: selectedProgram ? '#fff' : '#64748b',
            fontSize: '13px',
            fontWeight: 500,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: isProgOpen ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
            <BookOpen size={16} style={{ color: selectedProgram ? '#818cf8' : '#64748b', shrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedProgram || (selectedDepartment ? 'Select Degree Program (Searchable)...' : 'Select Program (or Department first)...')}
            </span>
          </div>
          <ChevronDown 
            size={16} 
            style={{ 
              color: '#94a3b8', 
              transition: 'transform 0.2s', 
              transform: isProgOpen ? 'rotate(180deg)' : 'none',
              shrink: 0
            }} 
          />
        </button>

        {programError && (
          <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px' }}>{programError}</p>
        )}

        {/* Dropdown Menu */}
        {isProgOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '14px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(99,102,241,0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            {/* Search Box */}
            <div style={{ padding: '10px', borderBottom: '1px solid rgba(51,65,85,0.7)', background: 'rgba(30,41,59,0.5)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                <input
                  ref={progInputRef}
                  type="text"
                  value={progSearch}
                  onChange={e => setProgSearch(e.target.value)}
                  placeholder={selectedDepartment ? `Search programs in ${selectedDepartment}...` : "Search all degree programs..."}
                  style={{
                    width: '100%',
                    padding: '8px 28px 8px 30px',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    fontWeight: 500
                  }}
                />
                {progSearch && (
                  <button
                    type="button"
                    onClick={() => setProgSearch('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Program Items List */}
            <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '6px' }}>
              {filteredPrograms.length === 0 ? (
                <div style={{ padding: '20px 14px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  No degree programs match "{progSearch}"
                </div>
              ) : (
                filteredPrograms.map(prog => {
                  const isSelected = selectedProgram === prog;
                  const dept = progToDeptMap[prog];

                  return (
                    <button
                      key={prog}
                      type="button"
                      onClick={() => handleSelectProgram(prog)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        boxSizing: 'border-box',
                        background: isSelected ? 'rgba(99,102,241,0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: '9px',
                        color: isSelected ? '#a5b4fc' : '#e2e8f0',
                        fontSize: '12.5px',
                        fontWeight: isSelected ? 700 : 500,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        marginBottom: '2px'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(51,65,85,0.4)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prog}
                        </span>
                        {!selectedDepartment && dept && (
                          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                            {dept}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <Check size={16} style={{ color: '#818cf8', shrink: 0 }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
