const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const speedSlider = document.getElementById('speed');

let vertices = [];
let edges = [];
let mstEdges = [];
let selectedVertices = [];
let isDrawing = false;
let startVertex = null;
let currentAlgorithm = null;
let animationStep = 0;
let isAnimating = false;
let graphType = 'undirected';
let weightType = 'random';
let selectMode = false;
let manualMode = false;
let algorithmSteps = [];
let currentStepIndex = 0;
let components = [];
let currentPhase = 0;

// Initialize execution mode
let executionMode = 'automatic';

// Function to update execution mode and button visibility
function updateExecutionMode() {
    const modeSelect = document.getElementById('executionMode');
    executionMode = modeSelect.value;
    console.log('Execution mode changed to:', executionMode);
    
    const distributedBtn = document.getElementById('distributedBtn');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (executionMode === 'automatic') {
        // Automatic mode: show distributed button and reset button
        distributedBtn.style.display = 'inline-block';
        nextStepBtn.style.display = 'none';
        resetBtn.style.display = 'inline-block';
        console.log('Switched to automatic mode - distributed button visible');
    } else {
        // Manual mode: show next step button and reset button
        distributedBtn.style.display = 'none';
        nextStepBtn.style.display = 'inline-block';
        resetBtn.style.display = 'inline-block';
        
        // Enable next step button if we're not running
        if (!isAnimating) {
            nextStepBtn.disabled = false;
            console.log('Manual mode enabled - next step button enabled');
        } else {
            console.log('Manual mode enabled but animation is running - next step button disabled');
        }
        
        // If switching to manual mode and we have a valid graph, prepare steps
        const graphVertices = vertices.filter(v => v.inGraph);
        const graphEdges = edges.filter(e => e.inGraph);
        if (graphVertices.length >= 2 && graphEdges.length >= 1 && isGraphConnected()) {
            console.log('Auto-preparing steps for manual mode on mode switch');
            setTimeout(() => {
                setupManualDistributedBoruvka();
            }, 100);
        }
    }
}

class Vertex {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.selected = false;
        this.inGraph = true;
        this.component = id; // For Borůvka's algorithm
        this.highlighted = false;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
        
        if (this.selected) {
            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
        } else if (this.highlighted) {
            ctx.fillStyle = '#34d399';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
        } else if (this.isProcessor) {
            // Special styling for processor nodes in distributed mode
            ctx.fillStyle = '#a855f7';
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 3;
        } else if (this.inGraph) {
            ctx.fillStyle = '#60a5fa';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = '#d1d5db';
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 1;
        }
        
        ctx.fill();
        ctx.stroke();
        
        // Draw vertex label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.id + 1, this.x, this.y);
        
        // Draw component indicator in Borůvka mode
        if (currentAlgorithm === 'Boruvka' && this.inGraph) {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(`C${this.component}`, this.x, this.y + 30);
        }
        
        // Draw processor indicator in distributed mode
        if (this.isProcessor && currentAlgorithm === 'Boruvka') {
            ctx.fillStyle = '#7c3aed';
            ctx.font = 'bold 8px Arial';
            ctx.fillText('P', this.x, this.y - 30);
        }
    }
    
    contains(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        return distance <= 20;
    }
}

class Edge {
    constructor(v1, v2, weight) {
        this.v1 = v1;
        this.v2 = v2;
        this.weight = weight || calculateWeight(v1, v2);
        this.inMST = false;
        this.highlighted = false;
        this.inGraph = true;
        this.isMinimumEdge = false; // For Borůvka visualization
    }
    
    draw() {
        if (!this.inGraph) return;
        
        ctx.beginPath();
        ctx.moveTo(this.v1.x, this.v1.y);
        ctx.lineTo(this.v2.x, this.v2.y);
        
        if (this.inMST) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4;
        } else if (this.isMinimumEdge) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
        } else if (this.highlighted) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.setLineDash([3, 3]);
        } else {
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw weight
        const midX = (this.v1.x + this.v2.x) / 2;
        const midY = (this.v1.y + this.v2.y) / 2;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(midX - 15, midY - 10, 30, 20);
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.strokeRect(midX - 15, midY - 10, 30, 20);
        
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.weight, midX, midY);
    }
}

// Union-Find data structure for Borůvka's algorithm
class UnionFind {
    constructor(n) {
        this.parent = Array.from({ length: n }, (_, i) => i);
        this.rank = new Array(n).fill(0);
        this.components = n;
    }
    
    find(x) {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }
    
    union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);
        
        if (rootX === rootY) return false;
        
        if (this.rank[rootX] < this.rank[rootY]) {
            this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
            this.parent[rootY] = rootX;
        } else {
            this.parent[rootY] = rootX;
            this.rank[rootX]++;
        }
        
        this.components--;
        return true;
    }
    
    getComponents() {
        return this.components;
    }
}

