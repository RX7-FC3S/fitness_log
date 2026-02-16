import api from "../api.js";

export default class TrainingPage {
  constructor(state, { router, headerVar, footer }) {
    this.state = state;
    this.router = router;
    this.headerVar = headerVar;
    this.footer = footer;
    this.dayData = null;
    this.formValues = {
      exerciseId: "",
      setType: "WORKING",
      unitId: state.units[0]?.id || 1,
      weight: "",
      reps: "",
    };
    if (this.state.pendingPrimaryMuscles && this.state.pendingPrimaryMuscles.length) {
      this.primaryMuscleSelection = this.state.pendingPrimaryMuscles;
      this.state.pendingPrimaryMuscles = null;
    } else {
      this.primaryMuscleSelection = null;
    }
  }

  async render(dayId) {
    const container = document.createElement("div");
    container.className = "training-page";
    container.style.cssText = "display: flex; flex-direction: column; flex: 1; min-height: 0;";

    try {
      if (dayId) {
        this.dayData = await api.getDayDetail(dayId);
      } else {
        this.dayData = await api.getTodayTraining();
      }
    } catch (error) {
      console.error("Failed to load training data", error);
    }

    const date = this.dayData?.start_time
      ? (dayjs.utc
          ? (dayjs.tz
              ? dayjs.utc(this.dayData.start_time).tz(this.state.timezone)
              : dayjs.utc(this.dayData.start_time).local())
          : dayjs(this.dayData.start_time))
      : dayjs();
    const primaryMusclesForHeader = this.resolvePrimaryMuscles();
    if (primaryMusclesForHeader.length) {
      this.headerVar.innerHTML = `
        <span style="display:block; font-weight: 700;">${primaryMusclesForHeader.join(" + ")}</span>
      `;
    } else {
      this.headerVar.textContent = "";
    }

    const primaryMuscles = this.resolvePrimaryMuscles();
    const sortedExercises = this.state.exercises.slice().sort((a, b) => {
      if (!primaryMuscles.length) return 0;
      const aPrimary = primaryMuscles.includes(a.target_muscle);
      const bPrimary = primaryMuscles.includes(b.target_muscle);
      if (aPrimary === bPrimary) return 0;
      return aPrimary ? -1 : 1;
    });

    container.innerHTML = `
            <div class="page-header" style="padding: 0.75rem;  z-index: 99;">
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <select class="form-select" id="input-exercise">
                        <option value="">选择动作...</option>
                        ${sortedExercises
                          .map((e) => {
                            const isPrimary = primaryMuscles.length && primaryMuscles.includes(e.target_muscle);
                            return `<option value="${e.id}" data-primary="${isPrimary ? "1" : "0"}" ${this.formValues.exerciseId == e.id ? "selected" : ""}>${e.name}</option>`;
                          })
                          .join("")}
                    </select>
                    <select class="form-select" id="input-set-type">
                        ${this.state.setTypes.map((t) => `<option value="${t.value}" ${this.formValues.setType === t.value ? "selected" : ""}>${t.label}</option>`).join("")}
                    </select>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
                    <select class="form-select" id="input-unit">
                        ${this.state.units.map((u) => `<option value="${u.id}" ${this.formValues.unitId == u.id ? "selected" : ""}>${u.name}</option>`).join("")}
                    </select>
                    <input type="number" class="form-input" id="input-weight" placeholder="重量" step="0.5" value="${this.formValues.weight}">
                    <input type="number" class="form-input" id="input-reps" placeholder="次数" value="${this.formValues.reps}">
                </div>
            </div>

            <div class="scroll-area" id="sets-list-container">
                ${this.renderSetsList()}
            </div>
        `;

    this.setupFooter();

    return container;
  }

  renderSetsList() {
    if (!this.dayData || !this.dayData.exercises.length) {
      return '<div style="text-align:center; color:var(--text-secondary); margin-top: 2rem;">还没有记录，开始训练吧！</div>';
    }

    return this.dayData.exercises
      .map(
        (group) => `
            <div class="exercise-group">
                <h4 style="margin: 1.5rem 0.5rem 0.75rem; color: var(--secondary); font-size: var(--fs-lg); text-transform: uppercase; letter-spacing: 0.05em;">
                    ${group.exercise.name}
                </h4>
                ${group.sets.map((set) => this.renderSetCard(group.exercise, set)).join("")}
            </div>
        `,
      )
      .join("");
  }

