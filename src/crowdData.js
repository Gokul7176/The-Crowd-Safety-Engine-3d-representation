// Central Data Store for Crowd Safety Engine Simulation

export const ZONES = {
  ZONE_A: {
    id: 'ZONE_A',
    name: 'Zone A - Platform 1 North',
    type: 'Platform',
    status: 'NORMAL', // NORMAL, HIGH, CRITICAL
    count: 18,
    capacity: 80,
    density: 0.18, // people / m²
    trend: 'STABLE',
    color: '#10b981', // green
    description: 'Normal platform passenger movement with steady boarding and low crowd accumulation.'
  },
  ZONE_B: {
    id: 'ZONE_B',
    name: 'Zone B - Main Ticket Concourse',
    type: 'Concourse',
    status: 'HIGH',
    count: 52,
    capacity: 90,
    density: 0.58,
    trend: 'INCREASING',
    color: '#f59e0b', // amber
    description: 'High passenger inflow from ticket counters. Crowd density is steadily accumulating.'
  },
  ZONE_C: {
    id: 'ZONE_C',
    name: 'Zone C - West Corridor',
    type: 'Corridor',
    status: 'NORMAL',
    count: 22,
    capacity: 70,
    density: 0.22,
    trend: 'STABLE',
    color: '#10b981',
    description: 'Normal passenger transit between platform concourse and secondary exit.'
  },
  ZONE_D: {
    id: 'ZONE_D',
    name: 'Zone D - Main Exit Bottleneck',
    type: 'Turnstile Exit',
    status: 'CRITICAL',
    count: 86,
    capacity: 95,
    density: 0.91,
    trend: 'CRITICAL CONGESTION',
    color: '#ef4444', // red
    description: 'CRITICAL CONGESTION! Severe bottleneck at main turnstiles. Immediate intervention required.'
  }
};

// 5-Minute Sliding Window Stream Event Log (Window Size: 5 Events)
export const SLIDING_WINDOW = {
  windowSizeMinutes: 5,
  events: [
    { timestamp: '08:16', timeOffset: -4, count: 42, state: 'NORMAL', delta: '+3' },
    { timestamp: '08:17', timeOffset: -3, count: 48, state: 'NORMAL', delta: '+6' },
    { timestamp: '08:18', timeOffset: -2, count: 55, state: 'HIGH', delta: '+7' },
    { timestamp: '08:19', timeOffset: -1, count: 61, state: 'HIGH', delta: '+6' },
    { timestamp: '08:20', timeOffset: 0, count: 86, state: 'CRITICAL', delta: '+25' }
  ],
  latestMinute: 20,
  pushNewEvent: function() {
    this.latestMinute++;
    const minStr = this.latestMinute < 10 ? `0${this.latestMinute}` : `${this.latestMinute}`;
    const timestamp = `08:${minStr}`;
    
    // Simulate count evolution based on simulation state
    const lastCount = this.events[this.events.length - 1].count;
    // Keep Zone D in high/critical range with realistic fluctuations
    const nextCount = Math.max(65, Math.min(95, lastCount + Math.floor(Math.random() * 7) - 3));
    const delta = nextCount >= lastCount ? `+${nextCount - lastCount}` : `${nextCount - lastCount}`;
    const state = nextCount > 75 ? 'CRITICAL' : nextCount > 45 ? 'HIGH' : 'NORMAL';

    // Drop oldest event (first item) and append new event
    const droppedEvent = this.events.shift();
    const newEvent = { timestamp, timeOffset: 0, count: nextCount, state, delta };
    this.events.push(newEvent);

    // Update time offsets
    this.events.forEach((ev, idx) => {
      ev.timeOffset = idx - (this.events.length - 1);
    });

    return { droppedEvent, newEvent };
  }
};