canvas.addEventListener('click', (e) => {
    if (isAnimating) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedVertex = vertices.find(v => v.contains(x, y));
    
    if (selectMode) {
        if (clickedVertex) {
            toggleVertexSelection(clickedVertex);
        }
        return;
    }
    
    if (!clickedVertex) {
        // Create new vertex
        const newVertex = new Vertex(x, y, vertices.length);
        vertices.push(newVertex);
        log(`Added vertex ${newVertex.id + 1}`, 'node');
    } else {
        // Handle edge creation or vertex interaction
        if (!startVertex) {
            startVertex = clickedVertex;
            clickedVertex.highlighted = true;
        } else if (startVertex === clickedVertex) {
            startVertex.highlighted = false;
            startVertex = null;
        } else {
            // Create edge between startVertex and clickedVertex
            const existingEdge = edges.find(e => 
                (e.v1 === startVertex && e.v2 === clickedVertex) ||
                (e.v1 === clickedVertex && e.v2 === startVertex)
            );
            
            if (!existingEdge) {
                const weight = calculateWeight(startVertex, clickedVertex);
                const newEdge = new Edge(startVertex, clickedVertex, weight);
                edges.push(newEdge);
                log(`Added edge ${startVertex.id + 1}-${clickedVertex.id + 1} (weight: ${weight})`, 'node');
            }
            
            startVertex.highlighted = false;
            startVertex = null;
        }
    }
    
    draw();
    updateGraphInfo();
    
    // Check if we should auto-prepare steps for manual mode
    if (executionMode === 'manual') {
        const graphVertices = vertices.filter(v => v.inGraph);
        const graphEdges = edges.filter(e => e.inGraph);
        if (graphVertices.length >= 2 && graphEdges.length >= 1 && isGraphConnected()) {
            console.log('Auto-preparing steps for manual mode after manual graph creation');
            setTimeout(() => {
                setupManualDistributedBoruvka();
            }, 100);
        }
    }
});

function toggleVertexSelection(vertex) {
    vertex.selected = !vertex.selected;
    if (vertex.selected) {
        selectedVertices.push(vertex);
    } else {
        selectedVertices = selectedVertices.filter(v => v !== vertex);
    }
    
    document.getElementById('createGraphBtn').disabled = selectedVertices.length < 2;
}

function updateSelectedPointsDisplay() {
    const panel = document.getElementById('selectedPointsPanel');
    const list = document.getElementById('selectedPointsList');
    
    if (selectMode && selectedVertices.length > 0) {
        panel.style.display = 'block';
        list.innerHTML = selectedVertices.map(v => 
            `<span class="point-tag">V${v.id + 1}</span>`
        ).join('');
    } else {
        panel.style.display = 'none';
    }
}

function updateSpeedDisplay() {
    const speed = document.getElementById('speed').value;
    document.getElementById('speedValue').textContent = `${speed}x`;
}

function log(message, type = 'message') {
    const logsContainer = document.getElementById('activityLogs');
    const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    
    // Keep only the last 50 log entries
    const entries = logsContainer.children;
    if (entries.length > 50) {
        logsContainer.removeChild(entries[0]);
    }
}

function calculateWeight(v1, v2) {
    if (weightType === 'distance') {
        const distance = Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
        return Math.round(distance / 10);
    } else {
        return Math.floor(Math.random() * 20) + 1;
    }
}

function updateWeightType() {
    weightType = document.getElementById('weightType').value;
    
    // Recalculate weights for existing edges
    edges.forEach(edge => {
        edge.weight = calculateWeight(edge.v1, edge.v2);
    });
    
    draw();
    showNotification(`Weight type changed to ${weightType}`, 'info');
}

function toggleSelectMode() {
    selectMode = document.getElementById('selectMode').checked;
    
    if (!selectMode) {
        selectedVertices.forEach(v => v.selected = false);
        selectedVertices = [];
    }
    
    updateSelectedPointsDisplay();
    draw();
    showNotification(`Selection mode ${selectMode ? 'enabled' : 'disabled'}`, 'info');
}

function createGraphFromSelected() {
    if (selectedVertices.length < 2) {
        showNotification('Select at least 2 vertices', 'error');
        return;
    }
    
    // Mark vertices as in graph or not
    vertices.forEach(v => {
        v.inGraph = selectedVertices.includes(v);
    });
    
    // Create all possible edges between selected vertices
    edges = [];
    for (let i = 0; i < selectedVertices.length; i++) {
        for (let j = i + 1; j < selectedVertices.length; j++) {
            const weight = calculateWeight(selectedVertices[i], selectedVertices[j]);
            edges.push(new Edge(selectedVertices[i], selectedVertices[j], weight));
        }
    }
    
    // Check if graph is connected
    if (!isGraphConnected()) {
        showNotification('Generated graph is not connected!', 'warning');
    }
    
    resetVisualization();
    draw();
    updateGraphInfo();
    showNotification(`Created graph with ${selectedVertices.length} vertices and ${edges.length} edges`, 'success');
}

