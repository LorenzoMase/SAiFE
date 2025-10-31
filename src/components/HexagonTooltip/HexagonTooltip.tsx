import { useState, useEffect } from 'react';
import { Code, GitBranch } from 'react-feather';

interface HexagonTooltipProps {
    nodeId: string;
    taskName: string;
    position: { x: number; y: number };
    onGenerateCode: (taskName: string) => void;
    onGenerateGraph: (taskName: string) => void;
    onClose: () => void;
    hasCode?: boolean;
    hasGraph?: boolean;
}

const HexagonTooltip = ({ 
    nodeId, 
    taskName, 
    position, 
    onGenerateCode, 
    onGenerateGraph,
    onClose,
    hasCode = false,
    hasGraph = false
}: HexagonTooltipProps) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        setVisible(true);
    }, [nodeId]);

    if (!visible) return null;

    return (
        <div
            className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, -120%)',
            }}
            onMouseLeave={onClose}
        >
            <div className="flex flex-col gap-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-center">
                    {taskName}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            onGenerateCode(taskName);
                            onClose();
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
                        title={hasCode ? "Show generated code" : "Generate code for this task"}
                    >
                        <Code size={16} />
                        <span>{hasCode ? "Show Code" : "Generate Code"}</span>
                    </button>
                    <button
                        onClick={() => {
                            onGenerateGraph(taskName);
                            onClose();
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        title={hasGraph ? "Show generated graph" : "Generate sub-graph for this task"}
                    >
                        <GitBranch size={16} />
                        <span>{hasGraph ? "Show Graph" : "Generate Graph"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HexagonTooltip;
