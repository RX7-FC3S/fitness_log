import api from '../api.js';

export default class LogsPage {
    constructor(state, { router, headerVar, footer }) {
        this.state = state;
        this.router = router;
        this.headerVar = headerVar;
        this.footer = footer;
        this.logs = [];
        this.filters = {
            from_date: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
            to_date: dayjs().format('YYYY-MM-DD'),
            exercise_name: ''
        };
    }

    async render() {
        this.headerVar.textContent = '训练日志';
        const container = document.createElement('div');
        container.className = 'logs-page';
        container.style.cssText = 'display: flex; flex-direction: column; flex: 1; min-height: 0;';

        this.logs = await api.getLogs(this.filters);

        container.innerHTML = `
            <div class="page-header" style="padding: 0.75rem; z-index: 99;">
                <div class="form-group">
                    <input type="text" class="form-input" id="filter-search" placeholder="搜索动作..." value="${this.filters.exercise_name}">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label">开始日期</label>
                        <input type="date" class="form-input" id="filter-from" value="${this.filters.from_date}">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label">结束日期</label>
                        <input type="date" class="form-input" id="filter-to" value="${this.filters.to_date}">
                    </div>
                </div>
            </div>

            <div class="scroll-area" id="logs-list">
                ${this.renderLogsList()}
            </div>
        `;

        this.setupFooter();

        return container;
    }

    renderLogsList() {
        if (!this.logs.length) {
            return '<div style="text-align:center; color:var(--text-secondary); margin-top: 3rem;">没有找到相关记录</div>';
        }

        return this.logs.map(day => {
            const grouped = {};
            day.sets.forEach(set => {
                if (!grouped[set.exercise]) grouped[set.exercise] = [];
                grouped[set.exercise].push(set);
            });

            // Sort exercises by their earliest created_at time
            const sortedExercises = Object.keys(grouped).sort((exNameA, exNameB) => {
                const setsA = grouped[exNameA];
                const setsB = grouped[exNameB];
                
                const earliestA = Math.min(...setsA.map(s => new Date(s.created_at || 0).getTime()));
                const earliestB = Math.min(...setsB.map(s => new Date(s.created_at || 0).getTime()));
                
                return earliestA - earliestB;
            });

            const exerciseGroupsHtml = sortedExercises.map(exName => {
                const sets = grouped[exName];
                // Sort sets by created_at in ascending order
                sets.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateA - dateB;
                });
                const setsHtml = sets.map((set, index) => {
                    const typeLabel = this.state.setTypes.find(t => t.value === set.set_type)?.label || set.set_type;
                    const typeClass = `badge-${set.set_type.toLowerCase()}`;
                    
                    return `
                        <div style="padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.03);">
                            <div style="display: flex; align-items: center; font-size: 0.95rem;">
                                <span style="width: 1.5rem; color: var(--text-secondary); font-variant-numeric: tabular-nums;">${index + 1}</span>
                                <span style="flex: 1; font-weight: 700; color: var(--text-primary);">
                                    ${set.weight}<span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-left:1px;">${set.unit}</span> 
                                    <span style="font-weight: 400; color: var(--border); margin: 0 0.25rem;">×</span> 
                                    ${set.reps}<span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-left:1px;">次</span>
                                </span>
                                <span class="set-type-badge ${typeClass}" style="font-size: 0.7rem; padding: 0.1rem 0.4rem; transform: scale(0.9); transform-origin: right center;">${typeLabel}</span>
                            </div>
                            ${set.remark ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; padding-left: 1.5rem; line-height: 1.4;">${set.remark}</div>` : ''}
                        </div>
                    `;
                }).join('');

                return `
                    <div class="log-exercise-box" style="margin-bottom: 1rem; background: #fff; border-radius: 0.75rem; border: 1px solid var(--border); overflow: hidden;">
                        <div style="background: var(--bg-main); padding: 0.5rem 0.75rem; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--border);">
                            ${exName}
                        </div>
                        <div style="padding: 0.25rem 0;">
                            ${setsHtml}
                        </div>
                    </div>
                `;
            }).join('');

            // Count unique exercises
            const exerciseCount = Object.keys(grouped).length;

            return `
                <div class="log-day-section" style="margin-bottom: 2rem;">
                    <div style="display: flex; align-items: baseline; gap: 0.75rem; margin: 1.5rem 0.25rem 0.75rem;">
                        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0;">${day.date}</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">${exerciseCount} 动作 | ${day.sets.length} 组</span>
                    </div>
                    ${exerciseGroupsHtml}
                </div>
            `;
        }).join('');
    }

    setupFooter() {
        this.footer.classList.remove('hidden');
        this.footer.innerHTML = `
            <button class="btn btn-primary" id="apply-filters-btn" style="width: 100%;">
                <i data-lucide="search"></i> 筛选历史记录
            </button>
        `;
    }

    afterRender() {
        document.getElementById('apply-filters-btn').onclick = (e) => window.withBtnLoading(e.currentTarget, async () => await this.refresh());
    }

    async refresh() {
        this.filters.exercise_name = document.getElementById('filter-search').value;
        this.filters.from_date = document.getElementById('filter-from').value;
        this.filters.to_date = document.getElementById('filter-to').value;
        
        const newContent = await this.render();
        document.getElementById('main-content').innerHTML = '';
        document.getElementById('main-content').appendChild(newContent);
        if (window.lucide) window.lucide.createIcons();
        if (window.initCustomSelects) window.initCustomSelects();
        this.afterRender();
    }
}
