import React, { useState } from 'react';
import { useDispatch } from "react-redux";
import * as actions from '../modules';

import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Form from 'react-bootstrap/Form';

const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',    
        flexDirection: 'column',
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
    },
    textArea: {
        marginBottom: "8px",
        minHeight: "50px",
        fontSize: "12px",
    }
}));

const HighlightQuery = (props) => {
    const classes = useStyles();
    const [ query, setQuery ] = useState("");
    const dispatch = useDispatch();

    return (
        <form className={classes.container} noValidate autoComplete="on">
            <Form.Control
                    className={classes.textArea}
                    rows={2}
                    as="textarea" 
                    placeholder="KEYWORD FOR HIGHLIGHT (including tag, branch: ex. pr/123)"
                    onChange={(event) => {
                        setQuery(event.target.value);
                    }}
                />

                <Button style={{ "fontSize": "11px" }} variant="outlined" size="small"
                    onClick={() => {
                        let qList = [];
                        qList = query.split("\n").map(d => d.trim()).filter(d => d !== "");
                        dispatch(actions.updateHighlightQuery(qList));
                    }}>
                    HIGHLIGHT COMMITS
                </Button>
        </form>
    );
}

export default HighlightQuery;