import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Select, Space, Typography, Modal } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { datasetAPI } from '../services/api';

const { Option } = Select;

function DatasetList({ onDatasetSelect }) {
    const [form] = Form.useForm();
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const config = {
                root_path: values.root_path,
                min_score: values.min_score || 0,
                max_score: values.max_score || 10,
                score_step: values.score_step || 1,
                image_regex: values.image_regex || '.*\.(jpg|jpeg|png|bmp|webp)$',
                annotated_on_top: values.annotated_on_top || 'top'
            };

            await datasetAPI.create(config);
            message.success('Dataset created successfully');
            form.resetFields();
            loadDatasets();
        } catch (error) {
            message.error(error.response?.data?.detail || 'Failed to create dataset');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDataset = async (rootPath) => {
        try {
            const response = await datasetAPI.getConfig(rootPath);
            onDatasetSelect(rootPath, response.data);
        } catch (error) {
            message.error('Failed to load dataset config');
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
            message.error('Failed to load dataset config');
        }
    };

    const handleDeleteDataset = async (rootPath) => {
        try {
            await datasetAPI.delete(rootPath);
            message.success('Dataset configuration removed');
            loadDatasets(); // 重新加载数据集列表
        } catch (error) {
            message.error(error.response?.data?.detail || 'Failed to delete dataset');
        }
    };

    const showDeleteConfirm = (rootPath) => {
        Modal.confirm({
            title: 'Confirm Delete Dataset',
            content: `Are you sure you want to remove dataset configuration for: ${rootPath}\n\nNote: This will only remove the configuration, not delete the data from disk.`,
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk() {
                handleDeleteDataset(rootPath);
            },
        });
    };

    return (
        <div>
            <Card title="Existing Datasets">
                <Space orientation="vertical" style={{ width: '100%' }}>
                    {datasets.length > 0 ? (
                        datasets.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: '4px'
                                }}
                            >
                                <Button
                                    type="link"
                                    onClick={() => handleSelectDataset(item)}
                                    style={{ textAlign: 'left', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
                                >
                                    {item}
                                </Button>
                                <Space>
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => handleEditConfig(item)}
                                        title="Edit dataset configuration"
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => showDeleteConfirm(item)}
                                        title="Remove dataset configuration"
                                    />
                                </Space>
                            </div>
                        ))
                    ) : (
                        <Typography.Text type="secondary">No datasets found</Typography.Text>
                    )}
                </Space>
            </Card>
            <Card title="Create New Dataset" style={{ marginBottom: 16 }}>
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        name="root_path"
                        label="Dataset Root Path (Absolute Path)"
                        rules={[{ required: true, message: 'Please input the root path!' }]}
                    >
                        <Input placeholder="/path/to/dataset" />
                    </Form.Item>

                    <Form.Item name="min_score" label="Min Score" initialValue={0}>
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="max_score" label="Max Score" initialValue={10}>
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="score_step" label="Score Step" initialValue={1}>
                        <InputNumber style={{ width: '100%' }} step={0.1} />
                    </Form.Item>

                    <Form.Item
                        name="image_regex"
                        label="Image Regex Filter"
                        initialValue=".*\.(jpg|jpeg|png|bmp|webp)$"
                    >
                        <Input placeholder=".*\.(jpg|jpeg|png|bmp|webp)$" />
                    </Form.Item>

                    <Form.Item name="annotated_on_top" label="Annotated Images Position" initialValue="not_set">
                        <Select>
                            <Option value="top">Top</Option>
                            <Option value="bottom">Bottom</Option>
                            <Option value="not_set">Not Set</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Create Dataset
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

export default DatasetList;
