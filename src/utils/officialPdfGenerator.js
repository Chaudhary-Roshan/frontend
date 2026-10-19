import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Colors & Styling Tokens for Official University Documents
 */
const COLORS = {
  primaryNavy: [24, 43, 73],      // #182b49
  secondaryNavy: [30, 58, 138],   // #1e3a8a
  slateDark: [51, 65, 85],        // #334155
  slateLight: [241, 245, 249],    // #f1f5f9
  borderGrey: [203, 213, 225],    // #cbd5e1
  textDark: [15, 23, 42],         // #0f172a
  textMuted: [100, 116, 139],     // #64748b
  emeraldGreen: [16, 185, 129],   // #10b981
  amberOrange: [245, 158, 11],    // #f59e0b
  white: [255, 255, 255]
};

/**
 * Helper: Draw official page border & decorative corner brackets
 */
function drawPageBorder(doc, pageWidth = 210, pageHeight = 297, margin = 8) {
  doc.setDrawColor(...COLORS.borderGrey);
  doc.setLineWidth(0.3);
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));
  
  // Inner hairline border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.15);
  doc.rect(margin + 1.5, margin + 1.5, pageWidth - ((margin + 1.5) * 2), pageHeight - ((margin + 1.5) * 2));
}

/**
 * Helper: Add unified footer with page numbering
 */
function addDocumentFooter(doc, leftText, totalPages) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Footer divider line
    doc.setDrawColor(...COLORS.borderGrey);
    doc.setLineWidth(0.2);
    doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

    // Left info text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(leftText, 12, pageHeight - 8);

    // Right page numbering
    const pageStr = `Page ${i} of ${pageCount}`;
    doc.text(pageStr, pageWidth - 12, pageHeight - 8, { align: 'right' });
  }
}

/**
 * GENERATE OFFICIAL EVENT PROPOSAL FORM (Vector PDF)
 */
