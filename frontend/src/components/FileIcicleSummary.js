import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3';
import FileStructureAnalyzer from './analyzer/FileStructureAnalyzer'
import { useSelector } from 'react-redux';
import { AttributeColors } from "./ColorClasses"
import Select from '@material-ui/core/Select'

const FileIcicleSummary = props => {

    const { width, height, rawModLocData, rawInsertLocData, rawDeleteLocData, rawModNumData, file2Author, pageNum } = props;
    const { summaryByLOC, hideFiles } = useSelector(state => state.summaryParameters);

    console.log(file2Author);

    let partition = data => {
        const root = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.height - a.height || b.value - a.value);
        return d3.partition()
            .size([height, ((root.height + 1) * width / pageNum)])
            (root);
    }

    let format = d3.format(",d")

    function rectHeight(d) {
        return (d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2));
    }
    function labelVisible(d) {
        return ((d.x1 - d.x0) > 16);
    }

    let focus = useRef();
    let root = useRef();

    let currentCLocMode = useRef("sum");

    useEffect(() => {
        const svg = d3.select("#icicleSvg");
        svg.selectAll("g").remove();

        let fileAnalyzer;
        // console.log("rawData", rawModLocData, rawInsertLocData, rawDeleteLocData);

        if (summaryByLOC) {
            let rawModData;
            switch(currentCLocMode.current) {
                case "sum" : rawModData = rawModLocData; break;
                case "insertion" : rawModData = rawInsertLocData; break;
                case "deletion" : rawModData = rawDeleteLocData; break;
            }
            fileAnalyzer = new FileStructureAnalyzer(rawModData, hideFiles, file2Author);
        }
        else
            fileAnalyzer = new FileStructureAnalyzer(rawModNumData, hideFiles, file2Author);

        let data = fileAnalyzer.getFileStructure();

        // function rectHeight(d) {
        //     return (d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2));
        // }

        function clicked(p) {
            try {
                focus.current = focus.current === p ? p = p.parent : p;

                let widthScale;
                let curHeight = focus.current.height + 1;
                if (focus.current.data.name === "project") curHeight--;
                if (curHeight < pageNum)
                    widthScale = pageNum / curHeight;
                else
                    widthScale = 1;

                let isRoot = false;
                if (focus.current.data.name === "project")
                    isRoot = true;
                if (isRoot) {
                    root.current.each(d => d.target = {
                        x0: ((d.x0 - p.x0) / (p.x1 - p.x0) * height),
                        x1: ((d.x1 - p.x0) / (p.x1 - p.x0) * height),
                        y0: ((d.y0 - p.y0) - width / pageNum),
                        y1: ((d.y1 - p.y0) - width / pageNum)
                    });
                }
                else {
                    root.current.each(d => d.target = {
                        x0: ((d.x0 - p.x0) / (p.x1 - p.x0) * height),
                        x1: ((d.x1 - p.x0) / (p.x1 - p.x0) * height),
                        y0: (d.y0 - p.y0),
                        y1: (d.y1 - p.y0)
                    });
                }
                let cell = d3.selectAll(".icicleTreeCells");
                let rect = d3.selectAll(".icicleTreeRects");
                let text = d3.selectAll(".icicleTreeTexts");
                let tspan = d3.selectAll(".icicleTreeTspans")


                // console.log(widthScale);
                const t = cell.transition().duration(750)
                    .attr("transform", d => `translate(${d.target.y0 * widthScale},${d.target.x0})`);

                rect.transition(t).attr("height", d => rectHeight(d.target))
                    .attr("width", d => (d.y1 - d.y0 - 1) * widthScale);
                text.transition(t).attr("fill-opacity", d => labelVisible(d.target) ? 1 : 0);
                tspan.transition(t).attr("fill-opacity", d => labelVisible(d.target) ? 0.7 : 0);
            } catch (e) {
                console.log("debugging");
            }
        }

        root.current = partition(data);
        focus.current = root.current;
        // console.log(focus);

        let widthScale;
        let curHeight = focus.current.height;
        if (curHeight < pageNum)
            widthScale = pageNum / curHeight;
        else
            widthScale = 1;

        const cell = svg.selectAll("g")
            .data(root.current.descendants())
            .join("g")
            .attr("class", "icicleTreeCells")
            .attr("transform", d => `translate(${(d.y0 - width / pageNum) * widthScale},${d.x0})`)
            .attr("id", d => d.data.name);

        const rect = cell.append("rect")
            .attr("width", d => (d.y1 - d.y0 - 1) * widthScale)
            .attr("height", d => rectHeight(d))
            .attr("class", "icicleTreeRects")
            .style("fill", d => {
                if (d.data.value !== undefined) return AttributeColors.file[3];
                else return AttributeColors.dir[3];
            })
            .style("cursor", "pointer")
            .style("stroke-width", "0px")
            .on("click", clicked)

        const text = cell.append("text")
            .attr("class", "icicleTreeTexts")
            .style("user-select", "none")
            .attr("pointer-events", "none")
            .attr("x", 4)
            .attr("y", 13)
            .style("font-weight", 400)
            .attr("fill-opacity", d => labelVisible(d) ? 1 : 0)
            .style("overflow", "visible");

        text.append("tspan")
            .text(d => {
                if (d.data.children !== undefined)
                    return d.data.name + "/";
                else
                    return d.data.name;
            });

        const tspan = text.append("tspan")
            .attr("class", "icicleTreeTspans")
            .attr("fill-opacity", d => labelVisible(d) ? 0.7 : 0)
            .text(d => ` ${format(d.value)}`);

        let title = cell.append("title")

        title.append("tspan").text(d => {
            if (d.data.children !== undefined)
                return d.data.name + "/" + "\n";
            else
                return d.data.name + "\n";
        })
        title.append("tspan").text(d => {
            if (summaryByLOC) return `${format(d.value)}` + " lines modified\n"
            else return `${format(d.value)}` + " times touched\n"
        })

        title.append("tspan").text(d => {
            let authors = d.data.authors;

            let authorArray = [];

            if(summaryByLOC) {
                if(currentCLocMode.current == "sum") {
                    for(let author in authors) 
                        authorArray.push([author, authors[author].insertions + authors[author].deletions]);
                }
                else if(currentCLocMode.current == "insertion") {
                    for(let author in authors) 
                        authorArray.push([author, authors[author].insertions]);
                }
                else {  // if deletion
                    for(let author in authors) 
                        authorArray.push([author, authors[author].deletions]);
                }
            }
            else {
                for(let author in authors) 
                    authorArray.push([author, authors[author].count]);
            }


            authorArray.sort((a, b) => b[1] - a[1]);

            let message = "  ";
            authorArray.forEach(node => {
                message = message + "\n  " + node[0] + " :: " + node[1];
            })
            // console.log(message);

            return "Contributors:" + message;
        })
    }, [
        summaryByLOC, hideFiles, rawModLocData, rawModNumData, file2Author
    ])

    function updateLOCType(event) {
        let rawData;
        switch (event.target.value) {
            case "sum": rawData = rawModLocData; break;
            case "insertion": rawData = rawInsertLocData; break;
            case "deletion": rawData = rawDeleteLocData; break;
        }
        
        switch (event.target.value) {
            case "sum": currentCLocMode.current = "sum"; break;
            case "insertion": currentCLocMode.current = "insertion"; break;
            case "deletion": currentCLocMode.current = "deletion"; break;
        }

        let fileAnalyzer = new FileStructureAnalyzer(rawData, hideFiles, file2Author);
        let data = fileAnalyzer.getFileStructure();
        root.current = partition(data);
        focus.current = root.current;

        let widthScale;
        let curHeight = focus.current.height;
        if (curHeight < pageNum)
            widthScale = pageNum / curHeight;
        else
            widthScale = 1;


        let rootData = root.current.descendants();

        let cell = d3.selectAll(".icicleTreeCells")
            .data(rootData)
            .join();

        const t = cell.transition()
            .duration(750)
            .attr("transform", d => `translate(${(d.y0 - width / pageNum) * widthScale},${d.x0})`)
            .attr("id", d => d.data.name);

        // console.log(rootData);
        // console.log(cell.select("rect"));

        cell.select("rect")
            .transition()
            .duration(750)
            .attr("width", d => (d.y1 - d.y0 - 1) * widthScale)
            .attr("height", d => {
                return rectHeight(d)
            })
            .style("fill", d => {
                if (d.data.value !== undefined) return AttributeColors.file[3];
                else return AttributeColors.dir[3];
            })

        let text = cell.select("text")
            .style("user-select", "none")
            .attr("pointer-events", "none")
            .attr("x", 4)
            .attr("y", 13)
            .style("font-weight", 400)
            .attr("fill-opacity", d => labelVisible(d) ? 1 : 0)
            .style("overflow", "visible");

        text.selectAll("tspan").remove();
        text.append("tspan")
            .text(d => {
                if (d.data.children !== undefined)
                    return d.data.name + "/";
                else
                    return d.data.name;
            });

        text.append("tspan")
            .attr("class", "icicleTreeTspans")
            .attr("fill-opacity", d => labelVisible(d) ? 0.7 : 0)
            .text(d => ` ${format(d.value)}`);

        cell.selectAll("title").remove();

        let title = cell.append("title");

        title.append("tspan").text(d => {
            if (d.data.children !== undefined)
                return d.data.name + "/" + "\n";
            else
                return d.data.name + "\n";
        });
        title.append("tspan").text(d => {
            let str;
            switch (event.target.value) {
                case "sum": str = " lines modified\n"; break;
                case "insertion": str = " lines inserted\n"; break;
                case "deletion": str = " lines deleted\n"; break;
            }
            return (`${format(d.value)}` + str);
        });

        title.append("tspan").text(d => {
            let authors = d.data.authors;

            let authorArray = [];

            if(summaryByLOC) {
                if(currentCLocMode.current == "sum") {
                    for(let author in authors) 
                        authorArray.push([author, authors[author].insertions + authors[author].deletions]);
                }
                else if(currentCLocMode.current == "insertion") {
                    for(let author in authors) 
                        authorArray.push([author, authors[author].insertions]);
                }
                else {  // if deletion
                    for(let author in authors) 
                        authorArray.push([author, authors[author].deletions]);
                }
            }
            else {
                for(let author in authors) 
                    authorArray.push([author, authors[author].count]);
            }

            authorArray.sort((a, b) => b[1] - a[1]);

            let message = "  ";
            authorArray.forEach(node => {
                message = message + "\n  " + node[0] + " :: " + node[1];
            })

            return "Contributors:" + message;
        });
    }

    return (
        <div>
            {summaryByLOC &&
                <Select
                    id={"icicleTreeLocSelector"}
                    style={{ width: "90px", fontSize: "12px", height: "12px" }}
                    onChange={updateLOCType}
                    native
                >
                    <option value="sum">Sum</option>
                    <option value="insertion">Insertion</option>
                    <option value="deletion">Deletion</option>
                </Select>
            }
            <svg
                id="icicleSvg"
                width={width}
                height={summaryByLOC ? height - 18 : height}
            ></svg>
        </div>
    );
}

export default FileIcicleSummary;