function createCompleteGraph() {
    if (vertices.length < 2) {
        showNotification('Add at least 2 vertices first', 'error');
        return;
    }

    log('Creating complete graph from existing vertices', 'message');
    // Clear existing edges
    edges = [];
    
    // Create all possible edges between all vertices
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            const weight = calculateWeight(vertices[i], vertices[j]);
            edges.push(new Edge(vertices[i], vertices[j], weight));
        }
    }
    
    resetVisualization();
    draw();
    updateGraphInfo();
    log(`Complete graph created: ${vertices.length} vertices, ${edges.length} edges`, 'success');
    showNotification(`Created complete graph with ${vertices.length} vertices and ${edges.length} edges`, 'success');
}

function isGraphConnected() {
    const graphVertices = vertices.filter(v => v.inGraph);
    if (graphVertices.length === 0) return false;
    
    const visited = new Set();
    const queue = [graphVertices[0].id];
    visited.add(graphVertices[0].id);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        edges.forEach(edge => {
            if (edge.inGraph) {
                if (edge.v1.id === current && !visited.has(edge.v2.id)) {
                    visited.add(edge.v2.id);
                    queue.push(edge.v2.id);
                } else if (edge.v2.id === current && !visited.has(edge.v1.id)) {
                    visited.add(edge.v1.id);
                    queue.push(edge.v1.id);
                }
            }
        });
    }
    
    return visited.size === graphVertices.length;
}

function updateGraphInfo() {
    const graphVertices = vertices.filter(v => v.inGraph);
    const graphEdges = edges.filter(e => e.inGraph);
    
    document.getElementById('vertexCount').textContent = graphVertices.length;
    document.getElementById('edgeCount').textContent = graphEdges.length;
    
    const connected = isGraphConnected();
    document.getElementById('connectivity').textContent = connected ? 'Yes' : 'No';
    
    const maxEdges = graphVertices.length * (graphVertices.length - 1) / 2;
    const density = maxEdges > 0 ? ((graphEdges.length / maxEdges) * 100).toFixed(1) : 0;
    document.getElementById('density').textContent = `${density}%`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges first
    edges.forEach(edge => edge.draw());
    
    // Draw vertices on top
    vertices.forEach(vertex => vertex.draw());
}

function generateRandomGraph() {
    if (isAnimating) return;
    
    log('Generating random graph...', 'message');
    clearGraph();
    
    // Generate 6-8 vertices
    const numVertices = Math.floor(Math.random() * 3) + 6;
    
    for (let i = 0; i < numVertices; i++) {
        const x = 80 + Math.random() * (canvas.width - 160);
        const y = 80 + Math.random() * (canvas.height - 160);
        vertices.push(new Vertex(x, y, i));
    }
    log(`Generated ${numVertices} vertices`, 'node');
    
    // Generate random edges (ensure connectivity)
    const numEdges = Math.floor(Math.random() * 5) + numVertices;
    
    for (let i = 0; i < numEdges; i++) {
        const v1 = vertices[Math.floor(Math.random() * vertices.length)];
        const v2 = vertices[Math.floor(Math.random() * vertices.length)];
        
        if (v1 !== v2) {
            const existingEdge = edges.find(e => 
                (e.v1 === v1 && e.v2 === v2) || (e.v1 === v2 && e.v2 === v1)
            );
            
            if (!existingEdge) {
                const weight = calculateWeight(v1, v2);
                edges.push(new Edge(v1, v2, weight));
            }
        }
    }
    
    // Ensure connectivity by creating a spanning tree
    for (let i = 1; i < vertices.length; i++) {
        const v1 = vertices[i - 1];
        const v2 = vertices[i];
        
        const existingEdge = edges.find(e => 
            (e.v1 === v1 && e.v2 === v2) || (e.v1 === v2 && e.v2 === v1)
        );
        
        if (!existingEdge) {
            const weight = calculateWeight(v1, v2);
            edges.push(new Edge(v1, v2, weight));
        }
    }
    
    log(`Generated ${edges.length} edges ensuring connectivity`, 'node');
    draw();
    updateGraphInfo();
    
    // If in manual mode, automatically prepare algorithm steps
    if (executionMode === 'manual') {
        console.log('Auto-preparing steps for manual mode after graph generation');
        setTimeout(() => {
            setupManualDistributedBoruvka();
        }, 100); // Small delay to ensure everything is rendered
    }
    
    showNotification('Random graph generated!', 'success');
    log('Random graph generation complete', 'success');
}

