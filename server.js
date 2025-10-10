// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 模拟“数据库”：内存数据 ---
const users = [
  // 你可以根据需要增删账号
  { id: 'U-100', name: '张老师', email: 'teacher@polyclass.edu', password: '123456', role: 'teacher' },
  { id: 'U-200', name: '王同学', email: 'student@polyclass.edu', password: '123456', role: 'student' },
  { id: 'U-300', name: '管理员', email: 'admin@polyclass.edu',   password: '123456', role: 'admin' }
];

const courses = [
  { id: 'C-101', title: 'COMP5241 – Software Engineering', students: 86, updated: '2025-09-10' },
  { id: 'C-102', title: 'AI for Education', students: 54, updated: '2025-09-08' },
  { id: 'C-103', title: 'HCI & Interaction Design', students: 63, updated: '2025-09-06' }
];

const studentsByCourse = {
  'C-101': [
    { id:'S1001', name:'Alice', status:'online',  score:82, submissions:12 },
    { id:'S1002', name:'Bob',   status:'offline', score:71, submissions:9  },
    { id:'S1003', name:'Carol', status:'online',  score:90, submissions:14 },
    { id:'S1004', name:'David', status:'online',  score:65, submissions:7  }
  ],
  'C-102': [
    { id:'S2001', name:'Eve',   status:'online',  score:88, submissions:8  },
    { id:'S2002', name:'Frank', status:'offline', score:67, submissions:5  }
  ],
  'C-103': [
    { id:'S3001', name:'Grace', status:'online',  score:91, submissions:11 },
    { id:'S3002', name:'Heidi', status:'offline', score:72, submissions:6  }
  ]
};

// 每门课的问题（问答），存放在内存
const questionsByCourse = {
  'C-101': [],
  'C-102': [],
  'C-103': []
};

const joinCodes = {
  'C-101': 'JOIN-CODE-ABC123',
  'C-102': 'JOIN-CODE-XYZ789',
  'C-103': 'JOIN-CODE-HELLO1'
};

// --- 简单鉴权（无 token，无会话，仅校验一次） ---
app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body || {};
  const user = users.find(u => u.email === email && u.password === password && (!role || role === u.role));
  if (!user) return res.status(401).json({ ok: false, message: '账号或密码错误' });
  // 返回最小用户信息（不返回密码）
  res.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// --- 课程列表 ---
app.get('/api/courses', (req, res) => {
  res.json({ ok: true, data: courses });
});

// --- 某门课学生列表 ---
app.get('/api/courses/:courseId/students', (req, res) => {
  const list = studentsByCourse[req.params.courseId] || [];
  res.json({ ok: true, data: list });
});

// --- 某门课问答列表 ---
app.get('/api/courses/:courseId/questions', (req, res) => {
  const list = questionsByCourse[req.params.courseId] || [];
  res.json({ ok: true, data: list });
});

// --- 新建问答 ---
app.post('/api/courses/:courseId/questions', (req, res) => {
  const { title, desc, deadlineISO } = req.body || {};
  if (!title) return res.status(400).json({ ok: false, message: '缺少标题' });
  const courseId = req.params.courseId;
  const q = {
    id: 'Q-' + Math.random().toString(36).slice(2, 8),
    courseId,
    title,
    desc: desc || '',
    deadlineISO: deadlineISO || ''
  };
  if (!questionsByCourse[courseId]) questionsByCourse[courseId] = [];
  questionsByCourse[courseId].push(q);
  res.json({ ok: true, data: q });
});

// --- 编辑问答 ---
app.put('/api/courses/:courseId/questions/:qid', (req, res) => {
  const { title, desc, deadlineISO } = req.body || {};
  const courseId = req.params.courseId;
  const qid = req.params.qid;
  const list = questionsByCourse[courseId] || [];
  const q = list.find(x => x.id === qid);
  if (!q) return res.status(404).json({ ok: false, message: '问题不存在' });
  if (typeof title === 'string') q.title = title.trim();
  if (typeof desc === 'string') q.desc = desc;
  if (typeof deadlineISO === 'string') q.deadlineISO = deadlineISO;
  res.json({ ok: true, data: q });
});

// --- 删除问答（可选） ---
app.delete('/api/courses/:courseId/questions/:qid', (req, res) => {
  const courseId = req.params.courseId;
  const qid = req.params.qid;
  const list = questionsByCourse[courseId] || [];
  const idx = list.findIndex(x => x.id === qid);
  if (idx < 0) return res.status(404).json({ ok: false, message: '问题不存在' });
  const [removed] = list.splice(idx, 1);
  res.json({ ok: true, data: removed });
});

// --- 获取加入码 ---
app.get('/api/courses/:courseId/join-code', (req, res) => {
  const code = joinCodes[req.params.courseId] || 'JOIN-CODE-DEFAULT';
  res.json({ ok: true, code });
});

// --- 静态文件（前端） ---
app.use(express.static(path.join(__dirname, 'public')));

// SPA（hash 路由基本不需要处理，但保底返回 index.html）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PolyClass running at http://localhost:${PORT}`);
});
