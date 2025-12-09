### Controls 

The user will be provided with a graph visualization interface.
The controls for the experiment are as follows:
1.  **Graph Input**: The user can create a graph by adding nodes and edges. The user will specify the weight for each edge.
2.  **Random Graph**: A button to generate a random graph with a specified number of vertices and edges.
3.  **Run Algorithm**: A button to run Boruvka's algorithm on the graph. The algorithm will run step-by-step, highlighting the components and the cheapest edges being added in each iteration.
4.  **Next Step**: A button to proceed to the next iteration of the algorithm.
5.  **Reset**: A button to clear the graph and the algorithm's progress.
6.  **Speed Control**: A slider to control the speed of the animation of the algorithm.

### Procedure

Follow these steps to understand and execute Borůvka's algorithm:

#### Phase 1: Graph Setup
1. **Create or Generate a Graph**
   - Option A: Manually add vertices by clicking on the canvas, then create edges between vertices by selecting two nodes and entering the edge weight.
   - Option B: Click the "Random Graph" button and specify the number of vertices and edges to automatically generate a connected weighted graph.
   
2. **Verify the Graph**
   - Ensure all edges have positive weights displayed.
   - Confirm that the graph is connected (all vertices are reachable from any starting vertex).

#### Phase 2: Initialize the Algorithm
3. **Start Borůvka's Algorithm**
   - Click the "Run Algorithm" button to begin.
   - Observe the initial state: Each vertex is highlighted as its own separate component (different colors may be used to distinguish components).
   - The component count will be displayed (initially equal to the number of vertices).

#### Phase 3: Execute Algorithm Iterations
4. **Identify Cheapest Edges**
   - For the current iteration, the simulation will highlight the cheapest (minimum weight) outgoing edge for each component.
   - Multiple edges may be highlighted simultaneously if they are the cheapest for their respective components.
   - Observe carefully: Some components may select the same edge if it connects them.

5. **Add Edges and Merge Components**
   - Click the "Next Step" button to proceed.
   - The highlighted edges will be added to the Minimum Spanning Tree (they will change color to indicate inclusion in the MST).
   - Components connected by these edges will merge into larger components.
   - The component count will decrease accordingly.
   - Notice how vertices in merged components now share the same color.

6. **Repeat Until Completion**
   - Continue clicking "Next Step" to repeat steps 4-5.
   - Watch as components gradually merge with each iteration.
   - The algorithm terminates when only one component remains (component count = 1).

#### Phase 4: Review Results
7. **Analyze the Minimum Spanning Tree**
   - Once complete, all MST edges will be clearly highlighted.
   - The total weight of the MST will be displayed on the screen.
   - Count the number of edges in the MST (should be n-1, where n is the number of vertices).

8. **Experiment Further** (Optional)
   - Use the "Reset" button to clear the current progress.
   - Try different graphs to observe how Borůvka's algorithm handles various graph structures.
   - Adjust the "Speed Control" slider to slow down or speed up the animation for better understanding.

### Tips for Learning
- Pay attention to how multiple components can select edges simultaneously in each iteration, which is a key feature of Borůvka's algorithm.
- Compare the number of iterations required for different graph structures.
- Verify that no cycles are formed when edges are added to the MST.
