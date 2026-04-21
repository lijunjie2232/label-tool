import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Select, Space, Spin } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { datasetAPI } from '../services/api';

const { Option } = Select;

function DatasetConfigEditor({ dataset, config, onSave, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [fetchingConfig, setFetchingConfig] = useState(false);

  // Fetch the current dataset config when component mounts or dataset changes
  useEffect(() => {
    const fetchConfig = async () => {
      if (dataset) {
        setFetchingConfig(true);
        try {
          const response = await datasetAPI.getConfig(dataset);
          const fetchedConfig = response.data;
          setCurrentConfig(fetchedConfig);
          form.setFieldsValue({
            root_path: fetchedConfig.root_path,
            min_score: fetchedConfig.min_score,
            max_score: fetchedConfig.max_score,
            score_step: fetchedConfig.score_step,
            image_regex: fetchedConfig.image_regex,
            annotated_on_top: fetchedConfig.annotated_on_top
          });
        } catch (error) {
          message.error('Failed to load dataset configuration');
          console.error('Error fetching config:', error);
        } finally {
          setFetchingConfig(false);
        }
      }
    };

    fetchConfig();
  }, [dataset, form]);

  // Also update form when config prop changes (for immediate updates)
  useEffect(() => {
    if (config && !currentConfig) {
      // Only use the prop if we haven't fetched yet
      setCurrentConfig(config);
      form.setFieldsValue({
        root_path: config.root_path,
        min_score: config.min_score,
        max_score: config.max_score,
        score_step: config.score_step,
        image_regex: config.image_regex,
        annotated_on_top: config.annotated_on_top
      });
    }
  }, [config, form, currentConfig]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to current config values
    if (currentConfig) {
      form.setFieldsValue({
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

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const updatedConfig = {
        ...values,
        root_path: dataset // Keep the original root path
      };
      
      await datasetAPI.updateConfig(dataset, updatedConfig);
      message.success('Dataset configuration updated successfully');
      setIsEditing(false);
      
      // Update the current config state with the new values
      setCurrentConfig(updatedConfig);
      
      if (onSave) {
        onSave(updatedConfig);
      }
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to update dataset configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!dataset) {
    return (
      <Card title="Dataset Configuration">
        <p>No dataset selected. Please select a dataset first.</p>
      </Card>
    );
  }

  if (fetchingConfig) {
    return (
      <Card title="Dataset Configuration">
        <Spin tip="Loading configuration..." />
      </Card>
    );
  }

  if (!currentConfig) {
    return (
      <Card title="Dataset Configuration">
        <p>Failed to load configuration for dataset: {dataset}</p>
      </Card>
    );
  }

  return (
    <Card 
      title="Dataset Configuration" 
      extra={
        !isEditing ? (
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Edit Configuration
          </Button>
        ) : (
          <Space>
            <Button icon={<CloseOutlined />} onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={() => form.submit()} 
              loading={loading}
            >
              Save Changes
            </Button>
          </Space>
        )
      }
    >
      <Form 
        form={form} 
        onFinish={handleSubmit} 
        layout="vertical"
        disabled={!isEditing}
      >
        <Form.Item
          name="root_path"
          label="Dataset Root Path"
        >
          <Input disabled />
        </Form.Item>

        <Form.Item 
          name="min_score" 
          label="Min Score"
          rules={[{ required: true, message: 'Please input min score!' }]}
        >
          <InputNumber style={{ width: '100%' }} disabled={!isEditing} />
        </Form.Item>

        <Form.Item 
          name="max_score" 
          label="Max Score"
          rules={[{ required: true, message: 'Please input max score!' }]}
        >
          <InputNumber style={{ width: '100%' }} disabled={!isEditing} />
        </Form.Item>

        <Form.Item 
          name="score_step" 
          label="Score Step"
          rules={[{ required: true, message: 'Please input score step!' }]}
        >
          <InputNumber style={{ width: '100%' }} step={0.1} disabled={!isEditing} />
        </Form.Item>

        <Form.Item
          name="image_regex"
          label="Image Regex Filter"
          rules={[{ required: true, message: 'Please input image regex!' }]}
        >
          <Input placeholder=".*\.(jpg|jpeg|png|bmp|webp)$" disabled={!isEditing} />
        </Form.Item>

        <Form.Item 
          name="annotated_on_top" 
          label="Annotated Images Position"
          rules={[{ required: true, message: 'Please select annotated images position!' }]}
        >
          <Select disabled={!isEditing}>
            <Option value="top">Top</Option>
            <Option value="bottom">Bottom</Option>
            <Option value="not_set">Not Set</Option>
          </Select>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default DatasetConfigEditor;