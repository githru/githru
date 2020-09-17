import * as colors from "@material-ui/core/colors";
import * as d3 from "d3";

export const BranchColors = {
    MAIN_STEM: colors.blue[900],
    EXPLICIT: colors.cyan[700],
    IMPLICIT: colors.grey[400],
    PR_MERGED: colors.purple[600],
    PR_CLOSED: colors.pink[600],
    PR_OPEN: colors.green[300],
};

// const colorRange = d3.range(5, 0, -1);

const getListOfColors = (color) => {
    // let colorRange = [7, 4, 2, 1].map(d => d * 100);
    let colorRange = ["A700", 600, 400, 200, 100];
    return colorRange.map(d => color[d]);
}

export const AttributeColors = {
    author: getListOfColors(colors.brown),
    keyword: getListOfColors(colors.teal),
    commitType: getListOfColors(colors.lightGreen),
    file: getListOfColors(colors.amber),
    dir: getListOfColors(colors.orange),
    // commit: [
    //     "#90a4ae",
    //     "#b0bec5",
    //     "#cfd8dc",
    //     "#eceff1",
    //     "#78909c",
    // ],
    commit: [600, 400, 300, 200, 100].map(d => colors.blueGrey[d]),
    date: [
        "#90a4ae",
        "#b0bec5",
        "#cfd8dc",
        "#eceff1",
        "#78909c",
    ],
    highlight: getListOfColors(colors.red),
}

const ScoreColorMap = {
    author: AttributeColors.author,
    commitDate: AttributeColors.date,
    file: AttributeColors.file,
    message: AttributeColors.keyword,
    commitType: AttributeColors.commitType,
}

export function getScoreColor(name, colorIndex) {
    return ScoreColorMap[name][colorIndex];
}

export function changeRGBColorByOpacity(color, opacity) {
    let c = d3.rgb(color);
    return "rgb(" + c.r + "," + c.g + "," + c.b + ", " + opacity + ")";
}

// export const ClusterColorMap = {
//     master: colors.blue[900],
//     // stale: blueGrey[400],
//     implicit: colors.grey[400],
//     staleAndImplicit: colors.blueGrey[600],
// }

export const Tableau10 = ["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"];
