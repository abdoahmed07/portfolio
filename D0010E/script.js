// ── UTILS ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    hljs.highlightAll();
    function waitForWordList() {
        if (typeof WORD_SET !== "undefined") {
            document.getElementById("dictStatus").textContent = `${WORD_SET.size.toLocaleString()} words loaded`;
            document.getElementById("dictStatus").classList.add("loaded");
            document.getElementById("spellBtn").disabled = false;
        } else { setTimeout(waitForWordList, 100); }
    }
    waitForWordList();
    setTimeout(drawGame, 150);
    setTimeout(() => {
        const pill = document.querySelector('.bfs-pill');
        if (pill) loadGraph(0, pill);
    }, 100);
    setTimeout(cwInit, 300);
});

function toggleCode(btn) {
    const card = btn.closest(".project-card");
    const body = card.querySelector(".code-body");
    const isOpen = body.classList.contains("open");
    body.classList.toggle("open", !isOpen);
    btn.classList.toggle("open", !isOpen);
    btn.textContent = isOpen ? "View Code" : "Hide Code";
}

function switchCodeTab(btn, targetId) {
    const card = btn.closest(".project-card");
    card.querySelectorAll(".code-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    card.querySelectorAll(".code-body > div[id]").forEach(el => el.classList.add("hidden"));
    document.getElementById(targetId).classList.remove("hidden");
}

// ══════════ ARITHMETIC QUIZ ═══════════════════════════════
let quizQuestions=[], quizIndex=0, quizScore=0, quizAttempt=1, quizBreakdown=[];
const OPS=['+','-','*','/'];
function generateQuestion(){
    const op=OPS[Math.floor(Math.random()*4)];
    let a,b;
    switch(op){
        case '+':{a=Math.floor(101*Math.random());b=Math.floor((101-a)*Math.random());break;}
        case '-':{a=9+Math.floor(92*Math.random());b=Math.floor((1+a)*Math.random());break;}
        case '*':{a=Math.floor(51*Math.random());b=Math.floor(13*Math.random());break;}
        default:{const ans=Math.floor(13*Math.random());b=1+Math.floor(12*Math.random());a=b*ans;}
    }
    return{op,a,b,answer:op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:Math.floor(a/b)};
}
function startQuiz(){
    quizQuestions=Array.from({length:10},generateQuestion);
    quizIndex=0;quizScore=0;quizAttempt=1;quizBreakdown=[];
    document.getElementById("quizStart").classList.add("hidden");
    document.getElementById("quizResults").classList.add("hidden");
    document.getElementById("quizGame").classList.remove("hidden");
    showQuestion();
}
function showQuestion(){
    const q=quizQuestions[quizIndex];
    document.getElementById("quizQuestion").textContent=`What is ${q.a} ${q.op} ${q.b} ?`;
    document.getElementById("quizAttemptLabel").textContent=quizAttempt===1?"First attempt — 10 pts":"Second attempt — 5 pts";
    document.getElementById("quizAnswer").value="";
    document.getElementById("quizAnswer").focus();
    document.getElementById("quizFeedback").classList.add("hidden");
    document.getElementById("quizProgressFill").style.width=(quizIndex/10*100)+"%";
    document.getElementById("quizProgressLabel").textContent=`Question ${quizIndex+1} / 10`;
    document.getElementById("quizScore").textContent=quizScore;
}
function showFeedback(msg,type){
    const el=document.getElementById("quizFeedback");
    el.textContent=msg;el.className=`quiz-feedback quiz-feedback-${type}`;
}
function submitAnswer(){
    const input=document.getElementById("quizAnswer");
    const val=parseInt(input.value);
    if(isNaN(val)){input.focus();return;}
    const q=quizQuestions[quizIndex];
    if(val===q.answer){
        const pts=quizAttempt===1?10:5;quizScore+=pts;
        quizBreakdown.push({q,pts,correct:true});
        showFeedback(`✓ Correct! +${pts} points`,"correct");
        quizAttempt=1;quizIndex++;
        setTimeout(()=>{if(quizIndex>=10)endQuiz();else showQuestion();},900);
    } else if(quizAttempt===1){
        showFeedback("✗ Incorrect. Try again!","wrong");quizAttempt=2;
        setTimeout(showQuestion,700);
    } else {
        quizBreakdown.push({q,pts:0,correct:false});
        showFeedback(`✗ Incorrect. The answer was ${q.answer}.`,"wrong");
        quizAttempt=1;quizIndex++;
        setTimeout(()=>{if(quizIndex>=10)endQuiz();else showQuestion();},1200);
    }
}
function endQuiz(){
    document.getElementById("quizGame").classList.add("hidden");
    document.getElementById("quizResults").classList.remove("hidden");
    const msg=quizScore===100?"Perfect score! 🏆":quizScore>=80?"Great work! 🎉":quizScore>=50?"Not bad — keep practising.":"Keep at it — you'll get there.";
    document.getElementById("quizFinalScore").textContent=`${quizScore} / 100`;
    document.getElementById("quizFinalMsg").textContent=msg;
    document.getElementById("quizBreakdown").innerHTML=quizBreakdown.map(({q,pts,correct})=>`
        <div class="breakdown-row ${correct?'bd-correct':'bd-wrong'}">
            <span class="bd-q">${q.a} ${q.op} ${q.b} = ${q.answer}</span>
            <span class="bd-pts">${pts>0?'+'+pts:'0'} pts</span>
        </div>`).join("");
}

// ══════════ SPELLCHECK ════════════════════════════════════
function tryWord(el){document.getElementById("spellInput").value=el.textContent;checkSpelling();}
function clearSpellResult(){document.getElementById("spellResult").classList.add("hidden");}
function checkSpelling(){
    if(typeof WORD_SET==="undefined")return;
    const raw=document.getElementById("spellInput").value.trim().toLowerCase();
    if(!raw)return;
    const result=document.getElementById("spellResult");
    const verdict=document.getElementById("spellVerdict");
    const suggs=document.getElementById("spellSuggestions");
    result.classList.remove("hidden");
    if(WORD_SET.has(raw)){verdict.innerHTML=`<span class="spell-correct">✓</span> "<strong>${raw}</strong>" is spelled correctly.`;suggs.innerHTML="";return;}
    verdict.innerHTML=`<span class="spell-wrong">✗</span> "<strong>${raw}</strong>" is not in the dictionary.`;
    const found=new Set();
    for(let i=0;i<raw.length;i++){const s=raw.slice(0,i)+raw.slice(i+1);if(WORD_SET.has(s))found.add({word:s,method:"delete"});}
    for(let c=97;c<=122;c++)for(let i=0;i<=raw.length;i++){const s=raw.slice(0,i)+String.fromCharCode(c)+raw.slice(i);if(WORD_SET.has(s))found.add({word:s,method:"insert"});}
    for(let i=0;i<raw.length;i++)for(let c=97;c<=122;c++){if(c===raw.charCodeAt(i))continue;const s=raw.slice(0,i)+String.fromCharCode(c)+raw.slice(i+1);if(WORD_SET.has(s))found.add({word:s,method:"replace"});}
    for(let i=0;i<raw.length-1;i++){const arr=raw.split("");[arr[i],arr[i+1]]=[arr[i+1],arr[i]];const s=arr.join("");if(WORD_SET.has(s))found.add({word:s,method:"swap"});}
    const spaced=[];
    for(let i=1;i<raw.length;i++){const a=raw.slice(0,i),b=raw.slice(i);if(WORD_SET.has(a)&&WORD_SET.has(b))spaced.push(a+" "+b);}
    const wordsSeen=new Set();const unique=[];
    found.forEach(item=>{if(!wordsSeen.has(item.word)){wordsSeen.add(item.word);unique.push(item);}});
    const LABELS={delete:"delete a letter",insert:"add a letter",replace:"change a letter",swap:"swap letters"};
    if(unique.length===0&&spaced.length===0){suggs.innerHTML='<div class="no-sugg">No suggestions found.</div>';return;}
    suggs.innerHTML=`<div class="sugg-label">Did you mean:</div><div class="sugg-chips">
        ${unique.map(({word,method})=>`<div class="sugg-chip" onclick="acceptSuggestion('${word}')"><span class="sugg-word">${word}</span><span class="sugg-method">${LABELS[method]}</span></div>`).join("")}
        ${spaced.map(s=>`<div class="sugg-chip" onclick="acceptSuggestion('${s}')"><span class="sugg-word">${s}</span><span class="sugg-method">split into two words</span></div>`).join("")}
    </div>`;
}
function acceptSuggestion(word){document.getElementById("spellInput").value=word;checkSpelling();}

// ══════════ MYARRAYLIST DEMO ══════════════════════════════
class MyArrayList {
    constructor(cap=10){this._array=new Array(cap).fill(null);this._size=0;this._capacity=cap;}
    get size(){return this._size;}
    get capacity(){return this._capacity;}
    isEmpty(){return this._size===0;}
    ensureCapacity(min){
        if(min>this._capacity){
            const nc=Math.max(this._capacity*2+1,min);
            const na=new Array(nc).fill(null);
            for(let i=0;i<this._size;i++)na[i]=this._array[i];
            this._array=na;this._capacity=nc;
        }
    }
    add(indexOrVal,val){
        if(val===undefined){this.ensureCapacity(this._size+1);this._array[this._size++]=indexOrVal;return true;}
        const index=indexOrVal;
        if(index<0||index>this._size)throw new RangeError(`IndexOutOfBounds: index=${index}, size=${this._size}`);
        this.ensureCapacity(this._size+1);
        for(let i=this._size;i>index;i--)this._array[i]=this._array[i-1];
        this._array[index]=val;this._size++;
    }
    get(index){if(index<0||index>=this._size)throw new RangeError(`IndexOutOfBounds: index=${index}, size=${this._size}`);return this._array[index];}
    set(index,val){if(index<0||index>=this._size)throw new RangeError(`IndexOutOfBounds: index=${index}, size=${this._size}`);const old=this._array[index];this._array[index]=val;return old;}
    removeAt(index){if(index<0||index>=this._size)throw new RangeError(`IndexOutOfBounds: index=${index}, size=${this._size}`);const removed=this._array[index];this.removeRange(index,index+1);return removed;}
    removeRange(from,to){
        if(from<0||to>this._size||from>to)throw new RangeError(`IndexOutOfBounds`);
        const count=to-from;
        for(let i=to;i<this._size;i++)this._array[i-count]=this._array[i];
        for(let i=this._size-count;i<this._size;i++)this._array[i]=null;
        this._size-=count;
    }
    indexOf(val){for(let i=0;i<this._size;i++)if(this._array[i]===val)return i;return -1;}
    removeObj(val){const idx=this.indexOf(val);if(idx===-1)return false;this.removeAt(idx);return true;}
    contains(val){return this.indexOf(val)!==-1;}
    clone(){const copy=new MyArrayList(this._size);for(let i=0;i<this._size;i++)copy._array[i]=this._array[i];copy._size=this._size;return copy;}
    toArray(){return this._array.slice(0,this._size);}
    clear(){this._array.fill(null);this._size=0;}
    toDisplay(){return this._array.slice(0,this._size);}
}

let alList=new MyArrayList(10),alClone=null;
function alLog(msg,type="muted"){const term=document.getElementById("alTerminal");const line=document.createElement("div");line.className=`pb-line pb-${type}`;line.textContent=msg;term.appendChild(line);term.scrollTop=term.scrollHeight;}
function alEcho(cmd){const term=document.getElementById("alTerminal");const line=document.createElement("div");line.className="pb-line pb-cmd";line.textContent="list> "+cmd;term.appendChild(line);term.scrollTop=term.scrollHeight;}
function alRender(highlight=-1){
    const cells=document.getElementById("alCells");const label=document.getElementById("alSizeLabel");
    const items=alList.toDisplay();
    label.textContent=`size: ${alList.size} · capacity: ${alList.capacity}`;
    if(items.length===0){cells.innerHTML='<div class="al-empty-msg">List is empty. Add some elements.</div>';return;}
    cells.innerHTML=items.map((v,i)=>`<div class="al-cell ${i===highlight?'al-cell-highlight':''}"><span class="al-cell-idx">${i}</span><span class="al-cell-val">${v}</span></div>`).join("")+
        (alClone?`<div class="al-clone-sep">clone →</div>${alClone.toDisplay().map((v,i)=>`<div class="al-cell al-cell-clone"><span class="al-cell-idx">${i}</span><span class="al-cell-val">${v}</span></div>`).join("")}`:"");
}
const alForms={
    add:      {fields:["Value (integer)"],run:(v)=>{alList.add(parseInt(v[0]));alLog(`add(${v[0]}) → [${alList.toDisplay().join(", ")}]`,"success");alRender(alList.size-1);}},
    addAt:    {fields:["Index","Value"],  run:(v)=>{alList.add(parseInt(v[0]),parseInt(v[1]));alLog(`add(${v[0]},${v[1]}) → inserted`,"success");alRender(parseInt(v[0]));}},
    get:      {fields:["Index"],          run:(v)=>{const r=alList.get(parseInt(v[0]));alLog(`get(${v[0]}) → ${r}`,"success");alRender(parseInt(v[0]));}},
    set:      {fields:["Index","Value"],  run:(v)=>{const old=alList.set(parseInt(v[0]),parseInt(v[1]));alLog(`set(${v[0]},${v[1]}) → replaced ${old}`,"success");alRender(parseInt(v[0]));}},
    removeIdx:{fields:["Index"],          run:(v)=>{const r=alList.removeAt(parseInt(v[0]));alLog(`remove(${v[0]}) → removed ${r}`,"success");alRender();}},
    removeObj:{fields:["Value"],          run:(v)=>{const r=alList.removeObj(parseInt(v[0]));alLog(`remove(${v[0]}) → ${r?"removed":"not found"}`,r?"success":"error");alRender();}},
    indexOf:  {fields:["Value"],          run:(v)=>{const r=alList.indexOf(parseInt(v[0]));alLog(`indexOf(${v[0]}) → ${r}`,r>=0?"success":"error");if(r>=0)alRender(r);}},
    contains: {fields:["Value"],          run:(v)=>{const r=alList.contains(parseInt(v[0]));alLog(`contains(${v[0]}) → ${r}`,r?"success":"error");}},
};
function alSetAction(action){
    document.querySelectorAll(".pb-quick").forEach(b=>b.classList.remove("active"));
    event.target.classList.add("active");
    const area=document.getElementById("alInputArea");const form=alForms[action];
    if(!form)return;
    area.innerHTML=`<div class="demo-dict-row" style="margin-top:12px">${form.fields.map((f,i)=>`<input class="demo-input" type="number" id="alF${i}" placeholder="${f}" autocomplete="off" style="max-width:160px">`).join("")}<button class="demo-btn demo-btn-sm" onclick="alSubmit('${action}')">${action}</button></div>`;
    form.fields.forEach((_,i)=>document.getElementById(`alF${i}`)?.addEventListener("keydown",e=>{if(e.key==="Enter")alSubmit(action);}));
    document.getElementById("alF0")?.focus();
}
function alSubmit(action){
    const form=alForms[action];const vals=form.fields.map((_,i)=>document.getElementById(`alF${i}`)?.value.trim()||"");
    alEcho(`${action}(${vals.join(",")})`);
    try{form.run(vals);form.fields.forEach((_,i)=>{const el=document.getElementById(`alF${i}`);if(el)el.value="";});document.getElementById("alF0")?.focus();}
    catch(e){alLog(`✗ ${e.message}`,"error");alRender();}
}
function alRunCmd(cmd){
    document.querySelectorAll(".pb-quick").forEach(b=>b.classList.remove("active"));
    document.getElementById("alInputArea").innerHTML="";
    alEcho(cmd+"()");
    try{
        if(cmd==="size"){alLog(`size() → ${alList.size}`,"success");}
        if(cmd==="clear"){alList.clear();alClone=null;alLog("clear() → empty","success");alRender();}
        if(cmd==="clone"){alClone=alList.clone();alLog(`clone() → copy of size ${alClone.size}`,"success");alRender();}
        if(cmd==="toArray"){alLog(`toArray() → [${alList.toArray().join(", ")}]`,"success");}
    }catch(e){alLog(`✗ ${e.message}`,"error");}
}
function alRunRawCmd(){
    const input=document.getElementById("alCmd");const raw=input.value.trim();if(!raw)return;input.value="";alEcho(raw);
    const parts=raw.split(/\s+/);const action=parts[0].toLowerCase();const args=parts.slice(1).map(Number);
    try{
        switch(action){
            case"add":if(args.length===2){alList.add(args[0],args[1]);alLog(`add(${args[0]},${args[1]}) → done`,"success");alRender(args[0]);}else{alList.add(args[0]);alLog(`add(${args[0]}) → done`,"success");alRender(alList.size-1);}break;
            case"get":alLog(`get(${args[0]}) → ${alList.get(args[0])}`,"success");alRender(args[0]);break;
            case"set":alLog(`set(${args[0]},${args[1]}) → ${alList.set(args[0],args[1])}`,"success");alRender(args[0]);break;
            case"remove":alLog(`remove(${args[0]}) → ${alList.removeAt(args[0])}`,"success");alRender();break;
            case"indexof":alLog(`indexOf(${args[0]}) → ${alList.indexOf(args[0])}`,"success");break;
            case"contains":alLog(`contains(${args[0]}) → ${alList.contains(args[0])}`,"success");break;
            case"size":alLog(`size() → ${alList.size}`,"success");break;
            case"clear":alList.clear();alClone=null;alLog("clear() → done","success");alRender();break;
            case"clone":alClone=alList.clone();alLog(`clone() → created`,"success");alRender();break;
            case"toarray":alLog(`toArray() → [${alList.toArray().join(", ")}]`,"success");break;
            default:alLog(`Unknown: ${action}`,"error");
        }
    }catch(e){alLog(`✗ ${e.message}`,"error");}
}
alRender();

// ══════════ LAB 3: ROOM NAVIGATION GAME ══════════════════
const NORR=0,ÖSTER=1,SÖDER=2,VÄSTER=3;
const DIR_NAMES=['N (W)','E (D)','S (S)','W (A)'];
let gameRooms=[
    {name:'Red',    color:'#FF0000',w:75, h:75, x:25, y:25, exits:[null,null,null,null]},
    {name:'Blue',   color:'#0000FF',w:75, h:50, x:50, y:150,exits:[null,null,null,null]},
    {name:'Magenta',color:'#FF00FF',w:100,h:50, x:175,y:100,exits:[null,null,null,null]},
    {name:'Yellow', color:'#FFFF00',w:100,h:75, x:200,y:200,exits:[null,null,null,null]},
    {name:'Cyan',   color:'#00FFFF',w:100,h:75, x:325,y:50, exits:[null,null,null,null]},
    {name:'Orange', color:'#FF8000',w:75, h:75, x:450,y:125,exits:[null,null,null,null]},
    {name:'Pink',   color:'#FFB6C1',w:100,h:50, x:275,y:325,exits:[null,null,null,null]},
    {name:'Green',  color:'#00CC00',w:75, h:100,x:75, y:275,exits:[null,null,null,null]},
];
const CORRIDORS=[[0,SÖDER,1,NORR],[0,ÖSTER,2,NORR],[1,SÖDER,3,VÄSTER],[2,SÖDER,3,NORR],[2,ÖSTER,4,VÄSTER],[4,ÖSTER,5,NORR],[5,SÖDER,6,ÖSTER],[3,ÖSTER,5,VÄSTER],[3,SÖDER,6,NORR],[7,ÖSTER,6,VÄSTER]];
let currentRoom=5,corridorColor='rgb(123,63,0)',bgColor='#00CC00';

function buildExits(){
    gameRooms.forEach(r=>r.exits=[null,null,null,null]);
    for(const[fi,fd,ti,td]of CORRIDORS){gameRooms[fi].exits[fd]=ti;gameRooms[ti].exits[td]=fi;}
}
buildExits();

function getCanvasParams(canvas){
    const PAD=40,scaleX=(canvas.width-PAD*2)/525,scaleY=(canvas.height-PAD*2)/375,scale=Math.min(scaleX,scaleY);
    return{scale,offX:PAD,offY:PAD};
}
function roomRect(r,scale,offX,offY){return{sx:r.x*scale+offX,sy:r.y*scale+offY,sw:r.w*scale,sh:r.h*scale};}
function baspunkt(r,dir,scale,offX,offY){
    const{sx,sy,sw,sh}=roomRect(r,scale,offX,offY);const midX=sx+sw/2,midY=sy+sh/2;
    if(dir===NORR)return[midX,sy];if(dir===SÖDER)return[midX,sy+sh];if(dir===ÖSTER)return[sx+sw,midY];if(dir===VÄSTER)return[sx,midY];
}
function pivotpunkt(r,dir,scale,offX,offY){
    const[bx,by]=baspunkt(r,dir,scale,offX,offY);const o=7*scale;
    if(dir===NORR)return[bx,by-o];if(dir===SÖDER)return[bx,by+o];if(dir===ÖSTER)return[bx+o,by];if(dir===VÄSTER)return[bx-o,by];
}
function drawGame(){
    const canvas=document.getElementById('gameCanvas');if(!canvas||!gameRooms)return;
    const ctx=canvas.getContext('2d');const{scale,offX,offY}=getCanvasParams(canvas);
    ctx.fillStyle=bgColor;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle=corridorColor;ctx.lineWidth=Math.max(3,8*scale);ctx.lineCap='round';ctx.lineJoin='round';
    for(const[fi,fd,ti,td]of CORRIDORS){
        const[bfx,bfy]=baspunkt(gameRooms[fi],fd,scale,offX,offY);const[pfx,pfy]=pivotpunkt(gameRooms[fi],fd,scale,offX,offY);
        const[ptx,pty]=pivotpunkt(gameRooms[ti],td,scale,offX,offY);const[btx,bty]=baspunkt(gameRooms[ti],td,scale,offX,offY);
        ctx.beginPath();ctx.moveTo(bfx,bfy);ctx.lineTo(pfx,pfy);ctx.lineTo(ptx,pty);ctx.lineTo(btx,bty);ctx.stroke();
    }
    for(let i=0;i<gameRooms.length;i++){
        const r=gameRooms[i];const{sx,sy,sw,sh}=roomRect(r,scale,offX,offY);
        ctx.fillStyle=r.color;ctx.fillRect(sx,sy,sw,sh);
        ctx.strokeStyle='#000000';ctx.lineWidth=Math.max(2,8*scale);ctx.lineJoin='miter';ctx.strokeRect(sx,sy,sw,sh);
        if(i===currentRoom){ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=2;ctx.strokeRect(sx+4,sy+4,sw-8,sh-8);}
    }
    const cr=gameRooms[currentRoom];const{sx,sy,sw,sh}=roomRect(cr,scale,offX,offY);
    ctx.fillStyle='#000000';ctx.beginPath();ctx.arc(sx+sw/2,sy+sh/2,Math.max(3,4*scale),0,Math.PI*2);ctx.fill();
    const exits=cr.exits.map((e,i)=>e!==null?DIR_NAMES[i]:null).filter(Boolean);
    const descEl=document.getElementById('gameDesc');
    if(descEl){
        const col=cr.color==='#FFFF00'?'#cccc00':cr.color;
        descEl.innerHTML=`You are in the <strong style="color:${col}">${cr.name}</strong> room. `+(exits.length?`Exits: <strong>${exits.join(' · ')}</strong>. Use WASD to navigate.`:`No exits from here.`);
    }
    document.getElementById('statusRoom').textContent=`Current room: ${cr.name}`;
    document.getElementById('statusExits').textContent=exits.length?`Exits: ${exits.join('  ·  ')}`:'No exits';
}
function movePlayer(dir){const dest=gameRooms[currentRoom].exits[dir];if(dest!==null){currentRoom=dest;drawGame();}}

document.getElementById('gameCanvas')?.addEventListener('click',function(e){
    const rect=this.getBoundingClientRect();const mx=(e.clientX-rect.left)*(this.width/rect.width);const my=(e.clientY-rect.top)*(this.height/rect.height);
    const canvas=this;const{scale,offX,offY}=getCanvasParams(canvas);
    for(let i=0;i<gameRooms.length;i++){
        if(i===currentRoom||!gameRooms[currentRoom].exits.includes(i))continue;
        const{sx,sy,sw,sh}=roomRect(gameRooms[i],scale,offX,offY);
        if(mx>=sx&&mx<=sx+sw&&my>=sy&&my<=sy+sh){currentRoom=i;drawGame();break;}
    }
});
document.getElementById('mapWrap')?.addEventListener('keydown',function(e){
    const map={w:NORR,W:NORR,d:ÖSTER,D:ÖSTER,s:SÖDER,S:SÖDER,a:VÄSTER,A:VÄSTER};
    if(e.key in map){e.preventDefault();movePlayer(map[e.key]);}
});
document.getElementById('mapWrap')?.addEventListener('click',function(){this.focus();});

function openRoomEditor(){document.getElementById('roomEditorOverlay').classList.remove('re-hidden');renderEditorList();}
function closeRoomEditor(){document.getElementById('roomEditorOverlay').classList.add('re-hidden');buildExits();drawGame();}
const PRESET_COLORS=[
    {name:'Red',hex:'#FF0000'},{name:'Blue',hex:'#0000FF'},{name:'Magenta',hex:'#FF00FF'},
    {name:'Yellow',hex:'#FFFF00'},{name:'Cyan',hex:'#00FFFF'},{name:'Orange',hex:'#FF8000'},
    {name:'Pink',hex:'#FFB6C1'},{name:'Green',hex:'#00CC00'},{name:'Purple',hex:'#8B00FF'},
    {name:'Lime',hex:'#BFEF45'},{name:'Teal',hex:'#008080'},{name:'Coral',hex:'#FF6B6B'},
    {name:'White',hex:'#FFFFFF'},{name:'Grey',hex:'#888888'},
];
function renderEditorList(){
    const list=document.getElementById('reRoomList');
    list.innerHTML=gameRooms.map((r,i)=>`
        <div class="re-room-row" id="reRow${i}">
            <div class="re-room-swatch re-col-color" style="background:${r.color}" onclick="toggleColorPicker(${i})"></div>
            <input class="re-input re-name re-col-name" value="${r.name}" onchange="gameRooms[${i}].name=this.value;drawGame()">
            <input class="re-input re-num re-col-w" type="number" value="${r.w}" min="30" max="200" onchange="gameRooms[${i}].w=parseInt(this.value)||50;drawGame()" title="Width">
            <span class="re-x re-col-x">×</span>
            <input class="re-input re-num re-col-h" type="number" value="${r.h}" min="30" max="200" onchange="gameRooms[${i}].h=parseInt(this.value)||50;drawGame()" title="Height">
            <input class="re-input re-num re-col-at" type="number" value="${r.x}" min="0" max="480" onchange="gameRooms[${i}].x=parseInt(this.value);drawGame()" title="X">
            <span class="re-comma re-col-comma">,</span>
            <input class="re-input re-num re-col-y" type="number" value="${r.y}" min="0" max="360" onchange="gameRooms[${i}].y=parseInt(this.value);drawGame()" title="Y">
            <div id="reColorPicker${i}" class="re-color-picker re-hidden">
                ${PRESET_COLORS.map(c=>`<div class="re-color-swatch" style="background:${c.hex}" title="${c.name}" onclick="setRoomColor(${i},'${c.hex}')"></div>`).join('')}
                <input type="color" class="re-color-custom" value="${r.color}" oninput="setRoomColor(${i},this.value)" title="Custom">
            </div>
        </div>`).join('');
}
function toggleColorPicker(i){const p=document.getElementById(`reColorPicker${i}`);document.querySelectorAll('.re-color-picker').forEach((x,pi)=>{if(pi!==i)x.classList.add('re-hidden');});p.classList.toggle('re-hidden');}
function setRoomColor(i,hex){gameRooms[i].color=hex;document.querySelector(`#reRow${i} .re-room-swatch`).style.background=hex;document.getElementById(`reColorPicker${i}`).classList.add('re-hidden');drawGame();}
function toggleBgPicker(){document.getElementById('bgPicker').classList.toggle('re-hidden');document.getElementById('corridorPicker').classList.add('re-hidden');}
function setBgColor(hex){bgColor=hex;document.getElementById('bgSwatch').style.background=hex;document.getElementById('bgPicker').classList.add('re-hidden');drawGame();}
function toggleCorridorPicker(){document.getElementById('corridorPicker').classList.toggle('re-hidden');document.getElementById('bgPicker').classList.add('re-hidden');}
function setCorridorColor(hex){corridorColor=hex;document.getElementById('corridorSwatch').style.background=hex;document.getElementById('corridorPicker').classList.add('re-hidden');drawGame();}
function resetRooms(){
    gameRooms=[
        {name:'Red',    color:'#FF0000',w:75, h:75, x:25, y:25, exits:[null,null,null,null]},
        {name:'Blue',   color:'#0000FF',w:75, h:50, x:50, y:150,exits:[null,null,null,null]},
        {name:'Magenta',color:'#FF00FF',w:100,h:50, x:175,y:100,exits:[null,null,null,null]},
        {name:'Yellow', color:'#FFFF00',w:100,h:75, x:200,y:200,exits:[null,null,null,null]},
        {name:'Cyan',   color:'#00FFFF',w:100,h:75, x:325,y:50, exits:[null,null,null,null]},
        {name:'Orange', color:'#FF8000',w:75, h:75, x:450,y:125,exits:[null,null,null,null]},
        {name:'Pink',   color:'#FFB6C1',w:100,h:50, x:275,y:325,exits:[null,null,null,null]},
        {name:'Green',  color:'#00CC00',w:75, h:100,x:75, y:275,exits:[null,null,null,null]},
    ];
    currentRoom=5;corridorColor='rgb(123,63,0)';bgColor='#00CC00';
    document.getElementById('corridorSwatch').style.background='rgb(123,63,0)';
    document.getElementById('bgSwatch').style.background='#00CC00';
    buildExits();renderEditorList();drawGame();
}

// ══════════ LAB 4: BFS DEMO ═══════════════════════════════
const GRAPH_DATA=[
  {nodes:Array.from({length:100},(_,i)=>({id:i,x:(Math.floor(i/10))*50,y:(i%10)*50})),
   edges:(()=>{const e=[];for(let r=0;r<10;r++)for(let c=0;c<9;c++){e.push([r*10+c,r*10+c+1]);e.push([r*10+c+1,r*10+c]);}for(let i=0;i<90;i++){e.push([i,i+10]);e.push([i+10,i]);}return e;})()},
  {nodes:Array.from({length:16},(_,i)=>({id:i,x:(Math.floor(i/4))*50,y:(i%4)*50})),
   edges:(()=>{const e=[];const raw=[[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[8,9],[9,10],[10,11],[12,13],[13,14],[14,15],[0,4],[1,5],[2,6],[3,7],[4,8],[5,9],[6,10],[7,11],[8,12],[9,13],[10,14],[11,15]];raw.forEach(([a,b])=>{e.push([a,b]);e.push([b,a]);});return e;})()}
];
const BFS_COLORS=['#f59e0b','#fb923c','#f87171','#c084fc','#60a5fa','#34d399','#facc15','#a78bfa','#38bdf8','#4ade80','#f472b6','#818cf8'];
let bfsGraph=null,bfsVisited={},bfsLevel={},bfsQueue=[],bfsStarted=false,bfsAutoTimer=null;

function loadGraph(idx,btn){
    document.querySelectorAll('.bfs-pill').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    const data=GRAPH_DATA[idx];const adj={};data.nodes.forEach(n=>adj[n.id]=[]);
    data.edges.forEach(([a,b])=>{if(!adj[a].includes(b))adj[a].push(b);});
    bfsGraph={nodes:data.nodes,adj};bfsReset();
}
function bfsReset(){
    clearInterval(bfsAutoTimer);bfsAutoTimer=null;bfsVisited={};bfsLevel={};bfsQueue=[];bfsStarted=false;
    document.getElementById('bfsRunBtn').textContent='▶ Run All';
    updateQueueVis();bfsLogClear();bfsLogAdd('Click any node to start BFS, or press Step/Run for random start.','muted');
    updateProgress(0,bfsGraph?bfsGraph.nodes.length:0);bfsDrawGraph(-1);document.getElementById('bfsLegend').innerHTML='';
}
function bfsStartFrom(nodeId){
    bfsReset();bfsStarted=true;bfsVisited[nodeId]=true;bfsLevel[nodeId]=0;bfsQueue.push(nodeId);
    bfsLogClear();bfsLogAdd(`Start BFS from node ${nodeId}`,'accent');bfsLogAdd(`→ Enqueue ${nodeId}. Mark visited.`,'normal');
    updateQueueVis();updateProgress(1,bfsGraph.nodes.length);bfsDrawGraph(nodeId);updateLegend();
}
function bfsStep(){
    if(!bfsStarted){const idx=Math.floor(Math.random()*bfsGraph.nodes.length);bfsStartFrom(bfsGraph.nodes[idx].id);return;}
    if(bfsQueue.length===0)return;
    const current=bfsQueue.shift();const currentLevel=bfsLevel[current];
    bfsLogAdd(`Dequeue ${current} (level ${currentLevel})`,'dequeue');
    const neighbours=bfsGraph.adj[current]||[];const enqueued=[];
    neighbours.forEach(nb=>{if(!bfsVisited[nb]){bfsVisited[nb]=true;bfsLevel[nb]=currentLevel+1;bfsQueue.push(nb);enqueued.push(nb);}});
    if(enqueued.length>0)bfsLogAdd(`  Enqueue: [${enqueued.join(', ')}] → level ${currentLevel+1}`,'enqueue');
    else bfsLogAdd('  No new neighbours.','muted');
    const visitedCount=Object.keys(bfsVisited).length;
    updateProgress(visitedCount,bfsGraph.nodes.length);updateQueueVis();bfsDrawGraph(current);updateLegend();
    if(bfsQueue.length===0){bfsLogAdd(`✓ BFS complete. ${visitedCount} nodes visited.`,'accent');}
}
function bfsRun(){
    if(!bfsStarted){const idx=Math.floor(Math.random()*bfsGraph.nodes.length);bfsStartFrom(bfsGraph.nodes[idx].id);}
    const btn=document.getElementById('bfsRunBtn');
    if(bfsAutoTimer){clearInterval(bfsAutoTimer);bfsAutoTimer=null;btn.textContent='▶ Run All';return;}
    btn.textContent='⏸ Pause';
    const delay=bfsGraph.nodes.length>20?60:180;
    bfsAutoTimer=setInterval(()=>{if(bfsQueue.length===0){clearInterval(bfsAutoTimer);bfsAutoTimer=null;btn.textContent='▶ Run All';return;}bfsStep();},delay);
}
function bfsNodePos(node,canvas){
    const nodes=bfsGraph.nodes;const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const PAD=28;
    return[(node.x-minX)/(maxX-minX||1)*(canvas.width-PAD*2)+PAD,(node.y-minY)/(maxY-minY||1)*(canvas.height-PAD*2)+PAD];
}
function bfsDrawGraph(activeNode){
    const canvas=document.getElementById('bfsCanvas');if(!canvas||!bfsGraph)return;
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#0d1117';ctx.fillRect(0,0,canvas.width,canvas.height);
    const nodeMap={};bfsGraph.nodes.forEach(n=>nodeMap[n.id]=n);const drawn=new Set();
    ctx.lineWidth=1;
    bfsGraph.nodes.forEach(n=>{
        const[x1,y1]=bfsNodePos(n,canvas);
        (bfsGraph.adj[n.id]||[]).forEach(nb=>{
            const key=[Math.min(n.id,nb),Math.max(n.id,nb)].join('-');if(drawn.has(key))return;drawn.add(key);
            const[x2,y2]=bfsNodePos(nodeMap[nb],canvas);
            ctx.strokeStyle=(bfsVisited[n.id]&&bfsVisited[nb])?'rgba(245,158,11,0.35)':'rgba(255,255,255,0.08)';
            ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
        });
    });
    const nodeR=bfsGraph.nodes.length>20?5:10;
    bfsGraph.nodes.forEach(n=>{
        const[x,y]=bfsNodePos(n,canvas);const level=bfsLevel[n.id];
        let fill='#1e293b';if(bfsVisited[n.id]!==undefined)fill=BFS_COLORS[level%BFS_COLORS.length];
        if(n.id===activeNode){ctx.shadowColor=fill;ctx.shadowBlur=12;}
        ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,nodeR,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        if(bfsQueue.includes(n.id)){ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,nodeR+2.5,0,Math.PI*2);ctx.stroke();}
        if(bfsGraph.nodes.length<=20){ctx.fillStyle='#000';ctx.font=`bold ${nodeR}px DM Mono,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.id,x,y);}
    });
}
function updateQueueVis(){
    const el=document.getElementById('bfsQueue');
    if(bfsQueue.length===0){el.innerHTML='<span class="bfs-queue-empty">Empty</span>';return;}
    const show=bfsQueue.slice(0,12);
    el.innerHTML=show.map((id,i)=>{const level=bfsLevel[id]??0;const col=BFS_COLORS[level%BFS_COLORS.length];const label=i===0?' <span class="bfs-front-tag">front</span>':'';return`<span class="bfs-qitem" style="background:${col}22;border-color:${col};color:${col}">${id}${label}</span>`;}).join('')+(bfsQueue.length>12?`<span class="bfs-qmore">+${bfsQueue.length-12} more</span>`:'');
}
function bfsLogClear(){document.getElementById('bfsLog').innerHTML='';}
function bfsLogAdd(msg,type){const log=document.getElementById('bfsLog');const div=document.createElement('div');div.className=`bfs-log-line bfs-log-${type}`;div.textContent=msg;log.appendChild(div);log.scrollTop=log.scrollHeight;}
function updateProgress(visited,total){const pct=total>0?(visited/total)*100:0;document.getElementById('bfsProgressFill').style.width=pct+'%';document.getElementById('bfsProgressLabel').textContent=`${visited} / ${total} visited`;}
function updateLegend(){
    const maxLevel=Math.max(...Object.values(bfsLevel),-1);if(maxLevel<0){document.getElementById('bfsLegend').innerHTML='';return;}
    let html='';for(let l=0;l<=maxLevel;l++){const col=BFS_COLORS[l%BFS_COLORS.length];html+=`<span class="bfs-legend-item"><span class="bfs-legend-dot" style="background:${col}"></span>Level ${l}</span>`;}
    document.getElementById('bfsLegend').innerHTML=html;
}
document.getElementById('bfsCanvas')?.addEventListener('click',function(e){
    if(!bfsGraph)return;const rect=this.getBoundingClientRect();const mx=(e.clientX-rect.left)*(this.width/rect.width);const my=(e.clientY-rect.top)*(this.height/rect.height);
    const nodeR=bfsGraph.nodes.length>20?8:14;
    for(const n of bfsGraph.nodes){const[x,y]=bfsNodePos(n,this);if(Math.hypot(mx-x,my-y)<nodeR){bfsStartFrom(n.id);return;}}
});
// ══════════ LAB 5: CALCULATOR ════════════════════════════
let calcState='Input1',calcLeft=0,calcOper=null;
function calcDisplay(val){document.getElementById('calcDisplay').textContent=val;}
function calcGetDisplay(){return document.getElementById('calcDisplay').textContent;}
function calcApply(a,op,b){
    switch(op){case'+':return a+b;case'-':return a-b;case'*':return a*b;case'/':if(b===0)throw new Error('Division by zero');return Math.trunc(a/b);}
}
function calcDigit(d){
    const cur=calcGetDisplay();let log='';
    switch(calcState){
        case'Input1':if(cur==='0')calcDisplay(''+d);else calcDisplay(cur+d);log=`Input1: append ${d}`;break;
        case'OpReady':calcDisplay(''+d);calcState='Input2';log=`OpReady → Input2`;break;
        case'Input2':if(cur==='0')calcDisplay(''+d);else calcDisplay(cur+d);log=`Input2: append ${d}`;break;
        case'HasResult':calcLeft=0;calcOper=null;calcDisplay(''+d);calcState='Input1';log=`HasResult → Input1`;break;
    }
    calcUpdateInspector(log);
}
function calcOp(op){
    const sym={'+':'+','-':'−','*':'×','/':'÷'};let log='';
    try{
        const cur=parseInt(calcGetDisplay());const prev=calcState;
        switch(calcState){
            case'Input1':case'HasResult':calcLeft=cur;calcOper=op;calcState='OpReady';log=`${prev} → OpReady: left=${cur}, op=${sym[op]}`;break;
            case'OpReady':calcOper=op;log=`OpReady: operator → ${sym[op]}`;break;
            case'Input2':const res=calcApply(calcLeft,calcOper,cur);calcDisplay(''+res);calcLeft=res;calcOper=op;calcState='OpReady';log=`Input2 → OpReady: chained ${res}, op=${sym[op]}`;break;
        }
    }catch(e){calcDisplay('0');calcLeft=0;calcOper=null;calcState='Input1';log=`Error: ${e.message}`;}
    calcUpdateInspector(log);
}
function calcEquals(){
    let log='';
    try{
        const cur=parseInt(calcGetDisplay());
        if(calcState==='Input2'){const left=calcLeft;const o=calcOper;const res=calcApply(left,o,cur);calcDisplay(''+res);calcLeft=res;calcState='HasResult';const s={'+':'+','-':'−','*':'×','/':'÷'};log=`Input2 → HasResult: ${left} ${s[o]} ${cur} = ${res}`;}
        else log=`= ignored in ${calcState}`;
    }catch(e){calcDisplay('0');calcLeft=0;calcOper=null;calcState='Input1';log=`Error: ${e.message}`;}
    calcUpdateInspector(log);
}
function calcCancel(){calcDisplay('0');calcLeft=0;calcOper=null;calcState='Input1';calcUpdateInspector('C → reset to Input1');}
function calcUpdateInspector(logMsg){
    ['Input1','OpReady','Input2','HasResult'].forEach(s=>{const el=document.getElementById('cs'+s);if(el)el.classList.toggle('cis-active',s===calcState);});
    const sym={'+':'+','-':'−','*':'×','/':'÷'};
    document.getElementById('cifLeft').textContent=calcLeft;
    document.getElementById('cifOp').textContent=calcOper?sym[calcOper]:'—';
    document.getElementById('cifDisplay').textContent=calcGetDisplay();
    if(logMsg){const log=document.getElementById('calcLog');const line=document.createElement('div');line.className='calc-log-line '+(logMsg.includes('→')?'calc-log-transition':logMsg.includes('Error')?'calc-log-error':'calc-log-muted');line.textContent=logMsg;log.appendChild(line);log.scrollTop=log.scrollHeight;}
}
document.addEventListener('keydown',function(e){
    if(document.activeElement.tagName==='INPUT'||document.activeElement.id==='mapWrap')return;
    if(e.key>='0'&&e.key<='9')calcDigit(parseInt(e.key));
    else if(e.key==='+')calcOp('+');else if(e.key==='-')calcOp('-');else if(e.key==='*')calcOp('*');
    else if(e.key==='/'){e.preventDefault();calcOp('/');}
    else if(e.key==='Enter'||e.key==='=')calcEquals();
    else if(e.key==='Escape'||e.key.toLowerCase()==='c')calcCancel();
});
calcUpdateInspector('');

// ══════════ LAB 6: CAR WASH SIMULATION ═══════════════════
class SeededRandom{
    // LCG matching Java's java.util.Random for reproducible results
    constructor(seed){
        // Use two 32-bit halves to simulate 48-bit arithmetic without BigInt
        const s=(seed^0x5DEECE66D)>>>0;
        this.hi=((seed/0x100000000^0x5DEECE66D/0x100000000)&0xFFFF)>>>0;
        this.lo=s&0xFFFF;
        // Simpler: just use a good LCG with seeded Math.random substitute
        this._state=((seed^0x5DEECE66D)&0x7FFFFFFF)>>>0;
        // Advance state properly with modular arithmetic
        this._s=Math.abs(seed)%2147483647||12345;
    }
    _next(){
        // Park-Miller LCG: good quality, no BigInt needed
        this._s=Math.imul(this._s,16807)%2147483647;
        return(this._s-1)/2147483646;
    }
    nextDouble(){return this._next();}
    expNext(lam){return-Math.log(Math.max(1e-15,this._next()))/lam;}
    unifNext(lo,hi){return lo+this._next()*(hi-lo);}
}
let cwSim=null,cwAutoTimer=null;
function cwGetCfg(){return{fastStations:+document.getElementById('cwFast').value||2,slowStations:+document.getElementById('cwSlow').value||2,maxQueue:+document.getElementById('cwMaxQ').value||5,closeTime:+document.getElementById('cwClose').value||15,lambda:+document.getElementById('cwLambda').value||2,seed:+document.getElementById('cwSeed').value||1234,fastMin:2.8,fastMax:4.6,slowMin:3.5,slowMax:6.7};}
function cwPush(sim,time,type,data=null){sim.events.push({time,type,data});sim.events.sort((a,b)=>a.time-b.time);}
function cwInit(){
    clearInterval(cwAutoTimer);cwAutoTimer=null;
    document.getElementById('cwRunBtn').textContent='▶ Run';
    document.getElementById('cwLog').innerHTML='';
    document.getElementById('cwSummary').classList.add('re-hidden');
    const cfg=cwGetCfg();const rng=new SeededRandom(cfg.seed);
    cwSim={cfg,rng,events:[],freeFast:cfg.fastStations,freeSlow:cfg.slowStations,queue:[],carId:0,closed:false,done:false,totalArrived:0,totalServed:0,totalRejected:0,lastTime:0,totalIdleTime:0,totalQueueTime:0};
    cwPush(cwSim,cwSim.rng.expNext(cfg.lambda),'arrive');
    cwPush(cwSim,cfg.closeTime,'close');cwPush(cwSim,cfg.closeTime,'stop');
    cwRenderState();cwLogRow({t:0,e:'Start',id:'',ff:cfg.fastStations,fs:cfg.slowStations,idle:0,qt:0,qs:0,rej:0});
}
function cwUpdateTimes(sim,now){const dt=Math.max(0,now-sim.lastTime);sim.totalIdleTime+=dt*(sim.freeFast+sim.freeSlow);sim.totalQueueTime+=dt*sim.queue.length;sim.lastTime=now;}
function cwStep(){
    if(!cwSim||cwSim.done||cwSim.events.length===0)return;
    const ev=cwSim.events.shift();const{time,type,data}=ev;const sim=cwSim;const cfg=sim.cfg;
    cwUpdateTimes(sim,time);
    if(type==='arrive'){
        if(!sim.closed){
            sim.totalArrived++;const car={id:sim.carId++,arrivalTime:time};
            if(sim.freeFast>0){sim.freeFast--;cwPush(sim,time+sim.rng.unifNext(cfg.fastMin,cfg.fastMax),'depart',{car,fast:true});}
            else if(sim.freeSlow>0){sim.freeSlow--;cwPush(sim,time+sim.rng.unifNext(cfg.slowMin,cfg.slowMax),'depart',{car,fast:false});}
            else if(sim.queue.length<cfg.maxQueue){sim.queue.push(car);}
            else{sim.totalRejected++;}
            cwLogRow({t:time,e:'Arrive',id:String(car.id),ff:sim.freeFast,fs:sim.freeSlow,idle:sim.totalIdleTime,qt:sim.totalQueueTime,qs:sim.queue.length,rej:sim.totalRejected});
        }
        const nt=time+sim.rng.expNext(cfg.lambda);if(nt<cfg.closeTime)cwPush(sim,nt,'arrive');
    } else if(type==='depart'){
        const{car,fast}=data;sim.totalServed++;
        cwLogRow({t:time,e:'Leave',id:String(car.id),ff:sim.freeFast,fs:sim.freeSlow,idle:sim.totalIdleTime,qt:sim.totalQueueTime,qs:sim.queue.length,rej:sim.totalRejected});
        if(fast)sim.freeFast++;else sim.freeSlow++;
        if(sim.queue.length>0){const next=sim.queue.shift();if(fast){sim.freeFast--;cwPush(sim,time+sim.rng.unifNext(cfg.fastMin,cfg.fastMax),'depart',{car:next,fast:true});}else{sim.freeSlow--;cwPush(sim,time+sim.rng.unifNext(cfg.slowMin,cfg.slowMax),'depart',{car:next,fast:false});}}
    } else if(type==='close'){sim.closed=true;
    } else if(type==='stop'){
        cwLogRow({t:time,e:'Stop',id:'',ff:sim.freeFast,fs:sim.freeSlow,idle:sim.totalIdleTime,qt:sim.totalQueueTime,qs:sim.queue.length,rej:sim.totalRejected});
        sim.done=true;const entered=sim.totalArrived-sim.totalRejected;const meanQ=entered>0?sim.totalQueueTime/entered:0;
        cwShowSummary(sim.totalIdleTime,sim.totalQueueTime,meanQ,sim.totalRejected,sim.totalArrived,sim.totalServed);
        clearInterval(cwAutoTimer);cwAutoTimer=null;document.getElementById('cwRunBtn').textContent='▶ Run';
    }
    cwRenderState();
}
function cwToggleRun(){const btn=document.getElementById('cwRunBtn');if(cwAutoTimer){clearInterval(cwAutoTimer);cwAutoTimer=null;btn.textContent='▶ Run';return;}btn.textContent='⏸ Pause';cwAutoTimer=setInterval(()=>{if(!cwSim||cwSim.done){clearInterval(cwAutoTimer);cwAutoTimer=null;btn.textContent='▶ Run';return;}cwStep();},100);}
function cwRenderState(){
    if(!cwSim)return;const sim=cwSim,cfg=sim.cfg;
    document.getElementById('cwTime').textContent=sim.lastTime.toFixed(3);
    document.getElementById('cwArrived').textContent=sim.totalArrived;
    document.getElementById('cwServed').textContent=sim.totalServed;
    document.getElementById('cwRejected').textContent=sim.totalRejected;
    const renderMachines=(id,total,free)=>{const el=document.getElementById(id);el.innerHTML='';for(let i=0;i<total;i++){const d=document.createElement('div');d.className='cw-machine '+(i<(total-free)?'cw-machine-busy':'cw-machine-free');d.innerHTML=i<(total-free)?'🚗':'✓';el.appendChild(d);}};
    renderMachines('cwFastMachines',cfg.fastStations,sim.freeFast);
    renderMachines('cwSlowMachines',cfg.slowStations,sim.freeSlow);
    const qv=document.getElementById('cwQueueVis');qv.innerHTML='';
    if(sim.queue.length===0)qv.innerHTML='<span style="font-family:var(--font-m);font-size:0.7rem;color:var(--muted);font-style:italic">Empty</span>';
    else sim.queue.forEach(car=>{const s=document.createElement('span');s.className='cw-qcar';s.textContent='#'+car.id;qv.appendChild(s);});
}
function cwLogRow(row){const log=document.getElementById('cwLog');const div=document.createElement('div');div.className='cw-log-row'+(row.e==='Arrive'?' cw-log-arrive':row.e==='Leave'?' cw-log-leave':row.e==='Stop'?' cw-log-stop':'');div.innerHTML=`<span>${row.t.toFixed(3)}</span><span>${row.e}</span><span>${row.id}</span><span>${row.ff}</span><span>${row.fs}</span><span>${row.qs}</span><span>${row.rej}</span>`;log.appendChild(div);log.scrollTop=log.scrollHeight;}
function cwShowSummary(idle,qt,meanQ,rejected,arrived,served){const el=document.getElementById('cwSummary');el.classList.remove('re-hidden');el.innerHTML=`<div class="cw-sum-title">✓ Simulation Complete</div><div class="cw-sum-grid"><div class="cw-sum-item"><span>Arrived</span><strong>${arrived}</strong></div><div class="cw-sum-item"><span>Served</span><strong>${served}</strong></div><div class="cw-sum-item"><span>Rejected</span><strong style="color:#ef4444">${rejected}</strong></div><div class="cw-sum-item"><span>Total idle time</span><strong>${idle.toFixed(3)}</strong></div><div class="cw-sum-item"><span>Total queue time</span><strong>${qt.toFixed(3)}</strong></div><div class="cw-sum-item"><span>Mean queue time</span><strong>${meanQ.toFixed(3)}</strong></div></div>`;}