document.addEventListener('DOMContentLoaded', function() {
    // Simple in-memory model with localStorage persistence
   // add priority status to tasks to help sort them
   // make sure array operations is visible in code
// priority dropdown and sorting (low, medium, high). Keeps highest priority at top.
// add per-task priority dropdown and visual "!" markers; integrate with existing tasks/render/save
(function(){
    function weight(p){
        if (p === 'high') return 3;
        if (p === 'medium') return 2;
        return 1;
    }

    function attachPriorityUI(){
        const lists = [document.querySelector('#activeList'), document.querySelector('#completedList')];
        lists.forEach(list => {
            if (!list) return;
            list.querySelectorAll('.task').forEach(wrap => {
                const id = wrap.dataset.id;
                const task = Array.isArray(tasks) ? tasks.find(t => t.id === id) : null;

                // add select if missing
                if (!wrap.querySelector('.task-priority')) {
                    const sel = document.createElement('select');
                    sel.className = 'task-priority';
                    sel.title = 'Priority';
                    sel.style.marginLeft = '8px';
                    sel.style.minWidth = '72px';

                    const opts = [
                        {v: 'low', t: 'Low'},
                        {v: 'medium', t: 'Medium'},
                        {v: 'high', t: 'High'}
                    ];
                    const cur = task && task.priority ? task.priority : 'medium';
                    opts.forEach(o => {
                        const option = document.createElement('option');
                        option.value = o.v;
                        option.textContent = o.t;
                        if (o.v === cur) option.selected = true;
                        sel.appendChild(option);
                    });

                    sel.addEventListener('change', () => {
                        if (!task) return;
                        task.priority = sel.value;
                        // sort tasks by priority (highest first) then keep relative order otherwise
                        tasks.sort((a, b) => weight(b.priority || 'medium') - weight(a.priority || 'medium'));
                        try { saveToStorage(); } catch (e) {}
                        try { render(); } catch (e) {}
                    });

                    // place the select into the title-row, before meta if present
                    const titleRow = wrap.querySelector('.title-row') || wrap;
                    const meta = titleRow ? titleRow.querySelector('.meta') : null;
                    if (meta) titleRow.insertBefore(sel, meta);
                    else titleRow.appendChild(sel);
                }

                // add/update exclamation marker next to title
                const h3 = wrap.querySelector('h3');
                if (h3) {
                    let span = wrap.querySelector('.priority-bang');
                    if (!span) {
                        span = document.createElement('span');
                        span.className = 'priority-bang';
                        span.style.color = 'crimson';
                        span.style.marginLeft = '8px';
                        h3.appendChild(span);
                    }
                    const p = task && task.priority ? task.priority : 'medium';
                    span.textContent = p === 'high' ? '!!!' : p === 'medium' ? '!!' : '';
                }
            });
        });
    }

    // Wait until the main render function exists, then wrap it so our UI is applied after each render.
    (function waitForRender(){
        if (typeof render !== 'function') {
            setTimeout(waitForRender, 30);
            return;
        }
        const originalRender = render;
        render = function(){
            originalRender();
            attachPriorityUI();
        };
        // run once now
        try { attachPriorityUI(); } catch (e) {}
    })();
})();
(function(){
    function priorityWeight(p){
        if(p === 'high') return 3;
        if(p === 'medium') return 2;
        return 1; // low or unknown
    }

    function sortTasks(){
        // sort in-place: highest priority first; stable sort keeps relative order within same priority
        if (typeof tasks === 'undefined' || !Array.isArray(tasks)) return;
        tasks.sort((a,b) => priorityWeight(b.priority || 'medium') - priorityWeight(a.priority || 'medium'));
    }

    // Insert the priority select into the form after DOM elements are created.
    setTimeout(() => {
        const taskNameInput = document.querySelector('#taskName');
        const form = document.querySelector('#taskForm');
        if (!form || !taskNameInput) return;
        if (document.querySelector('#taskPriority')) return; // don't duplicate

        const sel = document.createElement('select');
        sel.id = 'taskPriority';
        sel.title = 'Priority';
        sel.style.marginLeft = '8px';

        const opts = [
            {v: 'low', t: 'Low'},
            {v: 'medium', t: 'Medium'},
            {v: 'high', t: 'High'}
        ];
        opts.forEach(o => {
            const option = document.createElement('option');
            option.value = o.v;
            option.textContent = o.t;
            if (o.v === 'medium') option.selected = true;
            sel.appendChild(option);
        });

        // Place the select right after the task name input
        taskNameInput.insertAdjacentElement('afterend', sel);
    }, 0);

    // Ensure loaded tasks have a priority and then sort & render/save once.
    setTimeout(() => {
        if (typeof tasks === 'undefined') return;
        let changed = false;
        tasks = tasks.map(t => {
            if (!t.priority) { t.priority = 'medium'; changed = true; }
            return t;
        });
        sortTasks();
        if (changed) try { saveToStorage(); } catch (e) {}
        try { render(); } catch (e) {}
    }, 0);

    // After the built-in submit handler creates the new task, set its priority and re-sort.
    setTimeout(() => {
        const form = document.querySelector('#taskForm');
        if (!form) return;
        // add listener after existing one so it runs afterward
        form.addEventListener('submit', () => {
            // allow the original submit handler to run first (it creates the task)
            setTimeout(() => {
                if (!Array.isArray(tasks) || tasks.length === 0) return;
                const newest = tasks[0]; // form handler inserts newest at front
                if (!newest) return;
                const sel = document.querySelector('#taskPriority');
                const val = sel ? sel.value : 'medium';
                if (newest.priority !== val) {
                    newest.priority = val;
                    sortTasks();
                    try { saveToStorage(); } catch (e) {}
                    try { render(); } catch (e) {}
                }
            }, 0);
        }, false);
    }, 0);
})();
   
   const form = document.querySelector('#taskForm');
   const taskNameInput = document.querySelector('#taskName');
   const activeList = document.querySelector('#activeList');
   const completedList = document.querySelector('#completedList');
   const completedCount = document.querySelector('#completedCount');
   const toggleCompleted = document.querySelector('#toggleCompleted');
   const completedPanel = document.querySelector('#completedPanel');
   const clearCompleted = document.querySelector('#clearCompleted');
   const clearAllActive = document.querySelector('#clearAllActive');

    // make Enter on the text field submit the form
    if (taskNameInput) {
        taskNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                if (typeof form.requestSubmit === 'function') form.requestSubmit();
                else form.submit();
            }
        });

        // give the user a sensible starting point
        try { taskNameInput.focus(); } 
        catch (e) { /* ignore */ }
    }

    let tasks = []; // {id, title, subtasks: [{id,text,done}], done}

    function uid(prefix='id'){
        return prefix+Math.random().toString(36).slice(2,9)}

    // load persisted tasks (if any)
    try {
        const raw = localStorage.getItem('tm_tasks');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) tasks = parsed;
        }
    } catch (e) { /* ignore */ }

    // normalize any loaded tasks to ensure subtasks array exists
    tasks = tasks.map(t => ({
        id: t.id || uid('t'),
        title: t.title || '',
        subtasks: Array.isArray(t.subtasks) ? t.subtasks.map(s => ({
            id: s.id || uid('s'),
            text: s.text || '',
            done: !!s.done
        })) : [],
        done: !!t.done
    }));

    function saveToStorage() {
        try { localStorage.setItem('tm_tasks', JSON.stringify(tasks)); } catch (e) {}
    }

    function render() {
        // Active
        const active = tasks.filter(t=>!t.done);
        activeList.innerHTML = active.length ? '' : '<p class="muted">No tasks yet — add a task above.</p>';
        active.forEach(t => activeList.appendChild(renderTask(t)));

        // Completed
        const completed = tasks.filter(t=>t.done);
        completedList.innerHTML = completed.length ? '' : '<p class="muted">No completed tasks.</p>';
        completed.forEach(t => completedList.appendChild(renderTask(t, true)));

        completedCount.textContent = completed.length;
    }

    function renderTask(task, inCompleted = false) {
        const wrap = document.createElement('div');
        wrap.className = 'task';
        wrap.dataset.id = task.id;

        // checkbox to mark complete/incomplete
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!task.done;
        cb.title = (task.done ? 'Mark as active' : 'Mark as completed');
        cb.addEventListener('change', () => {
            task.done = cb.checked;
            saveToStorage();
            render();
        });

        const left = document.createElement('div');
        left.className = 'left';
        const titleRow = document.createElement('div');
        titleRow.className = 'title-row';

        const title = document.createElement('h3');
        title.textContent = task.title;

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `${task.subtasks.length} subtasks`;

        const actions = document.createElement('div');
        actions.className = 'actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'small-btn delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', ()=>{
            tasks = tasks.filter(x=>x.id !== task.id);
            saveToStorage();
            render();
        });

        // Add subtask UI only for active tasks
        const subWrapper = document.createElement('div');
        subWrapper.className = 'subtasks';

        if (!inCompleted) {
            const subForm = document.createElement('form');
            subForm.style.display = 'flex';
            subForm.style.gap = '8px';
            subForm.addEventListener('submit', e=>{
                e.preventDefault();
                const input = subForm.querySelector('input');
                const text = input.value.trim();
                if(!text) return;
                task.subtasks.push({id:uid('s'), text, done:false});
                input.value='';
                saveToStorage();
                render();
            });

            const subInput = document.createElement('input');
            subInput.type = 'text';
            subInput.placeholder = 'Add subtask';
            subInput.style.flex='1';
            subInput.required = false;

            const subAdd = document.createElement('button');
            subAdd.type = 'submit';
            subAdd.className = 'small-btn';
            subAdd.textContent = 'Add';

            subForm.appendChild(subInput);
            subForm.appendChild(subAdd);
            subWrapper.appendChild(subForm);
        }

        // list of subtasks
        const subList = document.createElement('div');
        subList.style.marginTop = '6px';

        task.subtasks.forEach(s=>{
            const sEl = document.createElement('div');
            sEl.className = 'subtask';
            const sCb = document.createElement('input');
            sCb.type = 'checkbox';
            sCb.checked = !!s.done;
            sCb.addEventListener('change', ()=>{
                s.done = sCb.checked;
                saveToStorage();
                render();
            });
            const sText = document.createElement('div');
            sText.textContent = s.text;
            sText.style.flex='1';
            sText.className = s.done ? 'muted' : '';
            const sDel = document.createElement('button');
            sDel.className = 'small-btn';
            sDel.textContent = 'x';
            sDel.addEventListener('click', ()=>{
                task.subtasks = task.subtasks.filter(x=>x.id !== s.id);
                saveToStorage();
                render();
            });

            sEl.appendChild(sCb);
            sEl.appendChild(sText);
            sEl.appendChild(sDel);
            subList.appendChild(sEl);
        });

        // progress bar
        const progressWrap = document.createElement('div');
        progressWrap.className = 'progress-wrap';
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const pctLabel = document.createElement('div');
        pctLabel.className = 'muted';
        pctLabel.style.fontSize='12px';
        pctLabel.style.marginTop='6px';

        updateProgress(task, bar, pctLabel);

        progressWrap.appendChild(bar);

        titleRow.appendChild(title);
        titleRow.appendChild(meta);
        actions.appendChild(deleteBtn);
        titleRow.appendChild(actions);

        left.appendChild(titleRow);
        left.appendChild(progressWrap);
        left.appendChild(pctLabel);
        subWrapper.appendChild(subList);
        left.appendChild(subWrapper);

        wrap.appendChild(cb);
        wrap.appendChild(left);

        return wrap;
    }

    function updateProgress(task, barEl, labelEl) {
        const total = task.subtasks.length;
        const done = task.subtasks.filter(s=>s.done).length;
        const pct = total === 0 ? 0 : Math.round(done / total * 100);
        if (barEl) barEl.style.width = pct + '%';
        if (labelEl) labelEl.textContent = total === 0 ? 'No subtasks' : `${done} / ${total} completed (${pct}%)`;
    }

    form.addEventListener('submit', e=>{
        e.preventDefault();
        const title = taskNameInput.value.trim();
        if(!title) return;
        const t = {id: uid('t'), title, subtasks: [], done:false};
        tasks.unshift(t); // newest first
        taskNameInput.value = '';
        saveToStorage();
        render();
        taskNameInput.focus();
    });

    toggleCompleted.addEventListener('click', ()=>{
        const open = completedPanel.style.maxHeight && completedPanel.style.maxHeight !== '0px';
        if(open){
            completedPanel.style.maxHeight = '0';
            toggleCompleted.textContent = 'Show';
        } else {
            completedPanel.style.maxHeight = '400px';
            toggleCompleted.textContent = 'Hide';
        }
    });

    clearCompleted.addEventListener('click', ()=>{
        if(!confirm('Delete all completed tasks?')) return;
        tasks = tasks.filter(t=>!t.done);
        saveToStorage();
        render();
    });

    clearAllActive.addEventListener('click', ()=>{
        if(!confirm('Delete all active tasks?')) return;
        tasks = tasks.filter(t=>t.done);
        saveToStorage();
        render();
    });

    // initial render
    render();
});
// Sources: ww3schools.com (https://www.w3schools.com/howto/howto_js_collapsible.asp), ww3schools.com javascript examples