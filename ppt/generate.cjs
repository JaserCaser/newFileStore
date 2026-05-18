const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Personal FileStore · 产品介绍";
pres.author = "Personal FileStore";

// Color palette
const C = {
  ikb:    "002FA7",
  ink:    "0A0A0A",
  paper:  "FAFAF8",
  grey1:  "F0F0EE",
  grey2:  "D4D4D2",
  grey3:  "737373",
  white:  "FFFFFF",
};

const W = 10, H = 5.625;

// ── Helpers ──────────────────────────────────────────────────────────
function hairline(sl, x, y, w, color = C.grey2, transparency = 0) {
  sl.addShape(pres.shapes.LINE, {
    x, y, w, h: 0,
    line: { color, width: 0.5, transparency }
  });
}

function chromeLine(sl, left, right, pageNo, light = false) {
  const clr = light ? C.grey3 : "FFFFFF";
  const tr  = light ? 0 : 40;
  sl.addText(left,   { x: 0.5, y: 0.27, w: 7, h: 0.22, fontSize: 9, fontFace: "Calibri", color: clr, transparency: tr, charSpacing: 3, margin: 0 });
  sl.addText(pageNo, { x: 8.5, y: 0.27, w: 1, h: 0.22, fontSize: 9, fontFace: "Calibri", color: clr, transparency: tr, charSpacing: 2, align: "right", margin: 0 });
  hairline(sl, 0.5, 0.54, 9, light ? C.grey2 : C.white, light ? 0 : 70);
}

// ════════════════════════════════════════════════════════════════════
// Slide 1 · Cover · IKB 满屏
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();
  sl.background = { color: C.ikb };

  chromeLine(sl, "Personal FileStore · Product Overview", "01 / 10", "01 / 10", false);

  sl.addText("PERSONAL FILE MANAGEMENT · V1.6", {
    x: 0.5, y: 0.74, w: 9, h: 0.26,
    fontSize: 10, fontFace: "Calibri", color: C.white, transparency: 28, charSpacing: 3, margin: 0
  });

  sl.addText([
    { text: "您的文件，", options: { breakLine: true } },
    { text: "极致掌控",   options: { italic: true } },
  ], {
    x: 0.5, y: 1.1, w: 8.5, h: 2.15,
    fontSize: 64, fontFace: "Microsoft YaHei UI",
    color: C.white, bold: false, margin: 0, lineSpacingMultiple: 1.0
  });

  hairline(sl, 0.5, 3.5, 9, C.white, 62);

  sl.addText(
    "现代化、优雅且安全的个人文件管理系统。Apple 级交互体验，双端架构设计，AI 赋能。",
    { x: 0.5, y: 3.66, w: 7.5, h: 0.6, fontSize: 13.5, fontFace: "Microsoft YaHei UI", color: C.white, transparency: 16, margin: 0 }
  );

  sl.addText("React 19 · TypeScript 6.0 · Vite 8.0", {
    x: 0.5, y: 4.38, w: 5, h: 0.24,
    fontSize: 9, fontFace: "Calibri", color: C.white, transparency: 46, charSpacing: 2, margin: 0
  });
  sl.addText("→ swipe / arrow keys", {
    x: 7.2, y: 4.38, w: 2.3, h: 0.24,
    fontSize: 9, fontFace: "Calibri", color: C.white, transparency: 46, charSpacing: 2, align: "right", margin: 0
  });
}

