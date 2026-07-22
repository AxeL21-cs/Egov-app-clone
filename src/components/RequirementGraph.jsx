import { useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react';
import {
  ArrowRight,
  Check,
  Clock3,
  Flag,
  Info,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';
import '@xyflow/react/dist/style.css';

const NODE_WIDTH = 264;
const NODE_HEIGHT = 142;

const STATUS_CONFIG = {
  complete: { label: 'Complete', icon: Check },
  processing: { label: 'Processing', icon: Clock3 },
  available: { label: 'Start here', icon: ArrowRight },
  locked: { label: 'Locked', icon: LockKeyhole },
  conditional: { label: 'If needed', icon: Info },
  target: { label: 'Your goal', icon: Flag },
};

function RequirementGraphNode({ data }) {
  const config = STATUS_CONFIG[data.kind === 'target' ? 'target' : data.status] || STATUS_CONFIG.locked;
  const StatusIcon = config.icon;
  const actionable = data.status === 'available' && data.canOpen;

  return (
    <div className={`journey-node-shell ${data.kind === 'target' ? 'target' : data.status}`}>
      <Handle type="target" position={Position.Top} className="journey-handle" />
      <button
        type="button"
        className={`journey-node-card${actionable ? ' nodrag nopan' : ''}`}
        onClick={actionable ? data.onOpen : undefined}
        disabled={!actionable}
        aria-label={`${data.title}. ${config.label}.${actionable ? ' Open this step.' : ''}`}
      >
        <span className="journey-node-topline">
          <span className="journey-node-step">{data.stepLabel}</span>
          <span className="journey-node-status"><StatusIcon />{config.label}</span>
        </span>
        <strong>{data.title}</strong>
        <span className="journey-node-source">{data.source}</span>
        {data.batchLabel && <span className="journey-node-batch"><Sparkles />{data.batchLabel}</span>}
        {data.status === 'locked' && data.lockedBy && (
          <span className="journey-node-note"><LockKeyhole />{data.lockedBy}</span>
        )}
        {data.status === 'processing' && (
          <span className="journey-node-note processing"><Clock3 />The request is moving</span>
        )}
        {actionable && (
          <span className="journey-node-action">Open step <ArrowRight /></span>
        )}
        {data.status === 'available' && !data.canOpen && (
          <span className="journey-node-note"><Info />Choose an accepted document above</span>
        )}
        {data.status === 'conditional' && (
          <span className="journey-node-note"><Info />Turn on this applicant case above</span>
        )}
      </button>
      <Handle type="source" position={Position.Bottom} className="journey-handle" />
    </div>
  );
}

const nodeTypes = { requirement: RequirementGraphNode };

function styleEdges(graphEdges, requirementById, targetId, targetStatus) {
  return graphEdges.map((edge) => {
    const source = requirementById.get(edge.source);
    const target = edge.target === targetId ? { status: targetStatus } : requirementById.get(edge.target);
    const sourceMoved = source?.status === 'complete' || source?.status === 'processing';
    const targetReady = target?.status === 'available';
    const completedLink = source?.status === 'complete' && target?.status === 'complete';
    const stroke = edge.optional ? '#c49318' : completedLink ? '#258a55' : sourceMoved && targetReady ? '#0753da' : '#aab4c2';

    return {
      ...edge,
      type: 'smoothstep',
      animated: !edge.optional && sourceMoved && targetReady,
      style: {
        stroke,
        strokeWidth: sourceMoved && targetReady ? 3 : 2,
        strokeDasharray: edge.optional ? '7 6' : undefined,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 15, height: 15 },
    };
  });
}

function buildDependencyGraph(requirements, program, onOpen, selectedIncome) {
  const requirementById = new Map(requirements.map((item) => [item.id, item]));
  const graphNodes = requirements.map((requirement, index) => {
    const canOpen = requirement.method !== 'income' || Boolean(selectedIncome);
    const level = Number.isFinite(requirement.level) ? requirement.level : index;
    const lane = Number.isFinite(requirement.lane) ? requirement.lane : 0;
    return {
      id: requirement.id,
      type: 'requirement',
      selectable: requirement.status === 'available' && canOpen,
      position: { x: lane * 292, y: level * 194 },
      data: {
        ...requirement,
        kind: 'requirement',
        stepLabel: requirement.stageLabel || `STAGE ${level + 1}`,
        canOpen,
        onOpen: () => onOpen(requirement),
      },
    };
  });

  const graphEdges = requirements.flatMap((requirement) => (requirement.dependsOn || []).map((sourceId) => ({
    id: `${sourceId}-${requirement.id}`,
    source: sourceId,
    target: requirement.id,
    optional: requirement.status === 'conditional' || requirementById.get(sourceId)?.status === 'conditional',
  })));

  const targetId = `target-${program.id}`;
  const finalGates = requirements.filter((item) => item.finalGate);
  const targetStatus = finalGates.length > 0 && finalGates.every((item) => item.status === 'complete') ? 'complete' : 'locked';
  const maxLevel = Math.max(...requirements.map((item) => Number.isFinite(item.level) ? item.level : 0), 0);
  const targetX = finalGates.length ? finalGates.reduce((total, item) => total + (item.lane || 0) * 292, 0) / finalGates.length : 0;
  graphNodes.push({
    id: targetId,
    type: 'requirement',
    selectable: false,
    position: { x: targetX, y: (maxLevel + 1) * 194 },
    data: {
      id: targetId,
      kind: 'target',
      title: `${program.shortTitle} file ready`,
      source: program.agency,
      status: targetStatus,
      stepLabel: 'FINAL GOAL',
      canOpen: false,
    },
  });

  finalGates.forEach((item) => {
    graphEdges.push({ id: `${item.id}-${targetId}`, source: item.id, target: targetId, optional: false });
  });

  const availableNodes = graphNodes.filter((node) => node.data.status === 'available');
  const earliestY = Math.min(...availableNodes.map((node) => node.position.y), Number.POSITIVE_INFINITY);
  const parallelFocus = availableNodes.filter((node) => node.position.y === earliestY);
  const focusCandidates = parallelFocus.length ? parallelFocus : graphNodes.filter((node) => node.data.status === 'processing');
  const focusNode = focusCandidates.length ? {
    position: {
      x: focusCandidates.reduce((total, node) => total + node.position.x, 0) / focusCandidates.length,
      y: focusCandidates.reduce((total, node) => total + node.position.y, 0) / focusCandidates.length,
    },
  } : graphNodes[0];
  const focusZoom = parallelFocus.length >= 3 ? 0.38 : parallelFocus.length === 2 ? 0.64 : 0.86;

  return {
    nodes: graphNodes,
    edges: styleEdges(graphEdges, requirementById, targetId, targetStatus),
    focusNode,
    focusZoom,
    parallelCount: parallelFocus.length,
  };
}

function buildGraph(requirements, program, onOpen, selectedIncome) {
  if (requirements.some((item) => item.dependsOn?.length || Number.isFinite(item.level))) {
    return buildDependencyGraph(requirements, program, onOpen, selectedIncome);
  }
  const core = requirements.filter((item) => item.status !== 'conditional');
  const conditional = requirements.filter((item) => item.status === 'conditional');
  const coreIds = core.map((item) => item.id);
  const requirementById = new Map(requirements.map((item) => [item.id, item]));
  const graphNodes = [];
  const graphEdges = [];

  core.forEach((requirement, index) => {
    const canOpen = requirement.method !== 'income' || Boolean(selectedIncome);
    graphNodes.push({
      id: requirement.id,
      type: 'requirement',
      selectable: requirement.status === 'available' && canOpen,
      position: { x: 0, y: index * 188 },
      data: {
        ...requirement,
        kind: 'requirement',
        stepLabel: `STEP ${index + 1}`,
        canOpen,
        onOpen: () => onOpen(requirement),
      },
    });

    if (index > 0) {
      graphEdges.push({
        id: `${core[index - 1].id}-${requirement.id}`,
        source: core[index - 1].id,
        target: requirement.id,
        optional: false,
      });
    }
  });

  const branchLevel = Math.max(core.length - 1, 0);
  conditional.forEach((requirement, index) => {
    const direction = index % 2 === 0 ? -1 : 1;
    const distance = 310 + Math.floor(index / 2) * 285;
    const parentId = coreIds[Math.max(coreIds.length - 1, 0)];
    graphNodes.push({
      id: requirement.id,
      type: 'requirement',
      selectable: false,
      position: { x: direction * distance, y: branchLevel * 188 + 156 },
      data: {
        ...requirement,
        kind: 'requirement',
        stepLabel: 'OPTIONAL PATH',
        canOpen: false,
      },
    });
    if (parentId) {
      graphEdges.push({ id: `${parentId}-${requirement.id}`, source: parentId, target: requirement.id, optional: true });
    }
  });

  const targetId = `target-${program.id}`;
  const allCoreComplete = core.length > 0 && core.every((item) => item.status === 'complete');
  const targetStatus = allCoreComplete ? 'complete' : 'locked';
  const goalY = Math.max(core.length * 188 + (conditional.length ? 160 : 0), 188);
  graphNodes.push({
    id: targetId,
    type: 'requirement',
    selectable: false,
    position: { x: 0, y: goalY },
    data: {
      id: targetId,
      kind: 'target',
      title: `${program.shortTitle} file ready`,
      source: program.agency,
      status: targetStatus,
      stepLabel: 'FINAL GOAL',
      canOpen: false,
    },
  });

  const finalCoreId = coreIds[coreIds.length - 1];
  if (finalCoreId) {
    graphEdges.push({ id: `${finalCoreId}-${targetId}`, source: finalCoreId, target: targetId, optional: false });
  }
  conditional.forEach((requirement) => {
    graphEdges.push({ id: `${requirement.id}-${targetId}`, source: requirement.id, target: targetId, optional: true });
  });

  const focusNode = graphNodes.find((node) => node.data.status === 'available') || graphNodes.find((node) => node.data.status === 'processing') || graphNodes[0];
  return { nodes: graphNodes, edges: styleEdges(graphEdges, requirementById, targetId, targetStatus), focusNode, focusZoom: 0.92, parallelCount: 1 };
}

function FocusNextStep({ node, zoom = 0.92 }) {
  const { setCenter } = useReactFlow();

  useEffect(() => {
    if (!node) return undefined;
    let timer;
    const centerNextStep = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Keep the active card above the persistent bottom navigation instead of
        // centering it beneath the navigation overlay.
        const wideViewport = window.innerWidth >= 900;
        const responsiveZoom = wideViewport ? Math.max(zoom, 0.64) : zoom;
        const navigationOffset = wideViewport ? 360 : 132;
        setCenter(node.position.x + NODE_WIDTH / 2, node.position.y + NODE_HEIGHT / 2 + navigationOffset, { zoom: responsiveZoom, duration: 420 });
      }, 80);
    };
    centerNextStep();
    window.addEventListener('resize', centerNextStep);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', centerNextStep);
    };
  }, [node, setCenter, zoom]);

  return null;
}