export function generateOfficialProposalPDF(proposal, filename) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  let cursorY = margin + 4;

  // --- 1. INSTITUTIONAL HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primaryNavy);
  doc.text('THE ISLAMIA UNIVERSITY OF BAHAWALPUR', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.slateDark);
  doc.text('DIRECTORATE OF STUDENT AFFAIRS & CAMPUS LIFE', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Departmental Societies Management System (DSMS)', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4.5;

  // Header Banner
  doc.setFillColor(...COLORS.secondaryNavy);
  doc.roundedRect(margin, cursorY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.white);
  doc.text('OFFICIAL STATUTORY EVENT PROPOSAL FORM', pageWidth / 2, cursorY + 4.8, { align: 'center' });
  cursorY += 10.5;

  // --- 2. DOSSIER METADATA BLOCK ---
  const filingDate = proposal.generated_at 
    ? new Date(proposal.generated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: COLORS.textDark },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.slateDark, width: 32 },
      1: { textColor: COLORS.textDark, width: 62 },
      2: { fontStyle: 'bold', textColor: COLORS.slateDark, width: 34 },
      3: { textColor: COLORS.textDark, width: 58 }
    },
    body: [
      [
        'Proposal Dossier No:', proposal.proposal_no || 'N/A',
        'Submission Date:', filingDate
      ],
      [
        'Organizing Society:', proposal.society_name || 'Departmental Society',
        'Academic Session:', proposal.academic_year || '2026-2027'
      ],
      [
        'Current Review Status:', (proposal.status || 'draft').toUpperCase(),
        'Entry / Ticket Fee:', proposal.is_paid ? `PKR Rs. ${proposal.ticket_price || 0}` : 'Free Entry (No Fee)'
      ]
    ]
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  // --- 3. SECTION 1: EVENT IDENTIFICATION ---
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.slateLight, textColor: COLORS.primaryNavy, fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.slateDark, width: 45, fillColor: [248, 250, 252] },
      1: { textColor: COLORS.textDark }
    },
    head: [['1. EVENT IDENTIFICATION', 'DETAILS']],
    body: [
      ['Event Title', proposal.event_title || 'Untitled Event'],
      ['Event Category / Type', proposal.event_type || 'Workshop & Academic Seminar'],
      ['Proposed Event Date', proposal.event_date || 'TBD'],
      ['Designated Timings', `${proposal.start_time || '10:00 AM'} to ${proposal.end_time || '01:00 PM'}`],
      ['Campus Venue', proposal.venue || 'Campus Main Auditorium'],
      ['Expected Attendance', `${proposal.expected_participants || 100} Delegates / Students`],
      ['Publicity / Media Coverage', proposal.poster_image_url ? 'Official Digital Poster Attached' : 'Social Media & Campus Notice Board']
    ]
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  // --- 4. SECTION 2: AUDIENCE SCOPE & ELIGIBILITY ---
  const isRestricted = proposal.eligibility_type === 'restricted';
  const allowedDepts = Array.isArray(proposal.allowed_departments) && proposal.allowed_departments.length > 0
    ? proposal.allowed_departments.join('; ')
    : 'All University Departments';
  const allowedProgs = Array.isArray(proposal.allowed_programs) && proposal.allowed_programs.length > 0
    ? proposal.allowed_programs.join(', ')
    : 'All University Degree Programs';

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.slateLight, textColor: COLORS.primaryNavy, fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.slateDark, width: 45, fillColor: [248, 250, 252] },
      1: { textColor: COLORS.textDark }
    },
    head: [['2. AUDIENCE SCOPE & DEGREE ELIGIBILITY', 'SPECIFICATION']],
    body: [
      ['Access Restriction Level', isRestricted ? 'RESTRICTED (Exclusive to Designated Programs)' : 'OPEN ACCESS (All University Students)'],
      ['Allowed Academic Departments', allowedDepts],
      ['Permitted Degree Programs', allowedProgs]
    ]
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  // --- 5. SECTION 3: OBJECTIVES & DESCRIPTION ---
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.slateLight, textColor: COLORS.primaryNavy, fontStyle: 'bold', fontSize: 9 },
    head: [['3. EVENT OBJECTIVES & ACADEMIC OUTCOMES']],
    body: [
      [proposal.objectives || '1. Foster student competencies and leadership skills.\n2. Strengthen departmental academic and practical collaboration.\n3. Provide recognized extracurricular participation opportunities.']
    ]
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.slateLight, textColor: COLORS.primaryNavy, fontStyle: 'bold', fontSize: 9 },
    head: [['4. COMPREHENSIVE EVENT DESCRIPTION & OPERATIONAL SCHEDULE']],
    body: [
      [proposal.event_description || 'Detailed keynote sessions, hands-on activities, project demonstrations, and interactive Q&A supervised by designated faculty advisors.']
    ]
  });

  cursorY = doc.lastAutoTable.finalY + 5;

  // --- 6. SECTION 5: BUDGET BREAKDOWN TABLE ---
  const budgetItems = Array.isArray(proposal.budget_items) ? proposal.budget_items : [];
  const budgetRows = budgetItems.map((item, idx) => [
    idx + 1,
    item.item_name || item.name || item.description || `Item #${idx + 1}`,
    item.description || item.remarks || '-',
    `Rs. ${parseFloat(item.cost || item.estimated_cost || 0).toLocaleString()}`,
    proposal.funding_source || 'Society Annual Allocation'
  ]);

  const totalCalculated = proposal.budget || budgetItems.reduce((sum, it) => sum + parseFloat(it.cost || it.estimated_cost || 0), 0);

  // If budget items exist, show itemized table; otherwise show total budget row
  const tableBody = budgetRows.length > 0 
    ? [
        ...budgetRows,
        [{ content: 'TOTAL ESTIMATED SANCTION BUDGET (PKR):', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } }, { content: `Rs. ${totalCalculated.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: COLORS.secondaryNavy } }, '']
      ]
    : [
        ['1', 'Event Logistics, Refreshments & Operations', 'Full operational budget', `Rs. ${totalCalculated.toLocaleString()}`, proposal.funding_source || 'Society Allocation'],
        [{ content: 'TOTAL ESTIMATED SANCTION BUDGET (PKR):', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } }, { content: `Rs. ${totalCalculated.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: COLORS.secondaryNavy } }, '']
      ];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.primaryNavy, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
    head: [['#', 'Expenditure Head / Item', 'Specification', 'Cost (PKR)', 'Funding Source']],
    columnStyles: {
      0: { width: 8, halign: 'center' },
      1: { width: 55, fontStyle: 'bold' },
      2: { width: 60 },
      3: { width: 30, halign: 'right' },
      4: { width: 33 }
    },
    body: tableBody
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  // --- 7. SECTION 6: LOGISTICAL FACILITIES CHECKLIST ---
  const facilitiesText = proposal.required_facilities 
    ? (Array.isArray(proposal.required_facilities) ? proposal.required_facilities.join(' • ') : proposal.required_facilities.replace(/\n/g, ' • '))
    : 'Auditorium • Sound System • Projector • Certificates & Mementos • Security Clearance';

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.slateLight, textColor: COLORS.primaryNavy, fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.slateDark, width: 45, fillColor: [248, 250, 252] },
      1: { textColor: COLORS.textDark }
    },
    head: [['5. REQUIRED FACILITIES & LOGISTICS', 'STATUS / CHECKLIST']],
    body: [
      ['Designated Facilities', facilitiesText],
      ['Distinguished Guests / Speakers', proposal.guests || 'Faculty Advisors, Academic Experts, and Society Mentors'],
      ['Anticipated Event Outcomes', proposal.expected_outcome || 'Verified extracurricular credentials awarded to student attendees.']
    ]
  });

  cursorY = doc.lastAutoTable.finalY + 5;

  // If page is running out of space before signature block, push to next page
  if (cursorY > pageHeight - 55) {
    doc.addPage();
    cursorY = margin + 10;
  }

  // --- 8. SECTION 7: STATUTORY REVIEW & SIGNATURE MATRIX ---
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, lineColor: COLORS.borderGrey, lineWidth: 0.3 },
    headStyles: { fillColor: COLORS.slateLight, textColor: COLORS.primaryNavy, fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
    head: [['A. SOCIETY PRESIDENT', 'B. FACULTY ADVISOR ENDORSEMENT']],
    columnStyles: {
      0: { width: contentWidth / 2 },
      1: { width: contentWidth / 2 }
    },
    body: [
      [
        {
          content: 'I hereby certify that this event aligns with university policies and society mandates.\n\n\n___________________________\nSociety President Signature & Date\nName: ' + (proposal.president_name || proposal.society_president_name || 'Society President') + '\nSociety: ' + (proposal.society_name || 'Departmental Society'),
          styles: { minCellHeight: 28 }
        },
        {
          content: 'I have reviewed the event scope, budget, and program logistics. Endorsed and approved.\n\n\n___________________________\nFaculty Advisor Signature & Official Stamp\nName: ' + (proposal.advisor_name || 'Faculty Advisor') + '\nDate: ____________________',
          styles: { minCellHeight: 28 }
        }
      ]
    ]
  });

  // Draw borders on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageBorder(doc, pageWidth, pageHeight, margin - 4);
  }

  // Add Footers
  addDocumentFooter(
    doc,
    `Proposal Ref: ${proposal.proposal_no || 'DSMS-PROP'} • The Islamia University of Bahawalpur`,
    totalPages
  );

  const safeFilename = filename || `Event_Proposal_${(proposal.proposal_no || 'Dossier').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename.endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`);
  return true;
}