// ════════════════════════════════════════════════════════════════════
// Slide 2 · Problem · 左黑右灰 Split
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();

  // Backgrounds
  sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:5, h:H, fill:{color:C.ink}, line:{color:C.ink} });
  sl.addShape(pres.shapes.RECTANGLE, { x:5, y:0, w:5, h:H, fill:{color:C.grey1}, line:{color:C.grey1} });

  // Left chrome
  sl.addText("THE PROBLEM", { x:0.5, y:0.27, w:3, h:0.22, fontSize:9, fontFace:"Calibri", color:C.white, transparency:42, charSpacing:3, margin:0 });
  sl.addText("02 / 10",     { x:3.5, y:0.27, w:1, h:0.22, fontSize:9, fontFace:"Calibri", color:C.white, transparency:42, charSpacing:2, align:"right", margin:0 });
  hairline(sl, 0.5, 0.54, 4.1, C.white, 72);

  // Left kicker
  sl.addText("CHALLENGE", { x:0.5, y:0.72, w:4, h:0.24, fontSize:9, fontFace:"Calibri", color:C.white, transparency:46, charSpacing:3, margin:0 });

  // Left title
  sl.addText([
    { text:"文件管理，", options:{breakLine:true} },
    { text:"从未如此",   options:{breakLine:true} },
    { text:"令人头疼",   options:{italic:true} },
  ], {
    x:0.5, y:1.08, w:4.2, h:2.75,
    fontSize:35, fontFace:"Microsoft YaHei UI",
    color:C.white, bold:false, margin:0, lineSpacingMultiple:1.06
  });

  sl.addText("文件散落各处 · 安全无保障 · 体验粗糙", {
    x:0.5, y:5.08, w:4, h:0.24,
    fontSize:9, fontFace:"Microsoft YaHei UI", color:C.white, transparency:56, margin:0
  });

  // Right chrome
  sl.addText("PAIN POINTS", { x:5.4, y:0.27, w:3, h:0.22, fontSize:9, fontFace:"Calibri", color:C.grey3, charSpacing:3, margin:0 });
  sl.addText("03 ISSUES",   { x:8.4, y:0.27, w:1.1, h:0.22, fontSize:9, fontFace:"Calibri", color:C.grey3, charSpacing:2, align:"right", margin:0 });
  hairline(sl, 5.4, 0.54, 4.1);

  const pains = [
    { nb:"01", title:"文件杂乱，难以找寻", desc:"重要文件散落各处，没有统一管理入口，检索耗时费力。" },
    { nb:"02", title:"安全隐患，数据泄露", desc:"公共网盘权限复杂，个人隐私文件缺乏可靠保护机制。" },
    { nb:"03", title:"体验割裂，AI 缺席",  desc:"传统工具不具备智能处理能力，PC 与移动端体验割裂。", accent:true },
  ];

  pains.forEach((p, i) => {
    const y = 0.72 + i * 1.46;
    const clr = p.accent ? C.ikb : C.ink;
    sl.addShape(pres.shapes.LINE, { x:5.4, y, w:4.1, h:0, line:{color: p.accent ? C.ikb : C.grey2, width: p.accent ? 1 : 0.5 } });
    sl.addText(p.nb, { x:5.4, y:y+0.1, w:0.6, h:0.88, fontSize:30, fontFace:"Calibri", color:clr, bold:false, valign:"top", margin:0 });
    sl.addText(p.title, { x:6.1, y:y+0.12, w:3.4, h:0.36, fontSize:14, fontFace:"Microsoft YaHei UI", color:clr, bold:true, margin:0 });
    sl.addText(p.desc,  { x:6.1, y:y+0.52, w:3.4, h:0.58, fontSize:11, fontFace:"Microsoft YaHei UI", color:C.grey3, margin:0 });
    if (p.accent) {
      sl.addShape(pres.shapes.LINE, { x:5.4, y:y+1.34, w:4.1, h:0, line:{color:C.ikb, width:1.2} });
    }
  });

  sl.addText("→ 是时候改变了", { x:5.4, y:5.2, w:4.1, h:0.24, fontSize:9, fontFace:"Calibri", color:C.grey3, charSpacing:2, align:"right", margin:0 });
}

