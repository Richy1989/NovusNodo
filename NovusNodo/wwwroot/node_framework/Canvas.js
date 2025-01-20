import { Node } from "./Node.js";
import { Link } from "./Link.js";

export class Canvas {

    isDarkMode = false;
    nodeList = [];
    linkList = [];
    tempLine = null
    selectedLink = null;
    selectedNode = null;
    isSelecting = false;
    isLinking = false;
    tempSelectRect = null;

    dragMultipleSelection = [];
    isMultiNodeDragging = false;

    /**
     * Creates an instance of Canvas.
     * @param {string} id - The unique identifier for the canvas.
     */
    constructor(id, width, height) {
        this.height = height;
        this.id = id;
        this.width = width;
        this.nodes = [];
        this.svg = this.createSvg();
        this.init();
    }

    getLinkColor() {
        return this.isDarkMode ? "white" : "#778899";
    }

    getNodeStrokeColor() {
        return this.isDarkMode ? "#f0ead6" : "black";
    }

    getBackgroundColor() {
        return this.isDarkMode ? "#1a1a1a" : "#f0ead6";
    }

    createSvg() {
        let localSVG = d3.select('[id=\"' + this.id + '\"]')
            .attr("width", this.width)
            .attr("height", this.height)
            .style("background-color", this.getBackgroundColor())
            .style("border", "1px solid black");

        // Grid configuration
        const rows = Math.ceil(this.height / 20);
        const cols = Math.ceil(this.width / 20);
        const spacing = 20; // Distance between dots
        const dotRadius = 0.5;

        // Generate grid data
        const gridData = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                gridData.push({
                    x: col * spacing,
                    y: row * spacing
                });
            }
        }

        // Draw the dots
        localSVG.selectAll("circle")
            .data(gridData)
            .enter()
            .append("circle")
            .attr("cx", d => d.x + spacing / 2)
            .attr("cy", d => d.y + spacing / 2)
            .attr("r", dotRadius)
            .style("fill", "steelblue");

        return localSVG;
    }

    init() {
        const canvas = this;
        this.svg.on("pointerup", function (event) {
            if (!canvas.isLinking) {
                return;
            }
            canvas.isLinking = false;
            const svgNode = canvas.svg.node(); // Get the underlying DOM element
            const svgRect = svgNode.getBoundingClientRect();

            const svgX = svgRect.x; // X position of the SVG element
            const svgY = svgRect.y; // Y position of the SVG element

            canvas.isLinking = false;

            if (canvas.tempLine) {
                canvas.tempLine.remove();
                canvas.tempLine = null;
            }

            console.log("Mouse up", event.x, event.y);

            for (let i = 0; i < canvas.nodeList.length; i++) {
                const node = canvas.nodeList[i];
                const inputPort = canvas.nodeList[i].inputPort;

                let inputPortX = inputPort.x;
                let inputPortY = inputPort.y;

                const portX = parseFloat(node.x) + parseFloat(inputPortX);
                const portY = parseFloat(node.y) + parseFloat(inputPortY);

                let mouseX = event.x - svgX;
                let mouseY = event.y - svgY;

                if (mouseX > portX && mouseX < portX + 10 && mouseY > portY && mouseY < portY + 10) {
                    canvas.addLink(canvas.sourcePort, inputPort);
                    canvas.drawLinks();
                    break;
                }
            }
            canvas.svg.on("pointermove", null);
        });

        // Add pointerdown event listener to the SVG element for the selection rectangle
        this.svg.on("pointerdown", function (event) {            
            // Check if the target is the SVG element itself
            if (event.target.tagName === 'svg') {
                console.log("Mouse down on SVG", event.x, event.y);
            
                canvas.svg.on("pointermove", null);
                canvas.resetAllColors();
                canvas.dragMultipleSelection = []; 

                if(canvas.tempSelectRect)
                    canvas.tempSelectRect.remove();
                
                canvas.isSelecting = true;

                const startX = event.x;
                const startY = event.y;

                canvas.tempSelectRect = canvas.svg.append("rect")
                    .attr("x", startX)
                    .attr("y", startY)
                    .attr("class", "select-rect")
                    .attr("width", 1)
                    .attr("height", 1)

                    // Add pointermove event listener to the SVG element for the selection rectangle
                    canvas.svg.on("pointermove", function (event) {
                        if (canvas.tempSelectRect && canvas.isSelecting) {
                            const [x, y] = d3.pointer(event);
                            const width = x - startX;
                            const height = y - startY;

                            canvas.tempSelectRect
                                .attr("x", Math.min(x, startX))
                                .attr("y", Math.min(y, startY))
                                .attr("width", Math.abs(width))
                                .attr("height", Math.abs(height));
                        }
                    });
            }
        });

        d3.select("body").on("keydown", function (event) {
            if (event.key === "Delete") {
                canvas.deleteSelection();
            }
        });

        // Add global pointerup event listener to remove the selection rectangle
        // and mark all selected nodes
        window.addEventListener("pointerup", (event) => {
            canvas.isSelecting = false;
            if (canvas.tempSelectRect) {

                // Find all nodes within the selection rectangle
                const selectRect = canvas.tempSelectRect.node().getBBox();
                canvas.dragMultipleSelection = canvas.nodeList.filter(node => {
                    const nodeX = parseFloat(node.x);
                    const nodeY = parseFloat(node.y);
                    const nodeWidth = parseFloat(node.width);
                    const nodeHeight = parseFloat(node.height);

                    return (
                        nodeX >= selectRect.x &&
                        nodeY >= selectRect.y &&
                        nodeX + nodeWidth <= selectRect.x + selectRect.width &&
                        nodeY + nodeHeight <= selectRect.y + selectRect.height
                    );
                });
                
                // Mark all selected nodes
                canvas.dragMultipleSelection.forEach((d) => d.markAsSelected());   

                canvas.svg.on("pointermove", null);
                canvas.tempSelectRect.remove();
                canvas.tempSelectRect = null;                
            }
        });
    }

    addNode(node) {
        const canvas = this;
        node.outputPort.port.on("pointerdown", function (event) {
            const transform = d3.select(event.target.parentNode).attr("transform");
            const translateParent = transform.match(/translate\(([^,]+),([^\)]+)\)/);

            const portCenterX = parseFloat(translateParent[1]) + parseFloat(d3.select(event.target).attr("x")) + node.outputPort.width / 2;
            const portCenterY = parseFloat(translateParent[2]) + parseFloat(d3.select(event.target).attr("y")) + node.outputPort.height / 2;

            console.log("Mouse down", portCenterX, portCenterY);
            canvas.isLinking = true;
            canvas.sourcePort = node.outputPort;//d3.select(event.target);
            canvas.tempLine = canvas.svg.append("line")
                .attr("x1", portCenterX)
                .attr("y1", portCenterY)
                .attr("x2", event.x)
                .attr("y2", event.y)
                .attr("stroke", canvas.getLinkColor())
                .attr("stroke-width", 3);

            canvas.svg.on("pointermove", function (event) {
                if (canvas.isLinking && canvas.tempLine) {
                    const [x, y] = d3.pointer(event);
                    canvas.tempLine.attr("x2", x).attr("y2", y);
                }
            });
        });

        // Add pointerdown event listener to move all selected nodes
        node.group.on("pointerdown", function (event) {
            if (canvas.dragMultipleSelection.includes(node)) {
                canvas.isMultiNodeDragging = true;
                const initialPositions = canvas.dragMultipleSelection.map(node => ({
                    node: node,
                    startX: parseFloat(node.x),
                    startY: parseFloat(node.y)
                }));

                const startX = event.x;
                const startY = event.y;

                canvas.svg.on("pointermove", function (event) {
                    const dx = event.x - startX;
                    const dy = event.y - startY;

                    initialPositions.forEach(pos => {
                        pos.node.x = pos.startX + dx;
                        pos.node.y = pos.startY + dy;
                        pos.node.updatePosition(pos.node.x, pos.node.y);//group.attr("transform", `translate(${pos.node.x},${pos.node.y})`);
                    });
                });

                window.addEventListener("pointerup", function () {
                    canvas.svg.on("pointermove", null);
                    canvas.isMultiNodeDragging = false;
                }, { once: true });
            }
        });

        this.nodeList.push(node);
    }
    /**
     * Adds a link between two ports.
     * @param {Port} sourcePort - The source port.
     * @param {Port} targetPort - The target port.
     */
    addLink(sourcePort, targetPort) {

        const link = new Link(crypto.randomUUID(), sourcePort, targetPort);
        console.log("Adding link:", link.id, sourcePort, targetPort);
        sourcePort.connectedLinks.push(link);
        targetPort.connectedLinks.push(link);
        this.linkList.push(link);
    }
    /**
     * Draws all the links on the canvas.
     */
    drawLinks() {

        var lines = this.svg.selectAll("line").data(this.linkList, (d) => d.id);
        lines.join("line")
            .attr("class", "link")
            .attr("id", (d) => d.id)
            .attr("x1", (d) => d.sourcePort.node.x + d.sourcePort.x + 5)
            .attr("y1", (d) => d.sourcePort.node.y + d.sourcePort.y + 5)
            .attr("x2", (d) => d.targetPort.node.x + d.targetPort.x + 5)
            .attr("y2", (d) => d.targetPort.node.y + d.targetPort.y + 5)
            .attr("stroke", this.getLinkColor())
            .on("click", (event, link) => {
                console.log("Selected link", event, link);
                console.log("Selected This", this);
                this.resetAllColors();
                this.selectedLink = link;
                this.svg.select('[id=\"' + link.id + '\"]').attr("stroke", "orange");
            });
    }

    resetAllColors() {
        this.selectedLink = null;
        this.selectedNode = null;

        for (let i = 0; i < this.linkList.length; i++) {
            const link = this.linkList[i];
            this.svg.select('[id=\"' + link.id + '\"]').attr("stroke", this.getLinkColor());
        }

        for (let i = 0; i < this.nodeList.length; i++) {
            const node = this.nodeList[i];
            this.svg.select('[id=\"' + node.id + '\"]').attr("stroke", this.getNodeStrokeColor());
        }
    }

    deleteSelection() {
        if (this.selectedLink) {
            console.log("Deleting link", this.selectedLink.id);
            // Remove the link from the SVG
            this.linkList = this.linkList.filter(link => link.id !== this.selectedLink.id);
            this.drawLinks();

            // Remove the link from the connected links list of the source and target ports
            this.selectedLink.sourcePort.connectedLinks = this.selectedLink.sourcePort.connectedLinks.filter(link => link.id !== this.selectedLink.id);
            this.selectedLink.targetPort.connectedLinks = this.selectedLink.targetPort.connectedLinks.filter(link => link.id !== this.selectedLink.id);
            this.selectedLink = null;
        }

        if (this.selectedNode) {
            console.log("Deleting node", this.selectedNode.id);
            this.nodeList = this.nodeList.filter(node => node.id !== this.selectedNode.id);
            // Remove the node from the SVG
            this.selectedNode.removeNode();

            // Remove all links connected to the node
            let connectedLinksInput = this.selectedNode.inputPort.connectedLinks;
            let connectedLinksOutput = this.selectedNode.outputPort.connectedLinks;
            this.linkList = this.linkList.filter(link => !connectedLinksInput.includes(link) && !connectedLinksOutput.includes(link));
            this.drawLinks();

            this.selectedNode = null;
        }
    }
}