function clearGraph() {
    log('Clearing all graph elements', 'message');
    vertices = [];
    edges = [];
    mstEdges = [];
    selectedVertices = [];
    startVertex = null;
    resetVisualization();
    updateSelectedPointsDisplay();
    updateGraphInfo();
    draw();
    log('Graph cleared successfully', 'success');
}

function resetVisualization() {
    console.log('resetVisualization called');
    log('Resetting visualization', 'message');
    isAnimating = false;
    currentAlgorithm = null;
    animationStep = 0;
    manualMode = false;
    algorithmSteps = [];
    currentStepIndex = 0;
    currentPhase = 0;
    
    edges.forEach(edge => {
        edge.inMST = false;
        edge.highlighted = false;
        edge.isMinimumEdge = false;
        edge.isProcessorEdge = false;
    });
    
    vertices.forEach(vertex => {
        vertex.highlighted = false;
        vertex.component = vertex.id;
        vertex.isProcessor = false;
    });
    
    mstEdges = [];
    
    // Reset button states based on execution mode
    const nextStepBtn = document.getElementById('nextStepBtn');
    if (executionMode === 'manual') {
        nextStepBtn.disabled = true;
        // If in manual mode and we have a graph, prepare steps automatically
        const graphVertices = vertices.filter(v => v.inGraph);
        if (graphVertices.length >= 2) {
            console.log('Auto-preparing steps for manual mode after reset');
            setupManualDistributedBoruvka();
        }
    } else {
        nextStepBtn.disabled = true;
    }
    
    updateStats();
    updateStep('Ready for new algorithm');
    draw();
    console.log('resetVisualization completed');
    log('Visualization reset complete', 'success');
}

// Distributed Borůvka's Algorithm
async function startDistributedBoruvka() {
    console.log('startDistributedBoruvka called');
    const graphVertices = vertices.filter(v => v.inGraph);
    const graphEdges = edges.filter(e => e.inGraph);
    console.log('Vertices in graph:', graphVertices.length);
    console.log('Edges in graph:', graphEdges.length);
    console.log('Current execution mode:', executionMode);
    console.log('Is animating:', isAnimating);
    
    if (graphVertices.length < 2 || graphEdges.length < 1 || isAnimating) {
        console.log('Cannot start: insufficient graph or already animating');
        return;
    }
    
    if (!isGraphConnected()) {
        showNotification('Graph must be connected!', 'error');
        console.log('Graph is not connected');
        return;
    }
    
    resetVisualization();
    log('Starting Distributed Borůvka\'s Algorithm', 'algorithm');
    
    // Check execution mode
    if (executionMode === 'manual') {
        console.log('Setting up manual mode');
        setupManualDistributedBoruvka();
    } else {
        console.log('Running automatic mode');
        await runDistributedBoruvka();
    }
}

function setupManualDistributedBoruvka() {
    console.log('Setting up manual distributed Boruvka');
    manualMode = true;
    currentStepIndex = 0;
    algorithmSteps = [];
    
    const graphVertices = vertices.filter(v => v.inGraph);
    const graphEdges = edges.filter(e => e.inGraph);
    console.log('Graph vertices:', graphVertices.length);
    console.log('Graph edges:', graphEdges.length);
    
    // Initialize Union-Find
    const uf = new UnionFind(vertices.length);
    let phase = 0;
    
    // Initialize components (each vertex starts as its own component)
    graphVertices.forEach(v => v.component = v.id);
    
    algorithmSteps.push({
        type: 'initialize',
        message: 'Initializing distributed processors - each vertex is a separate component'
    });
    
    while (uf.getComponents() > 1) {
        phase++;
        
        algorithmSteps.push({
            type: 'startPhase',
            phase: phase,
            message: `Phase ${phase}: Each processor finds minimum outgoing edge`
        });
        
        algorithmSteps.push({
            type: 'highlightProcessors',
            message: 'Highlighting active processors (components)'
        });
        
        // Find minimum edge for each component
        const componentMinEdges = {};
        
        // Get all unique components
        const components = new Set();
        graphVertices.forEach(v => components.add(uf.find(v.id)));
        
        // For each component, find its minimum outgoing edge
        components.forEach(comp => {
            let minEdge = null;
            
            graphEdges.forEach(edge => {
                const comp1 = uf.find(edge.v1.id);
                const comp2 = uf.find(edge.v2.id);
                
                // Check if this edge goes from current component to another
                if ((comp1 === comp && comp2 !== comp) || (comp2 === comp && comp1 !== comp)) {
                    if (!minEdge || edge.weight < minEdge.weight) {
                        minEdge = edge;
                    }
                }
            });
            
            if (minEdge) {
                componentMinEdges[comp] = minEdge;
            }
        });
        
        algorithmSteps.push({
            type: 'findMinEdges',
            edges: Object.values(componentMinEdges),
            message: 'Each processor identifies its minimum outgoing edge'
        });
        
        algorithmSteps.push({
            type: 'communicationPhase',
            message: 'Communication phase: processors exchange minimum edge information'
        });
        
        // Add edges to MST
        Object.values(componentMinEdges).forEach(edge => {
            if (uf.union(edge.v1.id, edge.v2.id)) {
                algorithmSteps.push({
                    type: 'addToMST',
                    edge: edge,
                    message: `Adding edge ${edge.v1.id + 1}-${edge.v2.id + 1} (weight ${edge.weight}) to MST`
                });
            }
        });
        
        algorithmSteps.push({
            type: 'mergeComponents',
            message: `Phase ${phase} complete. Merging components. Remaining: ${uf.getComponents()}`
        });
    }
    
    algorithmSteps.push({
        type: 'complete',
        message: 'Distributed Borůvka\'s Algorithm Complete! All processors have converged.'
    });
    
    document.getElementById('nextStepBtn').disabled = false;
    updateStep('Manual Distributed Borůvka mode - click Next Step to proceed');
    showNotification('Manual mode enabled - use Next Step button', 'info');
    console.log('Manual setup complete. Total steps:', algorithmSteps.length);
    console.log('Next step button enabled');
}

