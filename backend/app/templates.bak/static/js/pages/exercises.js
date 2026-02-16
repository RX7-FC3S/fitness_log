import api from '../api.js';

export default class ExercisesPage {
    constructor(state, { router, headerVar, footer }) {
        this.state = state;
        this.router = router;
        this.headerVar = headerVar;
        this.footer = footer;
        this.exercises = [];
    }

    async render() {
        this.headerVar.textContent = '训练动作';
        const container = document.createElement('div');
        container.className = 'exercises-page';
        container.style.cssText = 'display: flex; flex-direction: column; flex: 1; min-height: 0;';

        this.exercises = await api.listExercises();
        this.state.exercises = this.exercises;

        // Group exercises by target_muscle
        const grouped = {};
        // Initialize with predefined muscle groups to keep order if possible
        this.state.muscleGroups.forEach(m => grouped[m] = []);
        grouped['未分类'] = [];

        this.exercises.forEach(ex => {
            const group = ex.target_muscle || '未分类';
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(ex);
        });

        const listHtml = Object.keys(grouped)
            .filter(muscle => grouped[muscle].length > 0)
            .map(muscle => `
                <div class="exercise-category">
                    <h4 style="margin: 1.5rem 0.5rem 0.75rem; color: var(--secondary); font-size: var(--fs-lg); text-transform: uppercase; letter-spacing: 0.05em;">
                        ${muscle}
                    </h4>
                    ${grouped[muscle].map(ex => `
                        <div class="card" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 700;">${ex.name}</span>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn-icon edit-ex-btn" data-ex-id="${ex.id}" data-ex-name="${ex.name}" data-ex-muscle="${ex.target_muscle || ''}"><i data-lucide="edit-2"></i></button>
                                <button class="btn-icon btn-icon-danger delete-ex-btn" data-ex-id="${ex.id}"><i data-lucide="trash-2"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('');

        container.innerHTML = `
            <div class="scroll-area exercises-list" id="exercises-list">
                ${listHtml || '<div style="text-align:center; color:var(--text-secondary); margin-top: 3rem;">暂无训练动作</div>'}
            </div>
        `;

        this.setupFooter();

        return container;
    }

    setupFooter() {
        this.footer.classList.remove('hidden');
        this.footer.innerHTML = `
            <button class="btn btn-primary" id="footer-add-ex-btn" style="width: 100%;">
                <i data-lucide="plus"></i> 新增训练动作
            </button>
        `;
        
        document.getElementById('footer-add-ex-btn').onclick = () => this.handleAddExercise();
    }

    handleAddExercise() {
        const modalHtml = `
            <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1.25rem; color: var(--primary);">新增训练动作</div>
            <div class="form-group" style="margin-top:1rem;">
                <label class="form-label">动作名称</label>
                <input type="text" class="form-input" id="new-ex-name" placeholder="请输入动作名称...">
            </div>
            <div class="form-group">
                <label class="form-label">目标肌群</label>
                <select class="form-select" id="new-ex-muscle">
                    <option value="">未分类</option>
                    ${this.state.muscleGroups.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
            </div>
            <div style="display:flex; gap:1rem; margin-top:2rem;">
                <button class="btn btn-outline cancel-btn" style="flex:1;">取消</button>
                <button class="btn btn-primary confirm-btn" style="flex:1;">保存</button>
            </div>
        `;

        window.showModal(modalHtml, async () => {
            const name = document.getElementById('new-ex-name').value;
            const target_muscle = document.getElementById('new-ex-muscle').value;
            if (!name) return;
            await api.createExercise({ name, target_muscle });
            this.refresh();
        });
    }

    afterRender() {
        // Edit
        document.querySelectorAll('.edit-ex-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.exId;
                const name = btn.dataset.exName;
                const muscle = btn.dataset.exMuscle;
                
                const modalHtml = `
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1.25rem; color: var(--primary);">编辑训练动作</div>
                    <div class="form-group" style="margin-top:1rem;">
                        <label class="form-label">动作名称</label>
                        <input type="text" class="form-input" id="edit-ex-name" value="${name}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">目标肌群</label>
                        <select class="form-select" id="edit-ex-muscle">
                            <option value="">未分类</option>
                            ${this.state.muscleGroups.map(m => `<option value="${m}" ${m === muscle ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display:flex; gap:1rem; margin-top:2rem;">
                        <button class="btn btn-outline cancel-btn" style="flex:1;">取消</button>
                        <button class="btn btn-primary confirm-btn" style="flex:1;">保存</button>
                    </div>
                `;

                window.showModal(modalHtml, async () => {
                    const newName = document.getElementById('edit-ex-name').value;
                    const newMuscle = document.getElementById('edit-ex-muscle').value;
                    if (!newName) return;
                    await api.updateExercise(id, { name: newName, target_muscle: newMuscle });
                    this.refresh();
                });
            };
        });

        // Delete (rest remains same but I should re-add it carefully)
        document.querySelectorAll('.delete-ex-btn').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.exId;
                window.showModal(`
                    <div style="text-align:center; padding: 0.5rem 0;">
                        <div style="font-weight:700; font-size:1.1rem; margin-bottom:1rem; color:var(--danger);">删除动作</div>
                        <div style="color:var(--text-secondary); margin-bottom:2rem;">确定删除此动作吗？如果已有训练记录引用此动作可能会导致错误。</div>
                        <div style="display:flex; gap:1rem;">
                            <button class="btn btn-outline cancel-btn" style="flex:1;">取消</button>
                            <button class="btn btn-danger confirm-btn" style="flex:1;">确定删除</button>
                        </div>
                    </div>
                `, async () => {
                    await api.deleteExercise(id);
                    this.refresh();
                });
            };
        });
    }

    async refresh() {
        const newContent = await this.render();
        document.getElementById('main-content').innerHTML = '';
        document.getElementById('main-content').appendChild(newContent);
        if (window.lucide) window.lucide.createIcons();
        if (window.initCustomSelects) window.initCustomSelects();
        this.afterRender();
    }
}
