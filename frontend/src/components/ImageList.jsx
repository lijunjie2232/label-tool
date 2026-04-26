import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Box,
  Stack,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Chip,
  Menu,
  Alert,
  Checkbox,
} from '@mui/material';
import {
  Remove as MinusIcon,
  Add as PlusIcon,
  KeyboardArrowDown as DownIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Edit as AnnotateIcon,
} from '@mui/icons-material';
import { imageAPI, annotationAPI } from '../services/api';
import imageCache from '../utils/imageCache';
import useToast from '../hooks/useToast';
import Toast from './Toast';

// 图片预览组件，使用 POST 请求获取图片
function ImagePreview({ path, onAnnotateClick }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    // Check if image is already cached
    if (imageCache.has(path)) {
      const blob = imageCache.get(path);
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
      path,
      () => imageAPI.getPreview(path).then(response => response.data)
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
  }, [path]);

  return (
    <img
      src={imageUrl}
      alt="preview"
      style={{ width: 80, height: 80, objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
      onClick={() => onAnnotateClick(path)}
    />
  );
}

function ImageList({ dataset, config, onAnnotateClick }) {
  const { success, error, warning, toastOpen, toastMessage, toastSeverity, hideToast } = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subDir, setSubDir] = useState('');
  const [sortBy, setSortBy] = useState('file_name');
  const [annotatedOnTop, setAnnotatedOnTop] = useState(config?.annotated_on_top || 'top');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [recursive, setRecursive] = useState(true);
  const [batchMenuAnchor, setBatchMenuAnchor] = useState(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);

  useEffect(() => {
    if (dataset) {
      loadImages();
    }
  }, [dataset, subDir, sortBy, annotatedOnTop, recursive]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await imageAPI.getList(dataset, {
        sub_dir: subDir,
        sort_by: sortBy,
        annotated_on_top: annotatedOnTop,
        recursive: recursive
      });
      setImages(response.data.images || []);
    } catch (error) {
      message.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = async (record, newScore) => {
    try {
      await annotationAPI.add(dataset, {
        image_path: record.relative_path,
        score: newScore
      });
      success('Score updated');
      loadImages();
    } catch (error) {
      error('Failed to update score');
    }
  };

  const handleDelete = async (record) => {
    try {
      await imageAPI.delete(record.absolute_path);
      success('Image marked as deleted');
      loadImages();
    } catch (error) {
      error('Failed to delete image');
    }
  };

  const handleClear = async (record) => {
    try {
      await annotationAPI.remove(dataset, record.relative_path);
      success('Annotation cleared');
      loadImages();
    } catch (error) {
      error('Failed to clear annotation');
    }
  };

  const handleBatchOperation = async (operation, value = null) => {
    if (selectedRowKeys.length === 0) {
      warning('Please select images first');
      return;
    }

    try {
      const selectedImages = images.filter(img => selectedRowKeys.includes(img.relative_path));
      
      switch (operation) {
        case 'delete':
          for (const img of selectedImages) {
            await imageAPI.delete(img.absolute_path);
          }
          success(`Marked ${selectedImages.length} images as deleted`);
          break;
        
        case 'clear':
          await annotationAPI.clear(dataset, selectedImages.map(img => img.relative_path));
          success(`Cleared ${selectedImages.length} annotations`);
          break;
        
        case 'set_score':
          for (const img of selectedImages) {
            await annotationAPI.add(dataset, {
              image_path: img.relative_path,
              score: value
            });
          }
          success(`Set score for ${selectedImages.length} images`);
          break;
        
        case 'add_score':
          for (const img of selectedImages) {
            const newScore = Math.min((img.score || 0) + config.score_step, config.max_score);
            await annotationAPI.add(dataset, {
              image_path: img.relative_path,
              score: newScore
            });
          }
          success(`Added score for ${selectedImages.length} images`);
          break;
        
        case 'sub_score':
          for (const img of selectedImages) {
            const newScore = Math.max((img.score || 0) - config.score_step, config.min_score);
            await annotationAPI.add(dataset, {
              image_path: img.relative_path,
              score: newScore
            });
          }
          success(`Subtracted score for ${selectedImages.length} images`);
          break;
      }
      
      setSelectedRowKeys([]);
      setBatchMenuAnchor(null);
      loadImages();
    } catch (error) {
      error('Batch operation failed');
    }
  };

  const batchMenuItems = [
    { key: 'delete', label: 'Delete Selected' },
    { key: 'clear', label: 'Clear Annotations' },
    { key: 'set_score', label: 'Set Score to...' },
    { key: 'add_score', label: 'Add Score Step' },
    { key: 'sub_score', label: 'Subtract Score Step' },
  ];

  const handleBatchMenuClick = (operation) => {
    if (operation === 'set_score') {
      const value = prompt('Enter score value:');
      if (value !== null) {
        handleBatchOperation(operation, parseFloat(value));
      }
    } else {
      handleBatchOperation(operation);
    }
  };

  const columns = [
    {
      field: 'preview',
      headerName: 'Preview',
      width: 120,
      renderCell: (params) => (
        <ImagePreview 
          path={params.row.absolute_path} 
          onAnnotateClick={() => onAnnotateClick(params.row.relative_path)} 
        />
      ),
    },
    {
      field: 'relative_path',
      headerName: 'Path',
      flex: 1,
      ellipsis: true,
    },
    {
      field: 'size',
      headerName: 'Size',
      width: 100,
      renderCell: (params) => `${params.row.width}x${params.row.height}`,
    },
    {
      field: 'score',
      headerName: 'Score',
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => {
              const newScore = Math.max((params.row.score || 0) - config.score_step, config.min_score);
              handleScoreChange(params.row, newScore);
            }}
          >
            <MinusIcon />
          </IconButton>
          <TextField
            size="small"
            type="number"
            value={params.row.score}
            onChange={(e) => handleScoreChange(params.row, parseFloat(e.target.value))}
            inputProps={{
              min: config.min_score,
              max: config.max_score,
              step: config.score_step,
            }}
            sx={{ width: 80 }}
          />
          <IconButton
            size="small"
            onClick={() => {
              const newScore = Math.min((params.row.score || 0) + config.score_step, config.max_score);
              handleScoreChange(params.row, newScore);
            }}
          >
            <PlusIcon />
          </IconButton>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<AnnotateIcon />}
            onClick={() => onAnnotateClick(params.row.relative_path)}
          >
            Annotate
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDelete(params.row)}
          >
            Delete
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={() => handleClear(params.row)}
          >
            Clear
          </Button>
        </Box>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <Box>
      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Sub-directory (optional)"
            value={subDir}
            onChange={(e) => setSubDir(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          
          <RadioGroup
            row
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <FormControlLabel value="file_name" control={<Radio />} label="File Name" />
            <FormControlLabel value="byte_size" control={<Radio />} label="File Size" />
          </RadioGroup>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Annotated Position</InputLabel>
            <Select
              value={annotatedOnTop}
              label="Annotated Position"
              onChange={(e) => setAnnotatedOnTop(e.target.value)}
            >
              <MenuItem value="top">Annotated on Top</MenuItem>
              <MenuItem value="bottom">Annotated on Bottom</MenuItem>
              <MenuItem value="not_set">Not Set</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>Recursive:</span>
            <Switch checked={recursive} onChange={(e) => setRecursive(e.target.checked)} />
          </Box>
          
          <Button
            variant="contained"
            endIcon={<DownIcon />}
            onClick={(e) => setBatchMenuAnchor(e.currentTarget)}
            disabled={selectedRowKeys.length === 0}
          >
            Batch Operations ({selectedRowKeys.length})
          </Button>
          
          <Menu
            anchorEl={batchMenuAnchor}
            open={Boolean(batchMenuAnchor)}
            onClose={() => setBatchMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleBatchMenuClick('delete')}>Delete Selected</MenuItem>
            <MenuItem onClick={() => handleBatchMenuClick('clear')}>Clear Annotations</MenuItem>
            <MenuItem onClick={() => handleBatchMenuClick('set_score')}>Set Score to...</MenuItem>
            <MenuItem onClick={() => handleBatchMenuClick('add_score')}>Add Score Step</MenuItem>
            <MenuItem onClick={() => handleBatchMenuClick('sub_score')}>Subtract Score Step</MenuItem>
          </Menu>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 60 }}>
                <Checkbox
                  checked={selectedRowKeys.length === images.length && images.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRowKeys(images.map(img => img.relative_path));
                    } else {
                      setSelectedRowKeys([]);
                    }
                  }}
                  sx={{
                    '& .MuiSvgIcon-root': {
                      fontSize: 28,
                    },
                  }}
                />
              </TableCell>
              {columns.map((column) => (
                <TableCell key={column.field} style={{ width: column.width }}>
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {images.map((row) => {
              const isSelected = selectedRowKeys.includes(row.relative_path);
              return (
                <TableRow
                  key={row.relative_path}
                  hover
                  selected={isSelected}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell padding="checkbox" sx={{ width: 60 }}>
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRowKeys([...selectedRowKeys, row.relative_path]);
                        } else {
                          setSelectedRowKeys(selectedRowKeys.filter(key => key !== row.relative_path));
                        }
                      }}
                      sx={{
                        '& .MuiSvgIcon-root': {
                          fontSize: 28,
                        },
                      }}
                    />
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.field}>
                      {column.renderCell ? column.renderCell({ row }) : row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {images.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>No images found</Alert>
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

export default ImageList;