// ════════════════════════════════════════════════════════════════════
// Slide 3 · Solution · 左文字 右三块
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();
  sl.background = { color: C.paper };
  chromeLine(sl, "THE SOLUTION · Personal FileStore", "03 / 10", "03 / 10", true);

  sl.addText("— A New Way", { x:0.5, y:0.72, w:4.5, h:0.26, fontSize:10, fontFace:"Calibri", color:C.ikb, bold:true, charSpacing:2, margin:0 });

  sl.addText([
    { text:"一个系统，", options:{breakLine:true} },
    { text:"掌控您的",   options:{breakLine:true} },
    { text:"全部数字资产", options:{} },
  ], {
    x:0.5, y:1.06, w:4.5, h:2.0,
    fontSize:32, fontFace:"Microsoft YaHei UI", color:C.ink, bold:false, margin:0, lineSpacingMultiple:1.06
  });

  sl.addText(
    "专为个人打造的现代化文件存储平台，Apple 级极简体验，融合 AI 智能处理，让文件管理回归纯粹。",
    { x:0.5, y:3.18, w:4.4, h:0.92, fontSize:12, fontFace:"Microsoft YaHei UI", color:C.grey3, margin:0 }
  );

  const blocks = [
    { tag:"极简设计", desc:"精心打磨的 Apple-like 界面，丝滑微动效，让每次操作都是享受。", blue:false },
    { tag:"AI 赋能",  desc:"集成前沿 AI 图像处理，让文件管理更聪明、更高效。",             blue:true  },
    { tag:"双端独立", desc:"前台个人空间 + 运营后台，独立入口，完整功能。",                 blue:false },
  ];

  blocks.forEach((b, i) => {
    const y = 0.72 + i * 1.22;
    const bg = b.blue ? C.ikb : C.grey1;
    const fg = b.blue ? C.white : C.ink;
    sl.addShape(pres.shapes.RECTANGLE, { x:5.3, y, w:4.2, h:1.12, fill:{color:bg}, line:{color:bg} });
    sl.addText(b.tag, { x:5.52, y:y+0.1, w:3.76, h:0.26, fontSize:10, fontFace:"Calibri", color:b.blue ? C.white : C.ikb, bold:true, charSpacing:2, transparency:b.blue?28:0, margin:0 });
    sl.addText(b.desc, { x:5.52, y:y+0.4, w:3.76, h:0.64, fontSize:11, fontFace:"Microsoft YaHei UI", color:fg, transparency:b.blue?18:0, margin:0 });
  });
}

// ════════════════════════════════════════════════════════════════════
// Slide 4 · Core Features · 2×3 卡片
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();
  sl.background = { color: C.paper };
  chromeLine(sl, "CORE FEATURES", "04 / 10", "04 / 10", true);

  sl.addText("— 六大核心能力", { x:0.5, y:0.68, w:5, h:0.26, fontSize:10, fontFace:"Calibri", color:C.ikb, bold:true, charSpacing:2, margin:0 });
  sl.addText("全能文件管家", { x:0.5, y:0.96, w:5, h:0.68, fontSize:34, fontFace:"Microsoft YaHei UI", color:C.ink, bold:false, margin:0 });

  const features = [
    { nb:"01", title:"安全可靠存储", desc:"文件云端安全托管，完善的权限控制机制。" },
    { nb:"02", title:"全能文件操作", desc:"上传、下载、移动、重命名等全套核心操作。" },
    { nb:"03", title:"AI 图像处理",  desc:"集成前沿 AI Image 模块，智能处理图片。",    accent:true },
    { nb:"04", title:"个性化空间",   desc:"深度个人资料配置，高级头像裁剪编辑器。" },
    { nb:"05", title:"全端响应式",   desc:"完美适配桌面端与移动端，随时随地管理。" },
    { nb:"06", title:"双端架构设计", desc:"前台个人空间与运营后台完全独立运行。" },
  ];

  const cw = 2.92, rh = 1.42;
  features.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.5 + col * (cw + 0.17);
    const y = 1.76 + row * (rh + 0.12);
    const bg = f.accent ? C.ikb : C.grey1;
    const fg = f.accent ? C.white : C.ink;
    const dg = f.accent ? C.white : C.grey3;

    sl.addShape(pres.shapes.RECTANGLE, { x, y, w:cw, h:rh, fill:{color:bg}, line:{color:bg} });
    sl.addText(f.nb, { x:x+cw-0.5, y:y+0.1, w:0.4, h:0.22, fontSize:9, fontFace:"Calibri", color:fg, transparency:38, align:"right", margin:0 });
    sl.addText(f.title, { x:x+0.18, y:y+0.18, w:cw-0.36, h:0.36, fontSize:13, fontFace:"Microsoft YaHei UI", color:fg, bold:true, margin:0 });
    sl.addText(f.desc,  { x:x+0.18, y:y+0.62, w:cw-0.36, h:0.72, fontSize:10.5, fontFace:"Microsoft YaHei UI", color:dg, transparency:f.accent?18:0, margin:0 });
  });
}

