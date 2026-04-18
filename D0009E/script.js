document.addEventListener("DOMContentLoaded", () => {
    hljs.highlightAll();
    calcRecipe();
});

function toggleCode(btn) {
    const card = btn.closest(".project-card");
    const body = card.querySelector(".code-body");
    const isOpen = body.classList.contains("open");
    body.classList.toggle("open", !isOpen);
    btn.classList.toggle("open", !isOpen);
    btn.textContent = isOpen ? "View Code" : "Hide Code";
}

// ── LOAN CALCULATOR ────────────────────────────────────────
function calcLoan() {
    const P = parseFloat(document.getElementById("loanP").value);
    const R = parseFloat(document.getElementById("loanR").value) / 100;
    const A = parseFloat(document.getElementById("loanA").value);
    const out = document.getElementById("loanOutput");
    if (isNaN(P) || isNaN(R) || isNaN(A) || P <= 0 || A <= 0) {
        out.className = "demo-output demo-error";
        out.textContent = "Please enter valid positive values.";
        return;
    }
    const k = P + ((A + 1) * R * P) / 2;
    const interest = k - P;
    const monthly = k / (A * 12);
    out.className = "demo-output";
    out.innerHTML = `
        <div class="loan-result">
            <div class="loan-stat"><span class="loan-stat-label">Total Cost</span><span class="loan-stat-val accent">${k.toLocaleString("sv-SE",{maximumFractionDigits:2})} kr</span></div>
            <div class="loan-stat"><span class="loan-stat-label">Principal</span><span class="loan-stat-val">${P.toLocaleString("sv-SE")} kr</span></div>
            <div class="loan-stat"><span class="loan-stat-label">Total Interest</span><span class="loan-stat-val">${interest.toLocaleString("sv-SE",{maximumFractionDigits:2})} kr</span></div>
            <div class="loan-stat"><span class="loan-stat-label">Monthly Payment</span><span class="loan-stat-val">${monthly.toLocaleString("sv-SE",{maximumFractionDigits:2})} kr</span></div>
        </div>`;
}

// ── RECIPE SCALER ──────────────────────────────────────────
function calcRecipe() {
    const P = parseInt(document.getElementById("recipeP").value);
    const out = document.getElementById("recipeOutput");
    const ingredients = [
        { label:"Butter (shape)", val:(15/4)*P, unit:"g" },
        { label:"Ströbröd",       val:(3/4)*P,  unit:"msk" },
        { label:"Eggs",           val:Math.floor((3/4)*P), unit:"" },
        { label:"Powdered sugar", val:(3/4)*P,  unit:"dl" },
        { label:"Vanilla sugar",  val:(2/4)*P,  unit:"tsp" },
        { label:"Baking powder",  val:(2/4)*P,  unit:"tsp" },
        { label:"Flour",          val:(3/4)*P,  unit:"dl" },
        { label:"Butter (cake)",  val:(75/4)*P, unit:"g" },
        { label:"Water",          val:(1/4)*P,  unit:"dl" },
    ];
    const mix = 10+P, bake = 30+P*3;
    out.innerHTML = `
        <div class="recipe-grid">${ingredients.map(i=>`
            <div class="recipe-row">
                <span class="recipe-label">${i.label}</span>
                <span class="recipe-val">${i.val%1===0?i.val:i.val.toFixed(2)} ${i.unit}</span>
            </div>`).join("")}
        </div>
        <div class="recipe-times">
            <div class="time-pill">Mix: ${mix} min</div>
            <div class="time-pill">Bake: ${bake} min</div>
            <div class="time-pill accent-pill">Total: ${mix+bake} min</div>
        </div>`;
}

// ── DICTIONARY ─────────────────────────────────────────────
const dict = {};

function dictMsg(msg, type) {
    const el = document.getElementById("dictMsg");
    el.textContent = msg;
    el.className = `demo-output ${type==="error"?"demo-error":"demo-success"}`;
    setTimeout(() => el.className = "demo-output hidden", 3000);
}

