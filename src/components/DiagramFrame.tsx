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
    const apiKey = "AIzaSyB7CvQfInd-nDUSsetox8ROXITBlVvR2to";
    const genAI = new GoogleGenerativeAI(apiKey);
    const [loading, setLoading] = useState(false);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
    };

    const handleModalSubmit = async (description: string) => {
        setLoading(true);
        setIsModalOpen(false);
        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Before you proceed anything, you need to remember that shape circle is the goal (functional goal), capsule is the \"AND\" logical operator, hexagon is the task and round-rectangle is soft goal (non-functional goal) more abstract, will have connections to the tasks.\n\nOverall information about the initial requirement models consists of one main goal (circle shape) followed by the AND logical operator and several sub goals and tasks. The subgoals might have tasks (with or without \"AND\" operator). If every tasks of the subgoals should be implemented, there should be \"AND\" operator or else, where just one or more tasks can be chosen to implement the subgoal, no need to add \"AND\" operator. The tasks or subgoals will have dotted connections to round-rectangle, which are the soft goals or non-functional requirements, and these tasks, subgoals might have both positive and negative impacts to the soft goals (\"+\" means positive,  \"-\" means negative, it should be identified in the dotted edges).\n\nYou are the requirement analyst who will create the Initial requirements model for the following software system which is:\n[\"${description !== "" ? description : "I don't have any ideas currently so, you can create requirements for any software project as an example"} and when you generate the goal model, you must not exceed the maximum output token\"]\n\nI want you to generate the results in the tree layout, level by level with nodes and edges. You need to follow these rules strictly when generating the results:\n1. There should be only one unique edge for two nodes and no duplications. \n2. Ensure that all the nodes have at least one connection and the hexagon must be connected to the circle, the round-rectangle must be connected to either circle or hexagon.\n3. Only the connection that includes the round-rectangle must be dotted, and two same connections from a single node with different impacts (both \"+\" and  \"-\") to the same round-rectangle is forbidden. For other connections, it should not be dotted.\n4. Again, there shouldn't be any nodes that don't have parents, except for the main goal on the top, which is the root.\n5. If there'\\''s any AND operator, it should be above it's children, and also AND operator should be included only when there's more than one child under the parent.\n6. x coordinates difference between the nodes at the same y coordinates should be at least 200 to one another so that they won't overlap.\n7. The color of all the nodes must be #438D57.\n\nAs an example, you can see it below. Remember, this is just the example, you have to generate only related to the requirements of the software system given above.\n\n{\"nodes\":[{\"id\":\"1722098794778\",\"type\":\"shape\",\"position\":{\"x\":759.2914835685135,\"y\":33.71378403752056},\"style\":{\"width\":200,\"height\":70},\"data\":{\"type\":\"circle\",\"contents\":\"Schedule Meeting\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722098802393\",\"type\":\"shape\",\"position\":{\"x\":839.9010241005961,\"y\":196.3174324465289},\"style\":{\"width\":42,\"height\":22},\"data\":{\"type\":\"capsule\",\"contents\":\"AND\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722098810842\",\"type\":\"shape\",\"position\":{\"x\":-58,\"y\":318},\"style\":{\"width\":200,\"height\":70},\"data\":{\"type\":\"circle\",\"contents\":\"Create a doodle\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722098814441\",\"type\":\"shape\",\"position\":{\"x\":768.3391862289268,\"y\":306.5871622326446},\"style\":{\"width\":200,\"height\":70},\"data\":{\"type\":\"circle\",\"contents\":\"Send Notifications\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722098833609\",\"type\":\"shape\",\"position\":{\"x\":1877.1419988634327,\"y\":293.3997595406479},\"style\":{\"width\":200,\"height\":70},\"data\":{\"type\":\"circle\",\"contents\":\"Close Doodle\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722099132707\",\"type\":\"shape\",\"position\":{\"x\":-420,\"y\":561},\"style\":{\"width\":200,\"height\":100},\"data\":{\"type\":\"hexagon\",\"contents\":\"Choose Date\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722099135871\",\"type\":\"shape\",\"position\":{\"x\":20,\"y\":450},\"style\":{\"width\":42,\"height\":22},\"data\":{\"type\":\"capsule\",\"contents\":\"AND\",\"color\":\"#438D57\"},\"selected\":false},{\"id\":\"1722099275085\",\"type\":\"shape\",\"position\":{\"x\":-53,\"y\":610},\"style\":{\"width\":200,\"height\":70},\"data\":{\"type\":\"circle\",\"contents\":\"Select Notification Mode\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722099811021\",\"type\":\"shape\",\"position\":{\"x\":328,\"y\":623},\"style\":{\"width\":200,\"height\":70},\"data\":{\"type\":\"circle\",\"contents\":\"Complete Creation\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722099842433\",\"type\":\"shape\",\"position\":{\"x\":-240,\"y\":850},\"style\":{\"width\":200,\"height\":70},\"data\":{\"type\":\"circle\",\"contents\":\"By Doodle Mailer\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722099855450\",\"type\":\"shape\",\"position\":{\"x\":138,\"y\":847},\"style\":{\"width\":200,\"height\":100},\"data\":{\"type\":\"hexagon\",\"contents\":\"By Public Link\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722099870284\",\"type\":\"shape\",\"position\":{\"x\":-239,\"y\":1166},\"style\":{\"width\":200,\"height\":100},\"data\":{\"type\":\"round-rectangle\",\"contents\":\"Improve Security\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722100347582\",\"type\":\"shape\",\"position\":{\"x\":438.72471925174,\"y\":892.8025481066534},\"style\":{\"width\":200,\"height\":100},\"data\":{\"type\":\"hexagon\",\"contents\":\"Send notification by doodle mailer\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722100419128\",\"type\":\"shape\",\"position\":{\"x\":442.73348716279287,\"y\":1185.4129933164807},\"style\":{\"width\":200,\"height\":100},\"data\":{\"type\":\"round-rectangle\",\"contents\":\"Fast Schedule\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722100448645\",\"type\":\"shape\",\"position\":{\"x\":1182.0481621076156,\"y\":574.4238405944556},\"style\":{\"width\":200,\"height\":70},\"data\":{\"type\":\"circle\",\"contents\":\"By Mail\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722100476994\",\"type\":\"shape\",\"position\":{\"x\":986.8705599459586,\"y\":847.5532806484971},\"style\":{\"width\":200,\"height\":70},\"data\":{\"type\":\"circle\",\"contents\":\"Insert Public Link\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722100479613\",\"type\":\"shape\",\"position\":{\"x\":1261.2944005404142,\"y\":721.2233596757515},\"style\":{\"width\":42,\"height\":22},\"data\":{\"type\":\"capsule\",\"contents\":\"AND\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722100495761\",\"type\":\"shape\",\"position\":{\"x\":1366.8705599459586,\"y\":825.3642391083165},\"style\":{\"width\":200,\"height\":100},\"data\":{\"type\":\"hexagon\",\"contents\":\"Send to potential participants\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false,\"measured\":{\"width\":200,\"height\":93},\"width\":200,\"height\":93,\"resizing\":false},{\"id\":\"1722100536096\",\"type\":\"shape\",\"position\":{\"x\":1670,\"y\":524.4238405944556},\"style\":{\"width\":200,\"height\":100},\"data\":{\"type\":\"hexagon\",\"contents\":\"Choose Schedule\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722100537527\",\"type\":\"shape\",\"position\":{\"x\":2105.305839918938,\"y\":522.2474407295592},\"style\":{\"width\":200,\"height\":100},\"data\":{\"type\":\"hexagon\",\"contents\":\"Send Confirmations by Doodle Mailer\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false},{\"id\":\"1722100559744\",\"type\":\"shape\",\"position\":{\"x\":1955.3058399189379,\"y\":440},\"style\":{\"width\":42,\"height\":22},\"data\":{\"type\":\"capsule\",\"contents\":\"AND\",\"color\":\"#438D57\"},\"selected\":false,\"dragging\":false}],\"edges\":[{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722098802393\",\"sourceHandle\":\"top\",\"target\":\"1722098794778\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722098802393top-1722098794778bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722098810842\",\"sourceHandle\":\"top\",\"target\":\"1722098802393\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722098810842top-1722098802393bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722098814441\",\"sourceHandle\":\"top\",\"target\":\"1722098802393\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722098814441top-1722098802393bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722098833609\",\"sourceHandle\":\"top\",\"target\":\"1722098802393\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722098833609top-1722098802393bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722099135871\",\"sourceHandle\":\"top\",\"target\":\"1722098810842\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722099135871top-1722098810842bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722099132707\",\"sourceHandle\":\"top\",\"target\":\"1722099135871\",\"targetHandle\":\"left\",\"id\":\"xy-edge__1722099132707top-1722099135871left\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722099275085\",\"sourceHandle\":\"top\",\"target\":\"1722099135871\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722099275085top-1722099135871bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722099811021\",\"sourceHandle\":\"top\",\"target\":\"1722099135871\",\"targetHandle\":\"right\",\"id\":\"xy-edge__1722099811021top-1722099135871right\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722099842433\",\"sourceHandle\":\"top\",\"target\":\"1722099275085\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722099842433top-1722099275085bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722099855450\",\"sourceHandle\":\"top\",\"target\":\"1722099275085\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722099855450top-1722099275085bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2,\"animation\":\"dashdraw 0s linear infinite\"},\"source\":\"1722099842433\",\"sourceHandle\":\"bottom\",\"target\":\"1722099870284\",\"targetHandle\":\"top\",\"id\":\"xy-edge__1722099842433bottom-1722099870284top\",\"selected\":false,\"animated\":true,\"data\":{\"animation\":\"dotted\",\"title\":\"+\"}},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2,\"animation\":\"dashdraw 0s linear infinite\"},\"source\":\"1722099855450\",\"sourceHandle\":\"bottom\",\"target\":\"1722099870284\",\"targetHandle\":\"right\",\"id\":\"xy-edge__1722099855450bottom-1722099870284right\",\"selected\":false,\"animated\":true,\"data\":{\"animation\":\"dotted\",\"algorithm\":\"straight\",\"title\":\"-\"}},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722100347582\",\"sourceHandle\":\"top\",\"target\":\"1722099811021\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722100347582top-1722099811021bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722100347582\",\"sourceHandle\":\"top\",\"target\":\"1722098814441\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722100347582top-1722098814441bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2,\"animation\":\"dashdraw 0s linear infinite\"},\"source\":\"1722100347582\",\"sourceHandle\":\"bottom\",\"target\":\"1722100419128\",\"targetHandle\":\"top\",\"id\":\"xy-edge__1722100347582bottom-1722100419128top\",\"selected\":false,\"animated\":true,\"data\":{\"animation\":\"dotted\",\"title\":\"+\"}},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722100448645\",\"sourceHandle\":\"top\",\"target\":\"1722098814441\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722100448645top-1722098814441bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2,\"animation\":\"dashdraw 0s linear infinite\"},\"source\":\"1722100448645\",\"sourceHandle\":\"bottom\",\"target\":\"1722100419128\",\"targetHandle\":\"right\",\"id\":\"xy-edge__1722100448645bottom-1722100419128right\",\"selected\":false,\"animated\":true,\"data\":{\"animation\":\"dotted\",\"title\":\"-\",\"algorithm\":\"straight\"}},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722100479613\",\"sourceHandle\":\"top\",\"target\":\"1722100448645\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722100479613top-1722100448645bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722100476994\",\"sourceHandle\":\"top\",\"target\":\"1722100479613\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722100476994top-1722100479613bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722100495761\",\"sourceHandle\":\"top\",\"target\":\"1722100479613\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722100495761top-1722100479613bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722100559744\",\"sourceHandle\":\"top\",\"target\":\"1722098833609\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722100559744top-1722098833609bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722100536096\",\"sourceHandle\":\"top\",\"target\":\"1722100559744\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722100536096top-1722100559744bottom\"},{\"type\":\"editable-edge\",\"style\":{\"strokeWidth\":2},\"source\":\"1722100537527\",\"sourceHandle\":\"top\",\"target\":\"1722100559744\",\"targetHandle\":\"bottom\",\"id\":\"xy-edge__1722100537527top-1722100559744bottom\"}]}`
                        },
                    ],
                },
            ],
        });
        const result = await chatSession.sendMessage("Generate the response and it must be JSON");
        try {
            if (JSON.parse(result.response.text())) {
                diagram.uploadJson(result.response.text());
            }
        } catch (e) {
            console.log(e);
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
