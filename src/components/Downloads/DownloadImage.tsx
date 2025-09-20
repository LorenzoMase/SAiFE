import React from "react";
import {
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { IoMdPhotos } from "react-icons/io";

const downloadImage = (dataUrl: string) => {
  const a = document.createElement("a");

  a.setAttribute("download", "DiagramX.png");
  a.setAttribute("href", dataUrl);
  a.click();
};

const imageWidth = 1600;
const imageHeight = 1200;

export const DownloadImageButton = (props: { useDiagram: any }) => {
  const { getNodes } = useReactFlow();
  const onClick = () => {
    props.useDiagram.deselectAll();
    // we calculate a transform for the nodes so that all nodes are visible
    // we then overwrite the transform of the `.react-flow__viewport` element
    // with the style option of the html-to-image library
    const nodesBounds = getNodesBounds(getNodes());
    
    const margin = 100;
    const nodesBoundsWithMargin = {
    x: nodesBounds.x - margin,
    y: nodesBounds.y - margin,
    width: nodesBounds.width + margin * 2,
    height: nodesBounds.height + margin * 2,
    };
    
    const transform = getViewportForBounds(
      nodesBoundsWithMargin,
      imageWidth,
      imageHeight,
      0.5,
      2,
      0.2
    );

    setTimeout(() => {
      toPng(document.querySelector(".react-flow__viewport") as HTMLElement, {
        backgroundColor: "white",
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}`,
          height: `${imageHeight}`,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
        },
      }).then(downloadImage);
    }, 1000);
  };

  return (
    <button
      className="w-full dark:text-white dark:hover:bg-slate-800 hover:bg-gray-200 rounded-md p-1 flex flex-row gap-1 justify-between items-center"
      onClick={onClick}
    >
      Download PNG
      <IoMdPhotos />
    </button>
  );
};

export default DownloadImageButton;
