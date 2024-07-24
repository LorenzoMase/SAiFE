import {type ShapeProps} from ".";

function Circle({width, height, ...svgAttributes}: ShapeProps) {
    return (
        <rect
            x={0}
            y={0}
            rx={100}
            width={width}
            height={height}
            {...svgAttributes}
        />
    );
}

export default Circle;