// ════════════════════════════════════════════════════════════════════
// Slide 5 · Architecture · 深色三列
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();
  sl.background = { color: C.ink };
  chromeLine(sl, "SYSTEM ARCHITECTURE", "05 / 10", "05 / 10", false);

  sl.addText("— 双端 + AI 三层架构", { x:0.5, y:0.68, w:6, h:0.26, fontSize:10, fontFace:"Calibri", color:C.white, bold:true, charSpacing:2, transparency:46, margin:0 });
  sl.addText("一套代码，三重体验", { x:0.5, y:0.96, w:6, h:0.68, fontSize:34, fontFace:"Microsoft YaHei UI", color:C.white, bold:false, margin:0 });

  const layers = [
    { nb:"LAYER 01", title:"前台应用 App",   desc:"个人文件管理中心，Apple-like 极简登录页，丝滑交互体验，支持全部文件操作。", tag:":5173 / npm run dev:app",   bg:C.grey1,  fg:C.ink  },
    { nb:"LAYER 02", title:"运营后台 Admin", desc:"独立管理后台入口，运营数据总览，用户管理与文件运营，完整权限体系。",         tag:":5174 / npm run dev:admin", bg:C.ikb,   fg:C.white },
    { nb:"LAYER 03", title:"AI Image 模块",  desc:"前沿 AI 图像生成与处理，深度集成于文件管理流程，让内容更智能。",             tag:"Feature-Sliced Design",     bg:"1A1A1A", fg:C.white },
  ];

  const cw = 2.82, ch = 3.65;
  layers.forEach((l, i) => {
    const x = 0.5 + i * (cw + 0.18);
    const y = 1.75;
    const dark = l.fg === C.white;

    sl.addShape(pres.shapes.RECTANGLE, { x, y, w:cw, h:ch, fill:{color:l.bg}, line:{color:l.bg} });
    sl.addText(l.nb,    { x:x+0.18, y:y+0.18, w:cw-0.36, h:0.22, fontSize:9,  fontFace:"Calibri",                color:l.fg, transparency:dark?40:30, charSpacing:2, margin:0 });
    sl.addText(l.title, { x:x+0.18, y:y+0.5,  w:cw-0.36, h:0.5,  fontSize:15, fontFace:"Microsoft YaHei UI",     color:l.fg, margin:0 });
    sl.addText(l.desc,  { x:x+0.18, y:y+1.1,  w:cw-0.36, h:1.85, fontSize:11, fontFace:"Microsoft YaHei UI",     color:l.fg, transparency:dark?20:22, margin:0 });
    sl.addShape(pres.shapes.LINE, { x:x+0.18, y:y+ch-0.58, w:cw-0.36, h:0, line:{color:l.fg, width:0.5, transparency:dark?68:55} });
    sl.addText(l.tag,   { x:x+0.18, y:y+ch-0.5, w:cw-0.36, h:0.22, fontSize:8.5, fontFace:"Calibri", color:l.fg, transparency:dark?44:36, charSpacing:1, margin:0 });
  });
}

