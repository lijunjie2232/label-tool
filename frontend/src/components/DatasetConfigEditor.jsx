import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Box,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { datasetAPI } from '../services/api';
import useToast from '../hooks/useToast';
import Toast from './Toast';

function DatasetConfigEditor({ dataset, config, onSave, onCancel }) {
  const { success, error, toastOpen, toastMessage, toastSeverity, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [fetchingConfig, setFetchingConfig] = useState(false);
  const [formData, setFormData] = useState({
    root_path: '',
    min_score: 0,
    max_score: 0,
    score_step: 1,
    image_regex: '',
    annotated_on_top: 'not_set'
  });

  // Fetch the current dataset config when component mounts or dataset changes
  useEffect(() => {
    const fetchConfig = async () => {
      if (dataset) {
        setFetchingConfig(true);
        try {
          const response = await datasetAPI.getConfig(dataset);
          const fetchedConfig = response.data;
          setCurrentConfig(fetchedConfig);
          setFormData({
            root_path: fetchedConfig.root_path,
            min_score: fetchedConfig.min_score,
            max_score: fetchedConfig.max_score,
            score_step: fetchedConfig.score_step,
            image_regex: fetchedConfig.image_regex,
            annotated_on_top: fetchedConfig.annotated_on_top
          });
        } catch (error) {
          error('Failed to load dataset configuration');
          console.error('Error fetching config:', error);
        } finally {
          setFetchingConfig(false);
        }
      }
    };

    fetchConfig();
  }, [dataset]);

  // Also update form when config prop changes (for immediate updates)
  useEffect(() => {
    if (config && !currentConfig) {
      // Only use the prop if we haven't fetched yet
      setCurrentConfig(config);
      setFormData({
        root_path: config.root_path,
        min_score: config.min_score,
        max_score: config.max_score,
        score_step: config.score_step,
        image_regex: config.image_regex,
        annotated_on_top: config.annotated_on_top
      });
    }
  }, [config, currentConfig]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to current config values
    if (currentConfig) {
      setFormData({
        root_path: currentConfig.root_path,
        min_score: currentConfig.min_score,
        max_score: currentConfig.max_score,
        score_step: currentConfig.score_step,
        image_regex: currentConfig.image_regex,
        annotated_on_top: currentConfig.annotated_on_top
      });
    }
    if (onCancel) {
      onCancel();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedConfig = {
        ...formData,
        root_path: dataset // Keep the original root path
      };
      
      await datasetAPI.updateConfig(dataset, updatedConfig);
      success('Dataset configuration updated successfully');
      setIsEditing(false);
      
      // Update the current config state with the new values
      setCurrentConfig(updatedConfig);
      
      if (onSave) {
        onSave(updatedConfig);
      }
    } catch (error) {
      error(error.response?.data?.detail || 'Failed to update dataset configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!dataset) {
    return (
      <Card>
        <CardHeader title="Dataset Configuration" />
        <CardContent>
          <Alert severity="info">No dataset selected. Please select a dataset first.</Alert>
        </CardContent>
      </Card>
    );
  }

  if (fetchingConfig) {
    return (
      <Card>
        <CardHeader title="Dataset Configuration" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!currentConfig) {
    return (
      <Card>
        <CardHeader title="Dataset Configuration" />
        <CardContent>
          <Alert severity="error">Failed to load configuration for dataset: {dataset}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Dataset Configuration"
        action={
          !isEditing ? (
            <Button 
              variant="contained" 
              startIcon={<EditIcon />} 
              onClick={handleEdit}
            >
              Edit Configuration
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button 
                startIcon={<CloseIcon />} 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained" 
                color="primary"
                startIcon={<SaveIcon />} 
                onClick={handleSubmit}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Stack>
          )
        }
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Dataset Root Path"
              value={formData.root_path}
              disabled
              fullWidth
            />
  
            <TextField
              label="Min Score"
              type="number"
              value={formData.min_score}
              onChange={(e) => setFormData({...formData, min_score: Number(e.target.value)})}
              disabled={!isEditing}
              required
              fullWidth
            />
  
            <TextField
              label="Max Score"
              type="number"
              value={formData.max_score}
              onChange={(e) => setFormData({...formData, max_score: Number(e.target.value)})}
              disabled={!isEditing}
              required
              fullWidth
            />
  
            <TextField
              label="Score Step"
              type="number"
              value={formData.score_step}
              onChange={(e) => setFormData({...formData, score_step: Number(e.target.value)})}
              inputProps={{ step: 0.1 }}
              disabled={!isEditing}
              required
              fullWidth
            />
  
            <TextField
              label="Image Regex Filter"
              value={formData.image_regex}
              onChange={(e) => setFormData({...formData, image_regex: e.target.value})}
              placeholder=".*\\.(jpg|jpeg|png|bmp|webp)$"
              disabled={!isEditing}
              required
              fullWidth
            />
  
            <FormControl fullWidth disabled={!isEditing}>
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
          </Stack>
        </form>
      </CardContent>

      {/* Toast Notification */}
      <Toast 
        open={toastOpen} 
        message={toastMessage} 
        severity={toastSeverity} 
        onClose={hideToast} 
      />
    </Card>
  );
}

export default DatasetConfigEditor;