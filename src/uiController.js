import { simulationState, getZoneMetrics, stepSlidingWindow } from './crowdData.js';
import { updateGate3Visual } from './venueBuilder.js';
import { syncCrowdDensityForZone } from './humanBuilder.js';

export function setupUIController(interactionHandler, sceneSetup, toggleSimulationCallback, scene, crowdMembers, zoneBounds) {
  const inspectorContent = document.getElementById('inspector-content');
  const alertToast = document.getElementById('alert-toast');
  const btnToggleSim = document.getElementById('btn-toggle-sim');
  const btnResetView = document.getElementById('btn-reset-view');

  // Update Top Quick Navigation Bar Status Dots dynamically
  function syncTopNavStatusDots() {
    document.querySelectorAll('.btn-zone-nav').forEach(btn => {
      const zId = btn.dataset.zone;
      if (zId && simulationState.zones[zId]) {
        const zone = simulationState.zones[zId];
        const metrics = getZoneMetrics(zone);
        const dot = btn.querySelector('.status-dot');
        if (dot) {
          dot.className = `status-dot ${metrics.status === 'CRITICAL' ? 'red' : metrics.status === 'HIGH' ? 'amber' : 'green'}`;
        }
      }
    });

    // Update Alert Toast text dynamically
    if (alertToast) {
      const activeZone = simulationState.zones[simulationState.selectedZone];
      const activeMetrics = getZoneMetrics(activeZone);
      if (activeMetrics.status === 'CRITICAL') {
        alertToast.textContent = `🚨 LIVE CROWD ALERT: ${activeZone.name} Bottleneck Critical! (${activeZone.count} people)`;
        alertToast.classList.add('visible');
      } else {
        alertToast.classList.remove('visible');
      }
    }
  }

  // Quick Navigation Button Click Listeners
  document.querySelectorAll('.btn-zone-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const zoneId = btn.dataset.zone;
      if (!zoneId) return;
      simulationState.selectedZone = zoneId;
      simulationState.selectedPipelineNode = null;
      if (interactionHandler) interactionHandler.focusOnZone(zoneId);
      renderInspector();
      syncTopNavStatusDots();
    });
  });

  document.querySelectorAll('.btn-node-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const nodeId = btn.dataset.node;
      if (!nodeId) return;
      simulationState.selectedPipelineNode = nodeId;
      if (interactionHandler) interactionHandler.focusOnPipelineNode(nodeId);
      renderInspector();
    });
  });

  if (btnResetView) {
    btnResetView.addEventListener('click', () => {
      simulationState.selectedPipelineNode = null;
      if (sceneSetup && sceneSetup.resetView) sceneSetup.resetView();
    });
  }

  if (btnToggleSim) {
    btnToggleSim.addEventListener('click', () => {
      simulationState.isSimulating = !simulationState.isSimulating;
      btnToggleSim.classList.toggle('active', simulationState.isSimulating);
      btnToggleSim.innerHTML = simulationState.isSimulating
        ? '<span class="status-dot green"></span> LIVE SIMULATION'
        : '<span class="status-dot gray"></span> SIMULATION: PAUSED';
      if (toggleSimulationCallback) toggleSimulationCallback(simulationState.isSimulating);
    });
  }

  // Global Event Listener for Action Triggers & Modals
  document.addEventListener('click', (e) => {
    // 1. Step Event Button
    if (e.target.closest('#btn-step-window')) {
      const result = stepSlidingWindow(simulationState.selectedZone);
      if (result) {
        // Sync 3D crowd density for the target zone
        if (scene && crowdMembers && zoneBounds) {
          syncCrowdDensityForZone(simulationState.selectedZone, result.count, scene, crowdMembers, zoneBounds);
        }
        renderInspector();
        syncTopNavStatusDots();
        showToastNotification(`New Stream Event Arrived (${result.timestamp} -> ${result.count} people). Window advanced!`);
      }
      return;
    }

    // 2. Open Operator Modal Button
    if (e.target.closest('#btn-operator-action') || e.target.closest('.btn-operator-modal-trigger')) {
      openOperatorModal();
      return;
    }

    // 3. Modal Close Button or Modal Backdrop
    if (e.target.closest('.modal-close') || e.target.classList.contains('modal-overlay')) {
      closeModals();
      return;
    }

    // 4. Modal Action Execute Button
    const execBtn = e.target.closest('.btn-action-execute');
    if (execBtn) {
      const act = execBtn.getAttribute('data-action') || '';
      if (act.includes('GATE')) {
        window.executeIntervention('OPEN_AUX_GATE');
      } else if (act.includes('MARSHAL')) {
        window.executeIntervention('DEPLOY_MARSHALS');
      } else if (act.includes('REROUTE')) {
        window.executeIntervention('BROADCAST_REROUTE');
      } else {
        window.executeIntervention('OPEN_AUX_GATE');
      }
      return;
    }
  });

  // Render Sidebar Inspector Panel
  function renderInspector() {
    if (!inspectorContent) return;

    if (simulationState.selectedPipelineNode) {
      // Render Selected Big Data Pipeline Node Inspector
      const nodeId = simulationState.selectedPipelineNode;
      const node = simulationState.pipelineNodes[nodeId] || simulationState.pipelineNodes.HDFS;

      let nodeContent = '';
      if (nodeId === 'HDFS') {
        nodeContent = `
          <div class="tech-box">
            <h4>HDFS Cluster Log Storage</h4>
            <p>Path: <code>/crowd/logs/2026/09/28/zone_events.snappy.parquet</code></p>
            <div class="log-preview">
              <div class="log-line">08:18:00 [INFO] Zone_A: 16 | Zone_B: 45 | Zone_D: 55</div>
              <div class="log-line">08:19:00 [INFO] Zone_A: 17 | Zone_B: 48 | Zone_D: 61</div>
              <div class="log-line warn">08:20:00 [WARN] Zone_D capacity > 85%! Event committed to HDFS datanodes.</div>
            </div>
          </div>
        `;
      } else if (nodeId === 'MAPREDUCE') {
        nodeContent = `
          <div class="tech-box">
            <h4>MapReduce Batch Aggregation</h4>
            <div class="mr-phase">
              <strong>MAP PHASE:</strong><br/>
              <code>Map(Zone_A->18), Map(Zone_B->52), Map(Zone_D->86)</code>
            </div>
            <div class="mr-phase">
              <strong>SHUFFLE PHASE:</strong><br/>
              <code>Group by Keys: Zone_D->[55, 61, 86]</code>
            </div>
            <div class="mr-phase">
              <strong>REDUCE PHASE:</strong><br/>
              <code>Zone_D Peak -> 86 | Avg -> 67.3 [CRITICAL BASELINE]</code>
            </div>
          </div>
        `;
      } else if (nodeId === 'STREAM_PROCESSING') {
        const logsHtml = simulationState.streamLogs.map(l => `<div class="log-line">${l}</div>`).join('');
        nodeContent = `
          <div class="tech-box">
            <h4>Stream Analytics Engine (Live Window)</h4>
            <p>Processing Latency: <strong>12ms</strong> | State: <strong>RocksDB</strong></p>
            <div class="log-preview">${logsHtml}</div>
          </div>
        `;
      } else if (nodeId === 'DASHBOARD') {
        nodeContent = `
          <div class="tech-box">
            <h4>Operations Control Room</h4>
            <p>Terminal: <strong>Station Master Workstation 01</strong></p>
            <p>Active Alert: <span class="badge critical">ZONE D CRITICAL</span></p>
            <p>Workflow State: <strong>DETECT → VERIFY → RESPOND</strong></p>
          </div>
        `;
      } else {
        nodeContent = `
          <div class="tech-box">
            <h4>Telemetry Hardware Sensors</h4>
            <p>Status: <strong>100% ONLINE</strong></p>
            <p>Sensors: <strong>4x CCTV IP Cameras + 2x LiDAR Counter Beams</strong></p>
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
            <div class="stat-box"><span class="stat-label">Role</span><span class="stat-val text-sm">${node.role}</span></div>
            <div class="stat-box"><span class="stat-label">Technology</span><span class="stat-val text-sm">${node.tech}</span></div>
          </div>
          ${nodeContent}
        </div>
      `;
    } else {
      // Render Selected Zone Inspector
      const zoneId = simulationState.selectedZone || 'ZONE_D';
      const zone = simulationState.zones[zoneId];
      const metrics = getZoneMetrics(zone);
      const statusClass = metrics.status.toLowerCase();

      const slidingWindowRows = zone.slidingWindow.map((ev, idx) => {
        const isLatest = idx === zone.slidingWindow.length - 1;
        const rowMetrics = getZoneMetrics({ count: ev.count, capacity: zone.capacity });
        const rowState = rowMetrics.status.toLowerCase();
        return `
          <div class="window-item ${isLatest ? 'latest-event' : ''}">
            <span class="win-time">${ev.timestamp}</span>
            <span class="win-bar"><span class="win-fill ${rowState}" style="width: ${Math.min(100, (ev.count / zone.capacity) * 100)}%"></span></span>
            <span class="win-count ${rowState}">${ev.count}</span>
            <span class="win-delta">${ev.delta}</span>
            ${isLatest ? '<span class="latest-tag">LATEST</span>' : ''}
          </div>
        `;
      }).join('');

      inspectorContent.innerHTML = `
        <div class="inspector-card">
          <div class="card-header">
            <span class="badge ${statusClass}">${metrics.status}</span>
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
              <span class="stat-val">${metrics.density} <small>p/m²</small></span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Trend (5-Min)</span>
              <span class="stat-val trend">${metrics.trend}</span>
            </div>
          </div>

          <div class="capacity-bar-container">
            <div class="capacity-bar-header">
              <span>Zone Capacity Load</span>
              <span>${Math.round(metrics.loadRatio * 100)}%</span>
            </div>
            <div class="capacity-bar">
              <div class="capacity-fill ${statusClass}" style="width: ${Math.min(100, metrics.loadRatio * 100)}%"></div>
            </div>
          </div>

          <div class="window-section">
            <div class="section-title">
              <span>LATEST 5-MINUTE SLIDING WINDOW</span>
              <button id="btn-step-window" class="btn-micro">+ STEP EVENT</button>
            </div>
            <div id="sliding-window-list" class="window-list">${slidingWindowRows}</div>
          </div>

          <div class="action-footer">
            <button id="btn-operator-action" class="btn-primary-action ${metrics.status === 'CRITICAL' ? 'pulse-alert' : ''}">
              ${metrics.status === 'CRITICAL' ? '⚠️ EXECUTE OPERATOR INTERVENTION' : metrics.status === 'HIGH' ? '⚠️ REVIEW HIGH DENSITY WORKFLOW' : 'VIEW ZONE STATUS WORKFLOW'}
            </button>
          </div>
        </div>
      `;
    }
  }

  // Operator Response Modal Workflow
  function openOperatorModal() {
    const modal = document.getElementById('operator-modal');
    if (!modal) return;
    modal.classList.add('visible');

    const zoneId = simulationState.selectedZone || 'ZONE_D';
    const zone = simulationState.zones[zoneId];
    const metrics = getZoneMetrics(zone);

    const modalBody = document.getElementById('operator-modal-body');

    let optionsHtml = '';
    if (metrics.status === 'CRITICAL') {
      optionsHtml = `
        <div class="alert-banner critical-banner">
          <h4>🚨 LIVE CROWD ALERT: ${zone.name.toUpperCase()} (CRITICAL CONGESTION)</h4>
          <p>Passenger count reached ${zone.count} people (${Math.round(metrics.loadRatio * 100)}% load ratio). Immediate mitigation required:</p>
        </div>
        <div class="intervention-options">
          <h4>Select Operator Intervention Action:</h4>
          <div class="option-card" id="opt-gate3" data-action="OPEN_AUX_GATE">
            <div class="opt-icon">🚪</div>
            <div class="opt-info">
              <strong>OPEN AUXILIARY GATE 3</strong>
              <p>Unlocks secondary side exit corridor to relieve turnstile pressure in Zone D.</p>
            </div>
            <button class="btn-action-execute" data-action="OPEN_AUX_GATE">EXECUTE</button>
          </div>

          <div class="option-card" id="opt-marshals" data-action="DEPLOY_MARSHALS">
            <div class="opt-icon">👮</div>
            <div class="opt-info">
              <strong>DEPLOY CROWD MARSHALS</strong>
              <p>Dispatches 4 station security personnel to regulate passenger queueing.</p>
            </div>
            <button class="btn-action-execute" data-action="DEPLOY_MARSHALS">EXECUTE</button>
          </div>

          <div class="option-card" id="opt-reroute" data-action="BROADCAST_REROUTE">
            <div class="opt-icon">📢</div>
            <div class="opt-info">
              <strong>BROADCAST AUDIO REROUTE ANNOUNCEMENT</strong>
              <p>Directs incoming Platform 1 passengers to West Corridor (Zone C).</p>
            </div>
            <button class="btn-action-execute" data-action="BROADCAST_REROUTE">EXECUTE</button>
          </div>
        </div>
      `;
    } else if (metrics.status === 'HIGH') {
      optionsHtml = `
        <div class="alert-banner high-banner" style="border-color:#f59e0b; background:rgba(245,158,11,0.15);">
          <h4>⚠️ HIGH DENSITY ADVISORY: ${zone.name.toUpperCase()}</h4>
          <p>Passenger count is ${zone.count} people (${Math.round(metrics.loadRatio * 100)}% load ratio). Recommended preventive measures:</p>
        </div>
        <div class="intervention-options">
          <h4>Select Operator Action:</h4>
          <div class="option-card" id="opt-gate3" data-action="OPEN_AUX_GATE">
            <div class="opt-icon">🚪</div>
            <div class="opt-info"><strong>OPEN AUXILIARY EXIT GATE</strong><p>Relieves ticket counter congestion.</p></div>
            <button class="btn-action-execute" data-action="OPEN_AUX_GATE">EXECUTE</button>
          </div>
          <div class="option-card" id="opt-marshals" data-action="DEPLOY_MARSHALS">
            <div class="opt-icon">👮</div>
            <div class="opt-info"><strong>DEPLOY PATROL MARSHALS</strong><p>Dispatches station security.</p></div>
            <button class="btn-action-execute" data-action="DEPLOY_MARSHALS">EXECUTE</button>
          </div>
        </div>
      `;
    } else {
      optionsHtml = `
        <div class="alert-banner normal-banner" style="border-color:#10b981; background:rgba(16,185,129,0.15);">
          <h4>ℹ️ ROUTINE STATUS: ${zone.name.toUpperCase()}</h4>
          <p>Passenger flow is normal (${zone.count} people, ${Math.round(metrics.loadRatio * 100)}% load ratio). All systems optimal.</p>
        </div>
        <div class="intervention-options">
          <div class="option-card" id="opt-reroute" data-action="BROADCAST_REROUTE">
            <div class="opt-icon">📢</div>
            <div class="opt-info"><strong>BROADCAST ROUTINE INFORMATION ANNOUNCEMENT</strong><p>Standard train schedule broadcast.</p></div>
            <button class="btn-action-execute" data-action="BROADCAST_REROUTE">EXECUTE</button>
          </div>
        </div>
      `;
    }

    modalBody.innerHTML = `
      <div class="workflow-stepper">
        <div class="step-item completed"><span class="step-num">1</span><span class="step-name">DETECT</span></div>
        <div class="step-line active"></div>
        <div class="step-item active"><span class="step-num">2</span><span class="step-name">VERIFY</span></div>
        <div class="step-line"></div>
        <div class="step-item"><span class="step-num">3</span><span class="step-name">RESPOND</span></div>
        <div class="step-line"></div>
        <div class="step-item"><span class="step-num">4</span><span class="step-name">MONITOR</span></div>
      </div>
      ${optionsHtml}
    `;
  }

  // Global action execution callback
  window.executeIntervention = function(actionType) {
    const activeZoneId = simulationState.selectedZone || 'ZONE_D';
    const zone = simulationState.zones[activeZoneId];

    if (actionType === 'OPEN_AUX_GATE' || actionType === 'OPEN_GATE') {
      simulationState.interventions.gate3 = true;
      zone.count = Math.max(35, zone.count - 30);
      showToastNotification(`✅ Auxiliary Gate 3 Opened! ${zone.name} count reduced to ${zone.count}.`);
      const venueGroup = scene ? scene.getObjectByName('PUBLIC_VENUE') : null;
      if (venueGroup) updateGate3Visual(true, venueGroup);
    } else if (actionType === 'DEPLOY_MARSHALS' || actionType === 'MARSHALS') {
      simulationState.interventions.marshals = true;
      zone.count = Math.max(45, zone.count - 20);
      showToastNotification(`👮 Security Marshals Deployed to ${zone.name}. Passenger queue regulated.`);
    } else if (actionType === 'BROADCAST_REROUTE' || actionType === 'REROUTE') {
      simulationState.interventions.announcement = true;
      zone.count = Math.max(50, zone.count - 15);
      showToastNotification(`📢 Audio Reroute Broadcasted for ${zone.name}. Passenger traffic diverted.`);
    }

    // Sync 3D crowd meshes
    if (scene && crowdMembers && zoneBounds) {
      syncCrowdDensityForZone(activeZoneId, zone.count, scene, crowdMembers, zoneBounds);
    }

    closeModals();
    renderInspector();
    syncTopNavStatusDots();
  };

  window.execAction = window.executeIntervention;

  function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('visible'));
  }

  function showToastNotification(msg) {
    if (!alertToast) return;
    alertToast.textContent = msg;
    alertToast.classList.add('visible');
    setTimeout(() => alertToast.classList.remove('visible'), 4000);
  }

  function handleSelectObject(selection) {
    if (selection.type === 'ZONE') {
      simulationState.selectedZone = selection.id;
      simulationState.selectedPipelineNode = null;
    } else if (selection.type === 'PIPELINE_NODE') {
      simulationState.selectedPipelineNode = selection.id;
    }
    renderInspector();
    syncTopNavStatusDots();
  }

  // Initial render & status dot sync
  renderInspector();
  syncTopNavStatusDots();

  return {
    handleSelectObject,
    renderInspector,
    syncTopNavStatusDots
  };
}
