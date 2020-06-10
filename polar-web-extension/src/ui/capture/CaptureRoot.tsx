import React from 'react';
import Paper from "@material-ui/core/Paper";
import {PreviewContent} from './PreviewContent';
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import Container from "@material-ui/core/Container";

export const CaptureRoot = () => (
    <Paper style={{
               margin: 'auto',
               maxWidth: '800px',
               overflow: 'hidden',
           }}>

        <Container maxWidth="lg">
        <AppBar position="fixed">
                <Toolbar>

                    <Typography variant="h6">
                    </Typography>

                    <Button
                        variant="contained"
                        color="default"
                        startIcon={<CloudUploadIcon />}>

                        Save to Polar

                    </Button>

                </Toolbar>
        </AppBar>
        </Container>

        <PreviewContent/>
    </Paper>
);