  renderSetCard(exercise, set) {
    const typeLabel = this.state.setTypes.find((t) => t.value === set.set_type)?.label || set.set_type;
    const typeClass = `badge-${set.set_type.toLowerCase()}`;

    return `
            <div class="card set-card" data-set-id="${set.id}" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-radius: 1rem;">
                <div class="set-card-content">
                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap: wrap;">
                        <span class="set-details">
                            ${set.weight} <span>${set.unit.name}</span>
                            <span style="color:var(--text-secondary); font-weight:400; margin: 0 0.25rem;">×</span>
                            ${set.reps} <span>次</span>
                        </span>
                        <span class="set-type-badge ${typeClass}">${typeLabel}</span>
                    </div>
                    ${set.remark ? `<div style="font-size: var(--fs-sm); color: var(--text-secondary); margin-top: 0.25rem;">${set.remark}</div>` : ""}
                </div>
                <div class="set-actions">
                    <button class="btn-icon remark-set-btn" data-set-id="${set.id}" style="width: 28px; height: 28px;"><i data-lucide="message-square"></i></button>
                    <button class="btn-icon edit-set-btn" data-set-id="${set.id}" style="width: 28px; height: 28px;"><i data-lucide="edit-3"></i></button>
                    <button class="btn-icon btn-icon-danger delete-set-btn" data-set-id="${set.id}" style="width: 28px; height: 28px;"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
  }

  setupFooter() {
    this.footer.classList.remove("hidden");
    this.footer.innerHTML = `
            <button class="btn btn-outline ${!this.dayData.id ? "hidden" : ""}" id="finish-training-btn" style="flex: 1;">
                <i data-lucide="check-circle"></i> 结束训练
            </button>
            <button class="btn btn-primary" id="footer-add-set-btn" style="${!this.dayData.id ? "width: 100%;" : "flex: 2;"}">
                <i data-lucide="plus"></i> 添加此组
            </button>
        `;

    document.getElementById("footer-add-set-btn").onclick = (e) => window.withBtnLoading(e.currentTarget, async () => await this.handleAddSet());
    document.getElementById("finish-training-btn").onclick = (e) =>
      window.withBtnLoading(e.currentTarget, async () => {
        await api.finishDay(this.dayData.id);
        window.navigateTo(e.currentTarget, "/");
      });
  }

  async handleAddSet() {
    const exId = document.getElementById("input-exercise").value;
    const setType = document.getElementById("input-set-type").value;
    const weight = document.getElementById("input-weight").value;
    const unitId = document.getElementById("input-unit").value;
    const reps = document.getElementById("input-reps").value;
    const primaryMuscles = this.resolvePrimaryMuscles();

    // Remember values
    this.formValues = { exerciseId: exId, setType, unitId, weight, reps };

    if (!exId || !weight || !reps) {
      window.showModal(`
                <div style="text-align:center; padding: 1rem 0;">
                    <div style="font-weight:700; font-size:1.1rem; margin-bottom:1rem;">提示</div>
                    <div style="color:var(--text-secondary); margin-bottom:1.5rem;">请选择动作并填写重量和次数</div>
                    <button class="btn btn-primary confirm-btn" style="width:100%;">确认</button>
                </div>
            `);
      return;
    }

    const res = await api.createSet({
      fitness_day_id: this.dayData.id,
      exercise_id: parseInt(exId),
      set_type: setType,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      unit_id: parseInt(unitId),
      remark: "",
      primary_muscles: primaryMuscles,
    });

    // Refresh page - use the day ID from the newly created set if our current day ID was null
    const newDayId = this.dayData.id || res.fitness_day_id;
    const newContent = await this.render(newDayId);
    document.getElementById("main-content").innerHTML = "";
    document.getElementById("main-content").appendChild(newContent);
    if (window.lucide) window.lucide.createIcons();
    if (window.initCustomSelects) window.initCustomSelects();
    this.afterRender();

    // Scroll to bottom of sets list
    setTimeout(() => {
      const scrollArea = document.getElementById("sets-list-container");
      if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
    }, 0);
  }

  showPrimaryMuscleModal() {
    const modalHtml = `
        <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1.25rem; color: var(--primary);">今天练哪里？</div>
        <div class="form-group">
            <div class="muscle-toggle-group" id="primary-muscle" style="display:flex; flex-wrap: wrap; gap: 0.5rem;">
                ${this.state.muscleGroups
                  .map(
                    (m) => {
                      const selected = (this.primaryMuscleSelection || []).includes(m);
                      return `<button type="button" class="btn btn-outline muscle-toggle ${selected ? "is-selected" : ""}" data-value="${m}" style="flex: 1; min-width: 4.5rem; ${selected ? "background: rgba(99, 102, 241, 0.12); border-color: rgba(99, 102, 241, 0.35);" : ""}">${m}</button>`;
                    },
                  )
                  .join("")}
            </div>
        </div>
        <div style="display:flex; gap:1rem; margin-top:2rem;">
            <button class="btn btn-outline cancel-btn" style="flex:1;">稍后</button>
            <button class="btn btn-primary confirm-btn" style="flex:1;">开始训练</button>
        </div>
    `;

    window.showModal(modalHtml, async () => {
      const selected = Array.from(document.querySelectorAll("#primary-muscle .muscle-toggle.is-selected"))
        .map((btn) => btn.dataset.value)
        .filter(Boolean);
      this.primaryMuscleSelection = selected.length ? selected : null;
      const newContent = await this.render(this.dayData?.id);
      document.getElementById("main-content").innerHTML = "";
      document.getElementById("main-content").appendChild(newContent);
      if (window.lucide) window.lucide.createIcons();
      if (window.initCustomSelects) window.initCustomSelects();
      this.afterRender();
    }, () => {
      this.router.navigate("/");
    });

    setTimeout(() => {
      document.querySelectorAll("#primary-muscle .muscle-toggle").forEach((btn) => {
        btn.onclick = () => {
          btn.classList.toggle("is-selected");
          if (btn.classList.contains("is-selected")) {
            btn.style.background = "rgba(99, 102, 241, 0.12)";
            btn.style.borderColor = "rgba(99, 102, 241, 0.35)";
          } else {
            btn.style.background = "";
            btn.style.borderColor = "";
          }
        };
      });
    }, 0);
  }

  resolvePrimaryMuscles() {
    if (this.dayData?.primary_muscles && this.dayData.primary_muscles.length) {
      return this.dayData.primary_muscles;
    }
    return this.primaryMuscleSelection || [];
  }

  afterRender() {
    // Remark logic
    document.querySelectorAll(".remark-set-btn").forEach((btn) => {
      btn.onclick = async () => {
        const setId = btn.dataset.setId;
        let existingRemark = "";
        this.dayData.exercises.forEach((g) => {
          const s = g.sets.find((item) => item.id == setId);
          if (s) existingRemark = s.remark || "";
        });

        const modalHtml = `
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1.25rem; color: var(--primary);">添加/修改备注</div>
                    <div class="form-group">
                        <textarea class="form-input" id="remark-input" style="height: 100px; padding: 0.75rem; resize: none;" placeholder="输入备注内容...">${existingRemark}</textarea>
                    </div>
                    <div style="display:flex; gap:1rem; margin-top:2rem;">
                        <button class="btn btn-outline cancel-btn" style="flex:1;">取消</button>
                        <button class="btn btn-primary confirm-btn" style="flex:1;">保存</button>
                    </div>
                `;

        window.showModal(modalHtml, async () => {
          const newRemark = document.getElementById("remark-input").value;
          await api.updateSet(setId, { remark: newRemark });
          const newContent = await this.render(this.dayData.id);
          document.getElementById("main-content").innerHTML = "";
          document.getElementById("main-content").appendChild(newContent);
          if (window.lucide) window.lucide.createIcons();
          if (window.initCustomSelects) window.initCustomSelects();
          this.afterRender();
        });
      };
    });

    // Delete set logic
    document.querySelectorAll(".delete-set-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        const setId = btn.dataset.setId;

        // Check if last set
        let allSetsCount = 0;
        this.dayData.exercises.forEach((g) => (allSetsCount += g.sets.length));

        if (allSetsCount === 1) {
          window.showModal(
            `
                        <div style="text-align:center; padding: 0.5rem 0;">
                            <div style="font-weight:700; font-size:1.1rem; margin-bottom:1rem; color:var(--danger);">最后一组</div>
                            <div style="color:var(--text-secondary); margin-bottom:2rem;">这是今天最后一组，删除后将清除今日记录并返回首页，确定吗？</div>
                            <div style="display:flex; gap:1rem;">
                                <button class="btn btn-outline cancel-btn" style="flex:1;">取消</button>
                                <button class="btn btn-danger confirm-btn" style="flex:1;">确定删除</button>
                            </div>
                        </div>
                    `,
            async () => {
              await api.deleteSet(setId);
              this.router.navigate("/");
            },
          );
          return;
        }

        window.showModal(
          `
                    <div style="text-align:center; padding: 0.5rem 0;">
                        <div style="font-weight:700; font-size:1.1rem; margin-bottom:1rem;">确认删除</div>
                        <div style="color:var(--text-secondary); margin-bottom:2rem;">确定要删除此组训练记录吗？</div>
                        <div style="display:flex; gap:1rem;">
                            <button class="btn btn-outline cancel-btn" style="flex:1;">取消</button>
                            <button class="btn btn-danger confirm-btn" style="flex:1;">确定删除</button>
                        </div>
                    </div>
                `,
          async () => {
            await api.deleteSet(setId);
            const newContent = await this.render(this.dayData.id);
            document.getElementById("main-content").innerHTML = "";
            document.getElementById("main-content").appendChild(newContent);
            if (window.lucide) window.lucide.createIcons();
            if (window.initCustomSelects) window.initCustomSelects();
            this.afterRender();
          },
        );
      };
    });

    // Edit set (modal) logic
    document.querySelectorAll(".edit-set-btn").forEach((btn) => {
      btn.onclick = async () => {
        const setId = btn.dataset.setId;
        // Find set data
        let setData = null;
        this.dayData.exercises.forEach((g) => {
          const s = g.sets.find((item) => item.id == setId);
          if (s) setData = { ...s, exercise: g.exercise };
        });

        if (!setData) return;

        const modalHtml = `
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1.25rem; color: var(--primary);">编辑：${setData.exercise.name}</div>
                    <div class="form-group">
                        <label class="form-label">组类型</label>
                        <select class="form-select" id="edit-set-type">
                            ${this.state.setTypes.map((t) => `<option value="${t.value}" ${t.value === setData.set_type ? "selected" : ""}>${t.label}</option>`).join("")}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">重量</label>
                        <input type="number" class="form-input" id="edit-weight" value="${setData.weight}" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">单位</label>
                        <select class="form-select" id="edit-unit">
                            ${this.state.units.map((u) => `<option value="${u.id}" ${u.id === setData.unit.id ? "selected" : ""}>${u.name}</option>`).join("")}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">次数 (Reps)</label>
                        <input type="number" class="form-input" id="edit-reps" value="${setData.reps}">
                    </div>
                    <div style="display:flex; gap:1rem; margin-top:2rem;">
                        <button class="btn btn-outline cancel-btn" style="flex:1;">取消</button>
                        <button class="btn btn-primary confirm-btn" style="flex:1;">保存</button>
                    </div>
                `;

        window.showModal(modalHtml, async () => {
          const newType = document.getElementById("edit-set-type").value;
          const newWeight = document.getElementById("edit-weight").value;
          const newUnit = document.getElementById("edit-unit").value;
          const newReps = document.getElementById("edit-reps").value;

          await api.updateSet(setId, {
            set_type: newType,
            weight: parseFloat(newWeight),
            unit_id: parseInt(newUnit),
            reps: parseInt(newReps),
          });

          // Refresh
          const newContent = await this.render(this.dayData.id);
          document.getElementById("main-content").innerHTML = "";
          document.getElementById("main-content").appendChild(newContent);
          if (window.lucide) window.lucide.createIcons();
          if (window.initCustomSelects) window.initCustomSelects();
          this.afterRender();
        });
      };
    });
  }
}