export default function RequirementGraph({ requirements, program, onOpen, selectedIncome }) {
  const graph = useMemo(
    () => buildGraph(requirements, program, onOpen, selectedIncome),
    [requirements, program, onOpen, selectedIncome],
  );

  return (
    <section className="requirement-graph-panel" aria-labelledby="requirement-graph-title">
      <div className="graph-panel-heading">
        <div>
          <span className="section-kicker">DEPENDENCY MAP</span>
          <h2 id="requirement-graph-title">Your document path</h2>
        </div>
        <span className="graph-focus-badge"><Sparkles />{graph.parallelCount > 1 ? `${graph.parallelCount} steps can start together` : 'Centered on your next step'}</span>
      </div>
      <p className="panel-intro">Follow the arrows to see what unlocks next. Cards on the same row can move in parallel. Drag the canvas to explore or use the visible zoom controls.</p>
      <div className="requirement-graph-canvas" aria-label="Interactive graph of document requirements">
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          panOnDrag
          preventScrolling={false}
          minZoom={0.38}
          maxZoom={1.4}
          proOptions={{ hideAttribution: true }}
        >
          <FocusNextStep node={graph.focusNode} zoom={graph.focusZoom} />
          <Background color="#cbd5e1" gap={22} size={1.25} variant="dots" />
          <Controls showInteractive={false} position="bottom-right" />
          <MiniMap
            className="journey-minimap"
            position="bottom-left"
            pannable
            zoomable
            nodeColor={(node) => node.data?.kind === 'target' ? '#f5b700' : ({ complete: '#258a55', processing: '#4f7fc9', available: '#0753da', conditional: '#c49318' }[node.data?.status] || '#aab4c2')}
            maskColor="rgba(239, 245, 253, .72)"
          />
        </ReactFlow>
      </div>
      <div className="graph-legend" aria-label="Graph status legend">
        <span className="complete"><i />Complete</span>
        <span className="available"><i />Start here</span>
        <span className="locked"><i />Locked</span>
        <span className="conditional"><i />If needed</span>
      </div>
    </section>
  );
}
