import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { datasetAPI } from '../services/api';
import useToast from '../hooks/useToast';
import Toast from './Toast';

function DatasetList({ onDatasetSelect }) {
    const { success, error, info, toastOpen, toastMessage, toastSeverity, hideToast } = useToast();
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        root_path: '',
        min_score: 0,
        max_score: 10,
        score_step: 1,
        image_regex: '.*\\.(jpg|jpeg|png|bmp|webp)$',
        annotated_on_top: 'not_set'
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [datasetToDelete, setDatasetToDelete] = useState(null);

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = async () => {
        try {
            const response = await datasetAPI.list();
            setDatasets(response.data.datasets || []);
        } catch (error) {
            message.error('Failed to load datasets');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                root_path: formData.root_path,
                min_score: formData.min_score || 0,
                max_score: formData.max_score || 10,
                score_step: formData.score_step || 1,
                image_regex: formData.image_regex || '.*\\.(jpg|jpeg|png|bmp|webp)$',
                annotated_on_top: formData.annotated_on_top || 'top'
            };
    
            await datasetAPI.create(config);
            success('Dataset created successfully');
            setFormData({
                root_path: '',
                min_score: 0,
                max_score: 10,
                score_step: 1,
                image_regex: '.*\\.(jpg|jpeg|png|bmp|webp)$',
                annotated_on_top: 'not_set'
            });
            loadDatasets();
        } catch (error) {
            error(error.response?.data?.detail || 'Failed to create dataset');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDataset = async (rootPath) => {
        try {
            const response = await datasetAPI.getConfig(rootPath);
            onDatasetSelect(rootPath, response.data);
        } catch (error) {
            error('Failed to load dataset config');
        }
    };

    const handleEditConfig = async (rootPath) => {
        try {
            const response = await datasetAPI.getConfig(rootPath);
            // Call a special callback to switch to config view with the dataset
            if (onDatasetSelect) {
                onDatasetSelect(rootPath, response.data, true); // Third parameter indicates edit mode
            }
        } catch (error) {
            error('Failed to load dataset config');
        }
    };

    const handleDeleteDataset = async (rootPath) => {
        try {
            await datasetAPI.delete(rootPath);
            success('Dataset configuration removed');
            loadDatasets(); // 重新加载数据集列表
        } catch (error) {
            error(error.response?.data?.detail || 'Failed to delete dataset');
        }
    };

    const confirmDelete = (rootPath) => {
        setDatasetToDelete(rootPath);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (datasetToDelete) {
            handleDeleteDataset(datasetToDelete);
            setDeleteDialogOpen(false);
            setDatasetToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setDatasetToDelete(null);
    };

    return (
        <Box>
            {/* Existing Datasets */}
            <Card sx={{ mb: 3 }}>
                <CardHeader 
                    title="Existing Datasets" 
                    titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <CardContent>
                    <Stack spacing={2}>
                        {datasets.length > 0 ? (
                            datasets.map((item, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 2,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: '#f5f5f5',
                                            boxShadow: 1,
                                        }
                                    }}
                                >
                                    <Button
                                        onClick={() => handleSelectDataset(item)}
                                        sx={{ 
                                            flex: 1, 
                                            justifyContent: 'flex-start',
                                            textTransform: 'none',
                                            textAlign: 'left',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        <Typography noWrap>{item}</Typography>
                                    </Button>
                                    <Box>
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleEditConfig(item)}
                                            title="Edit dataset configuration"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => confirmDelete(item)}
                                            title="Remove dataset configuration"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ))
                        ) : (
                            <Alert severity="info">No datasets found</Alert>
                        )}
                    </Stack>
                </CardContent>
            </Card>
    
            {/* Create New Dataset */}
            <Card>
                <CardHeader 
                    title="Create New Dataset"
                    titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <TextField
                                label="Dataset Root Path (Absolute Path)"
                                value={formData.root_path}
                                onChange={(e) => setFormData({...formData, root_path: e.target.value})}
                                placeholder="/path/to/dataset"
                                required
                                fullWidth
                            />
    
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                <TextField
                                    label="Min Score"
                                    type="number"
                                    value={formData.min_score}
                                    onChange={(e) => setFormData({...formData, min_score: Number(e.target.value)})}
                                    fullWidth
                                />
    
                                <TextField
                                    label="Max Score"
                                    type="number"
                                    value={formData.max_score}
                                    onChange={(e) => setFormData({...formData, max_score: Number(e.target.value)})}
                                    fullWidth
                                />
    
                                <TextField
                                    label="Score Step"
                                    type="number"
                                    value={formData.score_step}
                                    onChange={(e) => setFormData({...formData, score_step: Number(e.target.value)})}
                                    inputProps={{ step: 0.1 }}
                                    fullWidth
                                />
                            </Box>
    
                            <TextField
                                label="Image Regex Filter"
                                value={formData.image_regex}
                                onChange={(e) => setFormData({...formData, image_regex: e.target.value})}
                                placeholder=".*\\.(jpg|jpeg|png|bmp|webp)$"
                                fullWidth
                            />
    
                            <FormControl fullWidth>
                                <InputLabel>Annotated Images Position</InputLabel>
                                <Select
                                    value={formData.annotated_on_top}
                                    label="Annotated Images Position"
                                    onChange={(e) => setFormData({...formData, annotated_on_top: e.target.value})}
                                >
                                    <MenuItem value="top">Top</MenuItem>
                                    <MenuItem value="bottom">Bottom</MenuItem>
                                    <MenuItem value="not_set">Not Set</MenuItem>
                                </Select>
                            </FormControl>
    
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading}
                                startIcon={<AddIcon />}
                                sx={{ mt: 2 }}
                            >
                                Create Dataset
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
    
            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirm Delete Dataset</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to remove dataset configuration for: {datasetToDelete}?
                        <br /><br />
                        Note: This will only remove the configuration, not delete the data from disk.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
    
            {/* Toast Notification */}
            <Toast 
              open={toastOpen} 
              message={toastMessage} 
              severity={toastSeverity} 
              onClose={hideToast} 
            />
        </Box>
    );
}

export default DatasetList;