// ════════════════════════════════════════════════════════════════════
// Slide 6 · User Flow · 横向时间线
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();
  sl.background = { color: C.paper };
  chromeLine(sl, "USER FLOW", "06 / 10", "06 / 10", true);

  sl.addText("— 5 步上手流程", { x:0.5, y:0.68, w:5, h:0.26, fontSize:10, fontFace:"Calibri", color:C.ikb, bold:true, charSpacing:2, margin:0 });
  sl.addText("极速上手，开箱即用", { x:0.5, y:0.96, w:6, h:0.68, fontSize:34, fontFace:"Microsoft YaHei UI", color:C.ink, bold:false, margin:0 });

  const tlY = 3.15;
  // Axis line
  sl.addShape(pres.shapes.LINE, { x:0.9, y:tlY, w:8.2, h:0, line:{color:C.grey2, width:1} });

  const steps = [
    { nb:"01", name:"注册登录", desc:"极简登录页\n视频背景动效", up:true,  accent:true  },
    { nb:"02", name:"上传文件", desc:"拖拽或点击\n支持批量操作", up:false, accent:false },
    { nb:"03", name:"管理整理", desc:"移动重命名\n自定义右键菜单", up:true,  accent:false },
    { nb:"04", name:"AI 处理",  desc:"AI 图像生成\n与处理赋能",   up:false, accent:true  },
    { nb:"05", name:"随时访问", desc:"全端响应式\n桌面移动适配",  up:true,  accent:false },
  ];

  const xpos = [0.9, 2.94, 4.98, 7.02, 9.1];
  steps.forEach((s, i) => {
    const cx = xpos[i];
    const dc = s.accent ? C.ikb : C.ink;

    sl.addShape(pres.shapes.OVAL, { x:cx-0.09, y:tlY-0.09, w:0.18, h:0.18, fill:{color:dc}, line:{color:dc} });

    if (s.up) {
      sl.addText(s.nb,   { x:cx-0.55, y:tlY-0.56, w:1.1, h:0.22, fontSize:9,  fontFace:"Calibri",             color:s.accent?C.ikb:C.grey3, align:"center", charSpacing:2, margin:0 });
      sl.addText(s.name, { x:cx-0.7,  y:tlY-0.96, w:1.4, h:0.38, fontSize:12, fontFace:"Microsoft YaHei UI",  color:dc, bold:true, align:"center", margin:0 });
      sl.addText(s.desc, { x:cx-0.75, y:tlY+0.22, w:1.5, h:0.72, fontSize:10, fontFace:"Microsoft YaHei UI",  color:C.grey3, align:"center", margin:0 });
    } else {
      sl.addText(s.nb,   { x:cx-0.55, y:tlY+0.16, w:1.1, h:0.22, fontSize:9,  fontFace:"Calibri",             color:s.accent?C.ikb:C.grey3, align:"center", charSpacing:2, margin:0 });
      sl.addText(s.name, { x:cx-0.7,  y:tlY+0.42, w:1.4, h:0.38, fontSize:12, fontFace:"Microsoft YaHei UI",  color:dc, bold:true, align:"center", margin:0 });
      sl.addText(s.desc, { x:cx-0.75, y:tlY-0.88, w:1.5, h:0.72, fontSize:10, fontFace:"Microsoft YaHei UI",  color:C.grey3, align:"center", margin:0 });
    }
  });

  sl.addText("→ 从注册到管理，5 步完成", { x:0.5, y:5.22, w:9, h:0.22, fontSize:9, fontFace:"Calibri", color:C.grey3, charSpacing:2, margin:0 });
}