function renderDict() {
    const el = document.getElementById("dictEntries");
    const keys = Object.keys(dict);
    if (keys.length === 0) { el.innerHTML = '<div class="dict-empty">Dictionary is empty. Add some words above.</div>'; return; }
    el.innerHTML = keys.map(w=>`
        <div class="dict-entry">
            <span class="dict-word">${w}</span>
            <span class="dict-def">${dict[w]}</span>
            <button class="dict-del" onclick="dictDeleteWord('${w}')">✕</button>
        </div>`).join("");
}

function dictInsert() {
    const word = document.getElementById("dictWord").value.trim();
    const def  = document.getElementById("dictDef").value.trim();
    if (!word||!def) { dictMsg("Enter both a word and a definition.","error"); return; }
    if (word in dict) { dictMsg(`'${word}' already exists.`,"error"); return; }
    dict[word] = def;
    document.getElementById("dictWord").value = "";
    document.getElementById("dictDef").value  = "";
    dictMsg(`Inserted '${word}'.`,"success");
    renderDict();
}

function dictLookup() {
    const word = document.getElementById("dictLookup").value.trim();
    if (!word) return;
    if (word in dict) dictMsg(`${word}: ${dict[word]}`,"success");
    else              dictMsg(`'${word}' not found.`,"error");
}

function dictDelete() {
    dictDeleteWord(document.getElementById("dictLookup").value.trim());
}

function dictDeleteWord(word) {
    if (!word) return;
    if (word in dict) { delete dict[word]; dictMsg(`Deleted '${word}'.`,"success"); renderDict(); }
    else dictMsg(`'${word}' not found.`,"error");
}

renderDict();

// ── PHONEBOOK ──────────────────────────────────────────────
const pb = {};

function pbLog(msg, type) {
    const t = document.getElementById("pbTerminal");
    const l = document.createElement("div");
    l.className = `pb-line pb-${type==="error"?"error":type==="success"?"success":"muted"}`;
    l.textContent = msg;
    t.appendChild(l);
    t.scrollTop = t.scrollHeight;
}

function pbCmd(text) {
    const t = document.getElementById("pbTerminal");
    const e = document.createElement("div");
    e.className = "pb-line pb-cmd";
    e.textContent = "phoneBook> " + text;
    t.appendChild(e);
    const parts = text.trim().split(/\s+/);
    const action = parts[0].toLowerCase();
    const args = parts.slice(1);
    switch(action) {
        case "add":    if(args.length!==2){pbLog("Usage: add <name> <number>","error");break;} pbAdd(args[0],args[1]); break;
        case "lookup": if(args.length!==1){pbLog("Usage: lookup <name>","error");break;} pbLookup(args[0]); break;
        case "alias":  if(args.length<2){pbLog("Usage: alias <name> <alias>","error");break;} pbAlias(args[0],args[1],args[2]); break;
        case "change": if(args.length<2){pbLog("Usage: change <name> <new_number>","error");break;} pbChange(args[0],args[1],args[2]); break;
        case "remove": if(args.length!==2){pbLog("Usage: remove <name> <number>","error");break;} pbRemove(args[0],args[1]); break;
        case "list":   pbList(); break;
        case "clear":  document.getElementById("pbTerminal").innerHTML=""; break;
        default: pbLog(`Unknown command: ${action}. Try: add, lookup, alias, change, remove, list`,"error");
    }
}