async function runDistributedBoruvka() {
    isAnimating = true;
    currentAlgorithm = 'Boruvka';
    
    showNotification('Starting Distributed Borůvka\'s Algorithm', 'info');
    updateStep('Simulating distributed processing...');
    
    const graphVertices = vertices.filter(v => v.inGraph);
    const graphEdges = edges.filter(e => e.inGraph);
    
    // Initialize Union-Find
    const uf = new UnionFind(vertices.length);
    let phase = 0;
    
    // Initialize components
    graphVertices.forEach(v => v.component = v.id);
    draw();
    await sleep(1000);
    
    while (uf.getComponents() > 1) {
        phase++;
        currentPhase = phase;
        updateStats();
        
        log(`Distributed Phase ${phase}: Each processor finds minimum edge for its component`, 'algorithm');
        updateStep(`Distributed Phase ${phase}: Parallel edge finding...`);
        
        // Simulate parallel processing - highlight vertices as "processors"
        for (let i = 0; i < graphVertices.length; i++) {
            graphVertices[i].highlighted = true;
            draw();
            await sleep(100);
        }
        
        await sleep(500);
        
        // Clear highlights
        graphVertices.forEach(v => v.highlighted = false);
        edges.forEach(e => {
            e.isMinimumEdge = false;
            e.highlighted = false;
        });
        
        // Find minimum edge for each component (simulating distributed computation)
        const componentMinEdges = {};
        
        // Get all unique components
        const components = new Set();
        graphVertices.forEach(v => components.add(uf.find(v.id)));
        
        // Simulate each processor finding minimum edge for assigned components
        for (const comp of components) {
            let minEdge = null;
            
            for (const edge of graphEdges) {
                const comp1 = uf.find(edge.v1.id);
                const comp2 = uf.find(edge.v2.id);
                
                // Check if this edge goes from current component to another
                if ((comp1 === comp && comp2 !== comp) || (comp2 === comp && comp1 !== comp)) {
                    edge.highlighted = true;
                    draw();
                    await sleep(50);
                    
                    if (!minEdge || edge.weight < minEdge.weight) {
                        if (minEdge) {
                            minEdge.highlighted = false;
                            minEdge.isMinimumEdge = false;
                        }
                        minEdge = edge;
                        edge.isMinimumEdge = true;
                    }
                    
                    edge.highlighted = false;
                }
            }
            
            if (minEdge) {
                componentMinEdges[comp] = minEdge;
            }
        }
        
        log(`Communication phase: Broadcasting minimum edges`, 'algorithm');
        updateStep(`Communication: Broadcasting results...`);
        
        draw();
        await sleep(2000);
        
        // Add edges to MST
        Object.values(componentMinEdges).forEach(edge => {
            if (uf.union(edge.v1.id, edge.v2.id)) {
                edge.inMST = true;
                edge.isMinimumEdge = false;
                mstEdges.push(edge);
                log(`Added edge ${edge.v1.id + 1}-${edge.v2.id + 1} (weight ${edge.weight}) to MST`, 'algorithm');
            }
        });
        
        // Update component labels
        graphVertices.forEach(v => {
            v.component = uf.find(v.id);
        });
        
        draw();
        updateStats();
        await sleep(1500);
        
        log(`Distributed Phase ${phase} complete. Components: ${uf.getComponents()}`, 'algorithm');
    }
    
    isAnimating = false;
    updateStep('Distributed Borůvka\'s Algorithm Complete!');
    showNotification('Distributed MST construction finished!', 'success');
    log('Distributed Borůvka\'s algorithm completed successfully', 'success');
}

