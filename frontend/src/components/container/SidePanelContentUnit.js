import React, { useState } from 'react';
import './SidePanelContentUnit.css';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';

export const SidePanelContentUnit = (props) => {
    const [show, setShow] = useState( (props.show !== undefined ? props.show : true) );

    return (
        <div style={props.style}>
            <div className="sidepanel-container-header flexContainer">
                <div>{props.title}</div>
                <div
                    style={{cursor:"pointer"}}
                    onClick={ () => setShow(!show)}
                >{show ? <RemoveIcon fontSize="small"/>
                 : <AddIcon fontSize="small" />}</div>
            </div>
            <div className="sidepanel-container-content">
                {show ? props.children : ""}
            </div>
        </div>
    );
}