function pbAdd(name,number){if(!pb[number])pb[number]=[];if(pb[number].includes(name)){pbLog(`${name} already exists for ${number}`,"error");return;}pb[number].push(name);pbLog(`Added ${name} with number ${number}`,"success");}
function pbLookup(name){const m=Object.entries(pb).filter(([,n])=>n.includes(name)).map(([num])=>num);if(!m.length)pbLog(`${name} not found`,"error");else if(m.length===1)pbLog(`${name}'s number is ${m[0]}`,"success");else pbLog(`${name} has multiple numbers: ${m.join(", ")}`,"success");}
function pbAlias(existing,alias,number){const m=Object.entries(pb).filter(([,n])=>n.includes(existing)).map(([num])=>num);if(!m.length){pbLog(`${existing} not found`,"error");return;}const num=number||m[0];if(!pb[num]){pbLog(`Number ${num} not found`,"error");return;}if(pb[num].includes(alias)){pbLog(`${alias} already exists for ${num}`,"error");return;}pb[num].push(alias);pbLog(`Added alias ${alias} for ${existing} (${num})`,"success");}
function pbChange(name,newNum,oldNum){const m=Object.entries(pb).filter(([,n])=>n.includes(name)).map(([num])=>num);if(!m.length){pbLog(`${name} not found`,"error");return;}const on=oldNum||m[0];if(!pb[on]){pbLog(`Number ${on} not found`,"error");return;}pb[newNum]=[...pb[on]];delete pb[on];pbLog(`Changed ${name}'s number from ${on} to ${newNum}`,"success");}
function pbRemove(name,number){if(!pb[number]||!pb[number].includes(name)){pbLog(`${name} with ${number} not found`,"error");return;}pb[number]=pb[number].filter(n=>n!==name);if(!pb[number].length)delete pb[number];pbLog(`Removed ${name} (${number})`,"success");}
function pbList(){const e=Object.entries(pb);if(!e.length){pbLog("Phonebook is empty.","error");return;}e.forEach(([num,names])=>pbLog(`${num}: ${names.join(", ")}`,"success"));}

const pbForms = {
    add:    { fields:["Name","Number"],           cmd:(v)=>`add ${v[0]} ${v[1]}` },
    lookup: { fields:["Name"],                    cmd:(v)=>`lookup ${v[0]}` },
    alias:  { fields:["Existing name","New alias"],cmd:(v)=>`alias ${v[0]} ${v[1]}` },
    change: { fields:["Name","New number"],       cmd:(v)=>`change ${v[0]} ${v[1]}` },
    remove: { fields:["Name","Number"],           cmd:(v)=>`remove ${v[0]} ${v[1]}` },
    list:   { fields:[],                          cmd:()=>`list` },
};

function pbSetAction(action) {
    document.querySelectorAll(".pb-quick").forEach(b=>b.classList.remove("active"));
    event.target.classList.add("active");
    const area = document.getElementById("pbInputArea");
    const form = pbForms[action];
    if (form.fields.length===0) { area.innerHTML=""; pbCmd("list"); return; }
    area.innerHTML = `<div class="demo-dict-row pb-action-row">
        ${form.fields.map((f,i)=>`<input class="demo-input" type="text" id="pbF${i}" placeholder="${f}" autocomplete="off">`).join("")}
        <button class="demo-btn demo-btn-sm" onclick="pbSubmitAction('${action}')">${action.charAt(0).toUpperCase()+action.slice(1)}</button>
    </div>`;
    document.getElementById("pbF0")?.focus();
    form.fields.forEach((_,i)=>document.getElementById(`pbF${i}`)?.addEventListener("keydown",e=>{if(e.key==="Enter")pbSubmitAction(action);}));
}

function pbSubmitAction(action) {
    const form = pbForms[action];
    const vals = form.fields.map((_,i)=>document.getElementById(`pbF${i}`)?.value.trim()||"");
    if(vals.some(v=>!v)){pbLog("Please fill in all fields.","error");return;}
    pbCmd(form.cmd(vals));
    form.fields.forEach((_,i)=>{const el=document.getElementById(`pbF${i}`);if(el)el.value="";});
    document.getElementById("pbF0")?.focus();
}

function pbRunCmd() {
    const input = document.getElementById("pbCmd");
    const val = input.value.trim();
    if(!val) return;
    pbCmd(val);
    input.value = "";
}
