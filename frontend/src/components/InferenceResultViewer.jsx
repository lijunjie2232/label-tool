import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { inferenceAPI, imageAPI } from '../services/api';
import imageCache from '../utils/imageCache';
import useToast from '../hooks/useToast';
import Toast from './Toast';

// 图片预览组件，使用 POST 请求获取图片
function ImagePreview({ dataset, path }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    // Construct full image path
    const imagePath = `${dataset}/${path}`;
    
    // Check if image is already cached
    if (imageCache.has(imagePath)) {
      const blob = imageCache.get(imagePath);
      const url = URL.createObjectURL(blob);
      createdUrl = url;
      if (isMounted) {
        setImageUrl(url);
      }
      return () => {
        if (createdUrl) {
          URL.revokeObjectURL(createdUrl);
        }
      };
    }

    // Use the global cache to fetch and cache the image
    imageCache.fetchAndCache(
      imagePath,
      () => imageAPI.getPreview(imagePath).then(response => response.data)
    )
      .then(blob => {
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          createdUrl = url;
          setImageUrl(url);
        }
      })
      .catch(error => {
        console.error('Failed to load image:', error);
      });
    
    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [dataset, path]);

  return (
    <img
      src={imageUrl}
      alt="preview"
      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '4px' }}
    />
  );
}

function InferenceResultViewer({ dataset, config }) {
  const { error, toastOpen, toastMessage, toastSeverity, hideToast } = useToast();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dataset) {
      loadFiles();
    }
  }, [dataset]);

  const loadFiles = async () => {
    try {
      const response = await inferenceAPI.listFiles(dataset);
      setFiles(response.data.files || []);
      if (response.data.files?.length > 0) {
        setSelectedFile(response.data.files[0]);
        loadResults(response.data.files[0]);
      }
    } catch (error) {
      error('Failed to load inference files');
    }
  };

  const loadResults = async (filename) => {
    setLoading(true);
    try {
      const response = await inferenceAPI.getResult(dataset, filename);
      setResults(response.data.results || []);
    } catch (error) {
      error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (filename) => {
    setSelectedFile(filename);
    loadResults(filename);
  };

  const columns = [
    {
      title: 'Preview',
      dataIndex: 'image_path',
      key: 'preview',
      width: 120,
      render: (path) => (
        <ImagePreview dataset={dataset} path={path} />
      ),
    },
    {
      title: 'Path',
      dataIndex: 'image_path',
      key: 'path',
      ellipsis: true,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 100,
    },
  ];

  return (
    <Box>
      {/* File Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Select Inference File:
          </Typography>
          <FormControl sx={{ minWidth: 300 }} size="small">
            <InputLabel>Inference File</InputLabel>
            <Select
              value={selectedFile || ''}
              label="Inference File"
              onChange={(e) => handleFileChange(e.target.value)}
            >
              {files.map((f) => (
                <MenuItem key={f} value={f}>{f}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Results Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 120 }}>Preview</TableCell>
              <TableCell>Path</TableCell>
              <TableCell style={{ width: 100 }}>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((row) => (
              <TableRow key={row.image_path} hover>
                <TableCell>
                  <ImagePreview dataset={dataset} path={row.image_path} />
                </TableCell>
                <TableCell>{row.image_path}</TableCell>
                <TableCell>{row.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {results.length === 0 && !loading && selectedFile && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">No results found for this file</Alert>
        </Box>
      )}

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

export default InferenceResultViewer;
