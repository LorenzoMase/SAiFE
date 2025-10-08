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
import CodeModal from "@components/CodeModal/CodeModal";
import {GoogleGenerativeAI} from "@google/generative-ai";
import ProjectModal from "@components/ProjectModal/Modal";
import type { Node, NodeMouseHandler } from "@xyflow/react";
import { get, set } from "lodash";
const nodeTypes: NodeTypes = {
    shape: ShapeNode,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
    type: "editable-edge",
    style: {strokeWidth: 2},
};

const Flow = () => {
    const [chatSessions, setChatSessions] = useState<{[key: string]: Array<{role: string, parts: Array<{text: string}>}>}>({});
    const diagram = useDiagram();
    const {getSnapshotJson, takeSnapshot} = useUndoRedo();
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(false);
    const [width] = useWindowSize();
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [originalDescription, setOriginalDescription] = useState<string>("");
    const [includeNonFunctionalState, setIncludeNonFunctionalState] = useState<boolean>(false);
    const themeHook = useTheme();
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) {
    throw new Error("API_KEY not found");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const [loading, setLoading] = useState(false);
    const [codeModalOpen, setCodeModalOpen] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string>("");
    const [codeLoading, setCodeLoading] = useState(false);
    const [firstGeminiResult, setFirstGeminiResult] = useState<string>("");
    const [originalPrompt, setOriginalPrompt] = useState<string>("");
    const [graphIndex, setGraphIndex] = useState<number>(-1);
    const graphsHistory = useRef<string[]>([]);
    const [secondRequest, setSecondRequest] = useState<boolean>(false);
    const [thinking, setThinking] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
    });

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 65365,
        responseMimeType: "application/json",
    };

    const getChatHistory = (sessionKey: string) => {
        return chatSessions[sessionKey] || [];
    };

    const ThinkingIndicator = () => {
        const [dots, setDots] = useState('');
        
        useEffect(() => {
            if (!thinking) return;
            
            const interval = setInterval(() => {
                setDots(prev => {
                    if (prev === '...') return '';
                    return prev + '.';
                });
            }, 500);
            
            return () => clearInterval(interval);
        }, [thinking]);
        
        if (!thinking) return null;
        
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                            Thinking{dots}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const ErrorModal = () => {
        if (!error) return null;
        
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" style={{zIndex: 99999}}>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Error
                        </h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        {error}
                    </p>
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setError("")}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        );
    };



    const handleModalSubmit = async (description: string, includeNonFunctional: boolean) => {
        setThinking(true);
        setError("");
        setIsModalOpen(false);
        setOriginalDescription(description);
        setIncludeNonFunctionalState(includeNonFunctional);
        const nonFunctionalInstruction = includeNonFunctional
            ? "Include also non-functional requirements (soft goals, round-rectangle nodes) in the model."
            : "Do NOT include non-functional requirements (no soft goals, no round-rectangle nodes) in the model.";
        const originalPrompt = `You are a requirements analyst. Your task is to generate an Initial Requirements Model of a software system as a tree-structured graph in JSON format, with two sections: nodes and edges.
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
                    - Only edges to soft goals MUST be dotted.
                    - Dotted edges to soft goals MUST have a '+' if the impact is positive or a '-' label in the middle of the edge.
                    - A node cannot have both + and - impacts to the same soft goal.
                    - All other edges must be solid.
                3. AND operator:
                    - Use capsule: AND only if a node has two or more children.
                    - The AND operator must be placed above its children.
                4. Layout:
                    - NEVER make nodes overlap.
                    - Edges must NEVER cross other edges or nodes.
                    - Subtrees must be visually well composed and distinguishable.
                    - Nodes at the same y-axis be at least 200px apart on the x-axis.
                    - Edges must be at least 30px long.
                5. Style:
                    - Keep it coincise and simple.
                    - The text of the nodes must NEVER be longer than the node itself.
                    - Remember to implement cybersecurity requirements.
                    - Use short text for node contents.
                    - Remember to insert the '+' or '-' label on dotted edges to soft goals.
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
                Output only the JSON, no explanations.`;
        setOriginalPrompt(originalPrompt);
        
        try {
            const chatSession = model.startChat({
                generationConfig,
                history: []
            });
            const result = await chatSession.sendMessage(originalPrompt);
            const responseText = result.response.text();
            setFirstGeminiResult(responseText);
            
            setChatSessions(prev => ({
                ...prev,
                ["main"]: [
                    { role: "user", parts: [{ text: originalPrompt }] },
                    { role: "model", parts: [{ text: responseText }] }
                ]
            }));
            
            if (JSON.parse(responseText)) {
                diagram.uploadJson(responseText);
                console.log(diagram);
                console.log(responseText);
                graphsHistory.current = [responseText];
                setGraphIndex(0);
            }
        } catch (e) {
            setError("An error occurred while generating the diagram. Please try again.");
        } finally {
            setThinking(false);
        }
    }

    const generateCodeFromGraph = async () => {
        try {
            setCodeModalOpen(true);
            setCodeLoading(true);
            setError("");
            const graphJson = getSnapshotJson();
            const codePrompt = `You are a senior software engineer. Given this requirements graph in JSON with nodes and edges, generate secure, based on OWASP top 10 and CWEs, code that reflects the current model.
                Graph JSON:
                ${graphJson}

                Instructions:
                - Infer main capabilities from circle/hexagon nodes and relationships.
                - Divide the code in logical functions based on tasks and sub-goals.
                - Output ONLY code.
                - Remove the first line containing the language name.
                - Keep code short and focused; avoid placeholders if not necessary.
                - Assume the language based on the most used for the tasks.
                - Make the code secure, following OWASP Top 10 and common CWEs.
                - Ensure no hardcoded secrets, use environment variables.
                - Validate and sanitize all inputs.
                - Implement proper error handling and logging.
                - Use HTTPS and secure headers.
                - Protect against common vulnerabilities (e.g., SQL injection, XSS).
                - Include minimal comments for clarity
                - Generate a single file with secure functions`;
            
            const codeGenerationConfig = {
                ...generationConfig,
                responseMimeType: "text/plain",
            } as const;

            const currentHistory = getChatHistory("code");
            console.log(currentHistory);
            const chatSession = model.startChat({ 
                generationConfig: codeGenerationConfig, 
                history: currentHistory
            });
            
            const result = await chatSession.sendMessage(codePrompt);
            const text = result.response.text();
            setGeneratedCode(text);
            
            setChatSessions(prev => ({
                ...prev,
                ["code"]: [
                    ...currentHistory,
                    { role: "user", parts: [{ text: codePrompt }] },
                    { role: "model", parts: [{ text: text }] }
                ]
            }));
        } catch (e) {
            setError("An error occurred while generating the code. Please try again.");
        } finally {
            setCodeLoading(false);
        }
    };

    const generateTaskDiagram = async (taskName: string) => {
        setThinking(true);
        setError("");

        const taskPrompt = `Now, focus ONLY on the task: ${taskName}. Generate a smaller requirements model than the previous one for this specific task, keeping the context of the original description, and using the same exact rules.\nOutput only the JSON, no explanations.`;

        try {
            const currentHistory = getChatHistory("main");
            const chatSession = model.startChat({
                generationConfig,
                history: currentHistory
            });
            console.log(currentHistory);
            const result = await chatSession.sendMessage(taskPrompt);
            const responseText = result.response.text();
            console.log(responseText);
            setChatSessions(prev => ({
                ...prev,
                ["main"]: [
                    ...currentHistory,
                    { role: "user", parts: [{ text: taskPrompt }] },
                    { role: "model", parts: [{ text: responseText }] }
                ]
            }));
            console.log(getChatHistory("main"));
            if (JSON.parse(responseText)) {
                diagram.uploadJson(responseText);
                setSecondRequest(true);
                graphsHistory.current.push(responseText);
                setGraphIndex(graphsHistory.current.length - 1);
            }
        } catch (e) {
            setError("An error occurred while generating the task diagram. Please try again.");
        } finally {
            setThinking(false);
        }
    };

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


    const handleNodeClick: NodeMouseHandler = useCallback((event, node: Node) => {
        if (node?.data?.type === "hexagon" && originalDescription) {
            const taskName = String(node.data.contents);
            generateTaskDiagram(taskName);
        }
    }, [originalDescription, chatSessions, generateTaskDiagram]);

    const nextGraph = () => {
        if (graphIndex < graphsHistory.current.length - 1) {
            const newIndex = graphIndex + 1;
            setGraphIndex(newIndex);
            const graph = graphsHistory.current[newIndex];
            diagram.uploadJson(graph);
        }
    };

    const previousGraph = () => {
        if (graphIndex > 0) {
            const newIndex = graphIndex - 1;
            setGraphIndex(newIndex);
            const graph = graphsHistory.current[newIndex];
            diagram.uploadJson(graph);
        }
    };
    
    useEffect(() => {
        return () => {
            graphsHistory.current = [];
            setGraphIndex(-1);
        };
    }, []);

    return (
        <div className="w-full h-full">
            <ThinkingIndicator />
            <ErrorModal />
            {isModalOpen &&
                <ProjectModal
                    onSubmit={handleModalSubmit}
                />
            }
            <PanelGroup direction="horizontal" style={{display: thinking ? "none" : "block"}}>
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
                                onNodeClick={handleNodeClick}
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
            {!thinking && secondRequest && (
                <div className="fixed bottom-4 right-4 z-[9998]">
                    <div className="rounded-md bg-white/80 p-2 shadow-md backdrop-blur dark:bg-black/60">
                        <button
                            disabled={!originalDescription || codeLoading}
                            onClick={generateCodeFromGraph}
                            className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                            title="Generate Code"
                            >
                            Generate Code
                        </button>
                        <button
                            disabled={graphIndex <= 0}
                            onClick={previousGraph}
                            className="ml-2 rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                            title="Previous Graph"
                        >
                            Previous
                        </button>
                        <button
                            disabled={graphIndex < 0 || graphIndex >= graphsHistory.current.length - 1}
                            onClick={nextGraph}
                            className="ml-2 rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                            title="Next Graph"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
            <CodeModal
                isOpen={codeModalOpen}
                onClose={() => setCodeModalOpen(false)}
                code={generatedCode}
                isLoading={codeLoading}
            />
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
