// Central Unified Simulation State for Crowd Safety Engine
// ONE single source of truth for 3D scene, Inspector, Controls, and Pipeline

export const simulationState = {
  selectedZone: 'ZONE_D', // 'ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D'
  selectedPipelineNode: null, // 'HDFS', 'MAPREDUCE', 'STREAM_PROCESSING', 'DASHBOARD', 'DATA_SOURCES'
  isSimulating: true,

  zones: {
    ZONE_A: {
      id: 'ZONE_A',
      name: 'Zone A - Platform 1 North',
      type: 'Platform',
      count: 18,
      capacity: 80,
      description: 'Normal platform passenger movement with steady boarding and low crowd accumulation.',
      slidingWindow: [
        { timestamp: '08:16', count: 14, delta: '+1' },
        { timestamp: '08:17', count: 15, delta: '+1' },
        { timestamp: '08:18', count: 16, delta: '+1' },
        { timestamp: '08:19', count: 17, delta: '+1' },
        { timestamp: '08:20', count: 18, delta: '+1' }
      ]
    },
    ZONE_B: {
      id: 'ZONE_B',
      name: 'Zone B - Main Ticket Concourse',
      type: 'Concourse',
      count: 52,
      capacity: 90,
      description: 'High passenger inflow from ticket counters. Crowd density is steadily accumulating.',
      slidingWindow: [
        { timestamp: '08:16', count: 38, delta: '+3' },
        { timestamp: '08:17', count: 42, delta: '+4' },
        { timestamp: '08:18', count: 45, delta: '+3' },
        { timestamp: '08:19', count: 48, delta: '+3' },
        { timestamp: '08:20', count: 52, delta: '+4' }
      ]
    },
    ZONE_C: {
      id: 'ZONE_C',
      name: 'Zone C - West Corridor',
      type: 'Corridor',
      count: 22,
      capacity: 70,
      description: 'Normal passenger transit between platform concourse and secondary exit.',
      slidingWindow: [
        { timestamp: '08:16', count: 18, delta: '+1' },
        { timestamp: '08:17', count: 19, delta: '+1' },
        { timestamp: '08:18', count: 20, delta: '+1' },
        { timestamp: '08:19', count: 21, delta: '+1' },
        { timestamp: '08:20', count: 22, delta: '+1' }
      ]
    },
    ZONE_D: {
      id: 'ZONE_D',
      name: 'Zone D - Main Exit Bottleneck',
      type: 'Turnstile Exit',
      count: 86,
      capacity: 95,
      description: 'CRITICAL CONGESTION! Severe bottleneck at main turnstiles. Immediate intervention required.',
      slidingWindow: [
        { timestamp: '08:16', count: 42, delta: '+3' },
        { timestamp: '08:17', count: 48, delta: '+6' },
        { timestamp: '08:18', count: 55, delta: '+7' },
        { timestamp: '08:19', count: 61, delta: '+6' },
        { timestamp: '08:20', count: 86, delta: '+25' }
      ]
    }
  },

  latestMinute: 20,

  interventions: {
    gate3: false, // Auxiliary Gate 3 open state
    marshals: false, // Crowd marshals deployed state
    announcement: false // Audio reroute active state
  },

  streamLogs: [
    '08:20:00 [FLINK-STREAM] Window initialized. Monitoring 4 zones.',
    '08:20:12 [SENSORS] LiDAR Entry #04 reported +25 passengers at Zone D turnstiles.',
    '08:20:15 [SLIDING-WINDOW-5M] Zone D threshold exceeded (86/95 -> 91% load ratio).'
  ],

  pipelineNodes: {
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
      lastJob: 'Job_20260928_0820 (Completed in 1.4s)',
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
  }
};

// Reusable Zone Status Evaluator (Calculates status from count and capacity threshold)
export function getZoneMetrics(zone) {
  const loadRatio = zone.count / zone.capacity;
  const density = (zone.count / (zone.capacity * 1.1)).toFixed(2);
  let status = 'NORMAL';
  let trend = 'STABLE';
  let color = '#10b981';

  if (loadRatio >= 0.85) {
    status = 'CRITICAL';
    trend = 'CRITICAL CONGESTION';
    color = '#ef4444';
  } else if (loadRatio >= 0.50) {
    status = 'HIGH';
    trend = 'INCREASING';
    color = '#f59e0b';
  }

  return { loadRatio, density, status, trend, color };
}

// Reusable Sliding Window Advancement function
export function stepSlidingWindow(zoneId) {
  const targetZoneId = zoneId || simulationState.selectedZone;
  const zone = simulationState.zones[targetZoneId];
  if (!zone) return null;

  simulationState.latestMinute++;
  const minStr = simulationState.latestMinute < 10 ? `0${simulationState.latestMinute}` : `${simulationState.latestMinute}`;
  const timestamp = `08:${minStr}`;

  // Compute next count based on active interventions & current state
  let nextCount = zone.count;
  if (simulationState.interventions.gate3 && targetZoneId === 'ZONE_D') {
    nextCount = Math.max(35, zone.count - Math.floor(Math.random() * 5 + 4));
  } else if (simulationState.interventions.marshals && targetZoneId === 'ZONE_D') {
    nextCount = Math.max(45, zone.count - Math.floor(Math.random() * 4 + 2));
  } else if (simulationState.interventions.announcement && targetZoneId === 'ZONE_D') {
    nextCount = Math.max(50, zone.count - Math.floor(Math.random() * 3 + 2));
  } else {
    // Normal traffic fluctuation
    const change = Math.floor(Math.random() * 7) - 2;
    nextCount = Math.max(5, Math.min(zone.capacity, zone.count + change));
  }

  const deltaVal = nextCount - zone.count;
  const delta = deltaVal >= 0 ? `+${deltaVal}` : `${deltaVal}`;
  zone.count = nextCount;

  // Advance sliding window array
  zone.slidingWindow.shift();
  zone.slidingWindow.push({ timestamp, count: nextCount, delta });

  // Add event log entry to Stream Analytics
  const logMsg = `${timestamp}:00 [STREAM-INGEST] ${zone.name} -> Count: ${nextCount} (${delta}). Window advanced.`;
  simulationState.streamLogs.push(logMsg);
  if (simulationState.streamLogs.length > 8) simulationState.streamLogs.shift();

  return { timestamp, count: nextCount, delta };
}

// Backward compatibility export aliases
export const ZONES = simulationState.zones;
export const PIPELINE_NODES = simulationState.pipelineNodes;
