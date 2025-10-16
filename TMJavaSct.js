    window.onload = function() {
    // Simple in-memory model. Use localStorage if persistence desired.
        const form = document.getElementById('taskForm');
        const taskNameInput = document.getElementById('taskName');
        const activeList = document.getElementById('activeList');
        const completedList = document.getElementById('completedList');
        const completedCount = document.getElementById('completedCount');
        const toggleCompleted = document.getElementById('toggleCompleted');
        const completedPanel = document.getElementById('completedPanel');
        const clearCompleted = document.getElementById('clearCompleted');
        const clearAllActive = document.getElementById('clearAllActive');
        // make Enter on the text field submit the form (useful if the input isn't actually inside the <form>)
        if (taskNameInput) {
            taskNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    if (typeof form.requestSubmit === 'function') form.requestSubmit();
                    else form.submit();
                }
            });

            // give the user a sensible starting point
            try { taskNameInput.focus(); } catch (e) { /* ignore */ }
        }
        let tasks = []; // {id, title, subtasks: [{id,text,done}], done}
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

        // Add a subtask to a task (returns the new subtask id or null)
        function addSubtask(taskId, text) {
            const trimmed = (text || '').trim();
            if (!trimmed) return null;
            const task = tasks.find(x => x.id === taskId);
            if (!task) return null;
            const sid = uid('s');
            task.subtasks.push({ id: sid, text: trimmed, done: false });
            try { localStorage.setItem('tm_tasks', JSON.stringify(tasks)); } catch (e) {}
            render();
            return sid;
        }

        // Toggle a subtask's done state programmatically (true/false)
        // returns true if successful
        function toggleSubtask(taskId, subtaskId, done) {
            const task = tasks.find(x => x.id === taskId);
            if (!task) return false;
            const s = task.subtasks.find(x => x.id === subtaskId);
            if (!s) return false;
            s.done = !!done;
            try { localStorage.setItem('tm_tasks', JSON.stringify(tasks)); } catch (e) {}
            render();
            return true;
        }

        // Remove a subtask programmatically (returns true if removed)
        function removeSubtask(taskId, subtaskId) {
            const task = tasks.find(x => x.id === taskId);
            if (!task) return false;
            const before = task.subtasks.length;
            task.subtasks = task.subtasks.filter(x => x.id !== subtaskId);
            const removed = task.subtasks.length !== before;
            if (removed) {
                try { localStorage.setItem('tm_tasks', JSON.stringify(tasks)); } catch (e) {}
                render();
            }
            return removed;
        }
        function uid(prefix='id'){return prefix+Math.random().toString(36).slice(2,9)}
        // load persisted tasks (if any)
        try {
            const raw = localStorage.getItem('tm_tasks');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) tasks = parsed;
            }
        } catch (e) { /* ignore */ }

        // ensure render is invoked after the form's submit handler (fixes tasks not appearing immediately)
        form.addEventListener('submit', () => {
            setTimeout(() => {
                try { localStorage.setItem('tm_tasks', JSON.stringify(tasks)); } catch (e) {}
                render();
            }, 0);
        });
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
                    updateProgress(task, bar, pctLabel);
                    meta.textContent = `${task.subtasks.length} subtasks`;
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
                    updateProgress(task, bar, pctLabel);
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
                    updateProgress(task, bar, pctLabel);
                    meta.textContent = `${task.subtasks.length} subtasks`;
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
            render();
        });

        clearAllActive.addEventListener('click', ()=>{
            if(!confirm('Delete all active tasks?')) return;
            tasks = tasks.filter(t=>t.done);
            render();
        });

        // initial render
        render();

        // keyboard shortcut: focus input with "n"
        window.addEventListener('keydown', e=>{
            if(e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey){
                taskNameInput.focus();
            }
        });
};
