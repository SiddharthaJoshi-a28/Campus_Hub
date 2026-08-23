/* ==========================================================================
   CampusHub — script.js
   Vanilla JS, no framework, no build step. All data lives in localStorage
   under the key below, so it survives page reloads on this device/browser.
   ========================================================================== */

const STORAGE_KEY = 'campushub_data_v1';

const GRADE_POINTS = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, P: 4, F: 0 };

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ------------------------------------------------------------------------
   State
   ------------------------------------------------------------------------ */

function defaultState() {
  return {
    classes: [],
    assignments: [],
    exams: [],
    quickNotes: '',
    notes: [],
    cgpa: { semesters: [] },
    attendance: [],
    attThreshold: 75,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch (e) {
    console.warn('CampusHub: could not read saved data, starting fresh.', e);
    return defaultState();
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('CampusHub: could not save data.', e);
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ------------------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------------------ */

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function dueLabel(dateStr) {
  const n = daysUntil(dateStr);
  if (n < 0) return { text: `${Math.abs(n)}d overdue`, cls: 'tag-high' };
  if (n === 0) return { text: 'Due today', cls: 'tag-high' };
  if (n === 1) return { text: 'Due tomorrow', cls: 'tag-medium' };
  if (n <= 7) return { text: `Due in ${n}d`, cls: 'tag-medium' };
  return { text: `Due in ${n}d`, cls: 'tag-low' };
}

/* ------------------------------------------------------------------------
   Navigation (sidebar tabs + header pill sub-tabs)
   ------------------------------------------------------------------------ */

function initNav() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + btn.dataset.section).classList.add('active');
    });
  });

  document.querySelectorAll('.pill-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.view-header').parentElement;
      parent.querySelectorAll('.pill-tab').forEach((b) => b.classList.remove('active'));
      parent.querySelectorAll('.subview').forEach((v) => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.subview).classList.add('active');
    });
  });

  document.querySelectorAll('[data-open-modal]').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.modal-backdrop').classList.remove('open'));
  });
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

/* ------------------------------------------------------------------------
   Dashboard
   ------------------------------------------------------------------------ */