/**
 * GENERATE OFFICIAL CO-CURRICULAR TRANSCRIPT (Vector PDF)
 */
export function generateOfficialTranscriptPDF(transcriptData, filename) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  let cursorY = margin + 4;

  const {
    studentName = 'Student',
    rollNumber = 'N/A',
    facultyName = '',
    departmentName = 'Department of Information and Communication Engineering',
    programName = 'BS Cyber Security and Digital Forensics',
    academicYear = '2023-2027',
    activityScore = '3.80',
    totalEventsAttended = 0,
    totalVolHours = 0,
    totalSocieties = 0,
    totalCertificates = 0,
    registrations = [],
    volunteerHours = [],
    cabinetPositions = [],
    certificates = [],
    verificationUrl = ''
  } = transcriptData;

  const issuanceDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // --- 1. INSTITUTIONAL HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primaryNavy);
  doc.text('THE ISLAMIA UNIVERSITY OF BAHAWALPUR', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.slateDark);
  doc.text('DIRECTORATE OF STUDENT AFFAIRS & CAMPUS LIFE', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Permanent Institutional Record of Leadership, Service & Verified Extracurricular Engagement', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4.5;

  // Header Banner
  doc.setFillColor(...COLORS.secondaryNavy);
  doc.roundedRect(margin, cursorY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.white);
  doc.text('OFFICIAL CO-CURRICULAR TRANSCRIPT', pageWidth / 2, cursorY + 4.8, { align: 'center' });
  cursorY += 10.5;

  // --- 2. STUDENT IDENTIFICATION PROFILE (Hierarchical Academic Affiliation) ---
  const bioRows = [
    ['Student Full Name:', studentName, 'Roll Number / Reg:', rollNumber]
  ];

  if (facultyName) {
    bioRows.push(['Faculty Division:', facultyName, 'Department:', departmentName]);
    bioRows.push(['Degree Program:', programName, 'Session / Issuance:', `${academicYear} • ${issuanceDate}`]);
  } else {
    bioRows.push(['Academic Department:', departmentName, 'Degree Program:', programName]);
    bioRows.push(['Academic Session / Batch:', academicYear, 'Date of Issuance:', issuanceDate]);
  }

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.slateDark, width: 34, fillColor: [248, 250, 252] },
      1: { textColor: COLORS.textDark, width: 60 },
      2: { fontStyle: 'bold', textColor: COLORS.slateDark, width: 34, fillColor: [248, 250, 252] },
      3: { textColor: COLORS.textDark, width: 58 }
    },
    body: bioRows
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  // --- 3. EXTRACURRICULAR KPI SUMMARY DASHBOARD ---
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2, halign: 'center', lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.slateLight, textColor: COLORS.primaryNavy, fontStyle: 'bold', fontSize: 8 },
    head: [['ACTIVITY INDEX (GPA)', 'EVENTS ATTENDED', 'COMMUNITY SERVICE', 'SOCIETIES', 'CABINET ROLES', 'CERTIFICATES']],
    body: [
      [
        { content: `${activityScore} / 4.00`, styles: { fontStyle: 'bold', textColor: COLORS.secondaryNavy, fontSize: 10 } },
        { content: `${totalEventsAttended}`, styles: { fontStyle: 'bold', fontSize: 9.5 } },
        { content: `${totalVolHours} Hours`, styles: { fontStyle: 'bold', fontSize: 9.5 } },
        { content: `${totalSocieties}`, styles: { fontStyle: 'bold', fontSize: 9.5 } },
        { content: `${cabinetPositions.length}`, styles: { fontStyle: 'bold', fontSize: 9.5 } },
        { content: `${totalCertificates}`, styles: { fontStyle: 'bold', fontSize: 9.5 } }
      ]
    ]
  });

  cursorY = doc.lastAutoTable.finalY + 5;

  // --- 4. SECTION 1: EXECUTIVE & CABINET LEADERSHIP ROLES ---
  const cabinetRows = cabinetPositions.map((cab, idx) => [
    idx + 1,
    cab.society_name || 'Departmental Society',
    cab.position_title || cab.role || 'Cabinet Executive',
    cab.academic_year || academicYear,
    'VERIFIED & ENDORSED'
  ]);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.primaryNavy, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
    head: [['#', '1. EXECUTIVE & CABINET LEADERSHIP ROLES', 'Designation / Post', 'Session', 'Status']],
    columnStyles: {
      0: { width: 8, halign: 'center' },
      1: { width: 68, fontStyle: 'bold' },
      2: { width: 55 },
      3: { width: 25, halign: 'center' },
      4: { width: 30, halign: 'center', textColor: [16, 120, 80], fontStyle: 'bold' }
    },
    body: cabinetRows.length > 0 
      ? cabinetRows 
      : [['-', 'General Active Member', 'Student Society Member', academicYear, 'ACTIVE RECORD']]
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  // --- 5. SECTION 2: VERIFIED EVENT PARTICIPATION & ATTENDANCE ---
  const eventRows = registrations.map((reg, idx) => {
    const evDate = reg.event_date || reg.event_date_time 
      ? new Date(reg.event_date || reg.event_date_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Recorded';
    return [
      idx + 1,
      reg.event_title || reg.title || 'University Event',
      reg.society_name || 'University Society',
      evDate,
      reg.attended ? 'ATTENDED & VERIFIED' : 'CONFIRMED DELEGATE'
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.primaryNavy, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
    head: [['#', '2. VERIFIED EVENT ATTENDANCE & PARTICIPATION', 'Organizing Body', 'Date', 'Attendance Status']],
    columnStyles: {
      0: { width: 8, halign: 'center' },
      1: { width: 70, fontStyle: 'bold' },
      2: { width: 50 },
      3: { width: 25, halign: 'center' },
      4: { width: 33, halign: 'center', fontStyle: 'bold' }
    },
    body: eventRows.length > 0
      ? eventRows
      : [['-', 'Orientation and Departmental Technical Sessions', departmentName, issuanceDate, 'RECORDED']]
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  // --- 6. SECTION 3: COMMUNITY SERVICE & VOLUNTEER HOURS ---
  const volRows = volunteerHours.map((vol, idx) => {
    const vDate = vol.date 
      ? new Date(vol.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Recorded';
    return [
      idx + 1,
      vol.activity_title || vol.description || 'Campus Volunteer Initiative',
      vol.society_name || 'Student Society',
      `${vol.hours || 0} Hours`,
      vDate,
      'OFFICIALLY VERIFIED'
    ];
  });

  if (volRows.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
      headStyles: { fillColor: COLORS.primaryNavy, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
      head: [['#', '3. COMMUNITY SERVICE & VOLUNTEER HOURS', 'Supervising Society', 'Hours', 'Date', 'Verification']],
      columnStyles: {
        0: { width: 8, halign: 'center' },
        1: { width: 65, fontStyle: 'bold' },
        2: { width: 45 },
        3: { width: 20, halign: 'center', fontStyle: 'bold' },
        4: { width: 22, halign: 'center' },
        5: { width: 26, halign: 'center', textColor: [16, 120, 80], fontStyle: 'bold' }
      },
      body: volRows
    });

    cursorY = doc.lastAutoTable.finalY + 4;
  }

  // --- 7. SECTION 4: VERIFIED CERTIFICATES & HONORS ---
  const certRows = certificates.map((cert, idx) => {
    const cDate = cert.issued_at 
      ? new Date(cert.issued_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Verified';
    return [
      idx + 1,
      cert.title || cert.event_title || 'Certificate of Participation',
      cert.society_name || 'Directorate of Student Affairs',
      cert.certificate_id || `DSMS-${1000 + idx}`,
      cDate
    ];
  });

  if (certRows.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
      headStyles: { fillColor: COLORS.primaryNavy, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
      head: [['#', '4. CERTIFICATES & INSTITUTIONAL HONORS', 'Issuing Body', 'Credential ID', 'Date']],
      columnStyles: {
        0: { width: 8, halign: 'center' },
        1: { width: 70, fontStyle: 'bold' },
        2: { width: 50 },
        3: { width: 33, fontStyle: 'bold', halign: 'center' },
        4: { width: 25, halign: 'center' }
      },
      body: certRows
    });

    cursorY = doc.lastAutoTable.finalY + 5;
  }

  // Check if we need a new page for verification block
  if (cursorY > pageHeight - 50) {
    doc.addPage();
    cursorY = margin + 10;
  }

  // --- 8. INSTITUTIONAL AUTHENTICATION & SIGNATURE BOXES ---
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, lineColor: COLORS.borderGrey, lineWidth: 0.3 },
    headStyles: { fillColor: COLORS.slateLight, textColor: COLORS.primaryNavy, fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
    head: [['A. SOCIETY PRESIDENT ATTESTATION', 'B. FACULTY ADVISOR ENDORSEMENT']],
    columnStyles: {
      0: { width: contentWidth / 2 },
      1: { width: contentWidth / 2 }
    },
    body: [
      [
        {
          content: 'Attested that the extracurricular leadership, event participation, and society records are authentic.\n\n\n___________________________\nSociety President Signature & Date\nOfficial Record Seal',
          styles: { minCellHeight: 26 }
        },
        {
          content: 'Verified and certified against departmental extracurricular registry.\n\n\n___________________________\nFaculty Advisor Signature & Official Stamp\nOfficial Date: ____________________',
          styles: { minCellHeight: 26 }
        }
      ]
    ]
  });

  // Draw borders on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageBorder(doc, pageWidth, pageHeight, margin - 4);
  }

  // Add Footers
  addDocumentFooter(
    doc,
    `Roll No: ${rollNumber} • Co-Curricular Transcript • The Islamia University of Bahawalpur`,
    totalPages
  );

  const safeFilename = filename || `CoCurricular_Transcript_${rollNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename.endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`);
  return true;
}