function nextStep() {
    console.log('nextStep called');
    console.log('manualMode:', manualMode);
    console.log('currentStepIndex:', currentStepIndex);
    console.log('algorithmSteps.length:', algorithmSteps.length);
    
    // If manual mode but no steps prepared, start the algorithm
    if (executionMode === 'manual' && (!manualMode || algorithmSteps.length === 0)) {
        console.log('Starting algorithm in manual mode');
        startDistributedBoruvka();
        return;
    }
    
    if (!manualMode) {
        console.log('Manual mode not active - need to start algorithm first');
        showNotification('Please start the algorithm first', 'warning');
        return;
    }
    
    if (currentStepIndex >= algorithmSteps.length) {
        console.log('No more steps available');
        return;
    }
    
    const step = algorithmSteps[currentStepIndex];
    console.log(`Executing step ${currentStepIndex + 1}:`, step);
    log(`Step ${currentStepIndex + 1}: ${step.message}`, 'algorithm');
    executeStep(step);
    currentStepIndex++;
    
    if (currentStepIndex >= algorithmSteps.length) {
        document.getElementById('nextStepBtn').disabled = true;
        updateStep('Algorithm Complete!');
        manualMode = false;
        console.log('Algorithm completed');
    }
}

function executeStep(step) {
    console.log('Executing step:', step.type, step.message);
    switch(step.type) {
        case 'initialize':
            // Initialize visualization for distributed processing
            vertices.filter(v => v.inGraph).forEach(v => v.component = v.id);
            console.log('Initialized components');
            break;
            
        case 'startPhase':
            currentPhase = step.phase;
            edges.forEach(e => {
                e.isMinimumEdge = false;
                e.highlighted = false;
                e.isProcessorEdge = false;
            });
            break;
            
        case 'highlightProcessors':
            // Highlight active processors (components)
            vertices.forEach(v => v.isProcessor = true);
            break;
            
        case 'findMinEdges':
        case 'highlightMinEdges':
            edges.forEach(e => e.isMinimumEdge = false);
            step.edges.forEach(edge => {
                edge.isMinimumEdge = true;
                edge.isProcessorEdge = true;
            });
            break;
            
        case 'communicationPhase':
            // Visual indication of communication between processors
            edges.filter(e => e.isMinimumEdge).forEach(edge => {
                edge.highlighted = true;
            });
            break;
            
        case 'addToMST':
            step.edge.inMST = true;
            step.edge.isMinimumEdge = false;
            step.edge.isProcessorEdge = false;
            mstEdges.push(step.edge);
            break;
            
        case 'mergeComponents':
        case 'updateComponents':
            // Update component visualization
            vertices.forEach(v => {
                v.isProcessor = false;
            });
            break;
            
        case 'complete':
            // Algorithm completion
            vertices.forEach(v => v.isProcessor = false);
            edges.forEach(e => {
                e.isMinimumEdge = false;
                e.highlighted = false;
                e.isProcessorEdge = false;
            });
            break;
    }
    draw();
    updateStats();
}

function updateStats() {
    const totalCost = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);
    document.getElementById('totalCost').textContent = totalCost;
    document.getElementById('edgesInMST').textContent = mstEdges.length;
    document.getElementById('currentPhase').textContent = currentPhase;
    
    // Count current components
    if (currentAlgorithm === 'Boruvka') {
        const componentSet = new Set();
        vertices.filter(v => v.inGraph).forEach(v => {
            componentSet.add(v.component);
        });
        document.getElementById('componentsCount').textContent = componentSet.size;
    } else {
        document.getElementById('componentsCount').textContent = vertices.filter(v => v.inGraph).length;
    }
}

function updateStep(text) {
    document.getElementById('currentStep').textContent = text;
}