function renderDashboardDate() {
  const today = new Date();
  document.getElementById('today-date').textContent =
    today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function renderTodayClasses() {
  const todayName = DAYS[new Date().getDay()];
  const list = document.getElementById('todayClassesList');
  const todays = state.classes
    .filter((c) => c.day === todayName)
    .sort((a, b) => a.time.localeCompare(b.time));

  list.innerHTML = '';
  if (todays.length === 0) {
    list.appendChild(el(`<div class="empty-state">No classes logged for ${escapeHtml(todayName)}. Add your timetable to see it here.</div>`));
    return;
  }
  todays.forEach((c) => {
    list.appendChild(el(`
      <div class="row-item">
        <div class="row-main">
          <p class="row-title">${escapeHtml(c.subject)}</p>
          <div class="row-sub">
            <span>${escapeHtml(c.time)}</span>
            ${c.room ? `<span>· ${escapeHtml(c.room)}</span>` : ''}
          </div>
        </div>
      </div>
    `));
  });
}

function renderClassModalList() {
  const list = document.getElementById('classModalList');
  list.innerHTML = '';
  if (state.classes.length === 0) {
    list.appendChild(el('<div class="empty-state">No classes yet.</div>'));
    return;
  }
  const sorted = [...state.classes].sort((a, b) =>
    DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.time.localeCompare(b.time));
  sorted.forEach((c) => {
    const row = el(`
      <div class="row-item">
        <div class="row-main">
          <p class="row-title">${escapeHtml(c.subject)}</p>
          <div class="row-sub"><span>${escapeHtml(c.day)}</span><span>· ${escapeHtml(c.time)}</span>${c.room ? `<span>· ${escapeHtml(c.room)}</span>` : ''}</div>
        </div>
        <button class="icon-btn" title="Remove">&times;</button>
      </div>
    `);
    row.querySelector('.icon-btn').addEventListener('click', () => {
      state.classes = state.classes.filter((x) => x.id !== c.id);
      saveState();
      renderClassModalList();
      renderTodayClasses();
    });
    list.appendChild(row);
  });
}

function renderUpcomingAssignments() {
  const wrap = document.getElementById('upcomingAssignments');
  const upcoming = state.assignments
    .filter((a) => a.status !== 'completed')
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  wrap.innerHTML = '';
  if (upcoming.length === 0) {
    wrap.appendChild(el('<div class="empty-state">Nothing pending. Go outside.</div>'));
    return;
  }
  upcoming.forEach((a) => {
    const due = dueLabel(a.deadline);
    wrap.appendChild(el(`
      <div class="row-item">
        <div class="row-main">
          <p class="row-title">${escapeHtml(a.title)}</p>
          <div class="row-sub">
            <span class="tag tag-subject">${escapeHtml(a.subject)}</span>
            <span class="tag ${due.cls}">${due.text}</span>
          </div>
        </div>
      </div>
    `));
  });
}

function renderUpcomingExams() {
  const wrap = document.getElementById('upcomingExams');
  const upcoming = state.exams
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  wrap.innerHTML = '';
  if (upcoming.length === 0) {
    wrap.appendChild(el('<div class="empty-state">No exams on the horizon.</div>'));
    return;
  }
  upcoming.forEach((e) => {
    const due = dueLabel(e.date);
    wrap.appendChild(el(`
      <div class="row-item">
        <div class="row-main">
          <p class="row-title">${escapeHtml(e.subject)}</p>
          <div class="row-sub">
            <span class="tag tag-subject">${escapeHtml(e.type)}</span>
            <span class="tag ${due.cls}">${due.text}</span>
          </div>
        </div>
      </div>
    `));
  });
}

function renderDashboard() {
  renderDashboardDate();
  renderTodayClasses();
  renderUpcomingAssignments();
  renderUpcomingExams();
}

/* ------------------------------------------------------------------------
   Assignments
   ------------------------------------------------------------------------ */

let assignmentFilter = 'all';

function renderAssignments() {
  const wrap = document.getElementById('assignmentList');
  let items = [...state.assignments].sort((a, b) => a.deadline.localeCompare(b.deadline));
  if (assignmentFilter === 'pending') items = items.filter((a) => a.status !== 'completed');
  if (assignmentFilter === 'completed') items = items.filter((a) => a.status === 'completed');

  wrap.innerHTML = '';
  if (items.length === 0) {
    wrap.appendChild(el('<div class="empty-state">No assignments here yet.</div>'));
    return;
  }

  items.forEach((a) => {
    const done = a.status === 'completed';
    const due = dueLabel(a.deadline);
    const row = el(`
      <div class="row-item ${done ? 'done' : ''}">
        <button class="checkbox ${done ? 'checked' : ''}" title="Mark ${done ? 'pending' : 'complete'}">${done ? '✓' : ''}</button>
        <div class="row-main">
          <p class="row-title">${escapeHtml(a.title)}</p>
          <div class="row-sub">
            <span class="tag tag-subject">${escapeHtml(a.subject)}</span>
            <span class="tag tag-${a.priority}">${a.priority}</span>
            <span>${formatDate(a.deadline)}</span>
            ${!done ? `<span class="tag ${due.cls}">${due.text}</span>` : ''}
          </div>
        </div>
        <button class="icon-btn" title="Delete">&times;</button>
      </div>
    `);
    row.querySelector('.checkbox').addEventListener('click', () => {
      a.status = done ? 'pending' : 'completed';
      saveState();
      renderAssignments();
      renderDashboard();
    });
    row.querySelector('.icon-btn').addEventListener('click', () => {
      state.assignments = state.assignments.filter((x) => x.id !== a.id);
      saveState();
      renderAssignments();
      renderDashboard();
    });
    wrap.appendChild(row);
  });
}

function renderExams() {
  const wrap = document.getElementById('examList');
  const items = [...state.exams].sort((a, b) => a.date.localeCompare(b.date));
  wrap.innerHTML = '';
  if (items.length === 0) {
    wrap.appendChild(el('<div class="empty-state">No exams logged yet.</div>'));
    return;
  }
  items.forEach((e) => {
    const due = dueLabel(e.date);
    const row = el(`
      <div class="row-item">
        <div class="row-main">
          <p class="row-title">${escapeHtml(e.subject)}</p>
          <div class="row-sub">
            <span class="tag tag-subject">${escapeHtml(e.type)}</span>
            <span>${formatDate(e.date)}</span>
            <span class="tag ${due.cls}">${due.text}</span>
          </div>
        </div>
        <button class="icon-btn" title="Delete">&times;</button>
      </div>
    `);
    row.querySelector('.icon-btn').addEventListener('click', () => {
      state.exams = state.exams.filter((x) => x.id !== e.id);
      saveState();
      renderExams();
      renderDashboard();
    });
    wrap.appendChild(row);
  });
}

/* ------------------------------------------------------------------------
   CGPA Calculator
   ------------------------------------------------------------------------ */

function computeSemesterGpa(sem) {
  const totalCredits = sem.subjects.reduce((s, x) => s + Number(x.credits || 0), 0);
  if (totalCredits === 0) return 0;
  const points = sem.subjects.reduce((s, x) => s + Number(x.credits || 0) * GRADE_POINTS[x.grade], 0);
  return points / totalCredits;
}

function computeCgpa() {
  let totalCredits = 0;
  let totalPoints = 0;
  state.cgpa.semesters.forEach((sem) => {
    sem.subjects.forEach((x) => {
      totalCredits += Number(x.credits || 0);
      totalPoints += Number(x.credits || 0) * GRADE_POINTS[x.grade];
    });
  });
  return { cgpa: totalCredits ? totalPoints / totalCredits : 0, totalCredits };
}

function renderCgpaSummary() {
  const { cgpa, totalCredits } = computeCgpa();
  document.getElementById('cgpaValue').textContent = cgpa.toFixed(2);
  document.getElementById('creditTotals').textContent =
    `${totalCredits} credit${totalCredits === 1 ? '' : 's'} logged across ${state.cgpa.semesters.length} semester${state.cgpa.semesters.length === 1 ? '' : 's'}.`;

  const circumference = 2 * Math.PI * 60;
  const fraction = Math.max(0, Math.min(1, cgpa / 10));
  const ring = document.getElementById('cgpaRing');
  ring.style.strokeDasharray = String(circumference);
  ring.style.strokeDashoffset = String(circumference * (1 - fraction));
}

function renderSemesters() {
  const wrap = document.getElementById('semesterList');
  wrap.innerHTML = '';

  if (state.cgpa.semesters.length === 0) {
    wrap.appendChild(el('<div class="empty-state">Add your first semester to start tracking CGPA.</div>'));
    renderCgpaSummary();
    return;
  }

  state.cgpa.semesters.forEach((sem) => {
    const gpa = computeSemesterGpa(sem);
    const card = el(`
      <div class="semester-card">
        <div class="semester-head">
          <input type="text" class="semester-name" value="${escapeHtml(sem.name)}">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="semester-gpa">GPA ${gpa.toFixed(2)}</span>
            <button class="icon-btn" title="Delete semester">&times;</button>
          </div>
        </div>
        <div class="subject-rows"></div>
        <button class="subject-row-add">+ Add subject</button>
      </div>
    `);

    card.querySelector('.semester-name').addEventListener('change', (e) => {
      sem.name = e.target.value || 'Untitled semester';
      saveState();
    });

    card.querySelector('.icon-btn').addEventListener('click', () => {
      state.cgpa.semesters = state.cgpa.semesters.filter((s) => s.id !== sem.id);
      saveState();
      renderSemesters();
    });

    const rowsWrap = card.querySelector('.subject-rows');
    const gradeOptions = Object.keys(GRADE_POINTS)
      .map((g) => `<option value="${g}">${g}</option>`).join('');

    function renderSubjectRows() {
      rowsWrap.innerHTML = '';
      sem.subjects.forEach((subj) => {
        const row = el(`
          <div class="subject-row">
            <input type="text" placeholder="Subject name" value="${escapeHtml(subj.name)}">
            <input type="number" min="0" placeholder="Credits" value="${subj.credits}">
            <select>${gradeOptions}</select>
            <button class="icon-btn" title="Remove">&times;</button>
          </div>
        `);
        row.querySelector('select').value = subj.grade;

        row.children[0].addEventListener('input', (e) => { subj.name = e.target.value; saveState(); });
        row.children[1].addEventListener('input', (e) => {
          subj.credits = e.target.value;
          saveState();
          card.querySelector('.semester-gpa').textContent = `GPA ${computeSemesterGpa(sem).toFixed(2)}`;
          renderCgpaSummary();
        });
        row.children[2].addEventListener('change', (e) => {
          subj.grade = e.target.value;
          saveState();
          card.querySelector('.semester-gpa').textContent = `GPA ${computeSemesterGpa(sem).toFixed(2)}`;
          renderCgpaSummary();
        });
        row.querySelector('.icon-btn').addEventListener('click', () => {
          sem.subjects = sem.subjects.filter((s) => s.id !== subj.id);
          saveState();
          renderSubjectRows();
          card.querySelector('.semester-gpa').textContent = `GPA ${computeSemesterGpa(sem).toFixed(2)}`;
          renderCgpaSummary();
        });
        rowsWrap.appendChild(row);
      });
    }
    renderSubjectRows();

    card.querySelector('.subject-row-add').addEventListener('click', () => {
      sem.subjects.push({ id: uid(), name: '', credits: 3, grade: 'A' });
      saveState();
      renderSubjectRows();
      card.querySelector('.semester-gpa').textContent = `GPA ${computeSemesterGpa(sem).toFixed(2)}`;
      renderCgpaSummary();
    });

    wrap.appendChild(card);
  });

  renderCgpaSummary();
}

/* ------------------------------------------------------------------------
   Attendance
   ------------------------------------------------------------------------ */

function attendanceMath(attended, total, thresholdPct) {
  const req = thresholdPct / 100;
  const pct = total > 0 ? (attended / total) * 100 : 0;

  if (total === 0) return { pct: 0, message: 'Add classes held to see your numbers.', safe: true };

  if (pct >= thresholdPct) {
    // how many more can be missed and stay >= threshold
    const maxMiss = req > 0 ? Math.floor(attended / req - total) : Infinity;
    const missable = Math.max(0, maxMiss);
    return {
      pct,
      safe: true,
      message: missable > 0
        ? `You can skip ${missable} more class${missable === 1 ? '' : 'es'} and stay at or above ${thresholdPct}%.`
        : `You're exactly at ${thresholdPct}%. One more miss will drop you below it.`,
    };
  }

  // how many in-a-row attends needed to reach threshold
  const denom = 1 - req;
  const needed = denom > 0 ? Math.ceil((req * total - attended) / denom) : Infinity;
  return {
    pct,
    safe: false,
    message: `Attend the next ${needed} class${needed === 1 ? '' : 'es'} in a row to reach ${thresholdPct}%.`,
  };
}

function renderAttendance() {
  const wrap = document.getElementById('attendanceList');
  const threshold = Number(state.attThreshold) || 75;
  wrap.innerHTML = '';

  if (state.attendance.length === 0) {
    wrap.appendChild(el('<div class="empty-state">Add a subject to start tracking attendance.</div>'));
    return;
  }

  state.attendance.forEach((a) => {
    const { pct, safe, message } = attendanceMath(Number(a.attended), Number(a.total), threshold);
    const barColor = safe ? 'var(--green)' : 'var(--red)';
    const card = el(`
      <div class="att-card">
        <div class="att-card-head">
          <div>
            <p class="att-subject">${escapeHtml(a.subject)}</p>
            <p class="att-count">${a.attended} / ${a.total} classes</p>
          </div>
          <button class="icon-btn" title="Delete">&times;</button>
        </div>
        <div class="att-pct" style="color:${barColor}">${pct.toFixed(1)}%</div>
        <div class="att-bar-track"><div class="att-bar-fill" style="width:${Math.min(100, pct)}%; background:${barColor};"></div></div>
        <div class="att-status ${safe ? 'safe' : 'danger'}">${message}</div>
      </div>
    `);
    card.querySelector('.icon-btn').addEventListener('click', () => {
      state.attendance = state.attendance.filter((x) => x.id !== a.id);
      saveState();
      renderAttendance();
    });
    wrap.appendChild(card);
  });
}

/* ------------------------------------------------------------------------
   Notes
   ------------------------------------------------------------------------ */

let selectedNoteId = null;
let noteSearchQuery = '';

function renderNotesList() {
  const wrap = document.getElementById('notesList');
  const q = noteSearchQuery.trim().toLowerCase();
  let items = [...state.notes].sort((a, b) => b.updated - a.updated);
  if (q) {
    items = items.filter((n) =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  wrap.innerHTML = '';
  if (items.length === 0) {
    wrap.appendChild(el(`<div class="empty-state">${q ? 'No notes match your search.' : 'No notes yet. Create one.'}</div>`));
    return;
  }

  items.forEach((n) => {
    const item = el(`
      <div class="note-item ${n.id === selectedNoteId ? 'selected' : ''}">
        <p class="note-item-title">${escapeHtml(n.title || 'Untitled note')}</p>
        <p class="note-item-preview">${escapeHtml(n.content || 'No content yet')}</p>
        <p class="note-item-date">${new Date(n.updated).toLocaleDateString()}</p>
      </div>
    `);
    item.addEventListener('click', () => selectNote(n.id));
    wrap.appendChild(item);
  });
}

function selectNote(id) {
  selectedNoteId = id;
  const note = state.notes.find((n) => n.id === id);
  const editor = document.getElementById('noteEditor');
  editor.style.display = 'flex';
  document.getElementById('noteTitle').value = note ? note.title : '';
  document.getElementById('noteContent').value = note ? note.content : '';
  document.getElementById('noteMeta').textContent = note ? `Last edited ${new Date(note.updated).toLocaleString()}` : '';
  renderNotesList();
}

function createNote() {
  const note = { id: uid(), title: '', content: '', updated: Date.now() };
  state.notes.push(note);
  saveState();
  selectNote(note.id);
}

function persistCurrentNote() {
  const note = state.notes.find((n) => n.id === selectedNoteId);
  if (!note) return;
  note.title = document.getElementById('noteTitle').value;
  note.content = document.getElementById('noteContent').value;
  note.updated = Date.now();
  saveState();
  renderNotesList();
  document.getElementById('noteMeta').textContent = `Last edited ${new Date(note.updated).toLocaleString()}`;
  renderNotesEditorSelectionHighlight();
}

function renderNotesEditorSelectionHighlight() {
  document.querySelectorAll('.note-item').forEach((item, i) => {});
}

/* ------------------------------------------------------------------------
   Form wiring
   ------------------------------------------------------------------------ */

function initClassForm() {
  document.getElementById('classForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.classes.push({
      id: uid(),
      subject: document.getElementById('c_subject').value.trim(),
      day: document.getElementById('c_day').value,
      time: document.getElementById('c_time').value,
      room: document.getElementById('c_room').value.trim(),
    });
    saveState();
    e.target.reset();
    renderClassModalList();
    renderTodayClasses();
  });
}