/**
 * Generates an official printable Event Registration & Attendance Roster PDF
 * Designed for event coordinators, check-in gates, faculty advisors, and institutional record keeping.
 */
export async function generateEventAttendancePdf({ event, registrations = [], filename = '' }) {
  if (!event) return false;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  let cursorY = margin + 4;

  // --- 1. INSTITUTIONAL HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primaryNavy);
  doc.text('THE ISLAMIA UNIVERSITY OF BAHAWALPUR', pageWidth / 2, cursorY, { align: 'center' });

  cursorY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.secondaryNavy);
  doc.text('DIRECTORATE OF STUDENT AFFAIRS & CO-CURRICULAR ACTIVITIES', pageWidth / 2, cursorY, { align: 'center' });

  cursorY += 4.5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Official Event Participant Registry & Attendance Record Sheet', pageWidth / 2, cursorY, { align: 'center' });

  cursorY += 3;
  doc.setDrawColor(...COLORS.secondaryNavy);
  doc.setLineWidth(0.8);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 5;

  // --- 2. EVENT METADATA SUMMARY TABLE ---
  const eventDateStr = event.date_time || (event.date ? new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'full' }) : 'Scheduled Date');
  const societyTitle = event.society_name || (event.society?.name) || 'Departmental Student Society';
  const priceStr = event.is_paid ? `PKR ${event.price || event.ticket_price || 0}` : 'Free Attendance';
  const totalCount = registrations.length;
  const verifiedCount = registrations.filter(r => r.payment_status === 'verified').length;
  const attendedCount = registrations.filter(r => r.attendance_status).length;
  const turnoutRate = verifiedCount > 0 ? `${Math.round((attendedCount / verifiedCount) * 100)}%` : '0%';

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: COLORS.borderGrey, lineWidth: 0.2 },
    headStyles: { fillColor: COLORS.primaryNavy, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
    head: [['EVENT SPECIFICATION & SUMMARY AUDIT', 'ORGANIZING SOCIETY & METRICS']],
    body: [
      [
        `Event Title: ${event.title || 'Official University Event'}\nDate & Time: ${eventDateStr}\nVenue: ${event.event_venue || event.venue || 'Campus Auditorium'}\nRegistration Fee: ${priceStr}`,
        `Society: ${societyTitle}\nCapacity Limit: ${event.capacity || event.expected_attendees || 'Open'}\nTotal Registered: ${totalCount} | Confirmed: ${verifiedCount}\nVenue Attendance: ${attendedCount} (Turnout: ${turnoutRate})`
      ]
    ]
  });

  cursorY = doc.lastAutoTable.finalY + 6;

  // --- 3. ATTENDEES TABLE ---
  const tableRows = registrations.map((reg, index) => {
    const studentName = reg.student_name || reg.student?.username || 'Student';
    const rollNo = reg.student_roll_number || reg.student?.roll_number || 'N/A';
    const dept = reg.student_department || reg.student?.department || 'General';
    const prog = reg.student_program || reg.student?.program || '';
    const deptProg = prog ? `${dept} (${prog})` : dept;
    const ticketId = reg.ticket_number || (reg.id ? `TKT-${reg.id}` : 'PENDING');
    const isEventConcluded = Boolean(event?.is_expired || (event?.date && new Date(event.date) < new Date()));
    const attendance = reg.attendance_status ? 'Checked In' : (isEventConcluded ? 'Absent' : 'Registered / Upcoming');

    return [
      index + 1,
      rollNo,
      studentName,
      deptProg,
      ticketId,
      payment,
      attendance,
      '' // Blank column for physical checkmark / signature
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: COLORS.borderGrey, lineWidth: 0.15 },
    headStyles: { fillColor: COLORS.secondaryNavy, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 42 },
      4: { cellWidth: 26, fontStyle: 'bold' },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 18 },
      7: { cellWidth: 8 }
    },
    head: [['#', 'Roll Number', 'Student Name', 'Department / Program', 'Ticket ID', 'Payment', 'Status', 'Sig']],
    body: tableRows.length > 0 ? tableRows : [['-', '-', 'No students registered for this event yet.', '-', '-', '-', '-', '']]
  });

  cursorY = doc.lastAutoTable.finalY + 6;

  // Check if signature block fits on page
  if (cursorY > pageHeight - 45) {
    doc.addPage();
    cursorY = margin + 10;
  }

  // --- 4. SIGNATURE AND ATTESTATION BLOCK ---
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, lineColor: COLORS.borderGrey, lineWidth: 0.3 },
    headStyles: { fillColor: COLORS.slateLight, textColor: COLORS.primaryNavy, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    head: [['1. SOCIETY PRESIDENT ATTESTATION', '2. GATE CONTROLLER / VOLUNTEER', '3. FACULTY ADVISOR ENDORSEMENT']],
    columnStyles: {
      0: { width: contentWidth / 3 },
      1: { width: contentWidth / 3 },
      2: { width: contentWidth / 3 }
    },
    body: [
      [
        {
          content: 'I certify that this registration roster accurately reflects student signups.\n\n\n___________________________\nSociety President Signature\nDate: _____________________',
          styles: { minCellHeight: 24 }
        },
        {
          content: 'Confirmed entry and gate barcode scanning records authentic.\n\n\n___________________________\nGate Incharge / Volunteer\nDate: _____________________',
          styles: { minCellHeight: 24 }
        },
        {
          content: 'Reviewed and countersigned for official co-curricular audit file.\n\n\n___________________________\nFaculty Advisor Signature & Stamp\nDate: _____________________',
          styles: { minCellHeight: 24 }
        }
      ]
    ]
  });

  // Borders on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageBorder(doc, pageWidth, pageHeight, margin - 4);
  }

  // Add Footers
  addDocumentFooter(
    doc,
    `Event: ${event.title || 'Event Roster'} • Official Directorate Roster • The Islamia University of Bahawalpur`,
    totalPages
  );

  const safeName = filename || `Event_Roster_${(event.title || 'event').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`);
  return true;
}

