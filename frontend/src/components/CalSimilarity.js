import { intersection, union } from "lodash";

export function getScoreTemp(a, b, verbose = false) {
    function getFileList(commit) {
        if ("diffStat" in commit && "files" in commit.diffStat) {
            return Object.keys(commit["diffStat"]["files"]);
        } else {
            return [];
        }
    }

    function getJaccardSimilarity(a, b, test) {
        a = (!(a instanceof Array) ? [a] : a);
        b = (!(b instanceof Array) ? [b] : b);

        let intersectionLen = intersection(a, b).length;
        let unionLen = union(a, b).length;

        return (unionLen !== 0 ? (intersectionLen / unionLen) : 1);
    }

    function getTfidfCosineSimilarity(a,b) {
        let aVector = a;
        let bVector = b;

        if ("-1" in aVector || "-1" in bVector) return 0;
        
        let aKeys = Object.keys(aVector);
        let bKeys = Object.keys(bVector);

        let innerProduct = 0;
        while (aKeys.length > 0 && bKeys.length > 0) {
            if      (aKeys[0] < bKeys[0]) { aKeys.shift(); }
            else if (aKeys[0] > bKeys[0]) { bKeys.shift(); }
            else {
                innerProduct = innerProduct + aVector[aKeys[0]] * bVector[bKeys[0]];
                aKeys.shift();
                bKeys.shift();
            }
        }

        let aLengthSqr = 0, bLengthSqr = 0;

        Object.keys(aVector).forEach(k => {
            aLengthSqr += aVector[k] * aVector[k];
        })

        Object.keys(bVector).forEach(k => {
            bLengthSqr += bVector[k] * bVector[k];
        })

        let cosine_sim = innerProduct / Math.sqrt(aLengthSqr * bLengthSqr);
        return cosine_sim;
    }

    let score = {}

    // committer
    // score["committer"] = (a.author === b.author ? 1 : 0);
    score["author"] = getJaccardSimilarity(a.author, b.author, "author");
    // commit type
    score["commitType"] = getJaccardSimilarity(a.commitType, b.commitType, "type");
    // file
    score["file"] = getJaccardSimilarity(getFileList(a), getFileList(b), "file");
    // message
    score["message"] = getTfidfCosineSimilarity(a["tfidf"], b["tfidf"]);

    return score;
}