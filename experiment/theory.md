### Minimum Spanning Tree

A minimum spanning tree (MST) or minimum weight spanning tree is a subset of the edges of a connected, edge-weighted undirected graph that connects all the vertices together, without any cycles and with the minimum possible total edge weight.

Boruvka's algorithm is a greedy algorithm for finding a minimum spanning tree in a graph, or a minimum spanning forest in a disconnected graph.

The algorithm works as follows:
1. Initialize a forest F to be a set of one-vertex trees, one for each vertex of the graph.
2. While the forest F has more than one component:
    a. For each component C in F, find the cheapest edge from C to any other component C'.
    b. Add all such cheapest edges to the forest F. These edges will connect components together to form larger components.
3. The final forest F is the minimum spanning tree of the graph.

### Example
Let's consider a graph with vertices {A, B, C, D, E, F} and the following edges and weights:
(A, B, 4), (A, F, 2), (B, C, 6), (B, F, 5), (C, D, 3), (C, E, 2), (D, E, 4), (E, F, 1)

1. **Initialization:** Each vertex is a component: {A}, {B}, {C}, {D}, {E}, {F}.

2. **Iteration 1:**
   - Component {A}: cheapest edge is (A, F, 2) to component {F}.
   - Component {B}: cheapest edge is (B, A, 4) to component {A}.
   - Component {C}: cheapest edge is (C, E, 2) to component {E}.
   - Component {D}: cheapest edge is (D, C, 3) to component {C}.
   - Component {E}: cheapest edge is (E, F, 1) to component {F}.
   - Component {F}: cheapest edge is (F, E, 1) to component {E}.

   The cheapest edges to add are (A,F,2), (C,E,2), (E,F,1). Note that (F,E,1) is the same as (E,F,1). We add these edges.
   New components: {A, F, E, C}, {B}, {D}.

3. **Iteration 2:**
   - Component {A, F, E, C}:
     - From A: (A,B,4)
     - From C: (C,B,6), (C,D,3)
     - From E: no outgoing edges to other components
     - From F: (F,B,5)
     The cheapest edge is (C, D, 3).
   - Component {B}: cheapest edge is (B, A, 4).
   - Component {D}: cheapest edge is (D, C, 3).

   The cheapest edge to add is (C,D,3).
   New components: {A, F, E, C, D}, {B}.

4. **Iteration 3:**
   - Component {A, F, E, C, D}: cheapest edge to {B} is (A,B,4).
   - Component {B}: cheapest edge to {A, F, E, C, D} is (B,A,4).

   Add edge (A,B,4).
   Now there is only one component: {A, B, C, D, E, F}. The algorithm terminates.

The MST consists of edges (A,F,2), (C,E,2), (E,F,1), (C,D,3), (A,B,4). Total weight = 2+2+1+3+4 = 12.
Wait, there is a mistake in the example. (E,F,1) and (C,E,2) and (A,F,2) are chosen.
Components become {A,F,E,C}, {B}, {D}.
Cheapest from {A,F,E,C} is (C,D,3).
Cheapest from {B} is (B,A,4).
Cheapest from {D} is (D,C,3).
Edges to add are (C,D,3) and (B,A,4).
The MST edges are (A,F,2), (C,E,2), (E,F,1), (C,D,3), (A,B,4).
Let's re-check.
Initial components: {A}, {B}, {C}, {D}, {E}, {F}
Edges to find:
- A: (A,F,2)
- B: (B,A,4)
- C: (C,E,2)
- D: (D,C,3)
- E: (E,F,1)
- F: (F,A,2) or (F,E,1) -> (F,E,1)
Edges to add: (A,F,2), (B,A,4), (C,E,2), (D,C,3), (E,F,1).
Let's see the components formed.
(E,F,1) connects {E} and {F}.
(A,F,2) connects {A} to {E,F}. Component {A,E,F}.
(C,E,2) connects {C} to {A,E,F}. Component {A,C,E,F}.
(D,C,3) connects {D} to {A,C,E,F}. Component {A,C,D,E,F}.
(B,A,4) connects {B} to {A,C,D,E,F}. Component {A,B,C,D,E,F}.
All vertices are connected. The edges are (E,F,1), (A,F,2), (C,E,2), (D,C,3), (B,A,4).
Total weight = 1+2+2+3+4 = 12. This is a valid MST.

The simulation will allow the user to input a graph or use a randomly generated one. The user can then step through Boruvka's algorithm to see how the MST is constructed.