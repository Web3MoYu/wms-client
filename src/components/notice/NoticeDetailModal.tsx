import { useState, useEffect } from 'react';
import { Modal, Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import { Notice } from '../../api/msg-service/NoticeController';

const { Title } = Typography;

interface NoticeDetailModalProps {
  visible: boolean;
  notice: Partial<Notice> | null;
  onClose: () => void;
  title?: string;
}

// Markdown预览样式
const markdownStyles = {
  wrapper: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e8e8e8',
    maxHeight: '500px',
    overflowY: 'auto' as const,
  },
  title: {
    marginBottom: '16px',
    borderBottom: '1px solid #e8e8e8',
    paddingBottom: '8px',
  },
  content: {
    lineHeight: '1.8',
  }
};

const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  visible,
  notice,
  onClose,
  title = '公告详情'
}) => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    if (notice && notice.content) {
      setContent(notice.content);
    } else {
      setContent('');
    }
  }, [notice]);

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
      bodyStyle={{ padding: '24px' }}
    >
      <div style={markdownStyles.wrapper}>
        {notice && notice.title && (
          <Title level={3} style={markdownStyles.title}>
            {notice.title}
          </Title>
        )}
        <div style={markdownStyles.content}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </Modal>
  );
};

export default NoticeDetailModal; 