// ════════════════════════════════════════════════════════════════════
// Slide 7 · Comparison · 左右对比
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();
  sl.background = { color: C.paper };
  chromeLine(sl, "COMPARISON", "07 / 10", "07 / 10", true);

  sl.addText("— 传统方案 vs Personal FileStore", { x:0.5, y:0.68, w:7, h:0.26, fontSize:10, fontFace:"Calibri", color:C.ikb, bold:true, charSpacing:2, margin:0 });
  sl.addText("为什么选择我们", { x:0.5, y:0.96, w:6, h:0.68, fontSize:34, fontFace:"Microsoft YaHei UI", color:C.ink, bold:false, margin:0 });

  // Divider
  sl.addShape(pres.shapes.LINE, { x:5, y:1.82, w:0, h:3.55, line:{color:C.grey2, width:0.5} });

  // Left col — traditional
  sl.addText("✗  传统方案", { x:0.5, y:1.82, w:4.2, h:0.32, fontSize:12, fontFace:"Calibri", color:C.grey3, bold:true, charSpacing:1, margin:0 });
  sl.addText("杂乱、不安全、低效", { x:0.5, y:2.2, w:4.2, h:0.44, fontSize:18, fontFace:"Microsoft YaHei UI", color:C.grey2, bold:false, margin:0 });
  sl.addText("文件散落在多个平台，没有统一入口，操作繁琐，缺乏安全保障。", { x:0.5, y:2.72, w:4.2, h:0.6, fontSize:11, fontFace:"Microsoft YaHei UI", color:C.grey3, margin:0 });

  const bad = ["多平台文件散落，难以统一管理","公共网盘权限复杂，隐私风险高","不支持 AI 处理，智能化程度低","移动端与桌面端体验割裂","无管理后台，运营无从入手"];
  sl.addText(bad.map((t,i)=>({ text:t, options:{bullet:true, breakLine:i<bad.length-1} })), {
    x:0.5, y:3.38, w:4.2, h:1.85,
    fontSize:11, fontFace:"Microsoft YaHei UI", color:C.grey3, margin:0
  });

  // Right col — ours
  sl.addText("✓  Personal FileStore", { x:5.4, y:1.82, w:4.1, h:0.32, fontSize:12, fontFace:"Calibri", color:C.ikb, bold:true, charSpacing:1, margin:0 });
  sl.addText("统一、安全、智能", { x:5.4, y:2.2, w:4.1, h:0.44, fontSize:18, fontFace:"Microsoft YaHei UI", color:C.ikb, bold:false, margin:0 });
  sl.addText("一站式个人文件管理平台，极简体验，AI 赋能，双端独立，随时随地掌控。", { x:5.4, y:2.72, w:4.1, h:0.6, fontSize:11, fontFace:"Microsoft YaHei UI", color:C.grey3, margin:0 });

  const good = ["统一文件管理入口，一站掌控全局","安全可靠存储，权限体系完善","AI Image 模块，智能图像处理","全端响应式，桌面移动完美适配","独立运营后台，管理轻松高效"];
  sl.addText(good.map((t,i)=>({ text:t, options:{bullet:true, color:C.ikb, breakLine:i<good.length-1} })), {
    x:5.4, y:3.38, w:4.1, h:1.85,
    fontSize:11, fontFace:"Microsoft YaHei UI", color:C.ink, margin:0
  });
}

// ════════════════════════════════════════════════════════════════════
// Slide 8 · Value Proposition · 深色三列
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();
  sl.background = { color: C.ink };
  chromeLine(sl, "VALUE PROPOSITION", "08 / 10", "08 / 10", false);

  sl.addText("— 三大核心价值", { x:0.5, y:0.68, w:6, h:0.26, fontSize:10, fontFace:"Calibri", color:C.white, transparency:46, bold:true, charSpacing:2, margin:0 });
  sl.addText("为什么现在", { x:0.5, y:0.96, w:5, h:0.68, fontSize:34, fontFace:"Microsoft YaHei UI", color:C.white, bold:false, margin:0 });

  const vals = [
    { tag:"VALUE 01", title:"极致 Apple 体验",  desc:"精心打磨的极简 UI，视频背景登录页，硬件加速动效，每个细节都彰显品质。", nb:"01", accent:false },
    { tag:"VALUE 02", title:"工程级技术栈",     desc:"React 19 + TypeScript 6.0 + Vite 8.0，全方位 Vitest 测试覆盖，代码质量保障。", nb:"02", accent:true  },
    { tag:"VALUE 03", title:"AI 智能赋能",      desc:"前沿 AI 图像处理模块，Feature-Sliced Design 架构，灵活扩展，面向未来。", nb:"03", accent:false },
  ];

  const cw = 2.82;
  vals.forEach((v, i) => {
    const x = 0.5 + i * (cw + 0.18);

    sl.addText(v.tag, { x, y:1.9, w:cw, h:0.24, fontSize:9, fontFace:"Calibri", color:v.accent?C.ikb:C.white, transparency:v.accent?0:46, charSpacing:2, margin:0 });
    sl.addText(v.title, { x, y:2.2, w:cw, h:0.56, fontSize:16, fontFace:"Microsoft YaHei UI", color:C.white, bold:false, margin:0 });
    sl.addText(v.desc,  { x, y:2.84, w:cw, h:1.05, fontSize:11, fontFace:"Microsoft YaHei UI", color:C.white, transparency:36, margin:0 });

    // Big ghost number
    sl.addText(v.nb, { x, y:4.0, w:cw, h:1.3, fontSize:74, fontFace:"Calibri", color:v.accent?C.ikb:C.white, transparency:v.accent?65:85, bold:false, margin:0 });
  });
}