function initAssignmentForm() {
  document.getElementById('assignmentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.assignments.push({
      id: uid(),
      subject: document.getElementById('a_subject').value.trim(),
      title: document.getElementById('a_title').value.trim(),
      deadline: document.getElementById('a_deadline').value,
      priority: document.getElementById('a_priority').value,
      status: 'pending',
    });
    saveState();
    e.target.reset();
    renderAssignments();
    renderDashboard();
  });

  document.querySelectorAll('.filter-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      assignmentFilter = chip.dataset.filter;
      renderAssignments();
    });
  });
}

function initExamForm() {
  document.getElementById('examForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.exams.push({
      id: uid(),
      subject: document.getElementById('e_subject').value.trim(),
      type: document.getElementById('e_type').value,
      date: document.getElementById('e_date').value,
    });
    saveState();
    e.target.reset();
    renderExams();
    renderDashboard();
  });
}

function initCgpa() {
  document.getElementById('addSemesterBtn').addEventListener('click', () => {
    state.cgpa.semesters.push({
      id: uid(),
      name: `Semester ${state.cgpa.semesters.length + 1}`,
      subjects: [],
    });
    saveState();
    renderSemesters();
  });
}

function initAttendance() {
  document.getElementById('attendanceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.attendance.push({
      id: uid(),
      subject: document.getElementById('att_subject').value.trim(),
      attended: Number(document.getElementById('att_attended').value),
      total: Number(document.getElementById('att_total').value),
    });
    saveState();
    e.target.reset();
    renderAttendance();
  });

  const threshold = document.getElementById('attThreshold');
  threshold.value = state.attThreshold;
  threshold.addEventListener('input', () => {
    state.attThreshold = Number(threshold.value) || 75;
    saveState();
    renderAttendance();
  });
}