function showNotification(text, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = text;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function sleep(ms) {
    const speed = parseFloat(document.getElementById('speed').value);
    return new Promise(resolve => setTimeout(resolve, ms / speed));
}

// Initialize dropdown values to match JavaScript defaults
function initializeControls() {
    document.getElementById('weightType').value = weightType;
}

// Initialize
initializeControls();
updateExecutionMode(); // Initialize button visibility
draw();
updateStats();
updateSelectedPointsDisplay();
updateGraphInfo();
updateSpeedDisplay();

// MPI Code Download Functions
function downloadMPIBoruvka() {
    const mpiCode = `#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

#define MAX_VERTICES 100
#define INF INT_MAX

typedef struct {
    int u, v, weight;
} Edge;

typedef struct {
    int parent[MAX_VERTICES];
    int rank[MAX_VERTICES];
} UnionFind;

void initUnionFind(UnionFind* uf, int n) {
    for (int i = 0; i < n; i++) {
        uf->parent[i] = i;
        uf->rank[i] = 0;
    }
}

int find(UnionFind* uf, int x) {
    if (uf->parent[x] != x) {
        uf->parent[x] = find(uf, uf->parent[x]);
    }
    return uf->parent[x];
}

int unionSets(UnionFind* uf, int x, int y) {
    int rootX = find(uf, x);
    int rootY = find(uf, y);
    
    if (rootX == rootY) return 0;
    
    if (uf->rank[rootX] < uf->rank[rootY]) {
        uf->parent[rootX] = rootY;
    } else if (uf->rank[rootX] > uf->rank[rootY]) {
        uf->parent[rootY] = rootX;
    } else {
        uf->parent[rootY] = rootX;
        uf->rank[rootX]++;
    }
    return 1;
}

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    int n = 6; // Number of vertices
    int graph[MAX_VERTICES][MAX_VERTICES] = {
        {0, 4, 0, 0, 0, 0},
        {4, 0, 8, 0, 0, 0},
        {0, 8, 0, 7, 9, 14},
        {0, 0, 7, 0, 10, 0},
        {0, 0, 9, 10, 0, 2},
        {0, 0, 14, 0, 2, 0}
    };
    
    UnionFind uf;
    initUnionFind(&uf, n);
    
    Edge mst[MAX_VERTICES];
    int mstSize = 0;
    int totalWeight = 0;
    
    while (1) {
        // Each process finds minimum edge for its assigned components
        Edge localMinEdges[MAX_VERTICES];
        int localCount = 0;
        
        // Distribute work among processes
        for (int comp = rank; comp < n; comp += size) {
            int minWeight = INF;
            Edge minEdge = {-1, -1, INF};
            
            for (int i = 0; i < n; i++) {
                if (find(&uf, i) == comp) {
                    for (int j = 0; j < n; j++) {
                        if (graph[i][j] != 0 && find(&uf, i) != find(&uf, j)) {
                            if (graph[i][j] < minWeight) {
                                minWeight = graph[i][j];
                                minEdge.u = i;
                                minEdge.v = j;
                                minEdge.weight = graph[i][j];
                            }
                        }
                    }
                }
            }
            
            if (minEdge.u != -1) {
                localMinEdges[localCount++] = minEdge;
            }
        }
        
        // Gather all minimum edges
        Edge allMinEdges[MAX_VERTICES * size];
        int allCounts[size];
        
        MPI_Allgather(&localCount, 1, MPI_INT, allCounts, 1, MPI_INT, MPI_COMM_WORLD);
        
        int displs[size];
        displs[0] = 0;
        for (int i = 1; i < size; i++) {
            displs[i] = displs[i-1] + allCounts[i-1];
        }
        
        MPI_Allgatherv(localMinEdges, localCount * 3, MPI_INT,
                       allMinEdges, allCounts, displs, MPI_INT, MPI_COMM_WORLD);
        
        // Add edges to MST
        int edgesAdded = 0;
        int totalEdges = 0;
        for (int i = 0; i < size; i++) {
            totalEdges += allCounts[i];
        }
        
        for (int i = 0; i < totalEdges; i++) {
            if (unionSets(&uf, allMinEdges[i].u, allMinEdges[i].v)) {
                mst[mstSize++] = allMinEdges[i];
                totalWeight += allMinEdges[i].weight;
                edgesAdded++;
            }
        }
        
        if (edgesAdded == 0) break; // No more edges to add
    }
    
    if (rank == 0) {
        printf("Minimum Spanning Tree (Boruvka's Algorithm):\\n");
        printf("Total weight: %d\\n", totalWeight);
        for (int i = 0; i < mstSize; i++) {
            printf("Edge %d-%d: %d\\n", mst[i].u, mst[i].v, mst[i].weight);
        }
    }
    
    MPI_Finalize();
    return 0;
}`;

    const blob = new Blob([mpiCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boruvka_mpi.c';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Borůvka MPI code downloaded!', 'success');
}

function downloadSequentialBoruvka() {
    const sequentialCode = `#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

#define MAX_VERTICES 100
#define INF INT_MAX

typedef struct {
    int u, v, weight;
} Edge;

typedef struct {
    int parent[MAX_VERTICES];
    int rank[MAX_VERTICES];
} UnionFind;

void initUnionFind(UnionFind* uf, int n) {
    for (int i = 0; i < n; i++) {
        uf->parent[i] = i;
        uf->rank[i] = 0;
    }
}

int find(UnionFind* uf, int x) {
    if (uf->parent[x] != x) {
        uf->parent[x] = find(uf, uf->parent[x]);
    }
    return uf->parent[x];
}

int unionSets(UnionFind* uf, int x, int y) {
    int rootX = find(uf, x);
    int rootY = find(uf, y);
    
    if (rootX == rootY) return 0;
    
    if (uf->rank[rootX] < uf->rank[rootY]) {
        uf->parent[rootX] = rootY;
    } else if (uf->rank[rootX] > uf->rank[rootY]) {
        uf->parent[rootY] = rootX;
    } else {
        uf->parent[rootY] = rootX;
        uf->rank[rootX]++;
    }
    return 1;
}

int countComponents(UnionFind* uf, int n) {
    int components = 0;
    for (int i = 0; i < n; i++) {
        if (find(uf, i) == i) {
            components++;
        }
    }
    return components;
}

void boruvkaMST(int graph[][MAX_VERTICES], int n) {
    UnionFind uf;
    initUnionFind(&uf, n);
    
    Edge mst[MAX_VERTICES];
    int mstSize = 0;
    int totalWeight = 0;
    int phase = 0;
    
    printf("Starting Boruvka's Algorithm\\n");
    printf("Initial components: %d\\n\\n", n);
    
    while (countComponents(&uf, n) > 1) {
        phase++;
        printf("Phase %d:\\n", phase);
        
        // Find minimum edge for each component
        Edge minEdges[MAX_VERTICES];
        for (int i = 0; i < n; i++) {
            minEdges[i] = (Edge){-1, -1, INF};
        }
        
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (graph[i][j] != 0 && find(&uf, i) != find(&uf, j)) {
                    int comp1 = find(&uf, i);
                    int comp2 = find(&uf, j);
                    
                    if (graph[i][j] < minEdges[comp1].weight) {
                        minEdges[comp1] = (Edge){i, j, graph[i][j]};
                    }
                    if (graph[i][j] < minEdges[comp2].weight) {
                        minEdges[comp2] = (Edge){i, j, graph[i][j]};
                    }
                }
            }
        }
        
        // Add minimum edges to MST
        int edgesAdded = 0;
        for (int i = 0; i < n; i++) {
            if (minEdges[i].u != -1) {
                if (unionSets(&uf, minEdges[i].u, minEdges[i].v)) {
                    mst[mstSize++] = minEdges[i];
                    totalWeight += minEdges[i].weight;
                    printf("  Added edge %d-%d (weight: %d)\\n", 
                           minEdges[i].u, minEdges[i].v, minEdges[i].weight);
                    edgesAdded++;
                }
            }
        }
        
        printf("  Components remaining: %d\\n\\n", countComponents(&uf, n));
        
        if (edgesAdded == 0) break;
    }
    
    printf("Minimum Spanning Tree:\\n");
    printf("Total weight: %d\\n", totalWeight);
    printf("Edges in MST:\\n");
    for (int i = 0; i < mstSize; i++) {
        printf("  %d-%d: %d\\n", mst[i].u, mst[i].v, mst[i].weight);
    }
}

int main() {
    int n = 6;
    int graph[MAX_VERTICES][MAX_VERTICES] = {
        {0, 4, 0, 0, 0, 0},
        {4, 0, 8, 0, 0, 0},
        {0, 8, 0, 7, 9, 14},
        {0, 0, 7, 0, 10, 0},
        {0, 0, 9, 10, 0, 2},
        {0, 0, 14, 0, 2, 0}
    };
    
    boruvkaMST(graph, n);
    return 0;
}`;

    const blob = new Blob([sequentialCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boruvka_sequential.c';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Sequential Borůvka code downloaded!', 'success');
}

// Mobile orientation handling
function checkOrientation() {
    const overlay = document.querySelector('.rotate-device-overlay');
    const isMobile = window.innerWidth < 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (isMobile && isPortrait) {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

// Check orientation on load and resize
window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => {
    setTimeout(checkOrientation, 100);
});

// Info Modal Functions
function showInfo() {
    document.getElementById('infoModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideInfo() {
    document.getElementById('infoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Make functions globally accessible
window.showInfo = showInfo;
window.hideInfo = hideInfo;

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // F1 or Ctrl+H for help
    if (e.key === 'F1' || (e.ctrlKey && e.key === 'h')) {
        e.preventDefault();
        showInfo();
    }
    // Escape to close modal
    else if (e.key === 'Escape') {
        hideInfo();
    }
});

// Click outside modal to close
document.getElementById('infoModal').addEventListener('click', (e) => {
    if (e.target.id === 'infoModal') {
        hideInfo();
    }
});