// ════════════════════════════════════════════════════════════════════
// Slide 9 · Tech Highlights · 四卡片
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();
  sl.background = { color: C.paper };

  // Top accent bar
  sl.addShape(pres.shapes.RECTANGLE, { x:0.5, y:0.26, w:9, h:0.1, fill:{color:C.ikb}, line:{color:C.ikb} });

  sl.addText("技术亮点", { x:0.5, y:0.52, w:6, h:0.72, fontSize:34, fontFace:"Microsoft YaHei UI", color:C.ink, bold:false, margin:0 });
  sl.addText("TECH HIGHLIGHTS · 09 / 10", { x:6.5, y:0.68, w:3, h:0.26, fontSize:9, fontFace:"Calibri", color:C.grey3, charSpacing:2, align:"right", margin:0 });

  const techs = [
    { tag:"性能极致", big:"Vite\n8.0",    desc:"闪电般冷启动与热更新，开发体验无与伦比。",        accent:false },
    { tag:"类型安全", big:"TS\n6.0",      desc:"TypeScript 全量类型覆盖，告别运行时错误。",       accent:true  },
    { tag:"工程保障", big:"Vitest\n4.1",  desc:"完善的单元与组件测试套件，稳定可靠。",            accent:false },
    { tag:"架构清晰", big:"FSD\nDesign",  desc:"Feature-Sliced Design，模块清晰，高度可维护。", accent:false },
  ];

  const cw = 2.1, ch = 3.86;
  techs.forEach((t, i) => {
    const x = 0.5 + i * (cw + 0.2);
    const y = 1.52;
    const bg = t.accent ? C.ikb : C.grey1;
    const fg = t.accent ? C.white : C.ink;
    const dg = t.accent ? C.white : C.grey3;

    sl.addShape(pres.shapes.RECTANGLE, { x, y, w:cw, h:ch, fill:{color:bg}, line:{color:bg} });
    sl.addText(t.tag, { x:x+0.18, y:y+0.18, w:cw-0.36, h:0.26, fontSize:9,  fontFace:"Calibri",            color:t.accent?C.white:C.ikb, bold:true, charSpacing:2, transparency:t.accent?28:0, margin:0 });
    sl.addText(t.big, { x:x+0.18, y:y+0.56, w:cw-0.36, h:1.45, fontSize:26, fontFace:"Calibri",            color:fg, bold:false, margin:0 });
    sl.addText(t.desc,{ x:x+0.18, y:y+2.18, w:cw-0.36, h:1.52, fontSize:11, fontFace:"Microsoft YaHei UI", color:dg, transparency:t.accent?18:18, margin:0 });
  });
}