function initNotes() {
  document.getElementById('newNoteBtn').addEventListener('click', createNote);
  document.getElementById('deleteNoteBtn').addEventListener('click', () => {
    if (!selectedNoteId) return;
    state.notes = state.notes.filter((n) => n.id !== selectedNoteId);
    saveState();
    selectedNoteId = null;
    document.getElementById('noteEditor').style.display = 'none';
    renderNotesList();
  });

  let saveTimer;
  ['noteTitle', 'noteContent'].forEach((id) => {
    document.getElementById(id).addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(persistCurrentNote, 300);
    });
  });

  document.getElementById('noteSearch').addEventListener('input', (e) => {
    noteSearchQuery = e.target.value;
    renderNotesList();
  });

  document.getElementById('noteEditor').style.display = 'none';
}

function initQuickNotes() {
  const box = document.getElementById('quickNotes');
  box.value = state.quickNotes;
  let saveTimer;
  box.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      state.quickNotes = box.value;
      saveState();
    }, 300);
  });
}

function initExportImport() {
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campushub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const fileInput = document.getElementById('importFile');
  document.getElementById('importBtnTrigger').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        state = { ...defaultState(), ...imported };
        saveState();
        renderAll();
      } catch (e) {
        alert('That file does not look like a valid CampusHub backup.');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
}

/* ------------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------------ */

function renderAll() {
  renderDashboard();
  renderClassModalList();
  renderAssignments();
  renderExams();
  renderSemesters();
  renderAttendance();
  renderNotesList();
  document.getElementById('quickNotes').value = state.quickNotes;
}

function init() {
  initNav();
  initClassForm();
  initAssignmentForm();
  initExamForm();
  initCgpa();
  initAttendance();
  initNotes();
  initQuickNotes();
  initExportImport();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);