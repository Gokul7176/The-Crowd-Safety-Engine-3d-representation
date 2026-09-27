import { ZONES, SLIDING_WINDOW, PIPELINE_NODES, OPERATOR_WORKFLOW, MAPREDUCE_DEMO } from './crowdData.js';

export function setupUIController(interactionHandler, sceneSetup, toggleSimulationCallback) {
  let isSimulating = true;
  let activeSelection = { type: 'ZONE', id: 'ZONE_D' };

  // DOM Element References
  const inspectorContent = document.getElementById('inspector-content');
  const slidingWindowContainer = document.getElementById('sliding-window-widget');
  const alertToast = document.getElementById('alert-toast');
  const btnToggleSim = document.getElementById('btn-toggle-sim');
  const btnResetView = document.getElementById('btn-reset-view');

  // Quick Navigation Buttons
  document.querySelectorAll('.btn-zone-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const zoneId = btn.dataset.zone;
      activeSelection = { type: 'ZONE', id: zoneId };
      interactionHandler.focusOnZone(zoneId);
      renderInspector();
    });
  });

  document.querySelectorAll('.btn-node-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const nodeId = btn.dataset.node;
      activeSelection = { type: 'PIPELINE_NODE', id: nodeId };
      interactionHandler.focusOnPipelineNode(nodeId);
      renderInspector();
    });
  });

  if (btnResetView) {
    btnResetView.addEventListener('click', () => {
      sceneSetup.resetView();
    });
  }

  if (btnToggleSim) {
    btnToggleSim.addEventListener('click', () => {
      isSimulating = !isSimulating;
      btnToggleSim.classList.toggle('active', isSimulating);
      btnToggleSim.innerHTML = isSimulating
        ? '<span class="status-dot green"></span> SIMULATION: RUNNING'
        : '<span class="status-dot gray"></span> SIMULATION: PAUSED';
      toggleSimulationCallback(isSimulating);
    });
  }

  // Trigger New Stream Event in Sliding Window
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-step-window')) {
      const result = SLIDING_WINDOW.pushNewEvent();
      // Update Zone D count
      ZONES.ZONE_D.count = result.newEvent.count;
      ZONES.ZONE_D.status = result.newEvent.state;
      renderSlidingWindowWidget();
      renderInspector();
      showToastNotification(`New Stream Event Arrived (${result.newEvent.timestamp} -> ${result.newEvent.count} people). Window advanced!`);
    }

    if (e.target.closest('#btn-operator-action')) {
      openOperatorModal();
    }

    if (e.target.closest('.modal-close')) {
      closeModals();
    }
  });

  // Render Sidebar Inspector Content
  function renderInspector() {
    if (!inspectorContent) return;

    if (activeSelection.type === 'ZONE') {
      const zone = ZONES[activeSelection.id];
      const statusClass = zone.status.toLowerCase();

      inspectorContent.innerHTML = `
        <div class="inspector-card">
          <div class="card-header">
            <span class="badge ${statusClass}">${zone.status}</span>
            <span class="type-tag">${zone.type}</span>
          </div>
          <h3 class="zone-title">${zone.name}</h3>
          <p class="zone-desc">${zone.description}</p>

          <div class="stat-grid">
            <div class="stat-box">
              <span class="stat-label">Current Count</span>
              <span class="stat-val ${statusClass}">${zone.count} <small>people</small></span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Capacity Limit</span>
              <span class="stat-val">${zone.capacity} <small>max</small></span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Crowd Density</span>
              <span class="stat-val">${zone.density} <small>p/m²</small></span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Trend (5-Min)</span>
              <span class="stat-val trend">${zone.trend}</span>
            </div>
          </div>

          <div class="capacity-bar-container">
            <div class="capacity-bar-header">
              <span>Zone Capacity Load</span>
              <span>${Math.round((zone.count / zone.capacity) * 100)}%</span>
            </div>
            <div class="capacity-bar">
              <div class="capacity-fill ${statusClass}" style="width: ${Math.min(100, (zone.count / zone.capacity) * 100)}%"></div>
            </div>
          </div>

          <div class="window-section">
            <div class="section-title">
              <span>LATEST 5-MINUTE SLIDING WINDOW</span>
              <button id="btn-step-window" class="btn-micro">+ STEP EVENT</button>
            </div>
            <div id="sliding-window-list" class="window-list">
              <!-- Rendered by renderSlidingWindowWidget -->
            </div>
          </div>

          <div class="action-footer">
            <button id="btn-operator-action" class="btn-primary-action ${zone.status === 'CRITICAL' ? 'pulse-alert' : ''}">
              ${zone.status === 'CRITICAL' ? '⚠️ EXECUTE OPERATOR INTERVENTION' : 'VIEW OPERATOR WORKFLOW'}
            </button>
          </div>
        </div>
      `;
      renderSlidingWindowWidget();
    } else if (activeSelection.type === 'PIPELINE_NODE') {
      const node = PIPELINE_NODES[activeSelection.id];

      let nodeContent = '';
      if (node.id === 'HDFS') {
        nodeContent = `
          <div class="tech-box">
            <h4>HDFS Cluster Log Storage</h4>
            <p>Path: <code>/crowd/logs/2026/09/27/zone_events.snappy.parquet</code></p>
            <div class="log-preview">
              <div class="log-line">08:15:00 [INFO] Zone_A: 16 | Zone_B: 45 | Zone_D: 78</div>
              <div class="log-line">08:15:15 [INFO] Zone_A: 18 | Zone_B: 48 | Zone_D: 82</div>
              <div class="log-line">08:15:30 [INFO] Zone_A: 14 | Zone_B: 52 | Zone_D: 85</div>
              <div class="log-line warn">08:15:45 [WARN] Zone_D threshold > 80! Event stored.</div>
            </div>
          </div>
        `;
      } else if (node.id === 'MAPREDUCE') {
        nodeContent = `
          <div class="tech-box">
            <h4>MapReduce Batch Aggregation</h4>
            <div class="mr-phase">
              <strong>MAP PHASE:</strong><br/>
              <code>R1(Zone_D) -> 78, R2(Zone_D) -> 82, R3(Zone_D) -> 86</code>
            </div>
            <div class="mr-phase">
              <strong>SHUFFLE PHASE:</strong><br/>
              <code>Zone_D -> [78, 82, 85, 86]</code>
            </div>
            <div class="mr-phase">
              <strong>REDUCE PHASE:</strong><br/>
              <code>Zone_D Peak -> 86 | Avg -> 82.75 [CRITICAL]</code>
            </div>
          </div>
        `;
      } else if (node.id === 'STREAM_PROCESSING') {
        nodeContent = `
          <div class="tech-box">
            <h4>Stream Analytics Engine</h4>
            <p>Windowing: <strong>Tumbling / Sliding 5-Minute Window</strong></p>
            <p>Processing Latency: <strong>12 ms</strong></p>
            <p>State Backend: <strong>RocksDB Distributed State</strong></p>
          </div>
        `;
      } else if (node.id === 'DASHBOARD') {
        nodeContent = `
          <div class="tech-box">
            <h4>Operations Control Room</h4>
            <p>Operator: <strong>Station Master Terminal 01</strong></p>
            <p>Active Alert: <span class="badge critical">ZONE D CRITICAL</span></p>
            <p>Workflow State: <strong>DETECT → VERIFY → RESPOND</strong></p>
          </div>
        `;
      }

      inspectorContent.innerHTML = `
        <div class="inspector-card">
          <div class="card-header">
            <span class="badge green">${node.status}</span>
            <span class="type-tag">Big Data Pipeline</span>
          </div>
          <h3 class="zone-title">${node.title}</h3>
          <p class="zone-desc">${node.detail}</p>

          <div class="stat-grid">
            <div class="stat-box">
              <span class="stat-label">Role</span>
              <span class="stat-val text-sm">${node.role}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Technology</span>
              <span class="stat-val text-sm">${node.tech}</span>
            </div>
          </div>

          ${nodeContent}
        </div>
      `;
    } else if (activeSelection.type === 'SENSOR') {
      const sensor = activeSelection.data;
      inspectorContent.innerHTML = `
        <div class="inspector-card">
          <div class="card-header">
            <span class="badge green">ONLINE</span>
            <span class="type-tag">Telemetry Hardware</span>
          </div>
          <h3 class="zone-title">${sensor.type}</h3>
          <p class="zone-desc">Monitors live optical inflow/outflow for ${sensor.zone}.</p>
          <div class="stat-grid">
            <div class="stat-box">
              <span class="stat-label">Sensor ID</span>
              <span class="stat-val text-sm">${sensor.id}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Sampling Rate</span>
              <span class="stat-val text-sm">30 FPS Video</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Render 5-Minute Sliding Window Items
  function renderSlidingWindowWidget() {
    const listEl = document.getElementById('sliding-window-list');
    if (!listEl) return;

    listEl.innerHTML = SLIDING_WINDOW.events.map((ev, idx) => {
      const isLatest = idx === SLIDING_WINDOW.events.length - 1;
      const stateClass = ev.state.toLowerCase();
      return `
        <div class="window-item ${isLatest ? 'latest-event' : ''}">
          <span class="win-time">${ev.timestamp}</span>
          <span class="win-bar">
            <span class="win-fill ${stateClass}" style="width: ${Math.min(100, (ev.count / 95) * 100)}%"></span>
          </span>
          <span class="win-count ${stateClass}">${ev.count}</span>
          <span class="win-delta">${ev.delta}</span>
          ${isLatest ? '<span class="latest-tag">LATEST</span>' : ''}
        </div>
      `;
    }).join('');
  }

  // Operator Response Modal Workflow
  function openOperatorModal() {
    const modal = document.getElementById('operator-modal');
    if (!modal) return;
    modal.classList.add('visible');

    const modalBody = document.getElementById('operator-modal-body');
    modalBody.innerHTML = `
      <div class="workflow-stepper">
        <div class="step-item completed">
          <span class="step-num">1</span>
          <span class="step-name">DETECT</span>
        </div>
        <div class="step-line active"></div>
        <div class="step-item active">
          <span class="step-num">2</span>
          <span class="step-name">VERIFY</span>
        </div>
        <div class="step-line"></div>
        <div class="step-item">
          <span class="step-num">3</span>
          <span class="step-name">RESPOND</span>
        </div>
        <div class="step-line"></div>
        <div class="step-item">
          <span class="step-num">4</span>
          <span class="step-name">MONITOR</span>
        </div>
      </div>

      <div class="alert-banner critical-banner">
        <h4>🚨 LIVE CROWD ALERT: ZONE D (CRITICAL CONGESTION)</h4>
        <p>Turnstile exit queue has reached 86 passengers (91% density limit). Sliding window indicates continuous inflow over last 5 minutes.</p>
      </div>

      <div class="intervention-options">
        <h4>Select Operator Intervention Action:</h4>
        <div class="option-card" id="opt-gate3">
          <div class="opt-icon">🚪</div>
          <div class="opt-info">
            <strong>OPEN AUXILIARY GATE 3</strong>
            <p>Unlocks secondary side exit corridor to relieve turnstile pressure in Zone D.</p>
          </div>
          <button class="btn-action-execute" onclick="window.executeIntervention('OPEN_AUX_GATE')">EXECUTE</button>
        </div>

        <div class="option-card" id="opt-marshals">
          <div class="opt-icon">👮</div>
          <div class="opt-info">
            <strong>DEPLOY CROWD MARSHALS</strong>
            <p>Dispatches 4 station security personnel to manage passenger queueing.</p>
          </div>
          <button class="btn-action-execute" onclick="window.executeIntervention('DEPLOY_MARSHALS')">EXECUTE</button>
        </div>

        <div class="option-card" id="opt-reroute">
          <div class="opt-icon">📢</div>
          <div class="opt-info">
            <strong>BROADCAST AUDIO REROUTE ANNOUNCEMENT</strong>
            <p>Directs incoming Platform 1 passengers to West Corridor (Zone C).</p>
          </div>
          <button class="btn-action-execute" onclick="window.executeIntervention('BROADCAST_REROUTE')">EXECUTE</button>
        </div>
      </div>
    `;
  }

  // Global action execution callback
  window.executeIntervention = function(actionType) {
    if (actionType === 'OPEN_AUX_GATE') {
      ZONES.ZONE_D.count = 45;
      ZONES.ZONE_D.status = 'HIGH';
      ZONES.ZONE_D.density = 0.48;
      ZONES.ZONE_D.trend = 'REDUCING';
      showToastNotification('✅ Auxiliary Gate 3 Opened! Zone D count reduced to 45.');
    } else if (actionType === 'DEPLOY_MARSHALS') {
      ZONES.ZONE_D.count = 58;
      ZONES.ZONE_D.status = 'HIGH';
      showToastNotification('👮 Crowd Marshals Deployed. Passenger queue regulated.');
    } else if (actionType === 'BROADCAST_REROUTE') {
      ZONES.ZONE_D.count = 62;
      showToastNotification('📢 Audio Announcement Broadcasted. Passenger traffic diverted.');
    }
    closeModals();
    renderInspector();
  };

  function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('visible'));
  }

  function showToastNotification(msg) {
    if (!alertToast) return;
    alertToast.textContent = msg;
    alertToast.classList.add('visible');
    setTimeout(() => alertToast.classList.remove('visible'), 4000);
  }

  // Handle raycast click event selection from interaction.js
  function handleSelectObject(selection) {
    activeSelection = selection;
    renderInspector();
  }

  // Initial render
  renderInspector();

  return {
    handleSelectObject,
    renderInspector
  };
}
