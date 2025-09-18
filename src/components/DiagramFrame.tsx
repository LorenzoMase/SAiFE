import {
    Background,
    ConnectionLineType,
    ConnectionMode,
    ControlButton,
    Controls,
    DefaultEdgeOptions,
    MiniMap,
    NodeTypes,
    ReactFlow,
    ReactFlowProvider,
    Panel,
    EdgeTypes,
    EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./nodeStyles.css";
import ShapeNode from "./shape-node";
import Sidebar from "./Sidebar/Sidebar";
import MiniMapNode from "./minimap-node";
import {useDiagram} from "@/hooks/useDiagram";
import {CornerUpLeft, CornerUpRight} from "react-feather";
import useUndoRedo from "@/hooks/useUndoRedo";
import {
    PanelGroup,
    PanelResizeHandle,
    Panel as ResizablePanel,
} from "react-resizable-panels";

const JsonViewer = dynamic(() => import("./JsonViewer/JsonViewer"), {
    ssr: false,
});
import {useCallback, useEffect, useRef, useState} from "react";
import {useWindowSize} from "@/hooks/useWindowSize";
import dynamic from "next/dynamic";
import {EditableEdge} from "./edges/EditableEdge";
import EdgeToolbar from "./EdgeToolbar/EdgeToolbar";
import {ConnectionLine} from "./edges/ConnectionLine";
import savedDiagramJson from "../json-diagrams/DiagramX.json";
import {useTheme} from "@/hooks/useTheme";
import {Menu} from "./Menu";
import {GoogleGenerativeAI} from "@google/generative-ai";
import ProjectModal from "@components/ProjectModal/Modal";
import {ClipLoader} from "react-spinners";

const nodeTypes: NodeTypes = {
    shape: ShapeNode,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
    type: "editable-edge",
    style: {strokeWidth: 2},
};

const Flow = () => {
    const diagram = useDiagram();
    const {getSnapshotJson, takeSnapshot} = useUndoRedo();
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(false);
    const [width] = useWindowSize();
    const [isModalOpen, setIsModalOpen] = useState(true);
    const themeHook = useTheme();
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) {
  throw new Error("API_KEY not found");
}
    const genAI = new GoogleGenerativeAI(apiKey);
    const [loading, setLoading] = useState(false);

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
    });

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 65365,
        responseMimeType: "application/json",
    };

    const handleModalSubmit = async (description: string, includeNonFunctional: boolean) => {
        setLoading(true);
        setIsModalOpen(false);
        const nonFunctionalInstruction = includeNonFunctional
            ? "Include also non-functional requirements (soft goals, round-rectangle nodes) in the model."
            : "Do NOT include non-functional requirements (no soft goals, no round-rectangle nodes) in the model.";
        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: "user",
                    parts: [
                    {text: `You are a requirements analyst. Your task is to generate an Initial Requirements Model of a software system as a tree-structured graph in JSON format, with two sections: nodes and edges.
${nonFunctionalInstruction}

Node types:
- Circle = functional goal (main or sub-goal).
- Capsule = logical operator AND.
- Hexagon = task (implementable activity).
- Round-rectangle = soft goal (non-functional requirement).

Input:
The system to be modeled is described as: ${
              description !== ""
                ? description
                : "I don't have any ideas currently so, you can create requirements for any software project as an example"
            }

Expected output:
- A tree graph in JSON with nodes and edges.
- Each node must include x,y coordinates and consistent style.
- The graph must follow the rules below.

Rules:
1. General structure:
    - Only one main functional goal (circle) as the root.
    - Every other node must have at least one parent.
    - Each hexagon (task) must connect to a circle.
    - Each round-rectangle (soft goal) must connect to a circle or a hexagon.
2. Connections:
    - No duplicate edges between two nodes.
    - Only edges to soft goals must be dotted.
    - A node cannot have both + and - impacts to the same soft goal.
    - All other edges must be solid.
3. AND operator:
    - Use capsule: AND only if a node has two or more children.
    - The AND operator must be placed above its children.
4. Layout:
    - No overlapping nodes nor edges.
    - Edges must never cross other edges or nodes.
    - Subtrees must be visually well separated.
    - Nodes at the same level must be at least 200px apart on the x-axis.
    - Keep the system’s centroid close to the root node, take more space if required for a more comprehensive graph.
    - Edges must be at least 30px long.
5. Style:
    - Keep it coincice and simple.
    - Remember to implement cybersecurity requirements.
    - All nodes must have color #438D57.
    - Node sizes must be consistent with the provided example.
    - IMPORTANT: "style.width" and "style.height" must be NUMERIC values, not strings with "px".
    - Edges must follow this format:
      {
        "type": "editable-edge",
        "style": { "strokeWidth": 2 },
        "source": "nodeId1",
        "sourceHandle": "top",
        "target": "nodeId2",
        "targetHandle": "bottom",
        "id": "xy-edge__nodeId1top-nodeId2bottom"
      }

Here is an example of the expected JSON format:
{
  "nodes": [
    {
      "id": "1",
      "type": "shape",
      "position": { "x": 400, "y": 50 },
      "style": { "width": 200, "height": 70 },
      "data": { "type": "circle", "contents": "Order Food Online", "color": "#438D57" }
    },
    {
      "id": "2",
      "type": "shape",
      "position": { "x": 400, "y": 180 },
      "style": { "width": 42, "height": 22 },
      "data": { "type": "capsule", "contents": "AND", "color": "#438D57" }
    },
    {
      "id": "3",
      "type": "shape",
      "position": { "x": 200, "y": 300 },
      "style": { "width": 200, "height": 70 },
      "data": { "type": "circle", "contents": "Browse Menu", "color": "#438D57" }
    }
  ],
  "edges": [
    {
      "type": "editable-edge",
      "style": { "strokeWidth": 2 },
      "source": "2",
      "sourceHandle": "top",
      "target": "1",
      "targetHandle": "bottom",
      "id": "xy-edge__2top-1bottom"
    },
    {
      "type": "editable-edge",
      "style": { "strokeWidth": 2 },
      "source": "3",
      "sourceHandle": "top",
      "target": "2",
      "targetHandle": "bottom",
      "id": "xy-edge__3top-2bottom"
    }
  ]
}
Output only the JSON, no explanations.`
                    }]},
            ],
        });
        const result = await chatSession.sendMessage("Generate the response and it must be JSON");
        try {
            if (JSON.parse(result.response.text())) {
                diagram.uploadJson(result.response.text());
                console.log(diagram);
                console.log(result.response.text());
            }
        } catch (e) {
            console.log(e);
            console.log(result.response.text());
        } finally {
            setLoading(false);
        }
    }

    const getDefaultSize = (w: number) => {
        if (w < 1024) {
            return 33;
        } else return 20;
    };

    const toggleRightSidebar = () => {
        setIsRightSidebarOpen(!isRightSidebarOpen);
    };

    const toggleLeftSidebar = () => {
        setIsLeftSidebarOpen(!isLeftSidebarOpen);
    };

    const EditableEdgeWrapper = useCallback(
        (props: EdgeProps) => {
            return <EditableEdge {...props} useDiagram={diagram}/>;
        },
        [diagram]
    );
    const edgeTypes: EdgeTypes = {
        "editable-edge": EditableEdgeWrapper,
    };

    return (
        <div className="w-full h-full">
            {isModalOpen &&
                <ProjectModal
                    onSubmit={handleModalSubmit}
                />
            }
            {loading &&
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                    <ClipLoader
                        color={"#438D57"}
                        loading={loading}
                        size={150}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                    /></div>
            }
            <PanelGroup direction="horizontal" style={{display: loading ? "none" : "block"}}>
                {isLeftSidebarOpen ? (
                    <ResizablePanel
                        order={1}
                        className="bg-white dark:bg-black"
                        defaultSize={getDefaultSize(width)}
                        minSize={getDefaultSize(width)}
                    >
                    </ResizablePanel>
                ) : null}
                <PanelResizeHandle
                    className={`w-1 cursor-col-resize ${
                        isLeftSidebarOpen
                            ? "bg-stone-600 visible"
                            : "bg-transparent hidden"
                    }`}
                />
                <ResizablePanel order={2}>
                    <PanelGroup direction="horizontal">
                        <ResizablePanel minSize={30} order={1}>
                            <ReactFlow
                                className={themeHook.theme || "light"}
                                onConnect={diagram.onConnect}
                                isValidConnection={diagram.isValidConnection}
                                onConnectStart={diagram.onConnectStart}
                                connectionLineComponent={ConnectionLine}
                                proOptions={{hideAttribution: true}}
                                onPaneClick={diagram.onPaneClick}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                defaultNodes={savedDiagramJson.nodes}
                                defaultEdges={savedDiagramJson.edges}
                                defaultEdgeOptions={defaultEdgeOptions}
                                connectionLineType={ConnectionLineType.SmoothStep}
                                connectionMode={ConnectionMode.Loose}
                                panOnScroll={true}
                                onDrop={diagram.onDrop}
                                snapToGrid={false}
                                snapGrid={[10, 10]}
                                onDragOver={diagram.onDragOver}
                                zoomOnDoubleClick={false}
                                onNodesChange={diagram.onNodesChange}
                                onNodeDragStart={diagram.onNodeDragStart}
                                onSelectionDragStart={diagram.onSelectionDragStart}
                                onNodesDelete={diagram.onNodesDelete}
                                onNodeClick={diagram.onNodeClick}
                                onEdgesDelete={diagram.onEdgesDelete}
                                onEdgeClick={diagram.onEdgeClick}
                                elevateEdgesOnSelect
                                elevateNodesOnSelect
                                maxZoom={10}
                                minZoom={0.1}
                                multiSelectionKeyCode={["Meta", "Control"]}
                            >
                                <Background
                                    color="grey"
                                    bgColor={themeHook.theme === "dark" ? "black" : "white"}
                                />
                                <Panel position="top-left">
                                    <Sidebar/>
                                </Panel>
                                {diagram.editingEdgeId ? (
                                    <Panel position="top-center">
                                        <EdgeToolbar
                                            takeSnapshot={takeSnapshot}
                                            useDiagram={diagram}
                                        />
                                    </Panel>
                                ) : null}
                                <Panel position="top-right">
                                    <Menu
                                        themeHook={themeHook}
                                        diagram={diagram}
                                        isRightSidebarOpen={isRightSidebarOpen}
                                        toggleRightSidebar={toggleRightSidebar}
                                        toggleLeftSidebar={toggleLeftSidebar}
                                    />
                                </Panel>
                                <Controls className="" showInteractive={false}>
                                    <ControlButton onClick={() => diagram.undo()} title="Undo">
                                        <CornerUpLeft fillOpacity={0}/>
                                    </ControlButton>
                                    <ControlButton onClick={() => diagram.redo()} title="Redo">
                                        <CornerUpRight fillOpacity={0}/>
                                    </ControlButton>
                                </Controls>
                                <MiniMap
                                    zoomable
                                    pannable
                                    draggable
                                    nodeComponent={MiniMapNode}
                                />
                                <diagram.HelperLines
                                    horizontal={diagram.helperLineHorizontal}
                                    vertical={diagram.helperLineVertical}
                                />
                                <diagram.Markers/>
                            </ReactFlow>
                        </ResizablePanel>
                        <PanelResizeHandle
                            className={`w-1 cursor-col-resize ${
                                isRightSidebarOpen === true
                                    ? "bg-stone-600 visible"
                                    : "bg-transparent hidden"
                            }`}
                        />
                        {isRightSidebarOpen ? (
                            <ResizablePanel
                                order={2}
                                defaultSize={getDefaultSize(width)}
                                minSize={getDefaultSize(width)}
                            >
                                <JsonViewer
                                    jsonString={getSnapshotJson()}
                                    toggleRightSidebar={toggleRightSidebar}
                                />
                            </ResizablePanel>
                        ) : null}
                    </PanelGroup>
                </ResizablePanel>
            </PanelGroup>
        </div>
    );
};

const DiagramFrame = () => {
    return (
        <ReactFlowProvider>
            <Flow/>
        </ReactFlowProvider>
    );
};

export default DiagramFrame;
