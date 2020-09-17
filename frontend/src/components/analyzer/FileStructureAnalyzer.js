
export class FileStructureAnalyzer {
    constructor(rawData, hideFiles, file2Author) {



        this.fileStructure = {
            "name" : "project",
            "children" : []
        }
        this.hideFiles = hideFiles;

        // console.log(this.fileStructure);

        //console.log(rawData);

        console.log(file2Author);


        for (let path in rawData) {

            //console.log(this.fileStructure);

            this.analyzePath(path, rawData[path], this.fileStructure["children"], file2Author[path])

        }
        // console.log(this.fileStructure);

        this.compressStructure(this.fileStructure);
        this.updateAuthorInfo(this.fileStructure);

        console.log(this.fileStructure);

        // console.log(this.fileStructure);

    }


    analyzePath(path, score, root, author) {
        let pathDirectories = path.split("/");
        let fileName = pathDirectories[pathDirectories.length - 1];
        if(this.hideFiles.includes(fileName)) return;

       // console.log(path, score, root, author);

        //let size = root.length;
        if (!path.includes("/")) {
            root.push({
                "name" : path,
                "value" : score, 
                "authors" : author
            });
            return;
        }
        let curDirectory = pathDirectories[0];
        let subPath = path.substring(curDirectory.length + 1)

        for (let child in root) {

            // console.log(rochild, curDirectory, child["name"] == curDirectory)

            if(root[child]["name"] === curDirectory && root[child]["children"] !== undefined) {
                this.analyzePath(subPath, score, root[child]["children"], author);
                return;
            }
        }

        root.push({
            "name" : curDirectory,
            "children" : []
        });
        
        this.analyzePath(subPath, score, root[root.length - 1]["children"], author);
    }

    compressStructure(root) {

        if(root["children"] == undefined) return;

        for(let childNum in root["children"]) {
            this.compressStructure(root["children"][childNum]);
        }

        if(root["children"].length == 1 && root["name"] != "project") {
            root["name"] = root["name"] + "/" + root["children"][0]["name"];
            if(root["children"][0]["value"] == undefined)
                root["children"] = root["children"][0]["children"];
            else{
                root["value"] = root["children"][0]["value"];
                delete root.children;
            }
        }
    
    }

    updateAuthorInfo(root) {
        if(root["children"] == undefined) {
            return root["authors"];
        }

        let authors = {};
        for(let childNum in root["children"]) {
            let childAuthors = this.updateAuthorInfo(root["children"][childNum]);
            for (let author in childAuthors) {
                if(authors.hasOwnProperty(author)) {
                    authors[author].insertions += childAuthors[author].insertions;
                    authors[author].deletions += childAuthors[author].deletions;
                    authors[author].count += childAuthors[author].count;
                }
                else {
                    let dict = {};
                    dict.insertions = childAuthors[author].insertions;
                    dict.deletions = childAuthors[author].deletions;
                    dict.count = childAuthors[author].count;
                    authors[author] = dict;
                }
            }
            
        }

        root["authors"] = authors;

        return authors;
    }

    getFileStructure() {
        return this.fileStructure;
    }
}

export default FileStructureAnalyzer;