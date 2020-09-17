import * as d3 from 'd3';
import WordCloud from 'wordcloud';

function processKey(word) {
    if (word === undefined) return word;
    return word.replace(/[`~! @#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    // return replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(word, ".", ""), ">", ""), "=", ""), "}", ""), "{", ""), " ", ""), "/", "");
}

let color = {
    a: "rgb(255, 182, 182)",
    b: "#78e5cb",
    inter: "rgb(119, 122, 216)"
}


export class KeywordCloud {

    static generate(aList, bList, interList, canvas1, canvas2, weightFactor, changeOpacity, min, max) {

        
        console.log(aList, bList);
        console.log(interList);

        console.log(document.getElementById(canvas1));

        let aMin = aList[0][1];
        let aMax = aList[0][1];
        let bMin = bList[0][1];
        let bMax = bList[0][1];

        aList.forEach(node => {
            if(node[1] > aMax) aMax = node[1];
            if(node[1] < aMin) aMin = node[1];
        })
        bList.forEach(node => {
            if(node[1] > bMax) bMax = node[1];
            if(node[1] < bMin) bMin = node[1];
        })

        aList.forEach(node => {
            node[1] = ((node[1] - aMin) / (aMax - aMin)) * (max - min) + min;
        })
        bList.forEach(node => {
            node[1] = ((node[1] - bMin) / (bMax - bMin)) * (max - min) + min;
        })
        // normalize to min < < max


        WordCloud(document.getElementById(canvas1), {
            list: aList,
            wait: 0,
            rotateRatio: 0,
            weightFactor: weightFactor,
            color: function(word) {
                if(interList.includes(word)) return color.inter;
                else return color.a;
            },
            classes: function(word) {
                return "wordCloud wordCloud_" + processKey(word); 
            },
            hover: function(item, dimension, event) {
                if(item !== undefined) {
                    d3.selectAll(".wordCloud")
                      .style("font-weight", "300")
                      .style("opacity", changeOpacity);
                    d3.selectAll(".wordCloud_" + processKey(item[0]))
                      .style("font-weight", "900")
                      .style("opacity", 1);
                }
            }
        });


        WordCloud(document.getElementById(canvas2), {
            list: bList,
            wait: 0,
            rotateRatio: 0,
            weightFactor: weightFactor,
            color: function(word) {
                if(interList.includes(word)) return color.inter;
                else return color.b;
            },
            classes: function(word) {
                return "wordCloud wordCloud_" + processKey(word); 
            },
            hover: function(item, dimension, event) {
                if(item !== undefined) {
                    d3.selectAll(".wordCloud")
                    .style("font-weight", "300")
                    .style("opacity", changeOpacity);
                    d3.selectAll(".wordCloud_" + processKey(item[0]))
                    .style("font-weight", "900")
                    .style("opacity", 1);
                }
            }
        });

        d3.select("#" + canvas1)
        .on("mouseleave", function(d) {
            d3.selectAll(".wordCloud")
            .style("font-weight", 300)
            .style("opacity", 1);
        })
        .style("position", "absolute");

        d3.select("#" + canvas2)
        .on("mouseleave", function(d) {
            d3.selectAll(".wordCloud")
            .style("font-weight", 300)
            .style("opacity", 1);
        })
        .style("position", "absolute");
    }
}

export default KeywordCloud;