import React from 'react';
import { useSelector } from "react-redux";
import DetailCompare from './DetailCompare';

const CompareSummary = (props) => {
    const { capturedSummaryInfoListForCompare, gitAnalyzer } = props;
    const { inspectionPaneWidth } = useSelector(state => state.layout);

    if (capturedSummaryInfoListForCompare === undefined) return (<div></div>);
// console.log("capturedSummaryInfoListForCompare", capturedSummaryInfoListForCompare);
    return (
        <div
          id="compareSummaryDiv"
          style={{
            // visibility:"hidden",
            // width:clusterOverviewWidth + "px"
            width: "1676px",
          }}
          className="flexVerticalPane"
        >
            {/* <div id="branchSummaryCompare">
                {capturedSummaryInfoListForCompare.map( (capturedSummaryInfo) => (
                    <div
                        key = {capturedSummaryInfo.id}
                    >
                        {capturedSummaryInfo.id}
                    </div>
                ))}
            </div> */}
            <div id="detailCompare">
                <DetailCompare
                    // gitAnalyzer={gitAnalyzer}
                    capturedSummaryInfoListForCompare={capturedSummaryInfoListForCompare}
                    width={inspectionPaneWidth}
                    corpusData={gitAnalyzer.corpusData}
                />
            </div>
        </div>
    );
}

export default CompareSummary