// ════════════════════════════════════════════════════════════════════
// Slide 10 · Closing · 左 IKB 右白 Split
// ════════════════════════════════════════════════════════════════════
{
  const sl = pres.addSlide();

  sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:5, h:H, fill:{color:C.ikb}, line:{color:C.ikb} });
  sl.addShape(pres.shapes.RECTANGLE, { x:5, y:0, w:5, h:H, fill:{color:C.paper}, line:{color:C.paper} });

  // Left chrome
  sl.addText("10 / 10", { x:0.5, y:0.27, w:2, h:0.22, fontSize:9, fontFace:"Calibri", color:C.white, transparency:40, charSpacing:2, margin:0 });
  sl.addText("CLOSING",  { x:2.5, y:0.27, w:2, h:0.22, fontSize:9, fontFace:"Calibri", color:C.white, transparency:40, charSpacing:3, align:"right", margin:0 });
  hairline(sl, 0.5, 0.54, 4.1, C.white, 65);

  sl.addText("CALL TO ACTION", { x:0.5, y:0.74, w:4, h:0.24, fontSize:9, fontFace:"Calibri", color:C.white, transparency:28, charSpacing:3, margin:0 });

  sl.addText([
    { text:"立即升级", options:{breakLine:true} },
    { text:"您的",     options:{breakLine:true} },
    { text:"数字生活", options:{italic:true} },
  ], {
    x:0.5, y:1.08, w:4.2, h:2.55,
    fontSize:40, fontFace:"Microsoft YaHei UI", color:C.white, bold:false, margin:0, lineSpacingMultiple:1.06
  });

  sl.addText(
    "Personal FileStore，为您而生。现代、优雅、安全，从此文件管理不再是难题。",
    { x:0.5, y:3.75, w:4.1, h:0.75, fontSize:11, fontFace:"Microsoft YaHei UI", color:C.white, transparency:18, margin:0 }
  );

  hairline(sl, 0.5, 4.6, 4.1, C.white, 64);
  sl.addText("Personal FileStore v1.6", { x:0.5, y:4.72, w:2.5, h:0.22, fontSize:9, fontFace:"Calibri", color:C.white, transparency:42, charSpacing:2, margin:0 });
  sl.addText("2026.05.18", { x:3, y:4.72, w:1.5, h:0.22, fontSize:9, fontFace:"Calibri", color:C.white, transparency:42, charSpacing:2, align:"right", margin:0 });

  // Right chrome
  sl.addText("TAKEAWAYS", { x:5.4, y:0.27, w:3, h:0.22, fontSize:9, fontFace:"Calibri", color:C.grey3, charSpacing:3, margin:0 });
  sl.addText("03 RULES",  { x:8.4, y:0.27, w:1.1, h:0.22, fontSize:9, fontFace:"Calibri", color:C.grey3, charSpacing:2, align:"right", margin:0 });
  hairline(sl, 5.4, 0.54, 4.1);

  const takes = [
    { nb:"01", title:"Apple-like 极致体验", desc:"精心打磨的极简 UI，视频背景登录，硬件加速微动效，每次操作都是享受。" },
    { nb:"02", title:"工程级现代技术栈",   desc:"React 19 + TypeScript 6.0 + Vite 8.0，完整测试覆盖，代码质量有保障。" },
    { nb:"03", title:"AI 赋能，面向未来",  desc:"集成前沿 AI 图像处理，双端架构扩展灵活，持续迭代，与未来同行。", accent:true },
  ];

  takes.forEach((t, i) => {
    const y = 0.72 + i * 1.46;
    const clr = t.accent ? C.ikb : C.ink;
    sl.addShape(pres.shapes.LINE, { x:5.4, y, w:4.1, h:0, line:{color:t.accent?C.ikb:C.grey2, width:t.accent?1:0.5} });
    sl.addText(t.nb,    { x:5.4, y:y+0.1, w:0.65, h:0.88, fontSize:30, fontFace:"Calibri", color:clr, bold:false, valign:"top", margin:0 });
    sl.addText(t.title, { x:6.1, y:y+0.12, w:3.4, h:0.36, fontSize:14, fontFace:"Microsoft YaHei UI", color:clr, bold:true, margin:0 });
    sl.addText(t.desc,  { x:6.1, y:y+0.52, w:3.4, h:0.58, fontSize:11, fontFace:"Microsoft YaHei UI", color:C.grey3, margin:0 });
    if (t.accent) {
      sl.addShape(pres.shapes.LINE, { x:5.4, y:y+1.34, w:4.1, h:0, line:{color:C.ikb, width:1.2} });
    }
  });

  sl.addText("→ 完 · Personal FileStore", { x:5.4, y:5.22, w:4.1, h:0.22, fontSize:9, fontFace:"Calibri", color:C.grey3, charSpacing:2, align:"right", margin:0 });
}

// ── Write output ──────────────────────────────────────────────────────
const OUTPUT = "e:\\新文件系统\\ppt\\Personal_FileStore_产品介绍.pptx";
pres.writeFile({ fileName: OUTPUT })
  .then(() => console.log("✓ PPTX 生成成功:", OUTPUT))
  .catch(err => { console.error("✗ 生成失败:", err); process.exit(1); });
