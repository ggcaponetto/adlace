import {useEffect, useState} from "react";

export default function Home(props) {
    const [width, setWidth] = useState(10);
    const [height, setHeight] = useState(200);
    const [containers, setContainers] = useState(null);

    useEffect(() => {
        function setGrid(){
            let containers = [];
            Array(width).fill(0).map((val, i) => i).forEach((widthPosition) => {
                Array(height).fill(0).map((val, i) => i).forEach((heightPosition) => {
                    console.log(`constructing spot: ${widthPosition} x ${heightPosition}`);
                    let randomColor = Math.floor(Math.random() * 16777215).toString(16);
                    let topContainer = window.document.getElementById("top-container");
                    const style = {
                        minWidth: `${10}px`,
                        width: `${Math.floor(topContainer.offsetWidth / width)}px`,
                        minHeight: `${10}px`,
                        height: `${Math.floor(topContainer.offsetHeight / height)}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `#${randomColor}`,
                        fontSize: `0.5em`
                    }
                    const container =
                        <div
                            key={`${widthPosition}_${heightPosition}`}
                            className={`${widthPosition}_${heightPosition}`}
                            style={style}
                        >
                            {`${widthPosition}_${heightPosition}`}
                        </div>;
                    containers.push(container);
                });
            });
            setContainers(containers);
        }
        setGrid();
        window.addEventListener("resize", setGrid);
    }, [])
    return (
        <div
            id={"top-container"}
            style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexWrap: "wrap",
        }}>
            {containers || "No containers"}
        </div>
    )
}