// Big Data Pipeline Nodes metadata
export const PIPELINE_NODES = {
  DATA_SOURCES: {
    id: 'DATA_SOURCES',
    title: 'Data Sources (CCTV & IR Counters)',
    role: 'Real-time Video & Optical Telemetry Capture',
    tech: 'IP Cameras + LiDAR Entry/Exit Sensors',
    throughput: '120 FPS / 450 events/sec',
    status: 'ACTIVE',
    detail: 'Optical people counters and CCTV feeds monitor passengers entering/exiting zones A, B, C, and D.'
  },
  HDFS: {
    id: 'HDFS',
    title: 'HDFS Storage Cluster',
    role: 'Distributed Storage for Historical Events',
    tech: 'Hadoop Distributed File System v3.3',
    capacity: '14.2 TB Stored / 32 Nodes',
    status: 'OPTIMAL',
    detail: 'Stores long-term historical timestamped crowd event logs (/crowd/logs/YYYY/MM/DD) for batch trend analysis.'
  },
  MAPREDUCE: {
    id: 'MAPREDUCE',
    title: 'MapReduce Aggregation Engine',
    role: 'Batch Processing & Historical Baseline',
    tech: 'Hadoop MapReduce Parallel Analytics',
    lastJob: 'Job_20260927_0815 (Completed in 1.4s)',
    status: 'READY',
    detail: 'Processes historical crowd density baselines. Map: (Zone, Count) -> Shuffle: Group by Zone -> Reduce: Average & Peak stats.'
  },
  STREAM_PROCESSING: {
    id: 'STREAM_PROCESSING',
    title: 'Stream Analytics Engine',
    role: 'Real-Time 5-Minute Sliding Window Analytics',
    tech: 'Apache Flink / Spark Streaming',
    latency: '12ms Processing Delay',
    status: 'STREAMING',
    detail: 'Maintains the 5-minute sliding window stream state. Triggers instantaneous alerts when crowd thresholds exceed limits.'
  },
  DASHBOARD: {
    id: 'DASHBOARD',
    title: 'Operations Control Room',
    role: 'Central Monitoring & Visualization',
    tech: 'WebGL Digital Twin + Live Telemetry UI',
    activeAlerts: 1,
    status: 'MONITORING',
    detail: 'Provides 3D spatial situational awareness and real-time inspector feedback for station master operators.'
  }
};

// Operator Response Workflow State
export const OPERATOR_WORKFLOW = {
  step: 1, // 1: DETECT, 2: VERIFY, 3: RESPOND, 4: MONITOR
  stepsInfo: [
    { num: 1, label: 'DETECT', title: 'Automated Congestion Detection', text: 'Stream engine detected Zone D exceeding 85% capacity threshold (Current: 86 people).' },
    { num: 2, label: 'VERIFY', title: 'Operator Visual Verification', text: 'Station Master verifies live 3D visual twin & CCTV camera feed 04 covering Zone D main exit.' },
    { num: 3, label: 'RESPOND', title: 'Intervention Execution', text: 'Select operator action: Open Auxiliary Gate 3, Deploy Crowd Marshals, or Re-route Passengers.' },
    { num: 4, label: 'MONITOR', title: 'Post-Intervention Monitoring', text: 'Monitor next 5-minute sliding window to confirm density reduction.' }
  ],
  selectedAction: null,
  activeAlert: true,
  actionTaken: null
};

// Historical MapReduce Demo Data
export const MAPREDUCE_DEMO = {
  mapPhase: [
    { record: 'R1 (08:15:00)', key: 'Zone_D', value: 78 },
    { record: 'R2 (08:15:15)', key: 'Zone_B', value: 45 },
    { record: 'R3 (08:15:30)', key: 'Zone_D', value: 82 },
    { record: 'R4 (08:15:45)', key: 'Zone_A', value: 16 }
  ],
  shufflePhase: [
    { key: 'Zone_A', values: '[16, 18, 14, 15]' },
    { key: 'Zone_B', values: '[45, 48, 52, 50]' },
    { key: 'Zone_D', values: '[78, 82, 85, 86]' }
  ],
  reducePhase: [
    { key: 'Zone_A', avg: 15.8, max: 18, status: 'NORMAL' },
    { key: 'Zone_B', avg: 48.75, max: 52, status: 'HIGH' },
    { key: 'Zone_D', avg: 82.75, max: 86, status: 'CRITICAL' }
  ]
};
