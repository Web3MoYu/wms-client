import React, { useEffect, useState } from 'react';
import { Badge, Popover, List, Typography, notification } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { getUnReadMsgCount } from '../../api/msg-service/MsgController';
import { WSModel, Msg } from '../../api/msg-service/MsgController';
import userStore from '../../store/userStore';

const { Text, Paragraph } = Typography;

/**
 * 消息提醒组件
 * 显示在头像旁边，提示用户是否有未读消息
 */
const MessageNotifier: React.FC = () => {
  // 状态定义
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const user = new userStore();
  const userId = user.user.userId;

  // 样式定义
  const styles = {
    bellIcon: {
      fontSize: 20,
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      color: 'rgba(0, 0, 0, 0.65)',
    },
    listItem: {
      borderBottom: '1px solid #f0f0f0',
      padding: '12px 16px',
      cursor: 'pointer',
    },
    listItemContent: {
      width: '320px',
    },
    notificationTitle: {
      fontWeight: 'bold',
      marginBottom: 4,
    },
    sender: {
      marginLeft: 4,
      color: 'rgba(0, 0, 0, 0.45)',
    },
    content: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2 as const,
      WebkitBoxOrient: 'vertical' as const,
    },
    noData: {
      textAlign: 'center' as const,
      padding: '24px 0',
      color: 'rgba(0, 0, 0, 0.45)',
    },
    time: {
      fontSize: 12,
      color: 'rgba(0, 0, 0, 0.45)',
    },
    priorityHigh: {
      color: '#ff4d4f',
    },
    priorityMedium: {
      color: '#faad14',
    },
    priorityNormal: {
      color: '#52c41a',
    },
  };

  // 获取消息优先级样式
  const getPriorityStyle = (priority: number) => {
    switch (priority) {
      case 2:
        return styles.priorityHigh; // 紧急
      case 1:
        return styles.priorityMedium; // 重要
      default:
        return styles.priorityNormal; // 普通
    }
  };

  // 获取优先级文本
  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 2:
        return '紧急';
      case 1:
        return '重要';
      default:
        return '普通';
    }
  };

  // 初始化检查未读消息
  useEffect(() => {
    checkUnreadMessages();
  }, []);

  // 初始化WebSocket连接
  useEffect(() => {
    if (!userId) return;

    // 建立WebSocket连接
    const wsUrl = `ws://127.0.0.1:8003/ws/${userId}`;
    const newSocket = new WebSocket(wsUrl);

    // 连接打开时的处理
    newSocket.onopen = () => {
      console.log('WebSocket连接已建立');
    };

    // 接收消息时的处理
    newSocket.onmessage = (event) => {
      // 记录接收到的消息
      // 如果是简单字符串消息（如"connectok"）则不进行JSON解析
      if (typeof event.data === 'string' && 
          (event.data === 'connectok' || event.data === 'ping' || event.data === 'pong')) {
        console.log('收到WebSocket连接确认或心跳消息:', event.data);
        return;
      }
      
      // 尝试解析JSON消息
      try {
        const data: WSModel<Msg> = JSON.parse(event.data);
        
        // 忽略心跳包
        if (data.type === 0) {
          console.log('收到WebSocket心跳包');
          return;
        }
        
        // 处理消息提醒
        if (data.type === 1 && data.data) {
          // 更新未读状态
          setHasUnread(true);
          
          // 将新消息添加到列表
          setMessages((prevMessages) => [data.data, ...prevMessages]);
          
          // 显示通知提醒
          showNotification(data.data);
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error, '原始消息:', event.data);
      }
    };

    // 连接关闭时的处理
    newSocket.onclose = () => {
      console.log('WebSocket连接已关闭');
    };

    // 连接错误时的处理
    newSocket.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
    };

    // 组件卸载时关闭连接
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [userId]);

  // 检查是否有未读消息
  const checkUnreadMessages = async () => {
    try {
      const response = await getUnReadMsgCount();
      if (response.code === 200 && response.data) {
        setHasUnread(true);
      }
    } catch (error) {
      console.error('获取未读消息失败:', error);
    }
  };

  // 显示通知提醒
  const showNotification = (msg: Msg) => {
    const priorityText = getPriorityText(msg.priority);
    const priorityStyle = getPriorityStyle(msg.priority);

    notification.open({
      message: (
        <div>
          {msg.title}
          <Text style={{ ...priorityStyle, marginLeft: 8 }}>
            {`[${priorityText}]`}
          </Text>
        </div>
      ),
      description: (
        <div>
          <Paragraph style={styles.content}>{msg.content}</Paragraph>
          <Text style={styles.sender}>
            {msg.isSystem === 1 ? '系统消息' : `发送人: ${msg.senderName}`}
          </Text>
        </div>
      ),
      duration: 5,
      placement: 'topRight',
    });
  };

  // Popover内容
  const notificationContent = (
    <List
      dataSource={messages}
      locale={{ emptyText: <div style={styles.noData}>暂无消息</div> }}
      renderItem={(item) => (
        <List.Item style={styles.listItem}>
          <div style={styles.listItemContent}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text
                style={{ ...getPriorityStyle(item.priority), ...styles.time }}
              >
                {getPriorityText(item.priority)}
              </Text>
            </div>

            <Paragraph style={styles.content}>{item.content}</Paragraph>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={styles.sender}>
                {item.isSystem === 1
                  ? '系统消息'
                  : `发送人: ${item.senderName}`}
              </Text>
              <Text style={styles.time}>
                {item.sendTime ? new Date(item.sendTime).toLocaleString() : ''}
              </Text>
            </div>
          </div>
        </List.Item>
      )}
    />
  );

  return (
    <Popover
      content={notificationContent}
      title='消息通知'
      placement='bottomRight'
      trigger='click'
      overlayStyle={{ width: 360 }}
    >
      <Badge dot={hasUnread} offset={[-3, 3]}>
        <BellOutlined style={styles.bellIcon} />
      </Badge>
    </Popover>
  );
};

export default MessageNotifier;
