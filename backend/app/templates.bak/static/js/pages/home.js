import api from '../api.js';

export default class HomePage {
    constructor(state, { router, headerVar, footer }) {
        this.state = state;
        this.router = router;
        this.headerVar = headerVar;
        this.footer = footer;
        // 用本地日期维护日历显示
        this.currentDate = dayjs();
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'home-page';
        container.style.padding = '0.75rem';

        const calendarData = await api.getCalendar(this.currentDate.year(), this.currentDate.month() + 1);
        
        this.headerVar.textContent = '';
        
        container.innerHTML = `
            <div class="card">
                <div class="calendar-header" style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button class="btn-icon prev-month"><i data-lucide="chevron-left"></i></button>
                    <span style="font-weight: 600;">${this.currentDate.format('YYYY年MM月')}</span>
                    <button class="btn-icon next-month"><i data-lucide="chevron-right"></i></button>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-day-label">日</div>
                    <div class="calendar-day-label">一</div>
                    <div class="calendar-day-label">二</div>
                    <div class="calendar-day-label">三</div>
                    <div class="calendar-day-label">四</div>
                    <div class="calendar-day-label">五</div>
                    <div class="calendar-day-label">六</div>
                    ${this.generateCalendarDays(calendarData)}
                </div>
            </div>

            <div class="card quick-stats">
                <h3 style="margin-bottom: 0.5rem; font-size: 1rem;">本月训练</h3>
                <div style="font-size: 2rem; font-weight: 700; color: var(--secondary);">
                    ${Object.keys(calendarData.training_days).length} <span style="font-size: 1rem; color: var(--text-secondary);">天</span>
                </div>
            </div>
        `;

        this.setupFooter();
        
        return container;
    }

    generateCalendarDays(data) {
        const { first_weekday, days_in_month, training_days } = data;
        let html = '';
        
        // Empty cells for first week
        // Python's monthrange weekday is 0 (Mon) to 6 (Sun)
        // Lucide/Standard grid expects 0 (Sun) to 6 (Sat).
        // Adjusting...
        const startOffset = (first_weekday + 1) % 7; 
        
        for (let i = 0; i < startOffset; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        const today = dayjs();
        const isCurrentMonth = today.year() === this.currentDate.year() && today.month() === this.currentDate.month();

        for (let day = 1; day <= days_in_month; day++) {
            const hasRecord = training_days[day];
            const isToday = isCurrentMonth && today.date() === day;
            const dayClass = `calendar-day ${isToday ? 'active' : ''} ${hasRecord ? 'has-record' : ''}`;
            const dayId = hasRecord ? training_days[day] : null;
            
            html += `<div class="calendar-day ${dayClass}" onclick="${dayId ? `location.hash='/training/${dayId}'` : `location.hash='/training?date=${this.currentDate.date(day).format('YYYY-MM-DD')}'`}">
                ${day}
            </div>`;
        }
        
        return html;
    }

    setupFooter() {
        this.footer.classList.remove('hidden');
        this.footer.innerHTML = `
            <button class="btn btn-outline" id="nav-exercises">
                <i data-lucide="settings"></i> 训练动作
            </button>
            <button class="btn btn-primary" id="start-training-btn" style="flex: 1.5;">
                <i data-lucide="plus-circle"></i> 开始训练
            </button>
            <button class="btn btn-outline" id="nav-logs">
                <i data-lucide="list"></i> 训练日志
            </button>
        `;
        
        document.getElementById('nav-exercises').onclick = (e) => window.navigateWithLoading(e.currentTarget, '/exercises');
        document.getElementById('start-training-btn').onclick = () => this.showPrimaryMuscleModal();
        document.getElementById('nav-logs').onclick = (e) => window.navigateWithLoading(e.currentTarget, '/logs');
    }

    showPrimaryMuscleModal() {
        const modalHtml = `
            <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1.25rem; color: var(--primary);">今天练哪里？</div>
            <div class="form-group">
                <div class="muscle-toggle-group" id="primary-muscle" style="display:flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${this.state.muscleGroups
                        .map(
                            (m) =>
                                `<button type="button" class="btn btn-outline muscle-toggle" data-value="${m}" style="flex: 1; min-width: 4.5rem;">${m}</button>`
                        )
                        .join('')}
                </div>
            </div>
            <div style="display:flex; gap:1rem; margin-top:2rem;">
                <button class="btn btn-outline cancel-btn" style="flex:1;">稍后</button>
                <button class="btn btn-primary confirm-btn" style="flex:1;">开始训练</button>
            </div>
        `;

        window.showModal(modalHtml, async () => {
            const selected = Array.from(document.querySelectorAll('#primary-muscle .muscle-toggle.is-selected'))
                .map(btn => btn.dataset.value)
                .filter(Boolean);
            this.state.pendingPrimaryMuscles = selected.length ? selected : null;
            const confirmBtn = document.querySelector('#modal-content .confirm-btn');
            window.navigateWithLoading(confirmBtn, '/training');
            await new Promise((resolve) => {
                const check = () => {
                    if (location.hash.includes('/training')) {
                        resolve();
                        return;
                    }
                    requestAnimationFrame(check);
                };
                check();
            });
        }, null, { loading: 'none' });

        setTimeout(() => {
            document.querySelectorAll('#primary-muscle .muscle-toggle').forEach(btn => {
                btn.onclick = () => {
                    btn.classList.toggle('is-selected');
                    if (btn.classList.contains('is-selected')) {
                        btn.style.background = 'rgba(99, 102, 241, 0.12)';
                        btn.style.borderColor = 'rgba(99, 102, 241, 0.35)';
                    } else {
                        btn.style.background = '';
                        btn.style.borderColor = '';
                    }
                };
            });
        }, 0);
    }

    afterRender() {
        document.querySelector('.prev-month').onclick = (e) => window.withBtnLoading(e.currentTarget, async () => {
            this.currentDate = this.currentDate.subtract(1, 'month');
            // Re-render essentially
            const newContent = await this.render();
            document.getElementById('main-content').innerHTML = '';
            document.getElementById('main-content').appendChild(newContent);
            if (window.lucide) window.lucide.createIcons();
            this.afterRender();
        });
        document.querySelector('.next-month').onclick = (e) => window.withBtnLoading(e.currentTarget, async () => {
            this.currentDate = this.currentDate.add(1, 'month');
            const newContent = await this.render();
            document.getElementById('main-content').innerHTML = '';
            document.getElementById('main-content').appendChild(newContent);
            if (window.lucide) window.lucide.createIcons();
            this.afterRender();
        });
    }
}
