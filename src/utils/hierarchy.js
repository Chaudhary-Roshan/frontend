// Dynamic Role Hierarchy & Sorting Helper for Society Leadership & Teams

export const ROLE_TIER_CATEGORIES = [
  {
    category: "President",
    tierRange: "100–199",
    defaultRank: 100,
    roles: [
      { title: "President", rank: 100 },
      { title: "Co-President", rank: 110 }
    ]
  },
  {
    category: "Vice Presidents",
    tierRange: "200–299",
    defaultRank: 250,
    roles: [
      { title: "Vice President - Operations", rank: 200 },
      { title: "Vice President - Events", rank: 210 },
      { title: "Vice President - Finance", rank: 220 },
      { title: "Vice President - Media & PR", rank: 230 },
      { title: "Vice President - Technical", rank: 240 },
      { title: "Vice President", rank: 250 }
    ]
  },
  {
    category: "Secretariat & Treasury",
    tierRange: "300–399",
    defaultRank: 300,
    roles: [
      { title: "General Secretary", rank: 300 },
      { title: "Joint Secretary", rank: 310 },
      { title: "Treasurer & Finance Lead", rank: 320 }
    ]
  },
  {
    category: "Directors & Strategy Leads",
    tierRange: "400–499",
    defaultRank: 400,
    roles: [
      { title: "Event Director", rank: 400 },
      { title: "Strategic Operations Director", rank: 410 },
      { title: "Media & PR Director", rank: 420 },
      { title: "Creative Director", rank: 430 }
    ]
  },
  {
    category: "Department Heads",
    tierRange: "500–599",
    defaultRank: 500,
    roles: [
      { title: "Decore Head", rank: 500 },
      { title: "Marketing Head", rank: 510 },
      { title: "Security Head", rank: 520 },
      { title: "Logistics Head", rank: 530 },
      { title: "Technical & Cyber Head", rank: 540 },
      { title: "Content & Editorial Head", rank: 550 },
      { title: "Public Relations Head", rank: 560 }
    ]
  },
  {
    category: "Department Team Members",
    tierRange: "600–699",
    defaultRank: 600,
    roles: [
      { title: "Decore Team Member", rank: 600 },
      { title: "Marketing Team Member", rank: 610 },
      { title: "Security Team Member", rank: 620 },
      { title: "Logistics Team Member", rank: 630 },
      { title: "Technical Team Member", rank: 640 },
      { title: "Content Writer", rank: 650 },
      { title: "Graphic Designer", rank: 660 }
    ]
  },
  {
    category: "General / Custom Designation",
    tierRange: "900+",
    defaultRank: 900,
    roles: [
      { title: "Executive Council Member", rank: 900 },
      { title: "General Executive Member", rank: 910 },
      { title: "Volunteer Coordinator", rank: 920 }
    ]
  }
];

// Returns an integer hierarchy rank for any member/designation based on institutional seniority
export function getDynamicRoleRank(member) {
  const role = (member?.role_title || member?.designation || member?.role || "").toLowerCase().trim();

  if (role) {
    // 1. President / Chair (Rank 100–199)
    if (
      role === "president" || 
      role === "chair" || 
      role === "chairperson" || 
      (role.includes("president") && !role.includes("vice") && !role.startsWith("vp") && !role.includes(" vp")) ||
      (role.includes("chair") && !role.includes("vice"))
    ) {
      if (role.includes("co-president") || role.includes("co president") || role.includes("co-chair") || role.includes("co chair")) return 110;
      return 100;
    }

    // 2. Vice Presidents & Vice Chairs (Rank 200–299) - Always strictly above General Secretary
    if (
      role.includes("vice president") || 
      role.includes("vice chair") || 
      role.includes("vice-chair") || 
      role.includes("vicechair") ||
      role.startsWith("vp") || 
      role.includes(" vp") || 
      role.includes("vp-") || 
      role.includes("vp -")
    ) {
      if (role.includes("operation")) return 200;
      if (role.includes("event")) return 210;
      if (role.includes("finance")) return 220;
      if (role.includes("media") || role.includes("pr") || role.includes("comm") || role.includes("relation")) return 230;
      if (role.includes("tech") || role.includes("cyber")) return 240;
      return 250; // Generic Vice President / Vice Chair
    }

    // 3. General Secretary & Secretariat (Rank 300–399) - Strictly below Vice Chair, above Joint Secretary
    if (role.includes("general secretary") || role.includes("gen secretary") || role.includes("gen sec")) return 300;
    if (role.includes("joint secretary") || role.includes("jt secretary") || role.includes("jt sec")) return 310;
    if (role.includes("treasurer") || role.includes("finance lead") || role.includes("finance secretary")) return 320;
    if (role.includes("secretary")) return 330;

    // 4. Directors & Strategy Leads (Rank 400–499)
    if (role.includes("director") || role.includes("strateg")) return 400;

    // 5. Department Heads & Leads (Rank 500–599) - Strictly below Secretariat, above Team Members
    if (
      role.includes("head") || 
      role.includes("lead") || 
      role.includes("coordinator") || 
      role.includes("manager") ||
      role.includes("discipline") ||
      role.includes("security") ||
      role.includes("convener") ||
      role.includes("incharge")
    ) {
      if (role.includes("decore") || role.includes("decor") || role.includes("stage")) return 500;
      if (role.includes("marketing") || role.includes("outreach") || role.includes("social")) return 510;
      if (role.includes("security") || role.includes("discipline")) return 520;
      if (role.includes("logistic") || role.includes("transport")) return 530;
      if (role.includes("tech") || role.includes("cyber") || role.includes("it") || role.includes("dev") || role.includes("web")) return 540;
      if (role.includes("content") || role.includes("editor") || role.includes("creative")) return 550;
      if (role.includes("pr") || role.includes("public relation")) return 560;
      return 570;
    }

    // 6. Department Team Members & Creatives (Rank 600–699)
    if (
      role.includes("team") || 
      role.includes("member") || 
      role.includes("associate") || 
      role.includes("officer") || 
      role.includes("designer") ||
      role.includes("writer") ||
      role.includes("developer") ||
      role.includes("photographer") ||
      role.includes("volunteer")
    ) {
      if (role.includes("decore") || role.includes("decor")) return 600;
      if (role.includes("marketing")) return 610;
      if (role.includes("security") || role.includes("discipline")) return 620;
      if (role.includes("logistic")) return 630;
      if (role.includes("tech") || role.includes("cyber") || role.includes("it")) return 640;
      if (role.includes("content") || role.includes("design") || role.includes("photo")) return 650;
      return 660;
    }
  }

  // Fallback to explicit priority_rank if non-default
  if (member?.priority_rank !== undefined && member?.priority_rank !== null && member?.priority_rank !== '') {
    const num = Number(member.priority_rank);
    if (!isNaN(num) && num > 0 && num !== 500) return num;
  }

  // General Custom Designation Fallback
  return 900;
}

// Automatic sorting function: priority_rank ASC, then full_name ASC
export function sortSocietyMembers(members) {
  if (!Array.isArray(members)) return [];
  return [...members].sort((a, b) => {
    const rankA = getDynamicRoleRank(a);
    const rankB = getDynamicRoleRank(b);

    if (rankA !== rankB) {
      return rankA - rankB; // Lower number appears first (100 before 200, 200 before 300)
    }

    // Secondary sort alphabetically if ranks are equal
    const nameA = a.full_name || a.username || a.name || a.student_username || "";
    const nameB = b.full_name || b.username || b.name || b.student_username || "";
    return nameA.localeCompare(nameB);
  });
}
