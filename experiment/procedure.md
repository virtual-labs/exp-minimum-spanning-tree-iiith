### Controls 

The user will be provided with a graph visualization interface.
The controls for the experiment are as follows:
1.  **Graph Input**: The user can create a graph by adding nodes and edges. The user will specify the weight for each edge.
2.  **Random Graph**: A button to generate a random graph with a specified number of vertices and edges.
3.  **Run Algorithm**: A button to run Boruvka's algorithm on the graph. The algorithm will run step-by-step, highlighting the components and the cheapest edges being added in each iteration.
4.  **Next Step**: A button to proceed to the next iteration of the algorithm.
5.  **Reset**: A button to clear the graph and the algorithm's progress.
6.  **Speed Control**: A slider to control the speed of the animation of the algorithm.

The experiment will proceed as follows:
1. The user creates a graph or generates a random one.
2. The user clicks the "Run Algorithm" button.
3. The simulation will show the initial state where each vertex is a component.
4. In each step, the simulation will highlight the cheapest edge for each component.
5. The user clicks "Next Step" to add these edges and merge the components.
6. The process repeats until only one component remains, which is the Minimum Spanning Tree.
7. The total weight of the MST will be displayed.
