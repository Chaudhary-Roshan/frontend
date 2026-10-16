import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  GraduationCap, Search, ChevronDown, Check, X, 
  BookOpen, Building2, Layers, Landmark
} from 'lucide-react';
import { 
  FACULTY_CATALOG, 
  FACULTIES, 
  ACADEMIC_CATALOG, 
  DEPARTMENTS,
  findDepartmentAndFacultyForProgram,
  findFacultyForDepartment
} from '../../utils/academicCatalog';

/**
 * AcademicCombobox:
 * Searchable, 3-tier hierarchical linked dropdowns:
 * 1. Faculty Division
 * 2. Academic Department
 * 3. Degree Program
 *
 * Tailored for dark glassmorphism registration & complete profile modals.
 */
export default function AcademicCombobox({
  selectedFaculty = '',
  onFacultyChange,
  selectedDepartment = '',
  onDepartmentChange,
  selectedProgram = '',
  onProgramChange,
  facultyError = null,
  departmentError = null,
  programError = null,
  required = true,
  disabled = false,
  containerStyle = {}
}) {
  const [isFacOpen, setIsFacOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isProgOpen, setIsProgOpen] = useState(false);

  const [facSearch, setFacSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [progSearch, setProgSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState(selectedFaculty || 'all');

  useEffect(() => {
    if (selectedFaculty) {
      setFacultyFilter(selectedFaculty);
    }
  }, [selectedFaculty]);

  const facRef = useRef(null);
  const deptRef = useRef(null);
  const progRef = useRef(null);

  const facInputRef = useRef(null);
  const deptInputRef = useRef(null);
  const progInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (facRef.current && !facRef.current.contains(e.target)) {
        setIsFacOpen(false);
      }
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
    if (isFacOpen && facInputRef.current) {
      setTimeout(() => facInputRef.current?.focus(), 50);
    }
  }, [isFacOpen]);

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

  // Filtered faculties
  const filteredFaculties = useMemo(() => {
    const query = facSearch.trim().toLowerCase();
    if (!query) return FACULTIES;
    return FACULTIES.filter(f => f.toLowerCase().includes(query));
  }, [facSearch]);

  // Filtered departments based on search query and faculty filter
  const filteredDepartments = useMemo(() => {
    const query = deptSearch.trim().toLowerCase();
    const activeFaculty = selectedFaculty || (facultyFilter !== 'all' ? facultyFilter : null);

    return DEPARTMENTS.filter(dept => {
      const faculty = deptToFacultyMap[dept] || '';
      if (activeFaculty && faculty !== activeFaculty) {
        return false;
      }
      if (!query) return true;
      return (
        dept.toLowerCase().includes(query) ||
        faculty.toLowerCase().includes(query)
      );
    });
  }, [deptSearch, selectedFaculty, facultyFilter, deptToFacultyMap]);

  // Available programs for the selected department, or faculty, or all
  const availablePrograms = useMemo(() => {
    if (selectedDepartment && ACADEMIC_CATALOG[selectedDepartment]) {
      return ACADEMIC_CATALOG[selectedDepartment];
    }
    const activeFaculty = selectedFaculty || (facultyFilter !== 'all' ? facultyFilter : null);
    if (activeFaculty && FACULTY_CATALOG[activeFaculty]) {
      const progs = [];
      Object.values(FACULTY_CATALOG[activeFaculty]).forEach(list => progs.push(...list));
      return Array.from(new Set(progs));
    }
    // If neither is selected, list all unique programs
    const all = [];
    Object.values(ACADEMIC_CATALOG).forEach(list => all.push(...list));
    return Array.from(new Set(all));
  }, [selectedDepartment, selectedFaculty, facultyFilter]);

  // Filtered programs based on search query
  const filteredPrograms = useMemo(() => {
    const query = progSearch.trim().toLowerCase();
    if (!query) return availablePrograms;
    return availablePrograms.filter(prog => prog.toLowerCase().includes(query));
  }, [progSearch, availablePrograms]);

  // 1. SELECT FACULTY (Tier 1) - narrows departments & programs without auto-selecting
  const handleSelectFaculty = (faculty) => {
    setIsFacOpen(false);
    setFacSearch('');
    setFacultyFilter(faculty || 'all');
    onFacultyChange?.(faculty);

    // If current selected department does not belong to this faculty, reset dept and program
    if (faculty && selectedDepartment) {
      const deptsInFac = Object.keys(FACULTY_CATALOG[faculty] || {});
      if (!deptsInFac.includes(selectedDepartment)) {
        onDepartmentChange?.('');
        onProgramChange?.('');
      }
    }
  };

  // 2. SELECT DEPARTMENT (Tier 2) - auto-sets faculty and narrows programs
  const handleSelectDepartment = (dept) => {
    onDepartmentChange?.(dept);
    setIsDeptOpen(false);
    setDeptSearch('');

    const parentFaculty = findFacultyForDepartment(dept) || deptToFacultyMap[dept];
    if (parentFaculty) {
      setFacultyFilter(parentFaculty);
      onFacultyChange?.(parentFaculty);
    }

    // If current program does not belong to the selected department, clear it
    const deptPrograms = ACADEMIC_CATALOG[dept] || [];
    if (deptPrograms.length > 0 && !deptPrograms.includes(selectedProgram)) {
      onProgramChange?.('');
    } else if (deptPrograms.length === 0) {
      onProgramChange?.('');
    }
  };

  // 3. SELECT PROGRAM (Tier 3) - AUTOMATICALLY selects both Department and Faculty!
  const handleSelectProgram = (prog) => {
    onProgramChange?.(prog);
    setIsProgOpen(false);
    setProgSearch('');

    // If program is selected, auto-resolve both Department and Faculty!
    const resolved = findDepartmentAndFacultyForProgram(prog);
    if (resolved) {
      if (resolved.department && resolved.department !== selectedDepartment) {
        onDepartmentChange?.(resolved.department);
      }
      if (resolved.faculty) {
        setFacultyFilter(resolved.faculty);
        onFacultyChange?.(resolved.faculty);
      }
    } else {
      const parentDept = progToDeptMap[prog];
      if (parentDept && parentDept !== selectedDepartment) {
        onDepartmentChange?.(parentDept);
        const parentFac = deptToFacultyMap[parentDept];
        if (parentFac) {
          setFacultyFilter(parentFac);
          onFacultyChange?.(parentFac);
        }
      }
    }
  };

  const displayFaculty = selectedFaculty || (facultyFilter !== 'all' ? facultyFilter : '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', ...containerStyle }}>
      
      {/* 1. FACULTY SELECTOR */}
      <div ref={facRef} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Building2 size={13} style={{ color: '#818cf8' }} />
            <span>Faculty Division</span>
            {required && <span style={{ color: '#f87171' }}>*</span>}
          </label>
        </div>

        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsFacOpen(prev => !prev);
            setIsDeptOpen(false);
            setIsProgOpen(false);
          }}
          style={{
            width: '100%',
            padding: '11px 14px',
            boxSizing: 'border-box',
            background: 'rgba(15,23,42,0.85)',
            border: facultyError 
              ? '1.5px solid #ef4444' 
              : isFacOpen 
                ? '1.5px solid #6366f1' 
                : '1.5px solid rgba(51,65,85,0.9)',
            borderRadius: '11px',
            color: displayFaculty ? '#fff' : '#64748b',
            fontSize: '13px',
            fontWeight: 500,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: isFacOpen ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
            <Building2 size={16} style={{ color: displayFaculty ? '#818cf8' : '#64748b', shrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayFaculty || 'Select Faculty...'}
            </span>
          </div>
          <ChevronDown 
            size={16} 
            style={{ 
              color: '#94a3b8', 
              transition: 'transform 0.2s', 
              transform: isFacOpen ? 'rotate(180deg)' : 'none',
              shrink: 0
            }} 
          />
        </button>

        {facultyError && (
          <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px' }}>{facultyError}</p>
        )}

        {/* Dropdown Menu */}
        {isFacOpen && (
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
            zIndex: 110,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            {/* Search Box */}
            <div style={{ padding: '10px', borderBottom: '1px solid rgba(51,65,85,0.7)', background: 'rgba(30,41,59,0.5)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                <input
                  ref={facInputRef}
                  type="text"
                  value={facSearch}
                  onChange={e => setFacSearch(e.target.value)}
                  placeholder="Search 14 university faculties..."
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
                {facSearch && (
                  <button
                    type="button"
                    onClick={() => setFacSearch('')}
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

            {/* Faculty Items List */}
            <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '6px' }}>
              {displayFaculty && (
                <button
                  type="button"
                  onClick={() => handleSelectFaculty('')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    boxSizing: 'border-box',
                    background: 'transparent',
                    border: '1px dashed rgba(148,163,184,0.3)',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: '4px'
                  }}
                >
                  ✕ Clear Faculty Filter (Show All Faculties)
                </button>
              )}

              {filteredFaculties.length === 0 ? (
                <div style={{ padding: '20px 14px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  No faculties match "{facSearch}"
                </div>
              ) : (
                filteredFaculties.map(fac => {
                  const isSelected = displayFaculty === fac;
                  const deptCount = Object.keys(FACULTY_CATALOG[fac] || {}).length;

                  return (
                    <button
                      key={fac}
                      type="button"
                      onClick={() => handleSelectFaculty(fac)}
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
                          {fac}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          {deptCount} department{deptCount !== 1 ? 's' : ''}
                        </span>
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
      
      {/* 2. DEPARTMENT SELECTOR */}
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
            gap: '6px'
          }}>
            <GraduationCap size={13} style={{ color: '#818cf8' }} />
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
            setIsFacOpen(false);
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
              {selectedDepartment || 'Select Department...'}
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
            {/* Search Box */}
            <div style={{ padding: '10px', borderBottom: '1px solid rgba(51,65,85,0.7)', background: 'rgba(30,41,59,0.5)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                <input
                  ref={deptInputRef}
                  type="text"
                  value={deptSearch}
                  onChange={e => setDeptSearch(e.target.value)}
                  placeholder={displayFaculty ? `Search departments in ${displayFaculty}...` : "Search 60+ departments..."}
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

      {/* 3. DEGREE PROGRAM SELECTOR */}
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
            gap: '6px'
          }}>
            <BookOpen size={13} style={{ color: '#818cf8' }} />
            <span>Degree Program</span>
            {required && <span style={{ color: '#f87171' }}>*</span>}
          </label>
        </div>

        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsProgOpen(prev => !prev);
            setIsFacOpen(false);
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
              {selectedProgram || (selectedDepartment ? `Select Program in ${selectedDepartment}...` : 'Select Degree Program...')}
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
